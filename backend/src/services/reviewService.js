const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');

async function getCourseReviews(courseId) {
  return prisma.review.findMany({
    where: { courseId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getCourseRatingStats(courseId) {
  const reviews = await prisma.review.findMany({
    where: { courseId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    sum += r.rating;
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
  });

  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    breakdown,
  };
}

async function createReview(userId, courseId, { rating, comment }) {
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrolled) throw new AppError('You must be enrolled to review this course', 403);

  return prisma.review.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, rating, comment },
    update: { rating, comment },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

module.exports = { getCourseReviews, getCourseRatingStats, createReview };
