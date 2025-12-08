const multer = require('multer');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  logger.error(`Error: ${error.message}`, error);

  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large (max 20MB)',
        code: ErrorCodes.FILE_ERROR,
        statusCode: 400
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`,
      code: ErrorCodes.FILE_ERROR,
      statusCode: 400
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401
    });
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      code: ErrorCodes.INVALID_INPUT,
      statusCode: 400
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: ErrorCodes.INVALID_INPUT,
      statusCode: 400
    });
  }

  // App errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: ErrorCodes.SERVER_ERROR,
    statusCode: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = errorHandler;

