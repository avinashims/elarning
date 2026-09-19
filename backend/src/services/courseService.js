const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { cacheGet, cacheSet, cacheDel } = require('./cacheService');
const { canAccessPremiumContent } = require('./subscriptionService');
const { sanitizeLessonForClient } = require('../utils/lessonSerializer');
const { getCourseRatingStats } = require('./reviewService');

const COURSES_CACHE_KEY = 'courses:published';

const courseListInclude = {
  teacher: { select: { id: true, name: true, avatar: true, headline: true } },
  category: { select: { id: true, name: true, slug: true } },
  chapters: {
    select: { id: true, title: true, _count: { select: { lessons: true } } },
    orderBy: { order: 'asc' },
  },
  _count: { select: { enrollments: true, reviews: true } },
};

const courseDetailInclude = {
  teacher: { select: { id: true, name: true, avatar: true, headline: true, bio: true, website: true } },
  category: { select: { id: true, name: true, slug: true } },
  chapters: {
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: {
          id: true, title: true, description: true, duration: true,
          isPremium: true, order: true, videoUrl: true, videoKey: true,
        },
      },
    },
  },
  _count: { select: { enrollments: true, reviews: true } },
};

function sanitizeCourseLessons(course, hasPremium) {
  return {
    ...course,
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => sanitizeLessonForClient(lesson, hasPremium)),
    })),
  };
}

async function attachRatingStats(courses) {
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      rating: await getCourseRatingStats(course.id),
    }))
  );
}

async function getPublishedCourses(filters = {}) {
  const { category, level, q, sort, minPrice, maxPrice } = filters;

  const where = { isPublished: true };
  if (category) where.category = { slug: category };
  if (level) where.level = level;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { subtitle: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseInt(minPrice, 10);
    if (maxPrice !== undefined) where.price.lte = parseInt(maxPrice, 10);
  }

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'title') orderBy = { title: 'asc' };

  const courses = await prisma.course.findMany({
    where,
    include: courseListInclude,
    orderBy,
  });

  return attachRatingStats(courses);
}

async function getCourseById(id, user) {
  const hasPremium = user ? await canAccessPremiumContent(user.id) : false;

  const course = await prisma.course.findUnique({
    where: { id },
    include: courseDetailInclude,
  });

  if (!course) throw new AppError('Course not found', 404);
  if (!course.isPublished && user?.role !== 'ADMIN' && user?.id !== course.teacherId) {
    throw new AppError('Course not available', 404);
  }

  const rating = await getCourseRatingStats(id);
  let isEnrolled = false;
  let isOwned = false;

  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    isEnrolled = !!enrollment;
    isOwned = isEnrolled;
  }

  return {
    ...sanitizeCourseLessons(course, hasPremium || isOwned),
    rating,
    isEnrolled,
    isOwned,
  };
}

async function getInstructorProfile(teacherId) {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      id: true, name: true, avatar: true, headline: true, bio: true, website: true,
      coursesTaught: {
        where: { isPublished: true },
        include: courseListInclude,
      },
    },
  });
  if (!teacher) throw new AppError('Instructor not found', 404);
  teacher.coursesTaught = await attachRatingStats(teacher.coursesTaught);
  return teacher;
}

async function createCourse(data, user) {
  const resolvedTeacherId = user.role === 'ADMIN' && data.teacherId ? data.teacherId : user.id;

  const course = await prisma.course.create({
    data: {
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      thumbnail: data.thumbnail,
      price: data.price ?? 0,
      originalPrice: data.originalPrice,
      level: data.level ?? 'ALL_LEVELS',
      language: data.language ?? 'English',
      learningObjectives: data.learningObjectives ?? [],
      requirements: data.requirements ?? [],
      targetAudience: data.targetAudience ?? [],
      categoryId: data.categoryId,
      teacherId: resolvedTeacherId,
      isPublished: data.isPublished ?? false,
    },
    include: { teacher: { select: { id: true, name: true } }, category: true },
  });

  await cacheDel('courses:*');
  return course;
}

async function updateCourse(id, data, user) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Course not found', 404);
  if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
    throw new AppError('Not authorized', 403);
  }

  const allowedFields = [
    'title', 'subtitle', 'description', 'thumbnail', 'isPublished',
    'price', 'originalPrice', 'level', 'language', 'learningObjectives',
    'requirements', 'targetAudience', 'categoryId',
  ];
  if (user.role === 'ADMIN') allowedFields.push('teacherId');

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const updated = await prisma.course.update({ where: { id }, data: updateData });
  await cacheDel('courses:*');
  return updated;
}

async function deleteCourse(id, user) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Course not found', 404);
  if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
    throw new AppError('Not authorized', 403);
  }
  await prisma.course.delete({ where: { id } });
  await cacheDel('courses:*');
}

async function enrollCourse(id, userId) {
  const course = await prisma.course.findFirst({ where: { id, isPublished: true } });
  if (!course) throw new AppError('Course not found', 404);
  if (course.price > 0) throw new AppError('Paid courses require purchase — add to cart', 402);

  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: id } },
    create: { userId, courseId: id },
    update: {},
  });
}

async function getMyCourses(user) {
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    return prisma.course.findMany({
      where: user.role === 'ADMIN' ? {} : { teacherId: user.id },
      include: {
        category: true,
        chapters: { include: { _count: { select: { lessons: true } } } },
        _count: { select: { enrollments: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          teacher: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
          chapters: { select: { id: true, _count: { select: { lessons: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const courses = enrollments.map((e) => ({ ...e.course, enrolledAt: e.enrolledAt }));
  return attachRatingStats(courses);
}

module.exports = {
  getPublishedCourses,
  getCourseById,
  getInstructorProfile,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getMyCourses,
};
