const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const LESSON_ID = '11111111-1111-4111-8111-111111111111';
const PREMIUM_LESSON_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const VIDEO_KEY = 'test-video.mp4';

const mockLesson = {
  id: LESSON_ID,
  title: 'Free Lesson',
  description: 'Test lesson',
  videoKey: VIDEO_KEY,
  videoUrl: null,
  duration: 120,
  isPremium: false,
  order: 1,
  chapterId: '44444444-4444-4444-8444-444444444444',
  chapter: { courseId: '55555555-5555-4555-8555-555555555555' },
};

const mockPremiumLesson = {
  ...mockLesson,
  id: PREMIUM_LESSON_ID,
  title: 'Premium Lesson',
  isPremium: true,
};

const mockUser = {
  id: USER_ID,
  email: 'student@test.com',
  name: 'Test Student',
  role: 'STUDENT',
  avatar: null,
};

jest.mock('../src/config/database', () => ({
  lesson: {
    findUnique: jest.fn(),
  },
  videoProgress: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  user: {
    findUnique: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  chapter: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
}));

jest.mock('../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
  getRedis: jest.fn(),
}));

jest.mock('../src/services/cacheService', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDel: jest.fn().mockResolvedValue(undefined),
}));

let app;
let generateAccessToken;
let generateSignedVideoUrl;
let verifySignedToken;
let prisma;
let tempVideoDir;
let tempVideoPath;

beforeAll(() => {
  tempVideoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elearning-video-test-'));
  tempVideoPath = path.join(tempVideoDir, VIDEO_KEY);
  fs.writeFileSync(tempVideoPath, Buffer.alloc(1024, 0x61));

  process.env.VIDEO_STORAGE_PATH = tempVideoDir;
  process.env.VIDEO_SIGNING_SECRET = 'test-video-signing-secret';
  process.env.VIDEO_URL_EXPIRY_SECONDS = '900';
  process.env.NODE_ENV = 'test';

  jest.resetModules();

  prisma = require('../src/config/database');
  ({ generateAccessToken } = require('../src/utils/jwt'));
  ({ generateSignedVideoUrl, verifySignedToken } = require('../src/services/videoAccessService'));
  app = require('../src/app');
});

afterAll(() => {
  fs.rmSync(tempVideoDir, { recursive: true, force: true });
});

function authHeader() {
  return { Authorization: `Bearer ${generateAccessToken(USER_ID, 'STUDENT')}` };
}

function setupAuthenticatedUser() {
  prisma.user.findUnique.mockResolvedValue(mockUser);
}

describe('Video access API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthenticatedUser();
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
  });

  test('unauthenticated request denied with 401', async () => {
    const res = await request(app).get(`/api/videos/lessons/${LESSON_ID}/access`);
    expect(res.status).toBe(401);
  });

  test('free lesson returns signed URL for authenticated user', async () => {
    prisma.lesson.findUnique.mockResolvedValue(mockLesson);

    const res = await request(app)
      .get(`/api/videos/lessons/${LESSON_ID}/access`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signedUrl).toMatch(/^\/api\/videos\/stream\?token=/);
    expect(res.body.data.expiresAt).toBeDefined();
  });

  test('premium lesson denied without subscription with 403', async () => {
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);

    const res = await request(app)
      .get(`/api/videos/lessons/${PREMIUM_LESSON_ID}/access`)
      .set(authHeader());

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/premium/i);
  });

  test('premium lesson allowed with active subscription', async () => {
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);
    prisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      userId: USER_ID,
      status: 'ACTIVE',
      endDate: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .get(`/api/videos/lessons/${PREMIUM_LESSON_ID}/access`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.signedUrl).toMatch(/^\/api\/videos\/stream\?token=/);
  });

  test('invalid signed token rejected', async () => {
    const res = await request(app).get('/api/videos/stream?token=invalid.token');
    expect(res.status).toBe(401);
  });

  test('expired signed token rejected', async () => {
    const payload = {
      videoKey: VIDEO_KEY,
      userId: USER_ID,
      lessonId: LESSON_ID,
      exp: Date.now() - 1000,
    };
    const crypto = require('crypto');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', 'test-video-signing-secret')
      .update(payloadB64)
      .digest('base64url');
    const token = `${payloadB64}.${signature}`;

    const res = await request(app).get(`/api/videos/stream?token=${encodeURIComponent(token)}`);
    expect(res.status).toBe(401);
  });

  test('stream endpoint serves file with valid token', async () => {
    const { signedUrl } = generateSignedVideoUrl(VIDEO_KEY, USER_ID, LESSON_ID);
    const token = decodeURIComponent(signedUrl.split('token=')[1]);

    const res = await request(app).get(`/api/videos/stream?token=${encodeURIComponent(token)}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/video\/mp4/);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.body.length).toBe(1024);
  });

  test('verifySignedToken validates signature', () => {
    const { signedUrl } = generateSignedVideoUrl(VIDEO_KEY, USER_ID, LESSON_ID);
    const token = decodeURIComponent(signedUrl.split('token=')[1]);
    const payload = verifySignedToken(token);
    expect(payload.videoKey).toBe(VIDEO_KEY);
    expect(payload.userId).toBe(USER_ID);
    expect(payload.lessonId).toBe(LESSON_ID);
  });
});

describe('Progress API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthenticatedUser();
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
  });

  test('progress save and retrieve for resume', async () => {
    prisma.lesson.findUnique.mockResolvedValue(mockLesson);
    prisma.videoProgress.upsert.mockResolvedValue({
      id: 'progress-1',
      userId: USER_ID,
      lessonId: LESSON_ID,
      watchedSeconds: 45,
      completed: false,
      lastWatchedAt: new Date(),
    });
    prisma.videoProgress.findUnique.mockResolvedValue({
      id: 'progress-1',
      userId: USER_ID,
      lessonId: LESSON_ID,
      watchedSeconds: 45,
      completed: false,
      lastWatchedAt: new Date(),
    });

    const saveRes = await request(app)
      .put(`/api/progress/lesson/${LESSON_ID}`)
      .set(authHeader())
      .send({ watchedSeconds: 45, completed: false });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.watchedSeconds).toBe(45);

    const getRes = await request(app)
      .get(`/api/progress/lesson/${LESSON_ID}`)
      .set(authHeader());

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.watchedSeconds).toBe(45);
  });

  test('progress save denied for locked premium lesson', async () => {
    prisma.lesson.findUnique.mockResolvedValue(mockPremiumLesson);

    const res = await request(app)
      .put(`/api/progress/lesson/${PREMIUM_LESSON_ID}`)
      .set(authHeader())
      .send({ watchedSeconds: 10, completed: false });

    expect(res.status).toBe(403);
  });
});

describe('Lesson API response sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthenticatedUser();
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
  });

  test('raw videoUrl not exposed in lesson API response', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      ...mockLesson,
      videoUrl: 'secret/path/video.mp4',
      chapter: { course: { id: 'course-1', title: 'Test Course' } },
    });
    prisma.videoProgress.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/lessons/${LESSON_ID}`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.videoUrl).toBeUndefined();
    expect(res.body.data.videoKey).toBeUndefined();
    expect(res.body.data.hasVideo).toBe(true);
    expect(res.body.data.locked).toBe(false);
  });
});
