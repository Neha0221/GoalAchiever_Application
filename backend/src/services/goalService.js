const Goal = require('../models/Goal');
const Journey = require('../models/Journey');

class GoalService {
  // Calculate suggested timeline based on complexity and goal type
  static calculateSuggestedTimeline(complexity, category, description) {
    const timelineMap = {
      beginner: {
        learning: '6weeks',
        career: '3months',
        health: '6weeks',
        fitness: '6weeks',
        personal: '6weeks',
        financial: '3months',
        creative: '6weeks',
        technical: '3months',
        other: '6weeks'
      },
      intermediate: {
        learning: '3months',
        career: '6months',
        health: '3months',
        fitness: '3months',
        personal: '3months',
        financial: '6months',
        creative: '3months',
        technical: '6months',
        other: '3months'
      },
      advanced: {
        learning: '6months',
        career: '6months',
        health: '6months',
        fitness: '6months',
        personal: '6months',
        financial: '6months',
        creative: '6months',
        technical: '6months',
        other: '6months'
      },
      expert: {
        learning: '6months',
        career: '6months',
        health: '6months',
        fitness: '6months',
        personal: '6months',
        financial: '6months',
        creative: '6months',
        technical: '6months',
        other: '6months'
      }
    };

    return timelineMap[complexity]?.[category] || '6weeks';
  }

  // Generate milestones based on goal complexity and timeline
  static generateMilestones(goalData) {
    const { complexity, suggestedTimeline, targetDate, title, description } = goalData;
    const milestones = [];
    const startDate = new Date();
    const endDate = new Date(targetDate);
    
    let chunkCount = 0;
    let chunkDuration = 0;
    
    // Determine chunk count and duration based on timeline
    switch (suggestedTimeline) {
      case '6weeks':
        chunkCount = 3;
        chunkDuration = 2; // 2 weeks per chunk
        break;
      case '3months':
        chunkCount = 6;
        chunkDuration = 2; // 2 weeks per chunk
        break;
      case '6months':
        chunkCount = 12;
        chunkDuration = 2; // 2 weeks per chunk
        break;
      default:
        chunkCount = 3;
        chunkDuration = 2;
    }

    // Generate milestones based on complexity
    const milestoneTemplates = this.getMilestoneTemplates(complexity, title, description);
    
    for (let i = 0; i < chunkCount; i++) {
      const chunkStartDate = new Date(startDate);
      chunkStartDate.setDate(chunkStartDate.getDate() + (i * chunkDuration * 7));
      
      const chunkEndDate = new Date(chunkStartDate);
      chunkEndDate.setDate(chunkEndDate.getDate() + (chunkDuration * 7) - 1);
      
      // Ensure we don't exceed the target date
      if (chunkEndDate > endDate) {
        chunkEndDate.setTime(endDate.getTime());
      }

      const template = milestoneTemplates[i] || milestoneTemplates[milestoneTemplates.length - 1];
      
      milestones.push({
        title: template.title.replace('{index}', i + 1),
        description: template.description,
        targetDate: chunkEndDate,
        order: i + 1,
        status: 'pending'
      });
    }

    return milestones;
  }

  // Get milestone templates based on complexity
  static getMilestoneTemplates(complexity, title, description) {
    const templates = {
      beginner: [
        {
          title: 'Foundation Setup - Week {index}',
          description: 'Set up learning environment and gather basic resources'
        },
        {
          title: 'Basic Concepts - Week {index}',
          description: 'Learn fundamental concepts and terminology'
        },
        {
          title: 'First Practice - Week {index}',
          description: 'Apply basic concepts through simple exercises'
        },
        {
          title: 'Skill Building - Week {index}',
          description: 'Develop core skills through guided practice'
        },
        {
          title: 'Application - Week {index}',
          description: 'Apply skills to real-world scenarios'
        },
        {
          title: 'Review & Refine - Week {index}',
          description: 'Review progress and refine understanding'
        }
      ],
      intermediate: [
        {
          title: 'Advanced Setup - Week {index}',
          description: 'Configure advanced tools and environments'
        },
        {
          title: 'Deep Dive Concepts - Week {index}',
          description: 'Explore intermediate concepts in detail'
        },
        {
          title: 'Complex Practice - Week {index}',
          description: 'Work on more complex exercises and projects'
        },
        {
          title: 'Skill Integration - Week {index}',
          description: 'Integrate multiple skills and concepts'
        },
        {
          title: 'Real-world Application - Week {index}',
          description: 'Apply skills to complex real-world problems'
        },
        {
          title: 'Optimization - Week {index}',
          description: 'Optimize and improve existing solutions'
        }
      ],
      advanced: [
        {
          title: 'Expert Setup - Week {index}',
          description: 'Set up professional-grade tools and workflows'
        },
        {
          title: 'Advanced Theory - Week {index}',
          description: 'Study advanced theoretical concepts'
        },
        {
          title: 'Complex Implementation - Week {index}',
          description: 'Implement complex solutions and algorithms'
        },
        {
          title: 'System Design - Week {index}',
          description: 'Design and architect complex systems'
        },
        {
          title: 'Performance Optimization - Week {index}',
          description: 'Optimize for performance and scalability'
        },
        {
          title: 'Expert Review - Week {index}',
          description: 'Review and refine expert-level solutions'
        }
      ],
      expert: [
        {
          title: 'Mastery Setup - Week {index}',
          description: 'Set up cutting-edge tools and methodologies'
        },
        {
          title: 'Cutting-edge Research - Week {index}',
          description: 'Study latest research and innovations'
        },
        {
          title: 'Innovation Implementation - Week {index}',
          description: 'Implement innovative solutions and approaches'
        },
        {
          title: 'Leadership & Mentoring - Week {index}',
          description: 'Lead projects and mentor others'
        },
        {
          title: 'Industry Impact - Week {index}',
          description: 'Create solutions with industry-wide impact'
        },
        {
          title: 'Mastery Validation - Week {index}',
          description: 'Validate mastery through expert review'
        }
      ]
    };

    return templates[complexity] || templates.beginner;
  }

  // Create goal with auto-generated milestones
  static async createGoal(userId, goalData) {
    try {
      // Calculate suggested timeline
      const suggestedTimeline = this.calculateSuggestedTimeline(
        goalData.complexity,
        goalData.category,
        goalData.description
      );

      // Generate milestones
      const milestones = this.generateMilestones({
        ...goalData,
        suggestedTimeline
      });

      // Calculate estimated duration
      const estimatedDuration = this.calculateEstimatedDuration(suggestedTimeline);

      // Create goal
      const goal = new Goal({
        ...goalData,
        user: userId,
        suggestedTimeline,
        estimatedDuration,
        milestones,
        progress: {
          totalMilestones: milestones.length,
          milestonesCompleted: 0,
          overall: 0
        }
      });

      await goal.save();
      return goal;
    } catch (error) {
      throw new Error(`Failed to create goal: ${error.message}`);
    }
  }

  // Calculate estimated duration from timeline
  static calculateEstimatedDuration(suggestedTimeline) {
    const durationMap = {
      '6weeks': { weeks: 6, months: 0 },
      '3months': { weeks: 0, months: 3 },
      '6months': { weeks: 0, months: 6 },
      'custom': { weeks: 0, months: 0 }
    };

    return durationMap[suggestedTimeline] || { weeks: 6, months: 0 };
  }

  // Create journey from goal
  static async createJourneyFromGoal(goalId, userId) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      if (goal.user.toString() !== userId.toString()) {
        throw new Error('Unauthorized access to goal');
      }

      // Calculate journey duration
      const startDate = new Date();
      const endDate = new Date(goal.targetDate);
      const durationMs = endDate - startDate;
      
      // Use absolute value to handle past dates for testing
      const absDurationMs = Math.abs(durationMs);
      const totalWeeks = Math.ceil(absDurationMs / (7 * 24 * 60 * 60 * 1000));
      const months = Math.floor(totalWeeks / 4);
      const weeks = totalWeeks % 4;

      // Ensure we have at least some duration
      const finalWeeks = Math.max(1, weeks);
      const finalMonths = Math.max(0, months);

      // Generate chunks from milestones
      const chunks = this.generateChunksFromMilestones(goal.milestones, startDate);

      // Create journey
      const journey = new Journey({
        goal: goalId,
        user: userId,
        title: `${goal.title} - Learning Journey`,
        description: `A structured learning journey for: ${goal.description}`,
        duration: {
          weeks: finalWeeks,
          months: finalMonths
        },
        startDate,
        endDate,
        chunks,
        progress: {
          totalChunks: chunks.length,
          chunksCompleted: 0,
          totalObjectives: chunks.reduce((total, chunk) => total + chunk.learningObjectives.length, 0),
          objectivesCompleted: 0,
          overall: 0
        }
      });

      await journey.save();
      return journey;
    } catch (error) {
      throw new Error(`Failed to create journey: ${error.message}`);
    }
  }

  // Generate chunks from milestones
  static generateChunksFromMilestones(milestones, startDate) {
    return milestones.map((milestone, index) => {
      const chunkStartDate = new Date(startDate);
      chunkStartDate.setDate(chunkStartDate.getDate() + (index * 14)); // 2 weeks per chunk
      
      const chunkEndDate = new Date(chunkStartDate);
      chunkEndDate.setDate(chunkEndDate.getDate() + 13); // 2 weeks duration

      return {
        title: milestone.title,
        description: milestone.description,
        startDate: chunkStartDate,
        endDate: chunkEndDate,
        duration: { weeks: 2 },
        learningObjectives: this.generateLearningObjectives(milestone.title, milestone.description),
        order: index + 1,
        status: 'pending',
        progress: 0,
        resources: [],
        notes: []
      };
    });
  }

  // Generate learning objectives for a chunk
  static generateLearningObjectives(chunkTitle, chunkDescription) {
    const objectives = [
      {
        objective: `Understand the core concepts related to ${chunkTitle.toLowerCase()}`,
        isCompleted: false
      },
      {
        objective: `Practice implementing ${chunkTitle.toLowerCase()} through exercises`,
        isCompleted: false
      },
      {
        objective: `Apply knowledge to solve real-world problems`,
        isCompleted: false
      }
    ];

    return objectives;
  }

  // Update goal progress
  static async updateGoalProgress(goalId, userId, progressData) {
    try {
      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        throw new Error('Goal not found');
      }

      // Update milestone if provided
      if (progressData.milestoneId) {
        const milestone = goal.milestones.id(progressData.milestoneId);
        if (milestone) {
          milestone.status = progressData.status || milestone.status;
          if (progressData.status === 'completed') {
            milestone.completedAt = new Date();
          }
        }
      }

      // Update overall progress
      if (progressData.overallProgress !== undefined) {
        goal.progress.overall = Math.max(0, Math.min(100, progressData.overallProgress));
      }

      await goal.save();
      return goal;
    } catch (error) {
      throw new Error(`Failed to update goal progress: ${error.message}`);
    }
  }

  // Get goal analytics
  static async getGoalAnalytics(userId, timeRange = 'all') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      const query = { user: userId, ...dateFilter };

      const goals = await Goal.find(query);
      
      const analytics = {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        overdueGoals: goals.filter(g => g.isOverdue).length,
        averageProgress: goals.length > 0 
          ? Math.round(goals.reduce((sum, g) => sum + g.progress.overall, 0) / goals.length)
          : 0,
        goalsByCategory: this.groupGoalsByCategory(goals),
        goalsByComplexity: this.groupGoalsByComplexity(goals),
        goalsByStatus: this.groupGoalsByStatus(goals)
      };

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get goal analytics: ${error.message}`);
    }
  }

  // Get date filter for analytics
  static getDateFilter(timeRange) {
    const now = new Date();
    const filters = {
      'week': { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
      'month': { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      'quarter': { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } },
      'year': { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } },
      'all': {}
    };

    return filters[timeRange] || filters.all;
  }

  // Group goals by category
  static groupGoalsByCategory(goals) {
    const grouped = {};
    goals.forEach(goal => {
      grouped[goal.category] = (grouped[goal.category] || 0) + 1;
    });
    return grouped;
  }

  // Group goals by complexity
  static groupGoalsByComplexity(goals) {
    const grouped = {};
    goals.forEach(goal => {
      grouped[goal.complexity] = (grouped[goal.complexity] || 0) + 1;
    });
    return grouped;
  }

  // Group goals by status
  static groupGoalsByStatus(goals) {
    const grouped = {};
    goals.forEach(goal => {
      grouped[goal.status] = (grouped[goal.status] || 0) + 1;
    });
    return grouped;
  }
}

module.exports = GoalService;
