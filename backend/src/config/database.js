const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[INFO] MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (error) => {
      console.error(`[ERROR] MongoDB connection error: ${error.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[WARN] MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error(`[ERROR] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

