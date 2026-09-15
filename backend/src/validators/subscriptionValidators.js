const { body, param } = require('express-validator');

const createPlanValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ max: 100 })
    .withMessage('Plan name must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  body('price')
    .isInt({ min: 1 })
    .withMessage('Price must be a positive integer'),
  body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .isString()
    .withMessage('Each feature must be a string'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updatePlanValidation = [
  param('id')
    .notEmpty()
    .withMessage('Plan ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Plan name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Plan name must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  body('price')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Price must be a positive integer'),
  body('durationDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('features.*')
    .optional()
    .isString()
    .withMessage('Each feature must be a string'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const createOrderValidation = [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
    .isString()
    .withMessage('Plan ID must be a string'),
];

const verifyPaymentValidation = [
  body('razorpayOrderId')
    .notEmpty()
    .withMessage('Razorpay order ID is required')
    .isString()
    .withMessage('Razorpay order ID must be a string'),
  body('razorpayPaymentId')
    .notEmpty()
    .withMessage('Razorpay payment ID is required')
    .isString()
    .withMessage('Razorpay payment ID must be a string'),
  body('razorpaySignature')
    .notEmpty()
    .withMessage('Razorpay signature is required')
    .isString()
    .withMessage('Razorpay signature must be a string'),
];

module.exports = {
  createPlanValidation,
  updatePlanValidation,
  createOrderValidation,
  verifyPaymentValidation,
};
