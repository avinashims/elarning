const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/services/razorpayService', () => ({
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
}));

jest.mock('../src/services/progressService', () => ({
  getProgress: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/config/database', () => ({
  user: { findUnique: jest.fn() },
  course: { findUnique: jest.fn() },
  liveClass: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  recordedClass: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  lesson: { findUnique: jest.fn() },
  videoProgress: { findUnique: jest.fn() },
  enrollment: { findMany: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(),
}));

const COURSE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LIVE_CLASS_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PREMIUM_CLASS_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TEACHER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const STUDENT_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const ADMIN_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const OTHER_TEACHER_ID = '11111111-1111-4111-8111-111111111111';

const mockCourse = {
  id: COURSE_ID,
  title: 'Test Course',
  teacherId: TEACHER_ID,
};

const mockLiveClass = {
  id: LIVE_CLASS_ID,
  title: 'Free Live Class',
  description: 'A free session',
  courseId: COURSE_ID,
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
  startedAt: null,
  endedAt: null,
  meetingUrl: 'https://meet.google.com/free-class',
  liveStreamId: 'stream-free-001',
  recordingUrl: null,
  isPremium: false,
  status: 'SCHEDULED',
  course: { id: COURSE_ID, title: 'Test Course', thumbnail: null, teacherId: TEACHER_ID },
};

const mockPremiumClass = {
  ...mockLiveClass,
  id: PREMIUM_CLASS_ID,
  title: 'Premium Live Class',
  isPremium: true,
  meetingUrl: 'https://meet.google.com/premium-class',
  liveStreamId: 'stream-premium-001',
};

const mockStudent = {
  id: STUDENT_ID,
  email: 'student@test.com',
  name: 'Test Student',
  role: 'STUDENT',
  avatar: null,
};

const mockTeacher = {
  id: TEACHER_ID,
  email: 'teacher@test.com',
  name: 'Test Teacher',
  role: 'TEACHER',
  avatar: null,
};

const mockAdmin = {
  id: ADMIN_ID,
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  avatar: null,
};

function authHeader(userId, role) {
  return { Authorization: `Bearer ${generateAccessToken(userId, role)}` };
}

function setupUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Live Class API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
    prisma.course.findUnique.mockResolvedValue(mockCourse);
  });

  describe('POST /api/live-classes', () => {
    it('allows teacher to schedule a live class', async () => {
      setupUser(mockTeacher);
      const created = { ...mockLiveClass, id: LIVE_CLASS_ID };
      prisma.liveClass.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/live-classes')
        .set(authHeader(TEACHER_ID, 'TEACHER'))
        .send({
          courseId: COURSE_ID,
          title: 'Free Live Class',
          description: 'A free session',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          meetingUrl: 'https://meet.google.com/free-class',
          liveStreamId: 'stream-free-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SCHEDULED');
      expect(prisma.liveClass.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SCHEDULED', isPremium: false }),
        })
      );
    });

    it('returns 400 for validation errors', async () => {
      setupUser(mockTeacher);

      const res = await request(app)
        .post('/api/live-classes')
        .set(authHeader(TEACHER_ID, 'TEACHER'))
        .send({ courseId: 'invalid', title: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    it('blocks student from scheduling', async () => {
      setupUser(mockStudent);

      const res = await request(app)
        .post('/api/live-classes')
        .set(authHeader(STUDENT_ID, 'STUDENT'))
        .send({
          courseId: COURSE_ID,
          title: 'Unauthorized Class',
          scheduledAt: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/live-classes/:id/start', () => {
    it('starts a scheduled live class', async () => {
      setupUser(mockTeacher);
      prisma.liveClass.findUnique.mockResolvedValue({ ...mockLiveClass, course: mockCourse });
      prisma.liveClass.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...mockLiveClass, ...data, status: 'LIVE' })
      );

      const res = await request(app)
        .post(`/api/live-classes/${LIVE_CLASS_ID}/start`)
        .set(authHeader(TEACHER_ID, 'TEACHER'));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('LIVE');
      expect(prisma.liveClass.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'LIVE', startedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('POST /api/live-classes/:id/end', () => {
    it('ends a live class and saves recording URL', async () => {
      setupUser(mockTeacher);
      const liveClass = { ...mockLiveClass, status: 'LIVE', course: mockCourse };
      prisma.liveClass.findUnique.mockResolvedValue(liveClass);
      prisma.liveClass.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...liveClass, ...data, status: 'COMPLETED' })
      );
      prisma.recordedClass.create.mockResolvedValue({});

      const recordingUrl = 'https://recordings.example.com/class.mp4';
      const res = await request(app)
        .post(`/api/live-classes/${LIVE_CLASS_ID}/end`)
        .set(authHeader(TEACHER_ID, 'TEACHER'))
        .send({ recordingUrl });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(prisma.liveClass.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            endedAt: expect.any(Date),
            recordingUrl,
          }),
        })
      );
      expect(prisma.recordedClass.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/live-classes/upcoming', () => {
    it('returns upcoming classes for students', async () => {
      prisma.liveClass.findMany.mockResolvedValue([mockLiveClass, mockPremiumClass]);

      const res = await request(app).get('/api/live-classes/upcoming');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/live-classes/:id/join', () => {
    it('allows student to join free live class when LIVE', async () => {
      setupUser(mockStudent);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockLiveClass,
        status: 'LIVE',
        startedAt: new Date(),
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });

      const res = await request(app)
        .get(`/api/live-classes/${LIVE_CLASS_ID}/join`)
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.meetingUrl).toBe('https://meet.google.com/free-class');
      expect(res.body.data.liveStreamId).toBe('stream-free-001');
    });

    it('denies premium live class join without subscription', async () => {
      setupUser(mockStudent);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockPremiumClass,
        status: 'LIVE',
        startedAt: new Date(),
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });
      prisma.subscription.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/live-classes/${PREMIUM_CLASS_ID}/join`)
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Premium subscription required');
    });

    it('allows premium live class join with active subscription', async () => {
      setupUser(mockStudent);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockPremiumClass,
        status: 'LIVE',
        startedAt: new Date(),
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: STUDENT_ID,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .get(`/api/live-classes/${PREMIUM_CLASS_ID}/join`)
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
    });

    it('denies join for SCHEDULED class not yet in join window', async () => {
      setupUser(mockStudent);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockLiveClass,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });

      const res = await request(app)
        .get(`/api/live-classes/${LIVE_CLASS_ID}/join`)
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Class has not started yet');
    });

    it('allows teacher to bypass premium check for join', async () => {
      setupUser(mockTeacher);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockPremiumClass,
        status: 'LIVE',
        startedAt: new Date(),
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });

      const res = await request(app)
        .get(`/api/live-classes/${PREMIUM_CLASS_ID}/join`)
        .set(authHeader(TEACHER_ID, 'TEACHER'));

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
    });

    it('allows admin to bypass premium check for join', async () => {
      setupUser(mockAdmin);
      prisma.liveClass.findUnique.mockResolvedValue({
        ...mockPremiumClass,
        status: 'LIVE',
        startedAt: new Date(),
        course: { id: COURSE_ID, title: 'Test Course', teacherId: TEACHER_ID },
      });

      const res = await request(app)
        .get(`/api/live-classes/${PREMIUM_CLASS_ID}/join`)
        .set(authHeader(ADMIN_ID, 'ADMIN'));

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(true);
    });
  });

  describe('GET /api/live-classes/recordings', () => {
    it('returns recordings with premium gating', async () => {
      setupUser(mockStudent);
      prisma.recordedClass.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          title: 'Free Recording',
          videoUrl: 'https://example.com/free.mp4',
          isPremium: false,
          recordedAt: new Date(),
          liveClass: null,
        },
        {
          id: 'rec-2',
          title: 'Premium Recording',
          videoUrl: 'https://example.com/premium.mp4',
          isPremium: true,
          recordedAt: new Date(),
          liveClass: { id: PREMIUM_CLASS_ID, title: 'Premium', courseId: COURSE_ID },
        },
      ]);

      const res = await request(app)
        .get('/api/live-classes/recordings')
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(200);
      expect(res.body.data[0].videoUrl).toBe('https://example.com/free.mp4');
      expect(res.body.data[0].locked).toBe(false);
      expect(res.body.data[1].videoUrl).toBeNull();
      expect(res.body.data[1].locked).toBe(true);
    });

    it('unlocks premium recordings for subscribed student', async () => {
      setupUser(mockStudent);
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: STUDENT_ID,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 86400000),
      });
      prisma.recordedClass.findMany.mockResolvedValue([
        {
          id: 'rec-2',
          title: 'Premium Recording',
          videoUrl: 'https://example.com/premium.mp4',
          isPremium: true,
          recordedAt: new Date(),
          liveClass: null,
        },
      ]);

      const res = await request(app)
        .get('/api/live-classes/recordings')
        .set(authHeader(STUDENT_ID, 'STUDENT'));

      expect(res.status).toBe(200);
      expect(res.body.data[0].videoUrl).toBe('https://example.com/premium.mp4');
      expect(res.body.data[0].locked).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('blocks non-owner teacher from starting class', async () => {
      setupUser({ ...mockTeacher, id: OTHER_TEACHER_ID });
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.liveClass.findUnique.mockResolvedValue({ ...mockLiveClass, course: mockCourse });

      const res = await request(app)
        .post(`/api/live-classes/${LIVE_CLASS_ID}/start`)
        .set(authHeader(OTHER_TEACHER_ID, 'TEACHER'));

      expect(res.status).toBe(403);
    });
  });
});
