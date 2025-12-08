const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', ErrorCodes.UNAUTHORIZED, 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const admin = await Admin.findOne({ 
      telegramId: decoded.telegramId, 
      isActive: true 
    });

    if (!admin) {
      throw new AppError('Unauthorized', ErrorCodes.FORBIDDEN, 403);
    }

    req.admin = admin;
    req.telegramId = decoded.telegramId;
    next();
  } catch (error) {
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

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: ErrorCodes.SERVER_ERROR,
      statusCode: 500
    });
  }
};

module.exports = authMiddleware;

