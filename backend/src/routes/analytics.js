const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', analyticsController.getOverview);

// GET /api/analytics/names/:name
router.get('/names/:name', analyticsController.getNameAnalytics);

module.exports = router;

