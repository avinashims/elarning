const authService = require('../services/authService');
const { asyncHandler, sendSuccess } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, result, 201, 'Registration successful');
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  sendSuccess(res, result, 200, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  sendSuccess(res, result, 200, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logoutUser(refreshToken);
  sendSuccess(res, null, 200, 'Logged out successfully');
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  sendSuccess(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateUserProfile(req.user.id, req.body);
  sendSuccess(res, user, 200, 'Profile updated');
});

module.exports = { register, login, refresh, logout, getProfile, updateProfile };
