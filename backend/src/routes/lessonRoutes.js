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
const { authenticate, authorize } = require('../middleware/auth');
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
  createChapterValidation,
  validate,
  createChapter
);
router.put(
  '/chapters/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  updateChapterValidation,
  validate,
  updateChapter
);
router.delete('/chapters/:id', authenticate, authorize('TEACHER', 'ADMIN'), deleteChapter);
router.post(
  '/chapters/:chapterId/lessons',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  createLessonValidation,
  validate,
  createLesson
);
router.put(
  '/chapters/:chapterId/lessons/reorder',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  reorderLessonsValidation,
  validate,
  reorderLessons
);
router.put(
  '/lessons/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  updateLessonValidation,
  validate,
  updateLesson
);
router.delete('/lessons/:id', authenticate, authorize('TEACHER', 'ADMIN'), deleteLesson);

module.exports = router;
