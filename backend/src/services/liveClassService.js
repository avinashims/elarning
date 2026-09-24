const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { canAccessPremiumContent } = require('./subscriptionService');

const JOIN_WINDOW_MINUTES = 15;

const liveClassInclude = {
  course: { select: { id: true, title: true, thumbnail: true, teacherId: true } },
};

async function verifyCourseOwnership(courseId, userId, userRole) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Course not found', 404);
  if (userRole !== 'ADMIN' && course.teacherId !== userId) {
    throw new AppError('Not authorized', 403);
  }
  return course;
}

async function getLiveClassWithCourse(id) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!liveClass) throw new AppError('Live class not found', 404);
  return liveClass;
}

async function verifyLiveClassOwnership(liveClassId, userId, userRole) {
  const liveClass = await getLiveClassWithCourse(liveClassId);
  await verifyCourseOwnership(liveClass.courseId, userId, userRole);
  return liveClass;
}

function isWithinJoinWindow(liveClass) {
  if (liveClass.status === 'LIVE') return true;
  if (liveClass.status !== 'SCHEDULED') return false;

  const now = Date.now();
  const scheduled = new Date(liveClass.scheduledAt).getTime();
  const windowMs = JOIN_WINDOW_MINUTES * 60 * 1000;
  return now >= scheduled - windowMs;
}

async function scheduleLiveClass(teacherId, userRole, data) {
  const { courseId, title, description, scheduledAt, meetingUrl, liveStreamId, isPremium } = data;
  await verifyCourseOwnership(courseId, teacherId, userRole);

  return prisma.liveClass.create({
    data: {
      courseId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      meetingUrl,
      liveStreamId,
      isPremium: isPremium ?? false,
      status: 'SCHEDULED',
    },
    include: liveClassInclude,
  });
}

async function startLiveClass(id, teacherId, userRole) {
  const liveClass = await verifyLiveClassOwnership(id, teacherId, userRole);

  if (liveClass.status !== 'SCHEDULED') {
    throw new AppError('Only scheduled classes can be started', 400);
  }

  return prisma.liveClass.update({
    where: { id },
    data: { status: 'LIVE', startedAt: new Date() },
    include: liveClassInclude,
  });
}

async function endLiveClass(id, teacherId, userRole, { recordingUrl } = {}) {
  const liveClass = await verifyLiveClassOwnership(id, teacherId, userRole);

  if (liveClass.status !== 'LIVE') {
    throw new AppError('Only live classes can be ended', 400);
  }

  const endedAt = new Date();
  const updateData = {
    status: 'COMPLETED',
    endedAt,
    recordingUrl: recordingUrl || liveClass.recordingUrl,
  };

  const updated = await prisma.liveClass.update({
    where: { id },
    data: updateData,
    include: liveClassInclude,
  });

  if (recordingUrl) {
    await prisma.recordedClass.create({
      data: {
        title: liveClass.title,
        description: liveClass.description,
        videoUrl: recordingUrl,
        liveClassId: liveClass.id,
        courseId: liveClass.courseId,
        recordedAt: endedAt,
        isPremium: liveClass.isPremium,
      },
    });
  }

  return updated;
}

async function getUpcomingLiveClasses(filters = {}) {
  const now = new Date();
  const { courseId } = filters;

  const where = {
    status: { in: ['SCHEDULED', 'LIVE'] },
    OR: [{ status: 'LIVE' }, { scheduledAt: { gte: now } }],
  };
  if (courseId) where.courseId = courseId;

  return prisma.liveClass.findMany({
    where,
    include: liveClassInclude,
    orderBy: { scheduledAt: 'asc' },
    take: courseId ? 10 : 20,
  });
}

async function getLiveClasses(filters = {}) {
  const where = {};
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.status) where.status = filters.status;

  return prisma.liveClass.findMany({
    where,
    include: {
      ...liveClassInclude,
      recordedClasses: { select: { id: true, title: true, videoUrl: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  });
}

async function getLiveClassesForCourse(courseId) {
  return prisma.liveClass.findMany({
    where: { courseId },
    include: liveClassInclude,
    orderBy: { scheduledAt: 'desc' },
  });
}

async function updateLiveClass(id, teacherId, userRole, data) {
  await verifyLiveClassOwnership(id, teacherId, userRole);

  const allowed = ['title', 'description', 'scheduledAt', 'meetingUrl', 'liveStreamId', 'isPremium'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  if (updateData.scheduledAt) updateData.scheduledAt = new Date(updateData.scheduledAt);

  return prisma.liveClass.update({
    where: { id },
    data: updateData,
    include: liveClassInclude,
  });
}

async function getLiveClassJoinAccess(liveClassId, userId, userRole) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: { course: { select: { id: true, title: true, teacherId: true } } },
  });

  if (!liveClass) throw new AppError('Live class not found', 404);

  if (liveClass.status === 'COMPLETED' || liveClass.status === 'CANCELLED') {
    throw new AppError('This class is no longer available', 403);
  }

  if (!isWithinJoinWindow(liveClass)) {
    throw new AppError('Class has not started yet', 403);
  }

  const isTeacherOrAdmin =
    userRole === 'ADMIN' ||
    userRole === 'TEACHER' ||
    liveClass.course.teacherId === userId;

  if (liveClass.isPremium && !isTeacherOrAdmin) {
    const hasPremium = await canAccessPremiumContent(userId);
    if (!hasPremium) {
      throw new AppError('Premium subscription required to join this class', 403);
    }
  }

  return {
    eligible: true,
    liveClassId: liveClass.id,
    title: liveClass.title,
    status: liveClass.status,
    liveStreamId: liveClass.liveStreamId,
    meetingUrl: liveClass.meetingUrl,
    isPremium: liveClass.isPremium,
    scheduledAt: liveClass.scheduledAt,
    startedAt: liveClass.startedAt,
  };
}

async function getRecordedClasses(userId, userRole, filters = {}) {
  const hasPremium = await canAccessPremiumContent(userId);

  const where = {};
  if (filters.courseId) {
    where.OR = [{ courseId: filters.courseId }, { liveClass: { courseId: filters.courseId } }];
  }

  const recordings = await prisma.recordedClass.findMany({
    where,
    include: { liveClass: { select: { id: true, title: true, courseId: true } } },
    orderBy: { recordedAt: 'desc' },
  });

  return recordings.map((rec) => ({
    ...rec,
    videoUrl: rec.isPremium && !hasPremium ? null : rec.videoUrl,
    locked: rec.isPremium && !hasPremium,
  }));
}

async function createRecordedClass(teacherId, userRole, data) {
  const { title, description, videoUrl, liveClassId, courseId, duration, isPremium } = data;

  if (liveClassId) {
    const liveClass = await getLiveClassWithCourse(liveClassId);
    await verifyCourseOwnership(liveClass.courseId, teacherId, userRole);
  } else if (courseId) {
    await verifyCourseOwnership(courseId, teacherId, userRole);
  }

  return prisma.recordedClass.create({
    data: {
      title,
      description,
      videoUrl,
      liveClassId,
      courseId,
      duration: duration ?? 0,
      isPremium: isPremium ?? false,
    },
  });
}

module.exports = {
  scheduleLiveClass,
  startLiveClass,
  endLiveClass,
  getUpcomingLiveClasses,
  getLiveClasses,
  getLiveClassesForCourse,
  updateLiveClass,
  getLiveClassJoinAccess,
  getRecordedClasses,
  createRecordedClass,
};
