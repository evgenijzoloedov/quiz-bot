const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const nameRoutes = require('./names');
const questionRoutes = require('./questions');
const quizRoutes = require('./quiz');
const fileRoutes = require('./files');
const analyticsRoutes = require('./analytics');
const botRoutes = require('./bot');
const failImageRoutes = require('./failImages');

// Mount routes
router.use('/auth', authRoutes);
router.use('/names', nameRoutes);
router.use('/questions', questionRoutes);
router.use('/quiz', quizRoutes);
router.use('/files', fileRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/bot', botRoutes);
router.use('/fail-images', failImageRoutes);

// Also mount question routes at root for nested paths
router.use('/', questionRoutes);

module.exports = router;

