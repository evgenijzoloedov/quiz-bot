const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth');
const { uploadQuizVideo } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// GET /api/quiz
router.get('/', quizController.getActiveQuiz);

// PUT /api/quiz
router.put('/', uploadQuizVideo, quizController.updateQuiz);

module.exports = router;

