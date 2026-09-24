const express = require('express');
const {
  register,
  login,
  googleSignIn,
  refresh,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
  logoutValidation,
  updateProfileValidation,
  googleSignInValidation,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/google', googleSignInValidation, validate, googleSignIn);
router.post('/refresh', refreshValidation, validate, refresh);
router.post('/logout', logoutValidation, validate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);

module.exports = router;
