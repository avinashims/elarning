const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { verifyVideoAccess } = require('./videoAccessService');

async function saveProgress(userId, userRole, lessonId, watchedSeconds, completed) {
  await verifyVideoAccess(userId, userRole, lessonId);

  return prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      watchedSeconds,
      completed,
      lastWatchedAt: new Date(),
    },
    update: {
      watchedSeconds,
      completed,
      lastWatchedAt: new Date(),
    },
  });
}

async function getProgress(userId, lessonId) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError('Lesson not found', 404);

  const progress = await prisma.videoProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  return progress || { watchedSeconds: 0, completed: false };
}

module.exports = { saveProgress, getProgress };
