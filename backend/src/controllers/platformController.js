const { asyncHandler, sendSuccess } = require('../utils/helpers');
const { getHomePlatformData, listTestSeries } = require('../services/platformService');
const { EXAM_TRACKS } = require('../constants/examTracks');

const getHome = asyncHandler(async (req, res) => {
  const data = await getHomePlatformData();
  sendSuccess(res, data);
});

const getExamTracks = asyncHandler(async (req, res) => {
  sendSuccess(res, EXAM_TRACKS);
});

const getTestSeries = asyncHandler(async (req, res) => {
  const tests = await listTestSeries(req.query);
  sendSuccess(res, tests);
});

module.exports = { getHome, getExamTracks, getTestSeries };
