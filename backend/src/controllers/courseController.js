const { asyncHandler, sendSuccess } = require('../utils/helpers');
const courseService = require('../services/courseService');

const getCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getPublishedCourses(req.query);
  sendSuccess(res, courses);
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id, req.user);
  sendSuccess(res, course);
});

const createCourse = asyncHandler(async (req, res) => {
  const course = await courseService.createCourse(req.body, req.user);
  sendSuccess(res, course, 201, 'Course created');
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body, req.user);
  sendSuccess(res, course, 200, 'Course updated');
});

const deleteCourse = asyncHandler(async (req, res) => {
  await courseService.deleteCourse(req.params.id, req.user);
  sendSuccess(res, null, 200, 'Course deleted');
});

const enrollCourse = asyncHandler(async (req, res) => {
  const enrollment = await courseService.enrollCourse(req.params.id, req.user.id);
  sendSuccess(res, enrollment, 201, 'Enrolled successfully');
});

const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getMyCourses(req.user);
  sendSuccess(res, courses);
});

const getInstructor = asyncHandler(async (req, res) => {
  const instructor = await courseService.getInstructorProfile(req.params.id);
  sendSuccess(res, instructor);
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getMyCourses,
  getInstructor,
};
