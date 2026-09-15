const { asyncHandler, sendSuccess } = require('../utils/helpers');
const lessonService = require('../services/lessonService');

const createChapter = asyncHandler(async (req, res) => {
  const chapter = await lessonService.createChapter(req.params.courseId, req.body, req.user);
  sendSuccess(res, chapter, 201, 'Chapter created');
});

const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await lessonService.updateChapter(req.params.id, req.body, req.user);
  sendSuccess(res, chapter, 200, 'Chapter updated');
});

const deleteChapter = asyncHandler(async (req, res) => {
  await lessonService.deleteChapter(req.params.id, req.user);
  sendSuccess(res, null, 200, 'Chapter deleted');
});

const createLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.createLesson(req.params.chapterId, req.body, req.user);
  sendSuccess(res, lesson, 201, 'Lesson created');
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.updateLesson(req.params.id, req.body, req.user);
  sendSuccess(res, lesson, 200, 'Lesson updated');
});

const deleteLesson = asyncHandler(async (req, res) => {
  await lessonService.deleteLesson(req.params.id, req.user);
  sendSuccess(res, null, 200, 'Lesson deleted');
});

const reorderLessons = asyncHandler(async (req, res) => {
  const lessons = await lessonService.reorderLessons(
    req.params.chapterId,
    req.body.lessonIds,
    req.user
  );
  sendSuccess(res, lessons, 200, 'Lessons reordered');
});

const getLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.getLesson(req.params.id, req.user.id);
  sendSuccess(res, lesson);
});

module.exports = {
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getLesson,
};
