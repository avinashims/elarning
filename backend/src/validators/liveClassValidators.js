const { body, param, query } = require('express-validator');

const scheduleLiveClassValidation = [
  body('courseId').isUUID().withMessage('courseId must be a valid UUID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date'),
  body('meetingUrl')
    .optional()
    .isURL()
    .withMessage('meetingUrl must be a valid URL'),
  body('liveStreamId')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('liveStreamId must be at most 255 characters'),
  body('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean'),
];

const updateLiveClassValidation = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
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
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid date'),
  body('meetingUrl')
    .optional()
    .isURL()
    .withMessage('meetingUrl must be a valid URL'),
  body('liveStreamId')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('liveStreamId must be at most 255 characters'),
  body('isPremium')
    .optional()
    .isBoolean()
    .withMessage('isPremium must be a boolean'),
];

const liveClassIdParamValidation = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

const endLiveClassValidation = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('recordingUrl')
    .optional()
    .isURL()
    .withMessage('recordingUrl must be a valid URL'),
];

const listLiveClassesValidation = [
  query('courseId')
    .optional()
    .isUUID()
    .withMessage('courseId must be a valid UUID'),
  query('status')
    .optional()
    .isIn(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'])
    .withMessage('status must be a valid live class status'),
];

const recordedClassesValidation = [
  query('courseId')
    .optional()
    .isUUID()
    .withMessage('courseId must be a valid UUID'),
];

module.exports = {
  scheduleLiveClassValidation,
  updateLiveClassValidation,
  liveClassIdParamValidation,
  endLiveClassValidation,
  listLiveClassesValidation,
  recordedClassesValidation,
};
