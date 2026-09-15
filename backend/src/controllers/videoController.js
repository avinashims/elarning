const { asyncHandler, sendSuccess, AppError } = require('../utils/helpers');
const {
  verifyVideoAccess,
  generateSignedVideoUrl,
  verifySignedToken,
  getVideoFilePath,
  streamVideoFile,
} = require('../services/videoAccessService');

const getLessonVideoAccess = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { videoKey } = await verifyVideoAccess(req.user.id, req.user.role, lessonId);
  const access = generateSignedVideoUrl(videoKey, req.user.id, lessonId);
  sendSuccess(res, access);
});

const streamVideo = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new AppError('Video token required', 401);

  const payload = verifySignedToken(token);
  const filePath = getVideoFilePath(payload.videoKey);
  streamVideoFile(filePath, req, res);
});

module.exports = { getLessonVideoAccess, streamVideo };
