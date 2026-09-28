const express = require('express');
const {
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getLesson,
} = require('../controllers/lessonController');
const { authenticate, authorize, requireApprovedTeacher } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createChapterValidation,
  updateChapterValidation,
  createLessonValidation,
  updateLessonValidation,
  reorderLessonsValidation,
} = require('../validators/lessonValidators');

const router = express.Router();

router.get('/lessons/:id', authenticate, getLesson);
router.post(
  '/courses/:courseId/chapters',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  createChapterValidation,
  validate,
  createChapter
);
router.put(
  '/chapters/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  updateChapterValidation,
  validate,
  updateChapter
);
router.delete('/chapters/:id', authenticate, authorize('TEACHER', 'ADMIN'), requireApprovedTeacher, deleteChapter);
router.post(
  '/chapters/:chapterId/lessons',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  createLessonValidation,
  validate,
  createLesson
);
router.put(
  '/chapters/:chapterId/lessons/reorder',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  reorderLessonsValidation,
  validate,
  reorderLessons
);
router.put(
  '/lessons/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  requireApprovedTeacher,
  updateLessonValidation,
  validate,
  updateLesson
);
router.delete('/lessons/:id', authenticate, authorize('TEACHER', 'ADMIN'), requireApprovedTeacher, deleteLesson);

module.exports = router;
