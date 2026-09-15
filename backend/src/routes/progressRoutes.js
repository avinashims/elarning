const express = require('express');
const {
  updateProgress,
  getProgress,
  getCourseProgress,
  getAllProgress,
} = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProgressValidation, getProgressValidation } = require('../validators/progressValidators');

const router = express.Router();

router.get('/', authenticate, getAllProgress);
router.get('/course/:courseId', authenticate, getCourseProgress);
router.get('/lesson/:lessonId', authenticate, getProgressValidation, validate, getProgress);
router.put('/lesson/:lessonId', authenticate, updateProgressValidation, validate, updateProgress);

module.exports = router;
