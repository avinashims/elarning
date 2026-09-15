const { body } = require('express-validator');

const createChapterValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

const updateChapterValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

const createLessonValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string'),
  body('videoUrl')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('videoUrl must be a valid URL'),
  body('videoKey')
    .optional({ values: 'null' })
    .isString()
    .withMessage('videoKey must be a string')
    .matches(/^[^/\\].*/)
    .withMessage('videoKey must be a relative path'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

const updateLessonValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string'),
  body('videoUrl')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('videoUrl must be a valid URL'),
  body('videoKey')
    .optional({ values: 'null' })
    .isString()
    .withMessage('videoKey must be a string')
    .matches(/^[^/\\].*/)
    .withMessage('videoKey must be a relative path'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

const reorderLessonsValidation = [
  body('lessonIds')
    .isArray({ min: 1 })
    .withMessage('lessonIds must be a non-empty array'),
  body('lessonIds.*')
    .isUUID()
    .withMessage('Each lesson id must be a valid UUID'),
];

module.exports = {
  createChapterValidation,
  updateChapterValidation,
  createLessonValidation,
  updateLessonValidation,
  reorderLessonsValidation,
};
