const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

function generateRefreshToken(userId, role) {
  return jwt.sign({ userId, role, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, config.jwt.refreshSecret);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
