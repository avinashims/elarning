const AppError = require('./AppError');

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function sendSuccess(res, data, statusCode = 200, message = null) {
  const response = { success: true, data };
  if (message) response.message = message;
  res.status(statusCode).json(response);
}

function sendError(res, message, statusCode = 500) {
  res.status(statusCode).json({ success: false, message });
}

module.exports = { asyncHandler, sendSuccess, sendError, AppError };
