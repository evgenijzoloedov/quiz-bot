const { Name, Question, UserProgress } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');

const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const progressFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      progressFilter.completedAt = dateFilter;
    }

    const [
      totalNames,
      totalQuestions,
      totalCompletions,
      successfulCompletions,
      uniqueUsers,
      namesByPopularity,
      avgTimeSpent
    ] = await Promise.all([
      Name.countDocuments({ isActive: true }),
      Question.countDocuments(),
      UserProgress.countDocuments(progressFilter),
      UserProgress.countDocuments({ ...progressFilter, answersCorrect: true }),
      UserProgress.distinct('telegramUserId', progressFilter).then(ids => ids.length),
      UserProgress.aggregate([
        { $match: progressFilter },
        {
          $group: {
            _id: '$selectedName',
            completions: { $sum: 1 }
          }
        },
        { $sort: { completions: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: '$_id',
            completions: 1
          }
        }
      ]),
      UserProgress.aggregate([
        { $match: progressFilter },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$timeSpent' }
          }
        }
      ])
    ]);

    const completionRate = totalCompletions > 0
      ? Math.round((successfulCompletions / totalCompletions) * 100 * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        totalUsers: uniqueUsers,
        totalNames,
        totalQuestions,
        totalCompletions,
        completionRate,
        averageTimeSpent: avgTimeSpent[0]?.avgTime || 0,
        namesByPopularity
      }
    });
  } catch (error) {
    next(error);
  }
};

const getNameAnalytics = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { startDate, endDate } = req.query;

    const nameDoc = await Name.findOne({ name, isActive: true });
    if (!nameDoc) {
      throw new AppError('Name not found', ErrorCodes.NOT_FOUND, 404);
    }

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const progressFilter = { selectedName: name };
    if (Object.keys(dateFilter).length > 0) {
      progressFilter.completedAt = dateFilter;
    }

    const [
      totalAttempts,
      successfulCompletions,
      avgTimeSpent,
      questionStats
    ] = await Promise.all([
      UserProgress.countDocuments(progressFilter),
      UserProgress.countDocuments({ ...progressFilter, answersCorrect: true }),
      UserProgress.aggregate([
        { $match: progressFilter },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$timeSpent' }
          }
        }
      ]),
      UserProgress.aggregate([
        { $match: progressFilter },
        { $unwind: '$answers' },
        {
          $group: {
            _id: '$answers.questionId',
            correctCount: {
              $sum: { $cond: ['$answers.isCorrect', 1, 0] }
            },
            incorrectCount: {
              $sum: { $cond: ['$answers.isCorrect', 0, 1] }
            },
            totalAttempts: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'questions',
            localField: '_id',
            foreignField: '_id',
            as: 'question'
          }
        },
        { $unwind: '$question' },
        {
          $project: {
            questionId: '$_id',
            questionText: '$question.questionText',
            correctCount: 1,
            incorrectCount: 1,
            accuracy: {
              $multiply: [
                { $divide: ['$correctCount', { $add: ['$correctCount', '$incorrectCount'] }] },
                100
              ]
            }
          }
        },
        { $sort: { accuracy: 1 } }
      ])
    ]);

    const completionRate = totalAttempts > 0
      ? Math.round((successfulCompletions / totalAttempts) * 100 * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        name: nameDoc.name,
        totalAttempts,
        completions: successfulCompletions,
        completionRate,
        averageTimeSpent: avgTimeSpent[0]?.avgTime || 0,
        questionStats: questionStats.map(qs => ({
          ...qs,
          accuracy: Math.round(qs.accuracy * 10) / 10
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getNameAnalytics
};

