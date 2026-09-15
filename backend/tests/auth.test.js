const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateAccessToken, generateRefreshToken } = require('../src/utils/jwt');
const { hashToken } = require('../src/utils/tokenHash');

jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  course: { count: jest.fn() },
  enrollment: { count: jest.fn() },
  subscription: { count: jest.fn() },
  payment: { aggregate: jest.fn() },
}));

const mockUser = {
  id: 'user-123',
  email: 'student@example.com',
  name: 'Test Student',
  role: 'STUDENT',
  avatar: null,
  createdAt: new Date('2024-01-01'),
};

const mockAdmin = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'ADMIN',
};

const validPassword = 'Password1';
const hashedPassword = bcrypt.hashSync(validPassword, 4);

function mockRefreshTokenStore(userId, refreshToken) {
  const record = {
    id: 'rt-1',
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false,
  };
  prisma.refreshToken.create.mockResolvedValue(record);
  prisma.refreshToken.findUnique.mockImplementation(({ where }) => {
    if (where.tokenHash === hashToken(refreshToken)) {
      return Promise.resolve({ ...record });
    }
    return Promise.resolve(null);
  });
  return record;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('registers a new student with tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student@example.com',
        password: validPassword,
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('student@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student@example.com',
        password: validPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered');
  });

  it('returns validation errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
        role: 'SUPERADMIN',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(1);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashedPassword });
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@example.com', password: validPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('student@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: validPassword });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns validation error when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: validPassword });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues new tokens with valid refresh token', async () => {
    const refreshToken = generateRefreshToken(mockUser.id, mockUser.role);
    const record = mockRefreshTokenStore(mockUser.id, refreshToken);

    prisma.refreshToken.update.mockResolvedValue({ ...record, revoked: true });
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-2' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: record.id },
      data: { revoked: true },
    });
  });

  it('rejects invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.token.value' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired refresh token');
  });

  it('rejects revoked refresh token', async () => {
    const refreshToken = generateRefreshToken(mockUser.id, mockUser.role);
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: mockUser.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 86400000),
      revoked: true,
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired refresh token');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes refresh token on logout', async () => {
    const refreshToken = generateRefreshToken(mockUser.id, mockUser.role);
    const record = {
      id: 'rt-1',
      userId: mockUser.id,
      tokenHash: hashToken(refreshToken),
      revoked: false,
    };

    prisma.refreshToken.findUnique.mockResolvedValue(record);
    prisma.refreshToken.update.mockResolvedValue({ ...record, revoked: true });

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: record.id },
      data: { revoked: true },
    });
  });

  it('returns validation error when refresh token is missing', async () => {
    const res = await request(app).post('/api/auth/logout').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});

describe('Authentication middleware', () => {
  it('returns 401 without access token', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('returns profile with valid access token', async () => {
    const accessToken = generateAccessToken(mockUser.id, mockUser.role);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('student@example.com');
  });

  it('returns 401 with invalid access token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });
});

describe('Role-based authorization', () => {
  it('allows admin access to admin dashboard', async () => {
    const accessToken = generateAccessToken(mockAdmin.id, mockAdmin.role);
    prisma.user.findUnique.mockResolvedValue(mockAdmin);
    prisma.user.count.mockResolvedValue(1);
    prisma.course.count.mockResolvedValue(1);
    prisma.enrollment.count.mockResolvedValue(1);
    prisma.subscription.count.mockResolvedValue(1);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
    prisma.user.findMany.mockResolvedValue([mockAdmin]);

    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('denies student access to admin dashboard', async () => {
    const accessToken = generateAccessToken(mockUser.id, mockUser.role);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
  });
});

describe('PUT /api/auth/profile', () => {
  it('updates profile with valid data', async () => {
    const accessToken = generateAccessToken(mockUser.id, mockUser.role);
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('returns validation error for invalid avatar URL', async () => {
    const accessToken = generateAccessToken(mockUser.id, mockUser.role);
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ avatar: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});
