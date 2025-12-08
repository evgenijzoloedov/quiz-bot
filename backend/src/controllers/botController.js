const { Name, Quiz, Question } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');

const path = require('path');

const getFileType = (filename) => {
  if (!filename) return 'images';
  const ext = path.extname(filename).toLowerCase();
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv'];
  return videoExtensions.includes(ext) ? 'videos' : 'images';
};

const getFileUrl = (filename, type = null) => {
  if (!filename) return null;
  const fileType = type || getFileType(filename);
  return `${process.env.BACKEND_URL}/uploads/${fileType}/${filename}`;
};

const getNamesForBot = async (req, res, next) => {
  try {
    const names = await Name.find({ isActive: true })
      .select('name')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: names.map(nameDoc => ({
        name: nameDoc.name
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getQuizForBot = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ isActive: true })
      .populate({
        path: 'questions',
        options: { sort: { order: 1 } }
      })
      .lean();

    if (!quiz) {
      throw new AppError('Quiz not found', ErrorCodes.NOT_FOUND, 404);
    }

    res.json({
      success: true,
      data: {
        _id: quiz._id,
        name: quiz.name,
        questions: quiz.questions?.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          type: q.type,
          image: getFileUrl(q.image),
          answers: q.answers.map(a => ({
            id: a.id,
            text: a.text
            // Note: isCorrect is not sent to prevent cheating
          })),
          correctAnswerIds: q.correctAnswerIds
        })) || [],
        successVideo: getFileUrl(quiz.successVideo, 'videos')
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNamesForBot,
  getQuizForBot
};

