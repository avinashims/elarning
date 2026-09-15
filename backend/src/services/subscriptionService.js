const prisma = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const { createOrder, verifyPaymentSignature } = require('./razorpayService');

async function expireStaleSubscriptions(userId = null) {
  const where = {
    status: 'ACTIVE',
    endDate: { lt: new Date() },
  };
  if (userId) where.userId = userId;

  await prisma.subscription.updateMany({
    where,
    data: { status: 'EXPIRED' },
  });
}

async function getActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });
}

async function createPlan(data) {
  return prisma.subscriptionPlan.create({ data });
}

async function updatePlan(id, data) {
  return prisma.subscriptionPlan.update({ where: { id }, data });
}

async function getUserActiveSubscription(userId) {
  await expireStaleSubscriptions(userId);

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { endDate: 'desc' },
  });
}

async function activateSubscription(userId, planId) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError('Plan not found', 404);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  return prisma.subscription.create({
    data: {
      userId,
      planId,
      endDate,
      status: 'ACTIVE',
    },
    include: { plan: true },
  });
}

async function expireSubscriptions() {
  const result = await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });
  return result.count;
}

async function hasActiveSubscription(userId) {
  await expireStaleSubscriptions(userId);

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
  });
  return !!subscription;
}

async function canAccessPremiumContent(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'TEACHER') return true;
  return hasActiveSubscription(userId);
}

async function createSubscriptionOrder(userId, planId) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, isActive: true },
  });
  if (!plan) throw new AppError('Plan not found', 404);

  const receipt = `rcpt_${uuidv4().slice(0, 8)}`;
  const order = await createOrder(plan.price, 'INR', receipt);

  const payment = await prisma.payment.create({
    data: {
      userId,
      planId: plan.id,
      razorpayOrderId: order.id,
      amount: plan.price,
      status: 'PENDING',
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentId: payment.id,
    plan,
  };
}

async function verifyAndActivatePayment(
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) {
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new AppError('Invalid payment signature', 400);

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
    include: { plan: true },
  });
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.userId !== userId) throw new AppError('Unauthorized', 403);

  if (payment.status === 'COMPLETED') {
    const subscription = await getUserActiveSubscription(userId);
    return { payment, subscription, alreadyVerified: true };
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + payment.plan.durationDays);

  const [updatedPayment, subscription] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId,
        razorpaySignature,
      },
    }),
    prisma.subscription.create({
      data: {
        userId,
        planId: payment.planId,
        endDate,
        status: 'ACTIVE',
      },
      include: { plan: true },
    }),
  ]);

  return { payment: updatedPayment, subscription, alreadyVerified: false };
}

async function getPaymentHistory(userId) {
  return prisma.payment.findMany({
    where: { userId },
    include: { plan: { select: { name: true, price: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  getActivePlans,
  createPlan,
  updatePlan,
  getUserActiveSubscription,
  activateSubscription,
  expireSubscriptions,
  expireStaleSubscriptions,
  hasActiveSubscription,
  canAccessPremiumContent,
  createSubscriptionOrder,
  verifyAndActivatePayment,
  getPaymentHistory,
};
