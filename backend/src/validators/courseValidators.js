const { body } = require('express-validator');

const createCourseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('thumbnail')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  body('teacherId')
    .optional()
    .isUUID()
    .withMessage('teacherId must be a valid UUID'),
];

const updateCourseValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('thumbnail')
    .optional({ values: 'null' })
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('teacherId')
    .optional()
    .isUUID()
    .withMessage('teacherId must be a valid UUID'),
];

module.exports = {
  createCourseValidation,
  updateCourseValidation,
};
