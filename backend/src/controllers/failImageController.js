const fs = require('fs');
const path = require('path');
const { FailImage } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const getFileUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.BACKEND_URL}/uploads/fail-images/${filename}`;
};

const deleteFile = (filepath) => {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    logger.error(`Failed to delete file: ${filepath}`, error);
  }
};

const getFailImages = async (req, res, next) => {
  try {
    const isActive = req.query.isActive;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const failImages = await FailImage.find(query)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const formattedFailImages = failImages.map((img) => ({
      ...img,
      imageUrl: getFileUrl(img.filename),
    }));

    res.json({
      success: true,
      data: formattedFailImages,
    });
  } catch (error) {
    next(error);
  }
};

const getFailImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const failImage = await FailImage.findById(id).lean();

    if (!failImage) {
      throw new AppError('Fail image not found', ErrorCodes.NOT_FOUND, 404);
    }

    res.json({
      success: true,
      data: {
        ...failImage,
        imageUrl: getFileUrl(failImage.filename),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createFailImage = async (req, res, next) => {
  try {
    const { order, isActive } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('Image file is required', ErrorCodes.INVALID_INPUT, 400);
    }

    if (!file.mimetype.startsWith('image/')) {
      deleteFile(file.path);
      throw new AppError('Only image files are allowed', ErrorCodes.INVALID_INPUT, 400);
    }

    // Get next order if not provided
    let imageOrder = order !== undefined ? parseInt(order) : undefined;
    if (imageOrder === undefined) {
      const lastImage = await FailImage.findOne({})
        .sort({ order: -1 })
        .lean();
      imageOrder = lastImage ? lastImage.order + 1 : 0;
    }

    const failImage = await FailImage.create({
      filename: file.filename,
      order: imageOrder,
      isActive: isActive === 'true' || isActive === true,
      createdBy: req.admin._id,
    });

    logger.info(`Fail image created: ${failImage.filename} by admin ${req.telegramId}`);

    res.status(201).json({
      success: true,
      data: {
        _id: failImage._id,
        filename: failImage.filename,
        imageUrl: getFileUrl(failImage.filename),
        order: failImage.order,
        isActive: failImage.isActive,
        createdAt: failImage.createdAt,
      },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    next(error);
  }
};

const updateFailImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order, isActive } = req.body;

    const failImage = await FailImage.findById(id);

    if (!failImage) {
      throw new AppError('Fail image not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (order !== undefined) {
      failImage.order = parseInt(order);
    }

    if (isActive !== undefined) {
      failImage.isActive = isActive === 'true' || isActive === true;
    }

    await failImage.save();
    logger.info(`Fail image updated: ${failImage.filename} by admin ${req.telegramId}`);

    res.json({
      success: true,
      data: {
        _id: failImage._id,
        filename: failImage.filename,
        imageUrl: getFileUrl(failImage.filename),
        order: failImage.order,
        isActive: failImage.isActive,
        updatedAt: failImage.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteFailImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const failImage = await FailImage.findById(id);

    if (!failImage) {
      throw new AppError('Fail image not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Delete file
    const filePath = path.join('./uploads/fail-images', failImage.filename);
    deleteFile(filePath);

    await FailImage.findByIdAndDelete(id);
    logger.info(`Fail image deleted: ${failImage.filename} by admin ${req.telegramId}`);

    res.json({
      success: true,
      message: 'Fail image deleted successfully',
      deletedImage: { _id: failImage._id, filename: failImage.filename },
    });
  } catch (error) {
    next(error);
  }
};

const reorderFailImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.validatedBody;

    const failImage = await FailImage.findById(id);

    if (!failImage) {
      throw new AppError('Fail image not found', ErrorCodes.NOT_FOUND, 404);
    }

    const oldOrder = failImage.order;

    if (oldOrder === newOrder) {
      return res.json({
        success: true,
        message: 'Fail image order unchanged',
      });
    }

    // Reorder other images
    if (newOrder > oldOrder) {
      await FailImage.updateMany(
        { order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      );
    } else {
      await FailImage.updateMany(
        { order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      );
    }

    failImage.order = newOrder;
    await failImage.save();

    logger.info(`Fail image ${id} reordered to ${newOrder} by admin ${req.telegramId}`);

    res.json({
      success: true,
      message: 'Fail image reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFailImages,
  getFailImage,
  createFailImage,
  updateFailImage,
  deleteFailImage,
  reorderFailImage,
};

