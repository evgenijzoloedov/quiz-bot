const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');

// Public endpoints for bot (no auth required)

// POST /api/bot/names
router.post('/names', botController.getNamesForBot);

// POST /api/bot/quiz
router.post('/quiz', botController.getQuizForBot);

module.exports = router;

