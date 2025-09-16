const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const Journey = require('../models/Journey');

class CheckInService {
  // Create a new check-in
  static async createCheckIn(checkInData) {
    try {
      // Set default title if not provided
      if (!checkInData.title) {
        const goal = await Goal.findById(checkInData.goal);
        checkInData.title = `Check-in for ${goal.title}`;
      }

      // Set default scheduled date if not provided
      if (!checkInData.scheduledDate) {
        checkInData.scheduledDate = new Date();
      }

      // Create the check-in
      const checkIn = new CheckIn(checkInData);
      await checkIn.save();

      // Populate related data
      await checkIn.populate('goal', 'title category status');
      if (checkIn.journey) {
        await checkIn.populate('journey', 'title status');
      }

      return checkIn;
    } catch (error) {
      throw new Error(`Failed to create check-in: ${error.message}`);
    }
  }

  // Update a check-in
  static async updateCheckIn(checkIn, updateData) {
    try {
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          checkIn[key] = updateData[key];
        }
      });

      // Recalculate next scheduled date if frequency or scheduled date changed
      if (updateData.frequency || updateData.scheduledDate) {
        checkIn.nextScheduledDate = checkIn.calculateNextScheduledDate();
      }

      await checkIn.save();
      return checkIn;
    } catch (error) {
      throw new Error(`Failed to update check-in: ${error.message}`);
    }
  }

  // Delete a check-in
  static async deleteCheckIn(checkIn) {
    try {
      await CheckIn.findByIdAndDelete(checkIn._id);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete check-in: ${error.message}`);
    }
  }

  // Complete a check-in
  static async completeCheckIn(checkIn, assessmentData) {
    try {
      // Mark as completed with assessment data
      await checkIn.markCompleted(assessmentData);

      // Update related goal progress if assessment data includes progress
      if (assessmentData.overallProgress !== undefined) {
        await this.updateGoalProgress(checkIn.goal, assessmentData.overallProgress);
      }

      return checkIn;
    } catch (error) {
      throw new Error(`Failed to complete check-in: ${error.message}`);
    }
  }

  // Mark check-in as missed
  static async missCheckIn(checkIn) {
    try {
      await checkIn.markMissed();
      return checkIn;
    } catch (error) {
      throw new Error(`Failed to mark check-in as missed: ${error.message}`);
    }
  }

  // Reschedule a check-in
  static async rescheduleCheckIn(checkIn, newDate) {
    try {
      await checkIn.reschedule(newDate);
      return checkIn;
    } catch (error) {
      throw new Error(`Failed to reschedule check-in: ${error.message}`);
    }
  }

  // Create recurring check-ins for a goal
  static async createRecurringCheckIns({ goalId, userId, frequency, startDate, endDate, reminderSettings }) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      const checkIns = [];
      const maxCheckIns = 50; // Limit to prevent excessive creation
      let currentDate = new Date(startDate);
      let checkInCount = 0;

      while (currentDate <= (endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) && checkInCount < maxCheckIns) {
        const checkInData = {
          user: userId,
          goal: goalId,
          title: `${goal.title} - ${frequency} Check-in`,
          description: `Regular ${frequency} check-in for goal progress tracking`,
          type: 'goal',
          frequency,
          scheduledDate: new Date(currentDate),
          reminderSettings: reminderSettings || {
            enabled: true,
            advanceTime: 60,
            methods: ['email']
          },
          isRecurring: true,
          recurrenceEndDate: endDate
        };

        const checkIn = new CheckIn(checkInData);
        await checkIn.save();
        checkIns.push(checkIn);

        // Calculate next date based on frequency
        currentDate = this.calculateNextDate(currentDate, frequency);
        checkInCount++;
      }

      return checkIns;
    } catch (error) {
      throw new Error(`Failed to create recurring check-ins: ${error.message}`);
    }
  }

  // Calculate next date based on frequency
  static calculateNextDate(currentDate, frequency) {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }

    return nextDate;
  }

  // Update goal progress based on check-in assessment
  static async updateGoalProgress(goalId, progressPercentage) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      // Update goal progress
      goal.progress.overall = Math.max(0, Math.min(100, progressPercentage));
      goal.progress.lastUpdated = new Date();

      // Update goal status based on progress
      if (goal.progress.overall === 100 && goal.status !== 'completed') {
        goal.status = 'completed';
        goal.completedAt = new Date();
      } else if (goal.progress.overall > 0 && goal.status === 'draft') {
        goal.status = 'active';
      }

      await goal.save();
      return goal;
    } catch (error) {
      throw new Error(`Failed to update goal progress: ${error.message}`);
    }
  }

  // Get check-ins that need reminders
  static async getCheckInsNeedingReminders() {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const checkIns = await CheckIn.find({
        status: { $in: ['scheduled', 'pending'] },
        'reminderSettings.enabled': true,
        scheduledDate: {
          $gte: now,
          $lte: reminderTime
        }
      })
      .populate('user', 'email firstName lastName')
      .populate('goal', 'title')
      .populate('journey', 'title');

      return checkIns;
    } catch (error) {
      throw new Error(`Failed to get check-ins needing reminders: ${error.message}`);
    }
  }

  // Mark overdue check-ins
  static async markOverdueCheckIns() {
    try {
      const now = new Date();
      const overdueCheckIns = await CheckIn.find({
        status: { $in: ['scheduled', 'pending'] },
        scheduledDate: { $lt: now }
      });

      const results = [];
      for (const checkIn of overdueCheckIns) {
        await checkIn.markMissed();
        results.push(checkIn);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to mark overdue check-ins: ${error.message}`);
    }
  }

  // Generate progress assessment questions based on goal type
  static generateAssessmentQuestions(goal) {
    const baseQuestions = [
      {
        question: "How would you rate your overall progress on this goal?",
        type: "rating",
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
      },
      {
        question: "What challenges did you face this period?",
        type: "text"
      },
      {
        question: "What achievements are you proud of?",
        type: "text"
      },
      {
        question: "How motivated do you feel about continuing this goal?",
        type: "multiple_choice",
        options: ["Very High", "High", "Medium", "Low", "Very Low"]
      }
    ];

    // Add category-specific questions
    const categoryQuestions = {
      learning: [
        {
          question: "What new concepts or skills did you learn?",
          type: "text"
        },
        {
          question: "How confident do you feel with the material?",
          type: "multiple_choice",
          options: ["Very Confident", "Confident", "Somewhat Confident", "Not Very Confident", "Not Confident"]
        }
      ],
      fitness: [
        {
          question: "How many times did you exercise this period?",
          type: "number"
        },
        {
          question: "How do you feel physically?",
          type: "multiple_choice",
          options: ["Excellent", "Good", "Fair", "Poor"]
        }
      ],
      career: [
        {
          question: "What professional skills did you develop?",
          type: "text"
        },
        {
          question: "How satisfied are you with your career progress?",
          type: "rating",
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
        }
      ]
    };

    const questions = [...baseQuestions];
    if (categoryQuestions[goal.category]) {
      questions.push(...categoryQuestions[goal.category]);
    }

    return questions;
  }

  // Get check-in analytics for a user
  static async getCheckInAnalytics(userId, timeRange = 'month') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const analytics = await CheckIn.aggregate([
        {
          $match: {
            user: new require('mongoose').Types.ObjectId(userId),
            scheduledDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            missed: {
              $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            averageRating: { $avg: '$progressAssessment.rating' },
            averageProgress: { $avg: '$progressAssessment.overallProgress' },
            averageMood: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$progressAssessment.mood', 'excellent'] }, then: 5 },
                    { case: { $eq: ['$progressAssessment.mood', 'good'] }, then: 4 },
                    { case: { $eq: ['$progressAssessment.mood', 'neutral'] }, then: 3 },
                    { case: { $eq: ['$progressAssessment.mood', 'poor'] }, then: 2 },
                    { case: { $eq: ['$progressAssessment.mood', 'terrible'] }, then: 1 }
                  ],
                  default: 0
                }
              }
            }
          }
        }
      ]);

      const result = analytics.length > 0 ? analytics[0] : {
        total: 0,
        completed: 0,
        missed: 0,
        pending: 0,
        averageRating: 0,
        averageProgress: 0,
        averageMood: 0
      };

      // Calculate completion rate
      result.completionRate = result.total > 0 
        ? Math.round((result.completed / result.total) * 100) 
        : 0;

      return result;
    } catch (error) {
      throw new Error(`Failed to get check-in analytics: ${error.message}`);
    }
  }

  // Get check-in trends over time
  static async getCheckInTrends(userId, timeRange = 'month') {
    try {
      const now = new Date();
      let startDate;
      let groupBy;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } };
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } };
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } };
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m", date: "$scheduledDate" } };
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" } };
      }

      const trends = await CheckIn.aggregate([
        {
          $match: {
            user: new require('mongoose').Types.ObjectId(userId),
            scheduledDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            missed: {
              $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
            },
            averageRating: { $avg: '$progressAssessment.rating' },
            averageProgress: { $avg: '$progressAssessment.overallProgress' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return trends;
    } catch (error) {
      throw new Error(`Failed to get check-in trends: ${error.message}`);
    }
  }
}

module.exports = CheckInService;
