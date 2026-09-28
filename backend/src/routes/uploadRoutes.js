const express = require('express');
const { authenticate, authorize, requireApprovedTeacher } = require('../middleware/auth');
const { uploadThumbnail: thumbnailMiddleware, uploadLessonVideo: videoMiddleware } = require('../middleware/upload');
const { uploadThumbnail, uploadLessonVideo } = require('../controllers/uploadController');

const router = express.Router();

router.post(
  '/thumbnail',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  thumbnailMiddleware.single('thumbnail'),
  uploadThumbnail
);

router.post(
  '/lesson-video',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  videoMiddleware.single('video'),
  uploadLessonVideo
);

module.exports = router;
