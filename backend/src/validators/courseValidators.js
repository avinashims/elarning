const { body } = require('express-validator');

function isValidThumbnail(value) {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  if (value.startsWith('/api/uploads/thumbnails/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
    .custom((value) => {
      if (!isValidThumbnail(value)) {
        throw new Error('Thumbnail must be a valid URL or uploaded image path');
      }
      return true;
    }),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Price must be a whole number (0 for free)'),
  body('originalPrice')
    .optional({ values: 'null' })
    .isInt({ min: 0 })
    .withMessage('Original price must be a whole number'),
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
    .custom((value) => {
      if (!isValidThumbnail(value)) {
        throw new Error('Thumbnail must be a valid URL or uploaded image path');
      }
      return true;
    }),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Price must be a whole number (0 for free)'),
  body('originalPrice')
    .optional({ values: 'null' })
    .isInt({ min: 0 })
    .withMessage('Original price must be a whole number'),
  body('teacherId')
    .optional()
    .isUUID()
    .withMessage('teacherId must be a valid UUID'),
];

module.exports = {
  createCourseValidation,
  updateCourseValidation,
};
