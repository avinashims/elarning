const { param } = require('express-validator');

const lessonVideoAccessValidation = [
  param('lessonId')
    .isUUID()
    .withMessage('Valid lesson ID is required'),
];

module.exports = { lessonVideoAccessValidation };
