const prisma = require('../config/database');
const { asyncHandler, sendSuccess } = require('../utils/helpers');
const progressService = require('../services/progressService');

const updateProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { watchedSeconds, completed } = req.body;

  const progress = await progressService.saveProgress(
    req.user.id,
    req.user.role,
    lessonId,
    watchedSeconds,
    completed ?? false
  );

  sendSuccess(res, progress, 200, 'Progress saved');
});

const getProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const progress = await progressService.getProgress(req.user.id, lessonId);
  sendSuccess(res, progress);
});

const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const lessons = await prisma.lesson.findMany({
    where: { chapter: { courseId } },
    select: { id: true },
  });

  const lessonIds = lessons.map((l) => l.id);
  const progressList = await prisma.videoProgress.findMany({
    where: { userId: req.user.id, lessonId: { in: lessonIds } },
  });

  const totalLessons = lessonIds.length;
  const completedLessons = progressList.filter((p) => p.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  sendSuccess(res, {
    progressList,
    stats: { totalLessons, completedLessons, progressPercent },
  });
});

const getAllProgress = asyncHandler(async (req, res) => {
  const progress = await prisma.videoProgress.findMany({
    where: { userId: req.user.id },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          chapter: { select: { course: { select: { id: true, title: true } } } },
        },
      },
    },
    orderBy: { lastWatchedAt: 'desc' },
  });
  sendSuccess(res, progress);
});

module.exports = { updateProgress, getProgress, getCourseProgress, getAllProgress };
