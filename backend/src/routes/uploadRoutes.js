const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadThumbnail: uploadMiddleware } = require('../middleware/upload');
const { uploadThumbnail } = require('../controllers/uploadController');

const router = express.Router();

router.post(
  '/thumbnail',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  uploadMiddleware.single('thumbnail'),
  uploadThumbnail
);

module.exports = router;
