const fs = require('fs');
const path = require('path');
const { Quiz, Question } = require('../models');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const logger = require('../utils/logger');

const getFileUrl = (filename, type = 'videos') => {
	if (!filename) return null;
	return `${process.env.BACKEND_URL}/uploads/${type}/${filename}`;
};

const getActiveQuiz = async (req, res, next) => {
	try {
		const quiz = await Quiz.findOne({ isActive: true })
			.populate({
				path: 'questions',
				options: { sort: { order: 1 } },
			})
			.lean();

		if (!quiz) {
			// Return empty quiz structure if no active quiz exists
			return res.json({
				success: true,
				data: {
					_id: null,
					name: 'General Quiz',
					questions: [],
					successVideo: null,
					isActive: true,
					questionsCount: 0,
				},
			});
		}

		const formattedQuiz = {
			...quiz,
			successVideo: quiz.successVideo ? getFileUrl(quiz.successVideo, 'videos') : null,
			questions: quiz.questions?.map((q) => {
				const getFileType = (filename) => {
					if (!filename) return 'images';
					const ext = path.extname(filename).toLowerCase();
					const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv'];
					return videoExtensions.includes(ext) ? 'videos' : 'images';
				};
				return {
					_id: q._id,
					questionText: q.questionText,
					type: q.type,
					order: q.order,
					image: q.image ? getFileUrl(q.image, getFileType(q.image)) : null,
					answers: q.answers,
					correctAnswerIds: q.correctAnswerIds,
				};
			}) || [],
		};

		res.json({
			success: true,
			data: formattedQuiz,
		});
	} catch (error) {
		next(error);
	}
};

const updateQuiz = async (req, res, next) => {
	try {
		const { name, questionIds, isActive } = req.body;
		const files = req.files;

		// Find or create active quiz
		let quiz = await Quiz.findOne({ isActive: true });

		if (!quiz) {
			// Create new active quiz if none exists
			quiz = await Quiz.create({
				name: name || 'General Quiz',
				isActive: true,
				createdBy: req.admin._id,
			});
		}

		// Update fields
		if (name !== undefined) {
			quiz.name = name;
		}

		if (questionIds !== undefined) {
			// Parse questionIds if it's a string (from FormData)
			let parsedQuestionIds = questionIds;
			if (typeof questionIds === 'string') {
				try {
					parsedQuestionIds = JSON.parse(questionIds);
				} catch (e) {
					throw new AppError(
						'Invalid questionIds format',
						ErrorCodes.INVALID_INPUT,
						400
					);
				}
			}
			
			// Validate that all question IDs exist
			if (Array.isArray(parsedQuestionIds)) {
				const existingQuestions = await Question.find({
					_id: { $in: parsedQuestionIds },
				});
				if (existingQuestions.length !== parsedQuestionIds.length) {
					throw new AppError(
						'Some question IDs are invalid',
						ErrorCodes.INVALID_INPUT,
						400
					);
				}
				quiz.questions = parsedQuestionIds;
			}
		}

		if (isActive !== undefined) {
			// If activating this quiz, deactivate all others
			if (isActive === true || isActive === 'true') {
				await Quiz.updateMany(
					{ _id: { $ne: quiz._id } },
					{ isActive: false }
				);
			}
			quiz.isActive = isActive === 'true' || isActive === true;
		}

		// Update success video if provided
		if (files?.successVideo?.[0]) {
			// Delete old video if exists
			if (quiz.successVideo) {
				const oldVideoPath = path.join(
					process.cwd(),
					'uploads/videos',
					quiz.successVideo
				);
				if (fs.existsSync(oldVideoPath)) {
					fs.unlinkSync(oldVideoPath);
				}
			}
			quiz.successVideo = files.successVideo[0].filename;
		}

		await quiz.save();

		logger.info(`Quiz updated by admin ${req.telegramId}`);

		// Populate questions for response
		await quiz.populate({
			path: 'questions',
			options: { sort: { order: 1 } },
		});

		res.json({
			success: true,
			data: {
				_id: quiz._id,
				name: quiz.name,
				questions: quiz.questions?.map((q) => ({
					_id: q._id,
					questionText: q.questionText,
					type: q.type,
					order: q.order,
				})) || [],
				successVideo: quiz.successVideo
					? getFileUrl(quiz.successVideo, 'videos')
					: null,
				isActive: quiz.isActive,
				updatedAt: quiz.updatedAt,
			},
		});
	} catch (error) {
		// Clean up uploaded files on error
		if (req.files?.successVideo?.[0]) {
			const filePath = req.files.successVideo[0].path;
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}
		next(error);
	}
};

module.exports = {
	getActiveQuiz,
	updateQuiz,
};

