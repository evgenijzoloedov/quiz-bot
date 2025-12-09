require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Allow all origins

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const duration = Date.now() - start;
		logger.debug(
			`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
		);
	});
	next();
});

// Static files for uploads
app.use(
	'/uploads/images',
	express.static(path.join(__dirname, '../uploads/images'))
);
app.use(
	'/uploads/videos',
	express.static(path.join(__dirname, '../uploads/videos'))
);
app.use(
	'/uploads/pdfs',
	express.static(path.join(__dirname, '../uploads/pdfs'))
);
app.use(
	'/uploads/fail-images',
	express.static(path.join(__dirname, '../uploads/fail-images'))
);

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		error: 'Not found',
		code: 'NOT_FOUND',
		statusCode: 404,
	});
});

// Start server
const startServer = async () => {
	try {
		// Connect to database
		await connectDB();

		// Start Express server
		app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
			logger.info(`API: http://localhost:${PORT}/api`);
			logger.info(`Health: http://localhost:${PORT}/health`);
		});

		// Initialize Telegram bot
		initBot();
	} catch (error) {
		logger.error('Failed to start server', error);
		process.exit(1);
	}
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise);
	logger.error('Reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	process.exit(1);
});

startServer();

module.exports = app;
