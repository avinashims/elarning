const express = require('express');
const {
  getDashboardStats,
  getUsers,
  updateUserRole,
  getTeacherStats,
  getAdminCourses,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', authenticate, authorize('ADMIN'), getDashboardStats);
router.get('/admin/users', authenticate, authorize('ADMIN'), getUsers);
router.put('/admin/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);
router.get('/admin/courses', authenticate, authorize('ADMIN'), getAdminCourses);
router.get('/teacher', authenticate, authorize('TEACHER', 'ADMIN'), getTeacherStats);

module.exports = router;
