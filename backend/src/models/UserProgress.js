const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswers: {
    type: [String],
    required: true
  },
  correctAnswerIds: {
    type: [String],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  }
}, { _id: false });

const userProgressSchema = new mongoose.Schema({
  telegramUserId: {
    type: Number,
    required: true,
    index: true
  },
  selectedName: {
    type: String,
    required: true,
    index: true,
    maxlength: 100
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    default: null,
    index: true
  },
  completedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  answersCorrect: {
    type: Boolean,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  answers: {
    type: [userAnswerSchema],
    default: []
  },
  score: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userProgressSchema.index({ telegramUserId: 1, selectedName: 1 });

userProgressSchema.pre('save', function(next) {
  // Calculate score percentage
  if (this.totalQuestions > 0) {
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  next();
});

module.exports = mongoose.model('UserProgress', userProgressSchema);

