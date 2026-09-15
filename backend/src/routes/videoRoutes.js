const express = require('express');
const { getLessonVideoAccess, streamVideo } = require('../controllers/videoController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { lessonVideoAccessValidation } = require('../validators/videoValidators');

const router = express.Router();

router.get('/lessons/:lessonId/access', authenticate, lessonVideoAccessValidation, validate, getLessonVideoAccess);
router.get('/stream', streamVideo);

module.exports = router;
