const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiTutorRateLimit } = require('../middleware/rateLimiter');

// Apply authentication to all routes
router.use(authenticate);

// Apply rate limiting to AI endpoints
router.use(aiTutorRateLimit);

// Chat endpoints
router.post('/chat', AIController.chat);
router.post('/quick-response', AIController.quickResponse);

// Session management
router.get('/sessions', AIController.getSessions);
router.get('/sessions/:sessionId', AIController.getSession);
router.post('/sessions', AIController.createSession);
router.put('/sessions/:sessionId/status', AIController.updateSessionStatus);
router.delete('/sessions/:sessionId', AIController.deleteSession);

// Learning features
router.post('/practice-problems', AIController.generatePracticeProblems);
router.get('/recommendations', AIController.getRecommendations);

module.exports = router;