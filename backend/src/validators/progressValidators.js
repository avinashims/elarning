const { body, param } = require('express-validator');

const updateProgressValidation = [
  param('lessonId')
    .isUUID()
    .withMessage('Valid lesson ID is required'),
  body('watchedSeconds')
    .isInt({ min: 0 })
    .withMessage('watchedSeconds must be a non-negative integer'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed must be a boolean'),
];

const getProgressValidation = [
  param('lessonId')
    .isUUID()
    .withMessage('Valid lesson ID is required'),
];

module.exports = { updateProgressValidation, getProgressValidation };
