const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const thumbnailDir = path.join(config.uploadsPath, 'thumbnails');
fs.mkdirSync(thumbnailDir, { recursive: true });

const videoDir = path.resolve(__dirname, '../..', config.video.storagePath);
fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, thumbnailDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
  }
}

const uploadThumbnail = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function videoFileFilter(_req, file, cb) {
  const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WEBM, MOV, or M4V videos are allowed'));
  }
}

const uploadLessonVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});

module.exports = { uploadThumbnail, uploadLessonVideo, thumbnailDir, videoDir };
