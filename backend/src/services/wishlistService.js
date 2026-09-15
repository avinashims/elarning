const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');

const wishlistInclude = {
  course: {
    include: {
      teacher: { select: { id: true, name: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { enrollments: true, reviews: true } },
    },
  },
};

async function getWishlist(userId) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: wishlistInclude,
    orderBy: { createdAt: 'desc' },
  });
}

async function toggleWishlist(userId, courseId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true } });
  if (!course) throw new AppError('Course not found', 404);

  const existing = await prisma.wishlist.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { wishlisted: false };
  }

  await prisma.wishlist.create({ data: { userId, courseId } });
  return { wishlisted: true };
}

async function isWishlisted(userId, courseId) {
  const item = await prisma.wishlist.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!item;
}

module.exports = { getWishlist, toggleWishlist, isWishlisted };
