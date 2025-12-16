require('dotenv').config();
const mongoose = require('mongoose');
const { Question } = require('./src/models');
const fs = require('fs');

const extractCorrectAnswers = async () => {
	try {
		// Подключение к БД
		await mongoose.connect(process.env.MONGODB_URI, {
			dbName: 'quiz-bot',
		});
		console.log('✅ Подключено к MongoDB\n');

		// Получаем все вопросы
		const questions = await Question.find({}).sort({ order: 1 }).lean();

		console.log(`Найдено вопросов: ${questions.length}\n`);
		console.log('='.repeat(80));

		// Извлекаем правильные ответы
		questions.forEach((q, index) => {
			console.log(`\n${index + 1}. Вопрос #${q.order + 1}`);
			console.log(`Текст: ${q.questionText}`);
			console.log(`Правильные ответы:`);

			const correctAnswers = q.answers.filter((a) => a.isCorrect);
			correctAnswers.forEach((ans, i) => {
				console.log(`${i + 1}) ${ans.text}`);
			});

			console.log('-'.repeat(80));
		});

		// Экспорт в JSON (опционально)
		const exportData = questions.map((q) => ({
			questionId: q._id,
			order: q.order,
			questionText: q.questionText,
			correctAnswers: q.answers
				.filter((a) => a.isCorrect)
				.map((a) => ({ id: a.id, text: a.text })),
			correctAnswerIds: q.correctAnswerIds,
		}));

		fs.writeFileSync(
			'correct-answers-export.json',
			JSON.stringify(exportData, null, 2),
			'utf8'
		);
		console.log('\n✅ Данные экспортированы в correct-answers-export.json');

		await mongoose.disconnect();
		console.log('\n✅ Отключено от MongoDB');
	} catch (error) {
		console.error('❌ Ошибка:', error);
		process.exit(1);
	}
};

extractCorrectAnswers();
