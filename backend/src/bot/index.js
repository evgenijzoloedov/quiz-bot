const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { Name, Quiz, Question, UserProgress, FailImage } = require('../models');
const logger = require('../utils/logger');

// In-memory session storage
const userSessions = new Map();

class UserSession {
	constructor(userId) {
		this.userId = userId;
		this.selectedName = null;
		this.currentQuestionIndex = 0;
		this.answers = [];
		this.multipleChoiceSelection = [];
		this.failImageIndex = 0; // Index for cycling through fail images
		this.startTime = Date.now();
		this.questionStartTime = Date.now();
		this.createdAt = new Date();
		this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min timeout
	}

	isExpired() {
		return Date.now() > this.expiresAt.getTime();
	}

	reset() {
		this.selectedName = null;
		this.currentQuestionIndex = 0;
		this.answers = [];
		this.multipleChoiceSelection = [];
		this.failImageIndex = 0;
		this.startTime = Date.now();
		this.questionStartTime = Date.now();
	}
}

const initBot = () => {
	const token = process.env.TELEGRAM_BOT_TOKEN;

	if (!token) {
		logger.error('TELEGRAM_BOT_TOKEN is not set');
		return null;
	}

	const bot = new TelegramBot(token, { polling: true });

	logger.info('Telegram bot started');

	// Session cleanup (every 5 minutes)
	setInterval(() => {
		for (const [userId, session] of userSessions.entries()) {
			if (session.isExpired()) {
				userSessions.delete(userId);
				logger.debug(`Session expired for user ${userId}`);
			}
		}
	}, 5 * 60 * 1000);

	// /start command
	bot.onText(/\/start/, async (msg) => {
		const chatId = msg.chat.id;
		const userId = msg.from.id;

		try {
			// Clear any existing session
			userSessions.delete(userId);

			// Get active names
			const names = await Name.find({ isActive: true })
				.select('name')
				.sort({ name: 1 })
				.lean();

			if (names.length === 0) {
				return bot.sendMessage(
					chatId,
					'❌ Нет доступных имен. Попробуйте позже.'
				);
			}

			// Create inline keyboard with name buttons
			const keyboard = names.map((nameDoc) => [
				{
					text: nameDoc.name,
					callback_data: `name_${nameDoc.name}`,
				},
			]);

			await bot.sendMessage(
				chatId,
				'Привет! 👋 Добро пожаловать в Новогодний Paykib1 Quiz Bot!\n\n' +
					'Выбери свое имя и пройди квиз:',
				{
					reply_markup: {
						inline_keyboard: keyboard,
					},
				}
			);
		} catch (error) {
			logger.error('Error in /start command', error);
			bot.sendMessage(chatId, '❌ Ошибка сервера. Попробуйте позже.');
		}
	});

	// /help command
	bot.onText(/\/help/, async (msg) => {
		const chatId = msg.chat.id;

		await bot.sendMessage(
			chatId,
			'📚 *Quiz Bot - Справка*\n\n' +
				'🎮 *Команды:*\n' +
				'/start - Начать квиз, выбрать персонажа\n' +
				'/help - Показать эту справку\n' +
				'/cancel - Отменить текущий квиз\n\n' +
				'📌 *Как играть:*\n' +
				'1. Выберите персонажа\n' +
				'2. Отвечайте на вопросы\n' +
				'3. При правильном ответе - следующий вопрос\n' +
				'4. При неправильном - пробуйте снова\n' +
				'5. В конце получите PDF документ!',
			{ parse_mode: 'Markdown' }
		);
	});

	// /cancel command
	bot.onText(/\/cancel/, async (msg) => {
		const chatId = msg.chat.id;
		const userId = msg.from.id;

		const session = userSessions.get(userId);

		if (session && session.selectedName) {
			userSessions.delete(userId);
			await bot.sendMessage(
				chatId,
				'🚫 Квиз отменён.\n\nНачать заново: /start'
			);
		} else {
			await bot.sendMessage(
				chatId,
				'ℹ️ У вас нет активного квиза.\n\nНачать: /start'
			);
		}
	});

	// Handle callback queries (button clicks)
	bot.on('callback_query', async (query) => {
		const chatId = query.message.chat.id;
		const userId = query.from.id;
		const data = query.data;

		try {
			// Name selection
			if (data.startsWith('name_')) {
				const selectedName = data.replace('name_', '');
				await handleNameSelection(bot, chatId, userId, selectedName);
			}
			// Single choice answer
			else if (data.startsWith('ans_')) {
				await handleSingleAnswer(bot, chatId, userId, data);
			}
			// Multiple choice toggle
			else if (data.startsWith('toggle_')) {
				await handleMultipleToggle(bot, query, chatId, userId, data);
			}
			// Multiple choice confirm
			else if (data.startsWith('confirm_')) {
				await handleMultipleConfirm(bot, chatId, userId, data);
			}
			// Retry question after wrong answer
			else if (data.startsWith('retry_')) {
				await handleRetry(bot, chatId, userId);
			}

			await bot.answerCallbackQuery(query.id);
		} catch (error) {
			logger.error('Error in callback_query', error);

			try {
				await bot.sendMessage(
					chatId,
					'❌ Ошибка при обработке вашего ответа. Попробуйте еще раз.'
				);
			} catch (sendError) {
				logger.error('Failed to send error message', sendError);
			}

			await bot.answerCallbackQuery(query.id);
		}
	});

	// Bot health check
	setInterval(async () => {
		try {
			const me = await bot.getMe();
			logger.debug(`Bot is healthy: @${me.username}`);
		} catch (error) {
			logger.error('Bot health check failed', error);
		}
	}, 5 * 60 * 1000);

	// Error handlers
	bot.on('polling_error', (error) => {
		logger.error(`Telegram polling error: ${error.message}`);
	});

	return bot;
};

// Handle name selection
async function handleNameSelection(bot, chatId, userId, selectedName) {
	// Verify name exists and is active
	const nameDoc = await Name.findOne({ name: selectedName, isActive: true });
	if (!nameDoc) {
		return bot.sendMessage(chatId, '❌ Ошибка: имя не найдено');
	}

	// Get active quiz
	const quiz = await Quiz.findOne({ isActive: true }).populate({
		path: 'questions',
		options: { sort: { order: 1 } },
	});

	if (!quiz) {
		return bot.sendMessage(chatId, '❌ Квиз не настроен. Попробуйте позже.');
	}

	if (!quiz.questions || quiz.questions.length === 0) {
		return bot.sendMessage(
			chatId,
			'❌ В квизе нет вопросов. Попробуйте позже.'
		);
	}

	// Ensure all questions have correctAnswerIds
	quiz.questions.forEach((question) => {
		if (
			!question.correctAnswerIds ||
			!Array.isArray(question.correctAnswerIds) ||
			question.correctAnswerIds.length === 0
		) {
			// Calculate from answers if missing
			question.correctAnswerIds = question.answers
				.filter((a) => a.isCorrect)
				.map((a) => a.id);

			if (question.correctAnswerIds.length === 0) {
				logger.error(`Question ${question._id} has no correct answers!`);
			}
		}
	});

	// Create or reset session
	const session = new UserSession(userId);
	session.selectedName = selectedName;
	session.quiz = quiz;
	userSessions.set(userId, session);

	await bot.sendMessage(
		chatId,
		`👤 Вы выбрали: *${selectedName}*\n\n` +
			`📝 Всего вопросов: ${quiz.questions.length}\n\n` +
			'Начинаем!',
		{ parse_mode: 'Markdown' }
	);

	// Send first question
	await sendQuestion(bot, chatId, session);
}

// Send question to user
async function sendQuestion(bot, chatId, session) {
	if (!session.quiz || !session.quiz.questions) {
		throw new Error('Quiz or questions not found in session');
	}

	if (session.currentQuestionIndex >= session.quiz.questions.length) {
		throw new Error(
			`Question index ${session.currentQuestionIndex} out of bounds`
		);
	}

	const question = session.quiz.questions[session.currentQuestionIndex];

	if (!question) {
		throw new Error(
			`Question at index ${session.currentQuestionIndex} is null`
		);
	}

	if (
		!question.answers ||
		!Array.isArray(question.answers) ||
		question.answers.length === 0
	) {
		throw new Error(`Question ${question._id} has no answers`);
	}

	session.questionStartTime = Date.now();

	const questionNumber = session.currentQuestionIndex + 1;
	const totalQuestions = session.quiz.questions.length;
	const caption = `❓ Вопрос ${questionNumber}/${totalQuestions}\n\n${question.questionText}`;

	let keyboard;

	// Use question index instead of full ObjectId to keep callback_data under 64 bytes
	const questionIndex = session.currentQuestionIndex;

	if (question.type === 'single') {
		// Single choice - each answer is a row
		keyboard = question.answers.map((answer) => [
			{
				text: answer.text,
				callback_data: `ans_${questionIndex}_${answer.id}`,
			},
		]);
	} else {
		// Multiple choice - toggleable buttons + confirm
		keyboard = question.answers.map((answer) => {
			const isSelected = session.multipleChoiceSelection.includes(answer.id);
			return [
				{
					text: `${isSelected ? '✅ ' : '⬜ '}${answer.text}`,
					callback_data: `toggle_${questionIndex}_${answer.id}`,
				},
			];
		});

		// Add confirm button
		keyboard.push([
			{
				text: '✔️ Подтвердить выбор',
				callback_data: `confirm_${questionIndex}`,
			},
		]);
	}

	const options = {
		reply_markup: {
			inline_keyboard: keyboard,
		},
	};

	// Send with image or video if available
	if (question.image) {
		const ext = path.extname(question.image).toLowerCase();
		const videoExtensions = [
			'.mp4',
			'.mov',
			'.webm',
			'.avi',
			'.mkv',
			'.m4v',
			'.3gp',
			'.flv',
			'.wmv',
		];
		const isVideo = videoExtensions.includes(ext);

		const fileType = isVideo ? 'videos' : 'images';
		const filePath = path.join(
			process.cwd(),
			`uploads/${fileType}`,
			question.image
		);

		if (fs.existsSync(filePath)) {
			try {
				if (isVideo) {
					await bot.sendVideo(chatId, fs.createReadStream(filePath), {
						caption: caption,
						...options,
					});
				} else {
					await bot.sendPhoto(chatId, fs.createReadStream(filePath), {
						caption: caption,
						...options,
					});
				}
			} catch (mediaError) {
				logger.error(`Failed to send question media: ${filePath}`, mediaError);
				// Fallback to text message
				await bot.sendMessage(chatId, caption, options);
			}
		} else {
			logger.warn(`Question media not found: ${filePath}`);
			await bot.sendMessage(chatId, caption, options);
		}
	} else {
		await bot.sendMessage(chatId, caption, options);
	}
}

// Handle single choice answer
async function handleSingleAnswer(bot, chatId, userId, data) {
	const session = userSessions.get(userId);

	if (!session || !session.selectedName) {
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	if (session.isExpired()) {
		userSessions.delete(userId);
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	const parts = data.split('_');
	const questionIndex = parseInt(parts[1], 10);
	const answerId = parts[2];

	if (!session.quiz || !session.quiz.questions) {
		logger.error('Character or questions not found in session');
		return bot.sendMessage(chatId, '⏰ Ошибка сессии. Начните заново: /start');
	}

	if (
		isNaN(questionIndex) ||
		questionIndex < 0 ||
		questionIndex >= session.quiz.questions.length
	) {
		logger.error(`Invalid question index: ${questionIndex}`);
		return bot.sendMessage(chatId, '⏰ Ошибка сессии. Начните заново: /start');
	}

	// Check if this is the current question
	if (questionIndex !== session.currentQuestionIndex) {
		logger.debug(
			`Ignoring click on old question index ${questionIndex}, current is ${session.currentQuestionIndex}`
		);
		return; // Ignore clicks on old questions
	}

	const currentQuestion = session.quiz.questions[session.currentQuestionIndex];

	if (!currentQuestion) {
		logger.error(`Question at index ${session.currentQuestionIndex} is null`);
		return bot.sendMessage(chatId, '⏰ Ошибка сессии. Начните заново: /start');
	}

	// Ensure correctAnswerIds is an array
	if (
		!currentQuestion.correctAnswerIds ||
		!Array.isArray(currentQuestion.correctAnswerIds)
	) {
		// Fallback: calculate from answers if not set
		if (!currentQuestion.answers || !Array.isArray(currentQuestion.answers)) {
			logger.error(`Question ${questionId} has no answers array`);
			return bot.sendMessage(chatId, '❌ Ошибка: вопрос не имеет ответов');
		}

		currentQuestion.correctAnswerIds = currentQuestion.answers
			.filter((a) => a.isCorrect)
			.map((a) => a.id);

		logger.warn(
			`Question ${currentQuestion._id} missing correctAnswerIds, calculated from answers`
		);

		if (currentQuestion.correctAnswerIds.length === 0) {
			logger.error(`Question ${currentQuestion._id} has no correct answers`);
			return bot.sendMessage(
				chatId,
				'❌ Ошибка: вопрос не имеет правильных ответов'
			);
		}
	}

	const isCorrect = currentQuestion.correctAnswerIds.includes(answerId);
	const timeSpent = Date.now() - session.questionStartTime;

	logger.debug(
		`Answer check: questionIndex=${questionIndex}, answerId=${answerId}, isCorrect=${isCorrect}`
	);

	session.answers.push({
		questionId: currentQuestion._id,
		userAnswers: [answerId],
		correctAnswerIds: currentQuestion.correctAnswerIds,
		isCorrect,
		timeSpent,
	});

	if (isCorrect) {
		await handleCorrectAnswer(bot, chatId, session, currentQuestion);
	} else {
		await handleWrongAnswer(bot, chatId, session);
	}
}

// Handle multiple choice toggle
async function handleMultipleToggle(bot, query, chatId, userId, data) {
	const session = userSessions.get(userId);

	if (!session || !session.selectedName) {
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	const parts = data.split('_');
	const questionIndex = parseInt(parts[1], 10);
	const answerId = parts[2];

	if (isNaN(questionIndex) || questionIndex !== session.currentQuestionIndex) {
		return; // Ignore clicks on old questions
	}

	const currentQuestion = session.quiz.questions[session.currentQuestionIndex];

	if (!currentQuestion) {
		return;
	}

	// Toggle selection
	const index = session.multipleChoiceSelection.indexOf(answerId);
	if (index === -1) {
		session.multipleChoiceSelection.push(answerId);
	} else {
		session.multipleChoiceSelection.splice(index, 1);
	}

	// Update keyboard
	const keyboard = currentQuestion.answers.map((answer) => {
		const isSelected = session.multipleChoiceSelection.includes(answer.id);
		return [
			{
				text: `${isSelected ? '✅ ' : '⬜ '}${answer.text}`,
				callback_data: `toggle_${questionIndex}_${answer.id}`,
			},
		];
	});

	keyboard.push([
		{
			text: '✔️ Подтвердить выбор',
			callback_data: `confirm_${questionIndex}`,
		},
	]);

	await bot.editMessageReplyMarkup(
		{ inline_keyboard: keyboard },
		{ chat_id: chatId, message_id: query.message.message_id }
	);
}

// Handle multiple choice confirm
async function handleMultipleConfirm(bot, chatId, userId, data) {
	const session = userSessions.get(userId);

	if (!session || !session.selectedName) {
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	const questionIndex = parseInt(data.replace('confirm_', ''), 10);

	if (isNaN(questionIndex) || questionIndex !== session.currentQuestionIndex) {
		return; // Ignore clicks on old questions
	}

	const currentQuestion = session.quiz.questions[session.currentQuestionIndex];

	if (!currentQuestion) {
		return;
	}

	const selectedAnswers = session.multipleChoiceSelection;

	if (selectedAnswers.length === 0) {
		return bot.sendMessage(chatId, '⚠️ Выберите хотя бы один вариант ответа');
	}

	const isAllCorrect =
		selectedAnswers.length === currentQuestion.correctAnswerIds.length &&
		selectedAnswers.every((id) =>
			currentQuestion.correctAnswerIds.includes(id)
		);

	const timeSpent = Date.now() - session.questionStartTime;

	session.answers.push({
		questionId: currentQuestion._id,
		userAnswers: [...selectedAnswers],
		correctAnswerIds: currentQuestion.correctAnswerIds,
		isCorrect: isAllCorrect,
		timeSpent,
	});

	// Reset selection for next question
	session.multipleChoiceSelection = [];

	if (isAllCorrect) {
		await handleCorrectAnswer(bot, chatId, session, currentQuestion);
	} else {
		await handleWrongAnswer(bot, chatId, session);
	}
}

// Handle correct answer
async function handleCorrectAnswer(bot, chatId, session, currentQuestion) {
	try {
		logger.info(
			`Handling correct answer for question ${currentQuestion._id}, user ${session.userId}`
		);

		// Send success message
		// await bot.sendMessage(chatId, '✅ Правильно!');

		// Move to next question
		session.currentQuestionIndex++;
		logger.info(
			`Moving to question ${session.currentQuestionIndex + 1} of ${
				session.quiz.questions.length
			}`
		);

		if (session.currentQuestionIndex < session.quiz.questions.length) {
			// Next question
			try {
				await sendQuestion(bot, chatId, session);
				logger.debug(`Next question sent successfully`);
			} catch (sendError) {
				logger.error(`Failed to send next question:`, sendError);
				throw sendError;
			}
		} else {
			// Quiz completed
			logger.info(`Quiz completed for user ${session.userId}`);
			try {
				await completeQuiz(bot, chatId, session);
			} catch (completeError) {
				logger.error(`Failed to complete quiz:`, completeError);
				throw completeError;
			}
		}
	} catch (error) {
		logger.error('Error in handleCorrectAnswer', {
			error: error.message,
			stack: error.stack,
			userId: session.userId,
			questionId: currentQuestion._id,
			currentIndex: session.currentQuestionIndex,
		});
		throw error; // Re-throw to be caught by callback_query handler
	}
}

// Handle wrong answer
async function handleWrongAnswer(bot, chatId, session) {
	try {
		// Get all active fail images, sorted by order
		const failImages = await FailImage.find({ isActive: true })
			.sort({ order: 1, createdAt: 1 })
			.lean();

		// Create retry button
		const retryKeyboard = {
			inline_keyboard: [
				[
					{
						text: '🔄 Попробовать еще раз',
						callback_data: `retry_${session.currentQuestionIndex}`,
					},
				],
			],
		};

		if (failImages && failImages.length > 0) {
			// Get image at current index
			const currentImage =
				failImages[session.failImageIndex % failImages.length];
			const imagePath = path.join(
				process.cwd(),
				'uploads/fail-images',
				currentImage.filename
			);

			if (fs.existsSync(imagePath)) {
				try {
					await bot.sendPhoto(chatId, fs.createReadStream(imagePath), {
						caption: '❌ Упал мкс, попробуйте еще раз',
						reply_markup: retryKeyboard,
					});
					logger.debug(
						`Fail image sent: ${imagePath} (index: ${session.failImageIndex})`
					);
				} catch (photoError) {
					logger.error(`Failed to send fail image: ${imagePath}`, photoError);
					// Fallback to text message
					await bot.sendMessage(chatId, '❌ Упал мкс, попробуйте еще раз', {
						reply_markup: retryKeyboard,
					});
				}
			} else {
				logger.warn(`Fail image not found: ${imagePath}`);
				await bot.sendMessage(chatId, '❌ Упал мкс, попробуйте еще раз', {
					reply_markup: retryKeyboard,
				});
			}

			// Increment index for next wrong answer (circular)
			session.failImageIndex = (session.failImageIndex + 1) % failImages.length;
		} else {
			// No fail images available, just send text message
			await bot.sendMessage(chatId, '❌ Упал мкс, попробуйте еще раз', {
				reply_markup: retryKeyboard,
			});
		}

		// Don't resend question automatically - wait for retry button click
	} catch (error) {
		logger.error('Error in handleWrongAnswer', error);
		throw error;
	}
}

// Handle retry button click
async function handleRetry(bot, chatId, userId) {
	const session = userSessions.get(userId);

	if (!session || !session.selectedName) {
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	if (session.isExpired()) {
		userSessions.delete(userId);
		return bot.sendMessage(chatId, '⏰ Сеанс истёк. Начните заново: /start');
	}

	if (!session.quiz || !session.quiz.questions) {
		logger.error('Quiz or questions not found in session');
		return bot.sendMessage(chatId, '⏰ Ошибка сессии. Начните заново: /start');
	}

	if (
		session.currentQuestionIndex < 0 ||
		session.currentQuestionIndex >= session.quiz.questions.length
	) {
		logger.error(`Invalid question index: ${session.currentQuestionIndex}`);
		return bot.sendMessage(chatId, '⏰ Ошибка сессии. Начните заново: /start');
	}

	// Resend the same question
	await sendQuestion(bot, chatId, session);
}

// Complete quiz
async function completeQuiz(bot, chatId, session) {
	const userId = session.userId;
	const quiz = session.quiz;
	const selectedName = session.selectedName;
	const totalTime = Date.now() - session.startTime;

	// Check if all final answers are correct
	// We need to check only the last answer for each question
	const questionAnswers = new Map();
	session.answers.forEach((answer) => {
		questionAnswers.set(answer.questionId.toString(), answer);
	});

	const allCorrect = Array.from(questionAnswers.values()).every(
		(a) => a.isCorrect
	);
	const correctCount = Array.from(questionAnswers.values()).filter(
		(a) => a.isCorrect
	).length;
	const totalCount = quiz.questions.length;

	if (allCorrect) {
		// Send success video (common for all)
		if (quiz.successVideo) {
			const videoPath = path.join(
				process.cwd(),
				'uploads/videos',
				quiz.successVideo
			);

			if (fs.existsSync(videoPath)) {
				try {
					await bot.sendVideo(chatId, fs.createReadStream(videoPath), {
						caption: '🎉 Поздравляем! Все ответы правильные!',
					});
				} catch (videoError) {
					logger.error(
						`Failed to send success video: ${videoPath}`,
						videoError
					);
					await bot.sendMessage(
						chatId,
						'🎉 Поздравляем! Все ответы правильные!'
					);
				}
			} else {
				logger.warn(`Success video not found: ${videoPath}`);
				await bot.sendMessage(chatId, '🎉 Поздравляем! Все ответы правильные!');
			}
		} else {
			await bot.sendMessage(chatId, '🎉 Поздравляем! Все ответы правильные!');
		}

		// Send PDF file (unique for each user by name)
		if (selectedName) {
			// Load name from database to get pdfFilePath
			const nameDoc = await Name.findOne({
				name: selectedName,
				isActive: true,
			});

			if (nameDoc && nameDoc.pdfFilePath) {
				// pdfFilePath can be either absolute or relative
				let pdfPath = nameDoc.pdfFilePath;
				if (!path.isAbsolute(pdfPath)) {
					pdfPath = path.join(process.cwd(), pdfPath);
				}

				if (fs.existsSync(pdfPath)) {
					try {
						const pdfFilename = path.basename(pdfPath);
						await bot.sendDocument(chatId, fs.createReadStream(pdfPath), {
							caption: 'Квиз затащен! 🏆 ',
							filename: pdfFilename,
						});
					} catch (pdfError) {
						logger.error(`Failed to send PDF: ${pdfPath}`, pdfError);
					}
				} else {
					logger.warn(`PDF file not found: ${pdfPath}`);
				}
			} else {
				logger.warn(`PDF file not found for name ${selectedName}`);
			}
		}

		await bot.sendMessage(
			chatId,
			'Благодарим за прохождение квиза! 📚\n\n' +
				'Если есть вопросы, пишите @Evzol57'
		);
	} else {
		await bot.sendMessage(
			chatId,
			`❌ К сожалению, вы не прошли квиз.\n\n` +
				`Правильно: ${correctCount}/${totalCount}\n\n` +
				`Попробуйте еще раз: /start`
		);
	}

	// Save progress to database
	try {
		await UserProgress.create({
			telegramUserId: userId,
			selectedName: selectedName,
			quizId: quiz._id,
			completedAt: new Date(),
			answersCorrect: allCorrect,
			totalQuestions: totalCount,
			correctAnswers: correctCount,
			timeSpent: totalTime,
			answers: Array.from(questionAnswers.values()),
		});
	} catch (error) {
		logger.error('Failed to save user progress', error);
	}

	// Clear session
	userSessions.delete(userId);
}

module.exports = { initBot };
