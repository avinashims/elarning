const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashToken } = require('../utils/tokenHash');
const AppError = require('../utils/AppError');
const { ROLES, REGISTERABLE_ROLES } = require('../constants/roles');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  createdAt: true,
};

function getRefreshTokenExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

async function storeRefreshToken(userId, refreshToken) {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });
}

async function issueTokenPair(user) {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);
  await storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

async function registerUser({ email, password, name, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const userRole = REGISTERABLE_ROLES.includes(role) ? role : ROLES.STUDENT;
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role: userRole },
    select: USER_SELECT,
  });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.password) {
    throw new AppError('This account uses Google sign-in. Continue with Google.', 401);
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { password: _, ...userWithoutPassword } = user;
  const tokens = await issueTokenPair(userWithoutPassword);
  return { user: userWithoutPassword, ...tokens };
}

async function loginWithGoogle({ idToken, role }) {
  const { verifyGoogleIdToken } = require('../utils/googleAuth');
  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch (err) {
    if (err.statusCode === 503) throw new AppError(err.message, 503);
    throw new AppError('Invalid Google sign-in token', 401);
  }

  if (!payload.email || payload.email_verified === false) {
    throw new AppError('Google account email is not verified', 401);
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = payload.name || email.split('@')[0];
  const avatar = payload.picture || null;

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || googleId,
        avatar: avatar || user.avatar,
        name: user.name || name,
      },
      select: USER_SELECT,
    });
  } else {
    const userRole = REGISTERABLE_ROLES.includes(role) ? role : ROLES.STUDENT;
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        name,
        avatar,
        role: userRole,
      },
      select: USER_SELECT,
    });
  }

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (storedToken.userId !== decoded.userId) {
    throw new AppError('Invalid refresh token', 401);
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });

  if (storedToken && !storedToken.revoked) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });
  }

  return { loggedOut: true };
}

async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function updateUserProfile(userId, { name, avatar }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (avatar !== undefined) data.avatar = avatar;

  if (Object.keys(data).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, avatar: true },
  });
}

module.exports = {
  registerUser,
  loginUser,
  loginWithGoogle,
  refreshTokens,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  issueTokenPair,
};
