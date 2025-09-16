const Goal = require('../models/Goal');
const Journey = require('../models/Journey');
const GoalService = require('../services/goalService');
const { validationResult } = require('express-validator');

class GoalController {
  // Create a new goal
  static async createGoal(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const goalData = req.body;

      // Create goal using service
      const goal = await GoalService.createGoal(userId, goalData);

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: error.message
      });
    }
  }

  // Get all goals for a user
  static async getGoals(req, res) {
    try {
      const userId = req.user.id;
      const { status, category, isArchived, page = 1, limit = 10 } = req.query;

      const options = {};
      if (status) options.status = status;
      if (category) options.category = category;
      if (isArchived !== undefined) options.isArchived = isArchived === 'true';

      const goals = await Goal.findByUser(userId, options)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Goal.countDocuments({ user: userId, ...options });

      res.json({
        success: true,
        data: goals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch goals',
        error: error.message
      });
    }
  }

  // Get a specific goal by ID
  static async getGoal(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;

      // Add timeout and lean() for better performance
      const goal = await Goal.findOne({ _id: goalId, user: userId })
        .populate('user', 'firstName lastName email')
        .lean() // Use lean() for better performance
        .maxTimeMS(5000); // 5 second timeout for this query

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      res.json({
        success: true,
        data: goal
      });
    } catch (error) {
      console.error('Error fetching goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch goal',
        error: error.message
      });
    }
  }

  // Update a goal
  static async updateGoal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { goalId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const goal = await Goal.findOneAndUpdate(
        { _id: goalId, user: userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      res.json({
        success: true,
        message: 'Goal updated successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        error: error.message
      });
    }
  }

  // Delete a goal
  static async deleteGoal(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;

      const goal = await Goal.findOneAndDelete({ _id: goalId, user: userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      // Also delete associated journeys
      await Journey.deleteMany({ goal: goalId });

      res.json({
        success: true,
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete goal',
        error: error.message
      });
    }
  }

  // Add milestone to goal
  static async addMilestone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { goalId } = req.params;
      const userId = req.user.id;
      const milestoneData = req.body;

      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.addMilestone(milestoneData);

      res.json({
        success: true,
        message: 'Milestone added successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add milestone',
        error: error.message
      });
    }
  }

  // Update milestone
  static async updateMilestone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { goalId, milestoneId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const goal = await Goal.findOne({ _id: goalId, user: userId })
        .maxTimeMS(5000); // 5 second timeout
      
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.updateMilestone(milestoneId, updateData);

      res.json({
        success: true,
        message: 'Milestone updated successfully',
        data: goal
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update milestone',
        error: error.message
      });
    }
  }

  // Delete milestone
  static async deleteMilestone(req, res) {
    try {
      const { goalId, milestoneId } = req.params;
      const userId = req.user.id;

      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.deleteMilestone(milestoneId);

      res.json({
        success: true,
        message: 'Milestone deleted successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete milestone',
        error: error.message
      });
    }
  }

  // Update goal progress
  static async updateProgress(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { goalId } = req.params;
      const userId = req.user.id;
      const progressData = req.body;

      const goal = await GoalService.updateGoalProgress(goalId, userId, progressData);

      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update progress',
        error: error.message
      });
    }
  }

  // Add note to goal
  static async addNote(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { goalId } = req.params;
      const userId = req.user.id;
      const { content, isImportant } = req.body;

      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      await goal.addNote(content, isImportant);

      res.json({
        success: true,
        message: 'Note added successfully',
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add note',
        error: error.message
      });
    }
  }

  // Get goal analytics
  static async getAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { timeRange = 'all' } = req.query;

      const analytics = await GoalService.getGoalAnalytics(userId, timeRange);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  // Archive/Unarchive goal
  static async toggleArchive(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;
      const { isArchived } = req.body;

      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      goal.isArchived = isArchived;
      if (isArchived) {
        goal.archivedAt = new Date();
      } else {
        goal.archivedAt = undefined;
      }

      await goal.save();

      res.json({
        success: true,
        message: `Goal ${isArchived ? 'archived' : 'unarchived'} successfully`,
        data: goal
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle archive status',
        error: error.message
      });
    }
  }

  // Get overdue goals
  static async getOverdueGoals(req, res) {
    try {
      const userId = req.user.id;

      const goals = await Goal.find({
        user: userId,
        status: 'active',
        targetDate: { $lt: new Date() }
      }).populate('user', 'firstName lastName email');

      res.json({
        success: true,
        data: goals
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue goals',
        error: error.message
      });
    }
  }

  // Create journey from goal
  static async createJourney(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;

      const journey = await GoalService.createJourneyFromGoal(goalId, userId);

      res.status(201).json({
        success: true,
        message: 'Journey created successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create journey',
        error: error.message
      });
    }
  }
}

module.exports = GoalController;