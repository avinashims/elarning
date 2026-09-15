const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');

const cartInclude = {
  course: {
    include: {
      teacher: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  },
};

async function getCart(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { createdAt: 'desc' },
  });

  const total = items.reduce((sum, item) => sum + item.course.price, 0);
  return { items, total, count: items.length };
}

async function addToCart(userId, courseId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true } });
  if (!course) throw new AppError('Course not found', 404);
  if (course.price === 0) throw new AppError('Free courses can be enrolled directly', 400);

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (enrolled) throw new AppError('You already own this course', 409);

  return prisma.cartItem.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
    include: cartInclude,
  });
}

async function removeFromCart(userId, courseId) {
  await prisma.cartItem.deleteMany({ where: { userId, courseId } });
  return { removed: true };
}

async function clearCart(userId) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return { cleared: true };
}

module.exports = { getCart, addToCart, removeFromCart, clearCart };
