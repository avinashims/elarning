const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return next(new AppError('Validation failed', 400, messages));
  }
  next();
}

module.exports = { validate };
