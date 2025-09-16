const express = require('express');
const router = express.Router();
const CheckInController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateCheckInCreation = [
  body('goal')
    .isMongoId()
    .withMessage('Valid goal ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('type')
    .optional()
    .isIn(['goal', 'journey', 'milestone', 'general'])
    .withMessage('Invalid check-in type'),
  body('frequency')
    .isIn(['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'])
    .withMessage('Valid frequency is required'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('customFrequency.days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Custom frequency days must be between 1 and 365'),
  body('customFrequency.hours')
    .optional()
    .isInt({ min: 0, max: 23 })
    .withMessage('Custom frequency hours must be between 0 and 23'),
  body('reminderSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder enabled must be a boolean'),
  body('reminderSettings.advanceTime')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Reminder advance time must be between 0 and 1440 minutes'),
  body('reminderSettings.methods')
    .optional()
    .isArray()
    .withMessage('Reminder methods must be an array'),
  body('reminderSettings.methods.*')
    .optional()
    .isIn(['email', 'push', 'in-app'])
    .withMessage('Invalid reminder method'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurrenceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Valid recurrence end date is required')
];

const validateCheckInUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'])
    .withMessage('Invalid frequency'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  body('status')
    .optional()
    .isIn(['scheduled', 'pending', 'completed', 'missed', 'cancelled'])
    .withMessage('Invalid status'),
  body('reminderSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder enabled must be a boolean'),
  body('reminderSettings.advanceTime')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Reminder advance time must be between 0 and 1440 minutes')
];

const validateProgressAssessment = [
  body('overallProgress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Overall progress must be between 0 and 100'),
  body('mood')
    .optional()
    .isIn(['excellent', 'good', 'neutral', 'poor', 'terrible'])
    .withMessage('Invalid mood value'),
  body('energy')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid energy value'),
  body('motivation')
    .optional()
    .isIn(['very_high', 'high', 'medium', 'low', 'very_low'])
    .withMessage('Invalid motivation value'),
  body('challenges')
    .optional()
    .isArray()
    .withMessage('Challenges must be an array'),
  body('challenges.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Challenge description cannot exceed 200 characters'),
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array'),
  body('achievements.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Achievement description cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),
  body('responses')
    .optional()
    .isArray()
    .withMessage('Responses must be an array'),
  body('responses.*.question')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question must be between 1 and 500 characters'),
  body('responses.*.answer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Answer must be between 1 and 1000 characters'),
  body('responses.*.type')
    .optional()
    .isIn(['text', 'number', 'rating', 'multiple_choice', 'boolean'])
    .withMessage('Invalid response type')
];

const validateReschedule = [
  body('newDate')
    .isISO8601()
    .withMessage('Valid new date is required')
];

const validateRecurringCheckIns = [
  body('goalId')
    .isMongoId()
    .withMessage('Valid goal ID is required'),
  body('frequency')
    .isIn(['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'])
    .withMessage('Valid frequency is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('reminderSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder enabled must be a boolean'),
  body('reminderSettings.advanceTime')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Reminder advance time must be between 0 and 1440 minutes')
];

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Valid check-in ID is required')
];

const validateQueryParams = [
  query('status')
    .optional()
    .isIn(['scheduled', 'pending', 'completed', 'missed', 'cancelled'])
    .withMessage('Invalid status filter'),
  query('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'])
    .withMessage('Invalid frequency filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['scheduledDate', 'createdAt', 'status', 'frequency'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('timeRange')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year', 'all'])
    .withMessage('Invalid time range')
];

// All routes require authentication
router.use(authenticate);

// Check-in CRUD routes
router.post('/', validateCheckInCreation, (req, res) => CheckInController.createCheckIn(req, res));
router.get('/', validateQueryParams, (req, res) => CheckInController.getCheckIns(req, res));
router.get('/upcoming', (req, res) => CheckInController.getUpcomingCheckIns(req, res));
router.get('/overdue', (req, res) => CheckInController.getOverdueCheckIns(req, res));
router.get('/statistics', (req, res) => CheckInController.getCheckInStatistics(req, res));
router.get('/calendar', (req, res) => CheckInController.getCheckInsForCalendar(req, res));
router.get('/date-range', (req, res) => CheckInController.getCheckInsByDateRange(req, res));
router.get('/:id', validateMongoId, (req, res) => CheckInController.getCheckInById(req, res));
router.put('/:id', validateMongoId, validateCheckInUpdate, (req, res) => CheckInController.updateCheckIn(req, res));
router.delete('/:id', validateMongoId, (req, res) => CheckInController.deleteCheckIn(req, res));

// Check-in action routes
router.post('/:id/complete', validateMongoId, validateProgressAssessment, (req, res) => CheckInController.completeCheckIn(req, res));
router.post('/:id/miss', validateMongoId, (req, res) => CheckInController.missCheckIn(req, res));
router.post('/:id/reschedule', validateMongoId, validateReschedule, (req, res) => CheckInController.rescheduleCheckIn(req, res));

// Recurring check-ins
router.post('/recurring/create', validateRecurringCheckIns, (req, res) => CheckInController.createRecurringCheckIns(req, res));

module.exports = router;