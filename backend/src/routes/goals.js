const express = require('express');
const router = express.Router();
const GoalController = require('../controllers/goalController');
const JourneyController = require('../controllers/journeyController');
const { authenticate } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Goal routes
router.post('/', authenticate, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .isIn(['learning', 'career', 'health', 'fitness', 'personal', 'financial', 'creative', 'technical', 'other'])
    .withMessage('Invalid category'),
  body('complexity')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid complexity level'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('suggestedTimeline')
    .optional()
    .isIn(['6weeks', '3months', '6months', 'custom'])
    .withMessage('Invalid suggested timeline'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], (req, res) => GoalController.createGoal(req, res));

router.get('/', authenticate, [
  query('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('category')
    .optional()
    .isIn(['learning', 'career', 'health', 'fitness', 'personal', 'financial', 'creative', 'technical', 'other'])
    .withMessage('Invalid category'),
  query('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], (req, res) => GoalController.getGoals(req, res));

router.get('/analytics', authenticate, [
  query('timeRange')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year', 'all'])
    .withMessage('Invalid time range')
], (req, res) => GoalController.getAnalytics(req, res));

router.get('/overdue', authenticate, (req, res) => GoalController.getOverdueGoals(req, res));

router.get('/:goalId', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID')
], (req, res) => GoalController.getGoal(req, res));

router.put('/:goalId', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['learning', 'career', 'health', 'fitness', 'personal', 'financial', 'creative', 'technical', 'other'])
    .withMessage('Invalid category'),
  body('complexity')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid complexity level'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], (req, res) => GoalController.updateGoal(req, res));

router.delete('/:goalId', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID')
], (req, res) => GoalController.deleteGoal(req, res));

// Milestone routes
router.post('/:goalId/milestones', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Milestone title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Milestone description cannot exceed 500 characters'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('dependencies')
    .optional()
    .isArray()
    .withMessage('Dependencies must be an array')
], (req, res) => GoalController.addMilestone(req, res));

router.put('/:goalId/milestones/:milestoneId', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  param('milestoneId')
    .isMongoId()
    .withMessage('Invalid milestone ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Milestone title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Milestone description cannot exceed 500 characters'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'overdue'])
    .withMessage('Invalid status')
], (req, res) => GoalController.updateMilestone(req, res));

router.delete('/:goalId/milestones/:milestoneId', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  param('milestoneId')
    .isMongoId()
    .withMessage('Invalid milestone ID')
], (req, res) => GoalController.deleteMilestone(req, res));

// Progress and notes routes
router.put('/:goalId/progress', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('overallProgress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Overall progress must be between 0 and 100'),
  body('milestoneId')
    .optional()
    .isMongoId()
    .withMessage('Invalid milestone ID'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'overdue'])
    .withMessage('Invalid status')
], (req, res) => GoalController.updateProgress(req, res));

router.post('/:goalId/notes', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters'),
  body('isImportant')
    .optional()
    .isBoolean()
    .withMessage('isImportant must be a boolean')
], (req, res) => GoalController.addNote(req, res));

router.put('/:goalId/archive', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('isArchived')
    .isBoolean()
    .withMessage('isArchived must be a boolean')
], (req, res) => GoalController.toggleArchive(req, res));

router.post('/:goalId/journey', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID')
], (req, res) => GoalController.createJourney(req, res));

// Journey routes
router.get('/journeys', authenticate, [
  query('status')
    .optional()
    .isIn(['planned', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('goal')
    .optional()
    .isMongoId()
    .withMessage('Invalid goal ID'),
  query('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], (req, res) => JourneyController.getJourneys(req, res));

router.get('/journeys/overdue', authenticate, (req, res) => JourneyController.getOverdueJourneys(req, res));

router.get('/journeys/:journeyId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID')
], (req, res) => JourneyController.getJourney(req, res));

router.put('/journeys/:journeyId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('status')
    .optional()
    .isIn(['planned', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
], (req, res) => JourneyController.updateJourney(req, res));

router.delete('/journeys/:journeyId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID')
], (req, res) => JourneyController.deleteJourney(req, res));

// Chunk routes
router.post('/journeys/:journeyId/chunks', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chunk title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Chunk description cannot exceed 500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('duration.weeks')
    .isInt({ min: 1, max: 4 })
    .withMessage('Duration weeks must be between 1 and 4')
], (req, res) => JourneyController.addChunk(req, res));

router.put('/journeys/:journeyId/chunks/:chunkId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chunk title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Chunk description cannot exceed 500 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'overdue'])
    .withMessage('Invalid status')
], (req, res) => JourneyController.updateChunk(req, res));

router.delete('/journeys/:journeyId/chunks/:chunkId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID')
], (req, res) => JourneyController.deleteChunk(req, res));

// Objective routes
router.post('/journeys/:journeyId/chunks/:chunkId/objectives', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID'),
  body('objective')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Objective must be between 1 and 200 characters')
], (req, res) => JourneyController.addObjective(req, res));

router.put('/journeys/:journeyId/chunks/:chunkId/objectives/:objectiveId', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID'),
  param('objectiveId')
    .isMongoId()
    .withMessage('Invalid objective ID'),
  body('objective')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Objective must be between 1 and 200 characters'),
  body('isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted must be a boolean')
], (req, res) => JourneyController.updateObjective(req, res));

// Chunk notes and progress
router.post('/journeys/:journeyId/chunks/:chunkId/notes', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters'),
  body('isImportant')
    .optional()
    .isBoolean()
    .withMessage('isImportant must be a boolean')
], (req, res) => JourneyController.addNote(req, res));

router.get('/journeys/:journeyId/current-chunk', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID')
], (req, res) => JourneyController.getCurrentChunk(req, res));

router.put('/journeys/:journeyId/chunks/:chunkId/progress', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  param('chunkId')
    .isMongoId()
    .withMessage('Invalid chunk ID'),
  body('progress')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'overdue'])
    .withMessage('Invalid status')
], (req, res) => JourneyController.updateChunkProgress(req, res));

router.put('/journeys/:journeyId/archive', authenticate, [
  param('journeyId')
    .isMongoId()
    .withMessage('Invalid journey ID'),
  body('isArchived')
    .isBoolean()
    .withMessage('isArchived must be a boolean')
], (req, res) => JourneyController.toggleArchive(req, res));

router.get('/:goalId/journeys', authenticate, [
  param('goalId')
    .isMongoId()
    .withMessage('Invalid goal ID')
], (req, res) => JourneyController.getJourneysByGoal(req, res));

module.exports = router;