const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');
const { createOrder, verifyPaymentSignature } = require('./razorpayService');
const { getCart, clearCart } = require('./cartService');

async function createCourseOrder(userId, courseId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true } });
  if (!course) throw new AppError('Course not found', 404);
  if (course.price === 0) throw new AppError('This course is free — enroll directly', 400);

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) throw new AppError('You already own this course', 409);

  const receipt = `course_${uuidv4().slice(0, 8)}`;
  const order = await createOrder(course.price, 'INR', receipt);

  const purchase = await prisma.coursePurchase.create({
    data: {
      userId,
      courseId,
      razorpayOrderId: order.id,
      amount: course.price,
      status: 'PENDING',
    },
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, purchaseId: purchase.id, course };
}

async function verifyCoursePurchase(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const purchase = await prisma.coursePurchase.findUnique({ where: { razorpayOrderId } });
  if (!purchase) throw new AppError('Purchase not found', 404);
  if (purchase.userId !== userId) throw new AppError('Unauthorized', 403);
  if (purchase.status === 'COMPLETED') {
    return { purchase, alreadyCompleted: true };
  }

  const [updatedPurchase] = await prisma.$transaction([
    prisma.coursePurchase.update({
      where: { id: purchase.id },
      data: { status: 'COMPLETED', razorpayPaymentId, razorpaySignature },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: purchase.courseId } },
      create: { userId, courseId: purchase.courseId },
      update: {},
    }),
    prisma.cartItem.deleteMany({ where: { userId, courseId: purchase.courseId } }),
  ]);

  return { purchase: updatedPurchase, alreadyCompleted: false };
}

async function checkoutCart(userId) {
  const { items, total } = await getCart(userId);
  if (items.length === 0) throw new AppError('Cart is empty', 400);

  const receipt = `cart_${uuidv4().slice(0, 8)}`;
  const order = await createOrder(total, 'INR', receipt);

  await prisma.coursePurchase.create({
    data: {
      userId,
      courseId: items[0].courseId,
      razorpayOrderId: order.id,
      amount: total,
      status: 'PENDING',
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    items: items.map((i) => i.course),
  };
}

async function verifyCartPurchase(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const purchase = await prisma.coursePurchase.findUnique({ where: { razorpayOrderId } });
  if (!purchase || purchase.userId !== userId) throw new AppError('Purchase not found', 404);

  const cart = await getCart(userId);

  await prisma.$transaction([
    prisma.coursePurchase.update({
      where: { id: purchase.id },
      data: { status: 'COMPLETED', razorpayPaymentId, razorpaySignature },
    }),
    ...cart.items.map((item) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: item.courseId } },
        create: { userId, courseId: item.courseId },
        update: {},
      })
    ),
  ]);

  await clearCart(userId);
  return { completed: true, enrolled: cart.items.length };
}

module.exports = {
  createCourseOrder,
  verifyCoursePurchase,
  checkoutCart,
  verifyCartPurchase,
};
