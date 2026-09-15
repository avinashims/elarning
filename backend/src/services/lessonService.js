const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { canAccessPremiumContent } = require('./subscriptionService');
const { sanitizeLessonForClient } = require('../utils/lessonSerializer');
const progressService = require('./progressService');

function sanitizeLessonForTeacher(lesson) {
  const { videoUrl, ...rest } = lesson;
  return {
    ...rest,
    hasVideo: !!(lesson.videoKey || lesson.videoUrl),
  };
}

async function verifyCourseAccess(courseId, userId, userRole) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Course not found', 404);
  if (userRole !== 'ADMIN' && course.teacherId !== userId) {
    throw new AppError('Not authorized', 403);
  }
  return course;
}

async function createChapter(courseId, { title, order }, user) {
  await verifyCourseAccess(courseId, user.id, user.role);

  return prisma.chapter.create({
    data: { title, order: order ?? 0, courseId },
  });
}

async function updateChapter(id, data, user) {
  const chapter = await prisma.chapter.findUnique({ where: { id }, include: { course: true } });
  if (!chapter) throw new AppError('Chapter not found', 404);
  await verifyCourseAccess(chapter.courseId, user.id, user.role);

  const allowedFields = ['title', 'order'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  return prisma.chapter.update({ where: { id }, data: updateData });
}

async function deleteChapter(id, user) {
  const chapter = await prisma.chapter.findUnique({ where: { id }, include: { course: true } });
  if (!chapter) throw new AppError('Chapter not found', 404);
  await verifyCourseAccess(chapter.courseId, user.id, user.role);

  await prisma.chapter.delete({ where: { id } });
}

async function createLesson(chapterId, data, user) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true },
  });
  if (!chapter) throw new AppError('Chapter not found', 404);
  await verifyCourseAccess(chapter.courseId, user.id, user.role);

  const { title, description, videoUrl, videoKey, duration, isPremium, order } = data;

  const lesson = await prisma.lesson.create({
    data: {
      title,
      description,
      videoUrl,
      videoKey,
      duration: duration ?? 0,
      isPremium: isPremium ?? false,
      order: order ?? 0,
      chapterId,
    },
  });

  return sanitizeLessonForTeacher(lesson);
}

async function updateLesson(id, data, user) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);
  await verifyCourseAccess(lesson.chapter.courseId, user.id, user.role);

  const allowedFields = ['title', 'description', 'videoUrl', 'videoKey', 'duration', 'isPremium', 'order'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const updated = await prisma.lesson.update({ where: { id }, data: updateData });
  return sanitizeLessonForTeacher(updated);
}

async function deleteLesson(id, user) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);
  await verifyCourseAccess(lesson.chapter.courseId, user.id, user.role);

  await prisma.lesson.delete({ where: { id } });
}

async function reorderLessons(chapterId, lessonIds, user) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true, lessons: true },
  });
  if (!chapter) throw new AppError('Chapter not found', 404);
  await verifyCourseAccess(chapter.courseId, user.id, user.role);

  const existingIds = new Set(chapter.lessons.map((l) => l.id));
  if (lessonIds.length !== chapter.lessons.length) {
    throw new AppError('lessonIds must include all lessons in the chapter', 400);
  }

  for (const lessonId of lessonIds) {
    if (!existingIds.has(lessonId)) {
      throw new AppError('Invalid lesson id in reorder list', 400);
    }
  }

  await prisma.$transaction(
    lessonIds.map((lessonId, index) =>
      prisma.lesson.update({
        where: { id: lessonId },
        data: { order: index },
      })
    )
  );

  return prisma.lesson.findMany({
    where: { chapterId },
    orderBy: { order: 'asc' },
  });
}

async function getLesson(id, userId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      chapter: { include: { course: { select: { id: true, title: true } } } },
    },
  });
  if (!lesson) throw new AppError('Lesson not found', 404);

  const hasPremiumAccess = await canAccessPremiumContent(userId);
  const sanitized = sanitizeLessonForClient(lesson, hasPremiumAccess);

  if (sanitized.locked) {
    return {
      ...sanitized,
      message: 'Premium subscription required',
    };
  }

  const progress = await progressService.getProgress(userId, id);
  return { ...sanitized, progress };
}

module.exports = {
  verifyCourseAccess,
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getLesson,
};
