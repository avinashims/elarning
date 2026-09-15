const express = require('express');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getMyCourses,
  getInstructor,
} = require('../controllers/courseController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createCourseValidation,
  updateCourseValidation,
} = require('../validators/courseValidators');

const router = express.Router();

router.get('/', getCourses);
router.get('/instructor/:id', getInstructor);
router.get('/my', authenticate, getMyCourses);
router.get('/:id', optionalAuthenticate, getCourseById);
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), createCourseValidation, validate, createCourse);
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), updateCourseValidation, validate, updateCourse);
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), deleteCourse);
router.post('/:id/enroll', authenticate, enrollCourse);

module.exports = router;
