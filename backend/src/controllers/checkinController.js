const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const Journey = require('../models/Journey');
const CheckInService = require('../services/checkinService');
const { validationResult } = require('express-validator');

class CheckInController {
  // Create a new check-in
  static async createCheckIn(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const checkInData = { ...req.body, user: userId };

      // Verify goal exists and belongs to user
      const goal = await Goal.findOne({ _id: checkInData.goal, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found or access denied'
        });
      }

      // Verify journey if provided
      if (checkInData.journey) {
        const journey = await Journey.findOne({ _id: checkInData.journey, user: userId });
        if (!journey) {
          return res.status(404).json({
            success: false,
            message: 'Journey not found or access denied'
          });
        }
      }

      // Create check-in using service
      const checkIn = await CheckInService.createCheckIn(checkInData);

      // Populate the check-in with related data for frontend
      const populatedCheckIn = await CheckIn.findById(checkIn._id)
        .populate('goal', 'title category status')
        .populate('journey', 'title status');

      if (!populatedCheckIn) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve created check-in'
        });
      }

      console.log('Created check-in:', populatedCheckIn);
      res.status(201).json({
        success: true,
        message: 'Check-in created successfully',
        data: populatedCheckIn
      });
    } catch (error) {
      console.error('Create check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create check-in',
        error: error.message
      });
    }
  }

  // Get all check-ins for a user
  static async getCheckIns(req, res) {
    try {
      const userId = req.user.id;
      const { 
        status, 
        goal, 
        journey, 
        frequency, 
        startDate, 
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'scheduledDate',
        sortOrder = 'asc'
      } = req.query;

      // Build filter object
      const filter = { user: userId };
      
      if (status) filter.status = status;
      if (goal) filter.goal = goal;
      if (journey) filter.journey = journey;
      if (frequency) filter.frequency = frequency;
      
      if (startDate || endDate) {
        filter.scheduledDate = {};
        if (startDate) filter.scheduledDate.$gte = new Date(startDate);
        if (endDate) filter.scheduledDate.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query
      const checkIns = await CheckIn.find(filter)
        .populate('goal', 'title category status')
        .populate('journey', 'title status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CheckIn.countDocuments(filter);

      res.json({
        success: true,
        data: checkIns,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get check-ins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch check-ins',
        error: error.message
      });
    }
  }

  // Get a specific check-in by ID
  static async getCheckInById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId })
        .populate('goal', 'title category description status progress')
        .populate('journey', 'title description status progress');

      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      res.json({
        success: true,
        data: checkIn
      });
    } catch (error) {
      console.error('Get check-in by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch check-in',
        error: error.message
      });
    }
  }

  // Update a check-in
  static async updateCheckIn(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId });
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      // Update check-in using service
      const updatedCheckIn = await CheckInService.updateCheckIn(checkIn, updateData);

      res.json({
        success: true,
        message: 'Check-in updated successfully',
        data: updatedCheckIn
      });
    } catch (error) {
      console.error('Update check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update check-in',
        error: error.message
      });
    }
  }

  // Delete a check-in
  static async deleteCheckIn(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId });
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      await CheckInService.deleteCheckIn(checkIn);

      res.json({
        success: true,
        message: 'Check-in deleted successfully'
      });
    } catch (error) {
      console.error('Delete check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete check-in',
        error: error.message
      });
    }
  }

  // Complete a check-in
  static async completeCheckIn(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const assessmentData = req.body;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId });
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      if (checkIn.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Check-in is already completed'
        });
      }

      // Complete check-in using service
      const completedCheckIn = await CheckInService.completeCheckIn(checkIn, assessmentData);

      res.json({
        success: true,
        message: 'Check-in completed successfully',
        data: completedCheckIn
      });
    } catch (error) {
      console.error('Complete check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete check-in',
        error: error.message
      });
    }
  }

  // Mark check-in as missed
  static async missCheckIn(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId });
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      if (checkIn.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark completed check-in as missed'
        });
      }

      // Mark as missed using service
      const missedCheckIn = await CheckInService.missCheckIn(checkIn);

      res.json({
        success: true,
        message: 'Check-in marked as missed',
        data: missedCheckIn
      });
    } catch (error) {
      console.error('Miss check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark check-in as missed',
        error: error.message
      });
    }
  }

  // Reschedule a check-in
  static async rescheduleCheckIn(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { id } = req.params;
      const { newDate } = req.body;

      const checkIn = await CheckIn.findOne({ _id: id, user: userId });
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      if (checkIn.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule completed check-in'
        });
      }

      // Reschedule using service
      const rescheduledCheckIn = await CheckInService.rescheduleCheckIn(checkIn, new Date(newDate));

      res.json({
        success: true,
        message: 'Check-in rescheduled successfully',
        data: rescheduledCheckIn
      });
    } catch (error) {
      console.error('Reschedule check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reschedule check-in',
        error: error.message
      });
    }
  }

  // Get upcoming check-ins
  static async getUpcomingCheckIns(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const checkIns = await CheckIn.findUpcoming(userId, parseInt(limit));

      res.json({
        success: true,
        data: checkIns
      });
    } catch (error) {
      console.error('Get upcoming check-ins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming check-ins',
        error: error.message
      });
    }
  }

  // Get overdue check-ins
  static async getOverdueCheckIns(req, res) {
    try {
      const userId = req.user.id;

      const checkIns = await CheckIn.findOverdue(userId);

      res.json({
        success: true,
        data: checkIns
      });
    } catch (error) {
      console.error('Get overdue check-ins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue check-ins',
        error: error.message
      });
    }
  }

  // Get check-ins by date range
  static async getCheckInsByDateRange(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const checkIns = await CheckIn.findByDateRange(
        userId, 
        new Date(startDate), 
        new Date(endDate)
      );

      res.json({
        success: true,
        data: checkIns
      });
    } catch (error) {
      console.error('Get check-ins by date range error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch check-ins by date range',
        error: error.message
      });
    }
  }

  // Get check-in statistics
  static async getCheckInStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { timeRange = 'month' } = req.query;

      const stats = await CheckIn.getStatistics(userId, timeRange);
      const statistics = stats.length > 0 ? stats[0] : {
        total: 0,
        completed: 0,
        missed: 0,
        pending: 0,
        averageRating: 0,
        averageProgress: 0
      };

      // Calculate completion rate
      const completionRate = statistics.total > 0 
        ? Math.round((statistics.completed / statistics.total) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          ...statistics,
          completionRate,
          timeRange
        }
      });
    } catch (error) {
      console.error('Get check-in statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch check-in statistics',
        error: error.message
      });
    }
  }

  // Create recurring check-ins for a goal
  static async createRecurringCheckIns(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { goalId, frequency, startDate, endDate, reminderSettings } = req.body;

      // Verify goal exists and belongs to user
      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found or access denied'
        });
      }

      // Create recurring check-ins using service
      const checkIns = await CheckInService.createRecurringCheckIns({
        goalId,
        userId,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        reminderSettings
      });

      res.status(201).json({
        success: true,
        message: `Created ${checkIns.length} recurring check-ins`,
        data: checkIns
      });
    } catch (error) {
      console.error('Create recurring check-ins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create recurring check-ins',
        error: error.message
      });
    }
  }

  // Get check-ins for calendar view
  static async getCheckInsForCalendar(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const checkIns = await CheckIn.findByDateRange(
        userId, 
        new Date(startDate), 
        new Date(endDate)
      );

      // Format for calendar display
      const calendarEvents = checkIns.map(checkIn => ({
        id: checkIn._id,
        title: checkIn.title,
        start: checkIn.scheduledDate,
        end: checkIn.scheduledDate,
        status: checkIn.status,
        type: checkIn.type,
        goal: checkIn.goal,
        journey: checkIn.journey,
        frequency: checkIn.frequency,
        isOverdue: checkIn.isOverdue
      }));

      res.json({
        success: true,
        data: calendarEvents
      });
    } catch (error) {
      console.error('Get check-ins for calendar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch check-ins for calendar',
        error: error.message
      });
    }
  }
}

module.exports = CheckInController;
