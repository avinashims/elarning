const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { canAccessPremiumContent } = require('./subscriptionService');

function getStorageRoot() {
  return path.resolve(__dirname, '../..', config.video.storagePath);
}

function resolveLessonVideoKey(lesson) {
  if (lesson.videoKey) return lesson.videoKey;
  if (lesson.videoUrl && !/^https?:\/\//i.test(lesson.videoUrl)) {
    return lesson.videoUrl;
  }
  return null;
}

async function resolveVideoKey(lessonId) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError('Lesson not found', 404);

  const videoKey = resolveLessonVideoKey(lesson);
  if (!videoKey) throw new AppError('Video not available for this lesson', 404);

  return videoKey;
}

async function verifyVideoAccess(userId, userRole, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: { select: { courseId: true } } },
  });

  if (!lesson) throw new AppError('Lesson not found', 404);

  if (lesson.isPremium) {
    const hasAccess = await canAccessPremiumContent(userId);
    if (!hasAccess) {
      throw new AppError('Premium subscription required', 403);
    }
  }

  const videoKey = resolveLessonVideoKey(lesson);
  if (!videoKey) throw new AppError('Video not available for this lesson', 404);

  return { lesson, videoKey };
}

function generateSignedVideoUrl(videoKey, userId, lessonId) {
  const expiresAtMs = Date.now() + config.video.urlExpirySeconds * 1000;
  const payload = { videoKey, userId, lessonId, exp: expiresAtMs };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.video.signingSecret)
    .update(payloadB64)
    .digest('base64url');
  const token = `${payloadB64}.${signature}`;

  return {
    signedUrl: `/api/videos/stream?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

function verifySignedToken(token) {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) {
    throw new AppError('Invalid video token', 401);
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.video.signingSecret)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new AppError('Invalid video token', 401);
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw new AppError('Invalid video token', 401);
  }

  if (!payload.exp || Date.now() > payload.exp) {
    throw new AppError('Video token expired', 401);
  }

  if (!payload.videoKey || !payload.userId || !payload.lessonId) {
    throw new AppError('Invalid video token', 401);
  }

  return payload;
}

function getVideoFilePath(videoKey) {
  const storageRoot = getStorageRoot();
  const normalizedKey = path.normalize(videoKey).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolvedPath = path.resolve(storageRoot, normalizedKey);

  if (!resolvedPath.startsWith(storageRoot + path.sep) && resolvedPath !== storageRoot) {
    throw new AppError('Invalid video path', 400);
  }

  return resolvedPath;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.m4v': 'video/x-m4v',
  };
  return types[ext] || 'application/octet-stream';
}

function streamVideoFile(filePath, req, res) {
  if (!fs.existsSync(filePath)) {
    throw new AppError('Video file not found', 404);
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const contentType = getContentType(filePath);
  const range = req.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      throw new AppError('Invalid range header', 416);
    }

    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
  });
  fs.createReadStream(filePath).pipe(res);
}

module.exports = {
  resolveVideoKey,
  verifyVideoAccess,
  generateSignedVideoUrl,
  verifySignedToken,
  getVideoFilePath,
  streamVideoFile,
  resolveLessonVideoKey,
};
