const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/auth');
const { uploadQuestionFiles } = require('../middleware/upload');
const { validate, schemas } = require('../middleware/validate');

// All routes require authentication
router.use(authMiddleware);

// Middleware to parse answers JSON string before validation
const parseAnswersMiddleware = (req, res, next) => {
  if (req.body.answers && typeof req.body.answers === 'string') {
    try {
      req.body.answers = JSON.parse(req.body.answers);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format. Must be valid JSON.',
        code: 'INVALID_INPUT',
        statusCode: 400
      });
    }
  }
  next();
};

// GET /api/questions
router.get('/', questionController.getAllQuestions);

// GET /api/questions/:id
router.get('/:id', questionController.getQuestion);

// POST /api/questions
router.post('/', uploadQuestionFiles, parseAnswersMiddleware, validate(schemas.createQuestion), questionController.createQuestion);

// PUT /api/questions/:id
router.put('/:id', uploadQuestionFiles, parseAnswersMiddleware, validate(schemas.updateQuestion), questionController.updateQuestion);

// DELETE /api/questions/:id
router.delete('/:id', questionController.deleteQuestion);

// POST /api/questions/:id/reorder
router.post('/:id/reorder', validate(schemas.reorderQuestion), questionController.reorderQuestion);

module.exports = router;

