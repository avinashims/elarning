const { body } = require('express-validator');
const { REGISTERABLE_ROLES } = require('../constants/roles');

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(REGISTERABLE_ROLES)
    .withMessage(`Role must be one of: ${REGISTERABLE_ROLES.join(', ')}`),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

const logoutValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

const googleSignInValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Google idToken is required')
    .isString()
    .withMessage('idToken must be a string'),
  body('role')
    .optional()
    .isIn(REGISTERABLE_ROLES)
    .withMessage(`Role must be one of: ${REGISTERABLE_ROLES.join(', ')}`),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  updateProfileValidation,
  googleSignInValidation,
};
