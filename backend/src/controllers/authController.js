const jwt = require('jsonwebtoken');
const { Admin, Session } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const generateToken = (admin) => {
  return jwt.sign(
    {
      telegramId: admin.telegramId,
      role: admin.role,
      adminId: admin._id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
};

const login = async (req, res, next) => {
  try {
    const { telegramId } = req.validatedBody;

    const admin = await Admin.findOne({ telegramId, isActive: true });

    if (!admin) {
      throw new AppError('Telegram ID not authorized', ErrorCodes.UNAUTHORIZED, 401);
    }

    const token = generateToken(admin);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create session record
    await Session.create({
      telegramId: admin.telegramId,
      tokenHash: token.slice(-20),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.info(`Admin ${admin.name} (${admin.telegramId}) logged in`);

    res.json({
      success: true,
      token,
      admin: {
        telegramId: admin.telegramId,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { telegramId } = req;

    await Session.deleteMany({ telegramId });

    logger.info(`Admin ${telegramId} logged out`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = req.admin;

    res.json({
      success: true,
      data: {
        admin: {
          telegramId: admin.telegramId,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe
};

