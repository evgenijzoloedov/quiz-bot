const Joi = require('joi');
const { AppError, ErrorCodes } = require('../utils/errorCodes');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(messages, ErrorCodes.INVALID_INPUT, 400));
    }
    
    req.validatedBody = value;
    next();
  };
};

// Validation schemas
const schemas = {
  login: Joi.object({
    telegramId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Telegram ID must be a number',
        'number.positive': 'Telegram ID must be positive',
        'any.required': 'Telegram ID is required'
      })
  }),

  createCharacter: Joi.object({
    name: Joi.string().max(50).required()
      .messages({
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
    description: Joi.string().max(500).allow('').optional()
  }),

  updateCharacter: Joi.object({
    name: Joi.string().max(50).optional(),
    description: Joi.string().max(500).allow('').optional(),
    isActive: Joi.boolean().optional()
  }),

  createQuestion: Joi.object({
    questionText: Joi.string().max(500).required()
      .messages({
        'string.max': 'Question text cannot exceed 500 characters',
        'any.required': 'Question text is required'
      }),
    type: Joi.string().valid('single', 'multiple').required()
      .messages({
        'any.only': 'Type must be either "single" or "multiple"',
        'any.required': 'Question type is required'
      }),
    answers: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().max(100).required(),
          isCorrect: Joi.boolean().required()
        })
      ).min(1).max(5),
      Joi.string() // Allow JSON string
    ).required()
      .messages({
        'array.min': 'Question must have at least 1 answer',
        'array.max': 'Question cannot have more than 5 answers',
        'any.required': 'Answers are required'
      }),
    order: Joi.number().integer().min(0).optional()
  }),

  updateQuestion: Joi.object({
    questionText: Joi.string().max(500).optional(),
    type: Joi.string().valid('single', 'multiple').optional(),
    answers: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().max(100).required(),
          isCorrect: Joi.boolean().required()
        })
      ).min(1).max(5),
      Joi.string()
    ).optional(),
    order: Joi.number().integer().min(0).optional()
  }),

  reorderQuestion: Joi.object({
    newOrder: Joi.number().integer().min(0).required()
      .messages({
        'any.required': 'New order is required'
      })
  })
};

module.exports = { validate, schemas };

