const { asyncHandler, sendSuccess } = require('../utils/helpers');

const uploadThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }

  const thumbnailPath = `/api/uploads/thumbnails/${req.file.filename}`;
  sendSuccess(res, { url: thumbnailPath, filename: req.file.filename }, 201, 'Thumbnail uploaded');
});

const uploadLessonVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file uploaded' });
  }

  sendSuccess(
    res,
    { videoKey: req.file.filename, filename: req.file.filename },
    201,
    'Video uploaded'
  );
});

module.exports = { uploadThumbnail, uploadLessonVideo };
