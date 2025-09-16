const Journey = require('../models/Journey');
const Goal = require('../models/Goal');
const { validationResult } = require('express-validator');

class JourneyController {
  // Get all journeys for a user
  static async getJourneys(req, res) {
    try {
      const userId = req.user.id;
      const { status, goal, isArchived, page = 1, limit = 10 } = req.query;

      const options = {};
      if (status) options.status = status;
      if (goal) options.goal = goal;
      if (isArchived !== undefined) options.isArchived = isArchived === 'true';

      const journeys = await Journey.findByUser(userId, options)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ startDate: 1 });

      const total = await Journey.countDocuments({ user: userId, ...options });

      res.json({
        success: true,
        data: journeys,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch journeys',
        error: error.message
      });
    }
  }

  // Get a specific journey by ID
  static async getJourney(req, res) {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const journey = await Journey.findOne({ _id: journeyId, user: userId })
        .populate('user', 'firstName lastName email')
        .populate('goal', 'title description');

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      res.json({
        success: true,
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch journey',
        error: error.message
      });
    }
  }

  // Update journey
  static async updateJourney(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const journey = await Journey.findOneAndUpdate(
        { _id: journeyId, user: userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      res.json({
        success: true,
        message: 'Journey updated successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update journey',
        error: error.message
      });
    }
  }

  // Delete journey
  static async deleteJourney(req, res) {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const journey = await Journey.findOneAndDelete({ _id: journeyId, user: userId });

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      res.json({
        success: true,
        message: 'Journey deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete journey',
        error: error.message
      });
    }
  }

  // Add chunk to journey
  static async addChunk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId } = req.params;
      const userId = req.user.id;
      const chunkData = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.addChunk(chunkData);

      res.json({
        success: true,
        message: 'Chunk added successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add chunk',
        error: error.message
      });
    }
  }

  // Update chunk
  static async updateChunk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId, chunkId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.updateChunk(chunkId, updateData);

      res.json({
        success: true,
        message: 'Chunk updated successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update chunk',
        error: error.message
      });
    }
  }

  // Delete chunk
  static async deleteChunk(req, res) {
    try {
      const { journeyId, chunkId } = req.params;
      const userId = req.user.id;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.deleteChunk(chunkId);

      res.json({
        success: true,
        message: 'Chunk deleted successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete chunk',
        error: error.message
      });
    }
  }

  // Add objective to chunk
  static async addObjective(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId, chunkId } = req.params;
      const userId = req.user.id;
      const objectiveData = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.addObjectiveToChunk(chunkId, objectiveData);

      res.json({
        success: true,
        message: 'Objective added successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add objective',
        error: error.message
      });
    }
  }

  // Update objective
  static async updateObjective(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId, chunkId, objectiveId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.updateObjective(chunkId, objectiveId, updateData);

      res.json({
        success: true,
        message: 'Objective updated successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update objective',
        error: error.message
      });
    }
  }

  // Add note to chunk
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

      const { journeyId, chunkId } = req.params;
      const userId = req.user.id;
      const { content, isImportant } = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      await journey.addNoteToChunk(chunkId, content, isImportant);

      res.json({
        success: true,
        message: 'Note added successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add note',
        error: error.message
      });
    }
  }

  // Get journeys by goal
  static async getJourneysByGoal(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;

      // Verify goal belongs to user
      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }

      const journeys = await Journey.findByGoal(goalId);

      res.json({
        success: true,
        data: journeys
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch journeys',
        error: error.message
      });
    }
  }

  // Get current chunk
  static async getCurrentChunk(req, res) {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      const currentChunk = journey.currentChunk;
      const nextChunk = journey.nextChunk;

      res.json({
        success: true,
        data: {
          currentChunk,
          nextChunk,
          progress: journey.progress
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch current chunk',
        error: error.message
      });
    }
  }

  // Update chunk progress
  static async updateChunkProgress(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { journeyId, chunkId } = req.params;
      const userId = req.user.id;
      const { progress, status } = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      const chunk = journey.chunks.id(chunkId);
      if (!chunk) {
        return res.status(404).json({
          success: false,
          message: 'Chunk not found'
        });
      }

      if (progress !== undefined) {
        chunk.progress = Math.max(0, Math.min(100, progress));
      }
      if (status) {
        chunk.status = status;
      }

      await journey.save();

      res.json({
        success: true,
        message: 'Chunk progress updated successfully',
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update chunk progress',
        error: error.message
      });
    }
  }

  // Archive/Unarchive journey
  static async toggleArchive(req, res) {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;
      const { isArchived } = req.body;

      const journey = await Journey.findOne({ _id: journeyId, user: userId });
      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found'
        });
      }

      journey.isArchived = isArchived;
      if (isArchived) {
        journey.archivedAt = new Date();
      } else {
        journey.archivedAt = undefined;
      }

      await journey.save();

      res.json({
        success: true,
        message: `Journey ${isArchived ? 'archived' : 'unarchived'} successfully`,
        data: journey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle archive status',
        error: error.message
      });
    }
  }

  // Get overdue journeys
  static async getOverdueJourneys(req, res) {
    try {
      const userId = req.user.id;

      const journeys = await Journey.findOverdue();

      res.json({
        success: true,
        data: journeys
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue journeys',
        error: error.message
      });
    }
  }
}

module.exports = JourneyController;
