const { asyncHandler, sendSuccess } = require('../utils/helpers');
const liveClassService = require('../services/liveClassService');

const getLiveClasses = asyncHandler(async (req, res) => {
  const { courseId, status } = req.query;
  const classes = await liveClassService.getLiveClasses({ courseId, status });
  sendSuccess(res, classes);
});

const getUpcomingLiveClasses = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const classes = await liveClassService.getUpcomingLiveClasses({ courseId });
  sendSuccess(res, classes);
});

const scheduleLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.scheduleLiveClass(
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, liveClass, 201, 'Live class scheduled');
});

const updateLiveClass = asyncHandler(async (req, res) => {
  const updated = await liveClassService.updateLiveClass(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, updated, 200, 'Live class updated');
});

const startLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.startLiveClass(
    req.params.id,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, liveClass, 200, 'Live class started');
});

const endLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.endLiveClass(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, liveClass, 200, 'Live class ended');
});

const getJoinAccess = asyncHandler(async (req, res) => {
  const access = await liveClassService.getLiveClassJoinAccess(
    req.params.id,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, access);
});

const getRecordedClasses = asyncHandler(async (req, res) => {
  const recordings = await liveClassService.getRecordedClasses(
    req.user.id,
    req.user.role,
    req.query
  );
  sendSuccess(res, recordings);
});

const createRecordedClass = asyncHandler(async (req, res) => {
  const recorded = await liveClassService.createRecordedClass(
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, recorded, 201, 'Recording added');
});

module.exports = {
  getLiveClasses,
  getUpcomingLiveClasses,
  scheduleLiveClass,
  updateLiveClass,
  startLiveClass,
  endLiveClass,
  getJoinAccess,
  getRecordedClasses,
  createRecordedClass,
};
