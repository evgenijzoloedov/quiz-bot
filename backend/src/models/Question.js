const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 100
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['single', 'multiple'],
    required: true,
    default: 'single'
  },
  image: {
    type: String,
    default: null
  },
  answers: {
    type: [answerSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 1 && v.length <= 5;
      },
      message: 'Question must have between 1 and 5 answers'
    }
  },
  correctAnswerIds: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 1;
      },
      message: 'At least one correct answer is required'
    }
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

questionSchema.index({ order: 1 });
questionSchema.index({ createdBy: 1 });

questionSchema.pre('save', function(next) {
  // Auto-populate correctAnswerIds from answers
  this.correctAnswerIds = this.answers
    .filter(answer => answer.isCorrect)
    .map(answer => answer.id);
  next();
});

module.exports = mongoose.model('Question', questionSchema);

