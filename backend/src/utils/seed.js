require('dotenv').config();
const mongoose = require('mongoose');
const { Admin } = require('../models');
const logger = require('./logger');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({});
    
    if (existingAdmin) {
      logger.info('Admin already exists. Skipping seed.');
      logger.info(`Existing admin Telegram ID: ${existingAdmin.telegramId}`);
    } else {
      // Create default admin
      // IMPORTANT: Replace this with your actual Telegram ID
      const defaultTelegramId = parseInt(process.env.ADMIN_TELEGRAM_ID) || 123456789;
      
      const admin = await Admin.create({
        telegramId: defaultTelegramId,
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        permissions: ['create_character', 'edit_character', 'delete_character', 'view_analytics', 'manage_admins']
      });

      logger.info(`Admin created with Telegram ID: ${admin.telegramId}`);
      logger.info('⚠️  IMPORTANT: Update ADMIN_TELEGRAM_ID in .env with your actual Telegram ID!');
    }

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  }
};

seedAdmin();

