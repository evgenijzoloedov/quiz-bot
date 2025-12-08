const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Question } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const getFileType = (filename) => {
  if (!filename) return 'images';
  const ext = path.extname(filename).toLowerCase();
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv'];
  return videoExtensions.includes(ext) ? 'videos' : 'images';
};

const getFileUrl = (filename) => {
  if (!filename) return null;
  const fileType = getFileType(filename);
  return `${process.env.BACKEND_URL}/uploads/${fileType}/${filename}`;
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

const parseAnswers = (answersData) => {
  if (typeof answersData === 'string') {
    try {
      return JSON.parse(answersData);
    } catch {
      throw new AppError('Invalid answers format', ErrorCodes.INVALID_INPUT, 400);
    }
  }
  return answersData;
};

const getAllQuestions = async (req, res, next) => {
  try {
    const sortBy = req.query.sortBy || 'order';

    const questions = await Question.find({})
      .sort({ [sortBy]: 1 })
      .lean();

    const formattedQuestions = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type,
      image: getFileUrl(q.image),
      answers: q.answers,
      correctAnswerIds: q.correctAnswerIds,
      order: q.order
    }));

    res.json({
      success: true,
      data: formattedQuestions
    });
  } catch (error) {
    next(error);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id).lean();

    if (!question) {
      throw new AppError('Question not found', ErrorCodes.NOT_FOUND, 404);
    }

    res.json({
      success: true,
      data: {
        _id: question._id,
        questionText: question.questionText,
        type: question.type,
        image: getFileUrl(question.image),
        answers: question.answers,
        correctAnswerIds: question.correctAnswerIds,
        order: question.order,
        createdAt: question.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { questionText, type, order } = req.body;
    let answers = req.body.answers;
    const files = req.files;

    // Parse answers
    answers = parseAnswers(answers);

    // Generate IDs for answers if not provided
    answers = answers.map((answer, index) => ({
      id: answer.id || `ans_${uuidv4().slice(0, 8)}`,
      text: answer.text,
      isCorrect: answer.isCorrect
    }));

    // Calculate correctAnswerIds
    const correctAnswerIds = answers
      .filter(answer => answer.isCorrect)
      .map(answer => answer.id);

    if (correctAnswerIds.length === 0) {
      throw new AppError('At least one correct answer is required', ErrorCodes.INVALID_INPUT, 400);
    }

    // Get next order if not provided
    let questionOrder = order;
    if (questionOrder === undefined) {
      const lastQuestion = await Question.findOne({})
        .sort({ order: -1 })
        .lean();
      questionOrder = lastQuestion ? lastQuestion.order + 1 : 0;
    }

    const question = await Question.create({
      questionText,
      type,
      image: files?.image?.[0]?.filename || null,
      answers,
      correctAnswerIds, // Explicitly set to avoid validation error
      order: questionOrder,
      createdBy: req.admin._id
    });

    logger.info(`Question created by admin ${req.telegramId}`);

    res.status(201).json({
      success: true,
      data: {
        _id: question._id,
        questionText: question.questionText,
        type: question.type,
        image: getFileUrl(question.image),
        answers: question.answers,
        correctAnswerIds: question.correctAnswerIds,
        order: question.order,
        createdAt: question.createdAt
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        deleteFile(file.path);
      });
    }
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionText, type, order, removeImage } = req.body;
    let answers = req.body.answers;
    const files = req.files;

    const question = await Question.findById(id);

    if (!question) {
      throw new AppError('Question not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Update text fields
    if (questionText) question.questionText = questionText;
    if (type) question.type = type;
    if (order !== undefined) question.order = parseInt(order);

    // Update answers if provided
    if (answers) {
      answers = parseAnswers(answers);
      answers = answers.map(answer => ({
        id: answer.id || `ans_${uuidv4().slice(0, 8)}`,
        text: answer.text,
        isCorrect: answer.isCorrect
      }));
      
      // Calculate correctAnswerIds
      const correctAnswerIds = answers
        .filter(answer => answer.isCorrect)
        .map(answer => answer.id);
      
      if (correctAnswerIds.length === 0) {
        throw new AppError('At least one correct answer is required', ErrorCodes.INVALID_INPUT, 400);
      }
      
      question.answers = answers;
      question.correctAnswerIds = correctAnswerIds;
    }

    // Update files if provided
    if (files?.image?.[0]) {
      if (question.image) {
        const oldFileType = getFileType(question.image);
        deleteFile(path.join(`./uploads/${oldFileType}`, question.image));
      }
      question.image = files.image[0].filename;
    } else if (removeImage === 'true' && question.image) {
      // Explicitly remove image if removeImage flag is set
      const oldFileType = getFileType(question.image);
      deleteFile(path.join(`./uploads/${oldFileType}`, question.image));
      question.image = null;
    }

    await question.save();

    logger.info(`Question ${id} updated by admin ${req.telegramId}`);

    res.json({
      success: true,
      data: {
        _id: question._id,
        questionText: question.questionText,
        type: question.type,
        image: getFileUrl(question.image),
        answers: question.answers,
        correctAnswerIds: question.correctAnswerIds,
        order: question.order,
        updatedAt: question.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      throw new AppError('Question not found', ErrorCodes.NOT_FOUND, 404);
    }

    // Delete associated files
    if (question.image) {
      const fileType = getFileType(question.image);
      deleteFile(path.join(`./uploads/${fileType}`, question.image));
    }

    // Delete question
    await Question.findByIdAndDelete(id);

    logger.info(`Question ${id} deleted by admin ${req.telegramId}`);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const reorderQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.validatedBody;

    const question = await Question.findById(id);

    if (!question) {
      throw new AppError('Question not found', ErrorCodes.NOT_FOUND, 404);
    }

    const oldOrder = question.order;

    if (oldOrder === newOrder) {
      return res.json({
        success: true,
        message: 'Question order unchanged'
      });
    }

    // Reorder other questions
    if (newOrder > oldOrder) {
      // Moving down: decrease order of questions between old and new
      await Question.updateMany(
        {
          order: { $gt: oldOrder, $lte: newOrder }
        },
        { $inc: { order: -1 } }
      );
    } else {
      // Moving up: increase order of questions between new and old
      await Question.updateMany(
        {
          order: { $gte: newOrder, $lt: oldOrder }
        },
        { $inc: { order: 1 } }
      );
    }

    question.order = newOrder;
    await question.save();

    logger.info(`Question ${id} reordered to ${newOrder} by admin ${req.telegramId}`);

    res.json({
      success: true,
      message: 'Question reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestion
};

