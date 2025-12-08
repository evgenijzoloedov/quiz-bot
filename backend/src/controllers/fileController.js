const fs = require('fs');
const path = require('path');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const getFileUrl = (filename, type) => {
  return `${process.env.BACKEND_URL}/uploads/${type}/${filename}`;
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', ErrorCodes.FILE_ERROR, 400);
    }

    const file = req.file;
    const type = file.mimetype === 'application/pdf' ? 'pdfs' : 'images';

    logger.info(`File uploaded: ${file.filename} by admin ${req.telegramId}`);

    res.json({
      success: true,
      data: {
        filename: file.filename,
        url: getFileUrl(file.filename, type),
        size: file.size,
        type: type === 'pdfs' ? 'pdf' : 'image'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const type = req.query.type;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const files = [];

    // Get images
    if (!type || type === 'image') {
      const imagesDir = './uploads/images';
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir)
          .filter(f => !f.startsWith('.'))
          .map(filename => {
            const stats = fs.statSync(path.join(imagesDir, filename));
            return {
              filename,
              url: getFileUrl(filename, 'images'),
              size: stats.size,
              type: 'image',
              uploadedAt: stats.mtime
            };
          });
        files.push(...imageFiles);
      }
    }

    // Get PDFs
    if (!type || type === 'pdf') {
      const pdfsDir = './uploads/pdfs';
      if (fs.existsSync(pdfsDir)) {
        const pdfFiles = fs.readdirSync(pdfsDir)
          .filter(f => !f.startsWith('.'))
          .map(filename => {
            const stats = fs.statSync(path.join(pdfsDir, filename));
            return {
              filename,
              url: getFileUrl(filename, 'pdfs'),
              size: stats.size,
              type: 'pdf',
              uploadedAt: stats.mtime
            };
          });
        files.push(...pdfFiles);
      }
    }

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Paginate
    const total = files.length;
    const startIndex = (page - 1) * limit;
    const paginatedFiles = files.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new AppError('Invalid filename', ErrorCodes.INVALID_INPUT, 400);
    }

    let filePath = null;
    let fileType = null;

    // Check in images
    const imagePath = path.join('./uploads/images', filename);
    if (fs.existsSync(imagePath)) {
      filePath = imagePath;
      fileType = 'image';
    }

    // Check in pdfs
    const pdfPath = path.join('./uploads/pdfs', filename);
    if (fs.existsSync(pdfPath)) {
      filePath = pdfPath;
      fileType = 'pdf';
    }

    if (!filePath) {
      throw new AppError('File not found', ErrorCodes.NOT_FOUND, 404);
    }

    fs.unlinkSync(filePath);

    logger.info(`File deleted: ${filename} by admin ${req.telegramId}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile
};

