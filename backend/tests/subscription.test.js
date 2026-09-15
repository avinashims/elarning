const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/razorpayService', () => ({
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
}));

jest.mock('../src/services/progressService', () => ({
  getProgress: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
  subscriptionPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
  },
  videoProgress: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const { createOrder, verifyPaymentSignature } = require('../src/services/razorpayService');

const mockStudent = {
  id: 'user-student',
  email: 'student@example.com',
  name: 'Test Student',
  role: 'STUDENT',
  avatar: null,
};

const mockTeacher = {
  ...mockStudent,
  id: 'user-teacher',
  email: 'teacher@example.com',
  role: 'TEACHER',
};

const mockAdmin = {
  ...mockStudent,
  id: 'user-admin',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const mockPlan = {
  id: 'plan-1',
  name: 'Pro',
  description: 'Premium access',
  price: 999,
  durationDays: 30,
  features: ['All courses', 'Live classes'],
  isActive: true,
};

const mockPayment = {
  id: 'payment-1',
  userId: mockStudent.id,
  planId: mockPlan.id,
  razorpayOrderId: 'order_test123',
  amount: 999,
  status: 'PENDING',
  plan: mockPlan,
};

const mockSubscription = {
  id: 'sub-1',
  userId: mockStudent.id,
  planId: mockPlan.id,
  status: 'ACTIVE',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  plan: mockPlan,
};

const mockPremiumLesson = {
  id: 'lesson-premium',
  title: 'Premium Lesson',
  description: 'Advanced topic',
  videoUrl: 'videos/premium.mp4',
  videoKey: 'videos/premium.mp4',
  duration: 600,
  isPremium: true,
  order: 1,
  chapterId: 'chapter-1',
  chapter: {
    course: { id: 'course-1', title: 'Test Course' },
  },
};

function authHeader(user) {
  return `Bearer ${generateAccessToken(user.id, user.role)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
});

describe('GET /api/payments/plans', () => {
  it('lists active subscription plans', async () => {
    prisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan]);

    const res = await request(app).get('/api/payments/plans');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Pro');
  });
});

describe('POST /api/payments/create-order', () => {
  it('creates a Razorpay order and pending payment', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.subscriptionPlan.findFirst.mockResolvedValue(mockPlan);
    createOrder.mockResolvedValue({
      id: 'order_test123',
      amount: 99900,
      currency: 'INR',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'payment-1',
      razorpayOrderId: 'order_test123',
    });

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', authHeader(mockStudent))
      .send({ planId: mockPlan.id });

    expect(res.status).toBe(200);
    expect(res.body.data.orderId).toBe('order_test123');
    expect(res.body.data.paymentId).toBe('payment-1');
    expect(createOrder).toHaveBeenCalledWith(999, 'INR', expect.any(String));
  });

  it('returns 404 for unknown plan', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.subscriptionPlan.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', authHeader(mockStudent))
      .send({ planId: 'missing-plan' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Plan not found');
  });

  it('returns validation error when planId is missing', async () => {
    mockAuthenticatedUser(mockStudent);

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', authHeader(mockStudent))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toContain('Plan ID is required');
  });
});

describe('POST /api/payments/verify', () => {
  it('verifies payment and activates subscription', async () => {
    mockAuthenticatedUser(mockStudent);
    verifyPaymentSignature.mockReturnValue(true);
    prisma.payment.findUnique.mockResolvedValue(mockPayment);
    prisma.$transaction.mockResolvedValue([
      { ...mockPayment, status: 'COMPLETED' },
      mockSubscription,
    ]);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', authHeader(mockStudent))
      .send({
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test123',
        razorpaySignature: 'valid-signature',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Payment verified');
    expect(res.body.data.subscription.status).toBe('ACTIVE');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects invalid payment signature', async () => {
    mockAuthenticatedUser(mockStudent);
    verifyPaymentSignature.mockReturnValue(false);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', authHeader(mockStudent))
      .send({
        razorpayOrderId: 'order_test123',
        razorpayPaymentId: 'pay_test123',
        razorpaySignature: 'bad-signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid payment signature');
  });

  it('returns validation error when razorpay fields are missing', async () => {
    mockAuthenticatedUser(mockStudent);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', authHeader(mockStudent))
      .send({ razorpayOrderId: 'order_test123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toContain('Razorpay payment ID is required');
  });
});

describe('GET /api/payments/subscription', () => {
  it('returns active subscription for user', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

    const res = await request(app)
      .get('/api/payments/subscription')
      .set('Authorization', authHeader(mockStudent));

    expect(res.status).toBe(200);
    expect(res.body.data.plan.name).toBe('Pro');
    expect(prisma.subscription.updateMany).toHaveBeenCalled();
  });
});

describe('Premium content access', () => {
  it('blocks premium lesson access without subscription', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);
    prisma.subscription.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/lessons/lesson-premium')
      .set('Authorization', authHeader(mockStudent));

    expect(res.status).toBe(200);
    expect(res.body.data.locked).toBe(true);
    expect(res.body.data.videoUrl).toBeUndefined();
    expect(res.body.data.message).toBe('Premium subscription required');
  });

  it('allows premium lesson access with active subscription', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);
    prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

    const res = await request(app)
      .get('/api/lessons/lesson-premium')
      .set('Authorization', authHeader(mockStudent));

    expect(res.status).toBe(200);
    expect(res.body.data.locked).toBeFalsy();
    expect(res.body.data.hasVideo).toBe(true);
  });

  it('allows teacher to bypass premium check', async () => {
    mockAuthenticatedUser(mockTeacher);
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);

    const res = await request(app)
      .get('/api/lessons/lesson-premium')
      .set('Authorization', authHeader(mockTeacher));

    expect(res.status).toBe(200);
    expect(res.body.data.locked).toBeFalsy();
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it('blocks expired subscription from premium access', async () => {
    mockAuthenticatedUser(mockStudent);
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    prisma.subscription.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/lessons/lesson-premium')
      .set('Authorization', authHeader(mockStudent));

    expect(res.status).toBe(200);
    expect(res.body.data.locked).toBe(true);
    expect(res.body.data.message).toBe('Premium subscription required');
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        endDate: { lt: expect.any(Date) },
        userId: mockStudent.id,
      },
      data: { status: 'EXPIRED' },
    });
  });
});

describe('requireActiveSubscription middleware', () => {
  it('allows access when user has active subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(mockStudent);
    prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

    const hasAccess = await subscriptionService.canAccessPremiumContent(mockStudent.id);
    expect(hasAccess).toBe(true);
  });

  it('denies access when user has no subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(mockStudent);
    prisma.subscription.findFirst.mockResolvedValue(null);

    const hasAccess = await subscriptionService.canAccessPremiumContent(mockStudent.id);
    expect(hasAccess).toBe(false);
  });

  it('allows admin bypass', async () => {
    prisma.user.findUnique.mockResolvedValue(mockAdmin);

    const hasAccess = await subscriptionService.canAccessPremiumContent(mockAdmin.id);
    expect(hasAccess).toBe(true);
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
  });
});

describe('Subscription expiry logic', () => {
  it('marks stale subscriptions as EXPIRED', async () => {
    prisma.subscription.updateMany.mockResolvedValue({ count: 3 });

    const count = await subscriptionService.expireSubscriptions();

    expect(count).toBe(3);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        endDate: { lt: expect.any(Date) },
      },
      data: { status: 'EXPIRED' },
    });
  });
});

describe('Admin plan management', () => {
  it('creates a plan with validation', async () => {
    mockAuthenticatedUser(mockAdmin);
    prisma.subscriptionPlan.create.mockResolvedValue(mockPlan);

    const res = await request(app)
      .post('/api/payments/plans')
      .set('Authorization', authHeader(mockAdmin))
      .send({
        name: 'Pro',
        price: 999,
        durationDays: 30,
        features: ['All courses'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Pro');
  });

  it('returns validation error for invalid plan data', async () => {
    mockAuthenticatedUser(mockAdmin);

    const res = await request(app)
      .post('/api/payments/plans')
      .set('Authorization', authHeader(mockAdmin))
      .send({ name: '', price: -1, durationDays: 0 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toContain('Plan name is required');
  });

  it('denies non-admin plan creation', async () => {
    mockAuthenticatedUser(mockStudent);

    const res = await request(app)
      .post('/api/payments/plans')
      .set('Authorization', authHeader(mockStudent))
      .send({
        name: 'Pro',
        price: 999,
        durationDays: 30,
      });

    expect(res.status).toBe(403);
  });
});
