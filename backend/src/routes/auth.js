const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// POST /api/auth/login
router.post('/login', validate(schemas.login), authController.login);

// POST /api/auth/logout (requires auth)
router.post('/logout', authMiddleware, authController.logout);

// GET /api/auth/me (requires auth)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

