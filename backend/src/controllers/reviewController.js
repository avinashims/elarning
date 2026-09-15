const { asyncHandler, sendSuccess } = require('../utils/helpers');
const reviewService = require('../services/reviewService');

const getReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getCourseReviews(req.params.courseId);
  const rating = await reviewService.getCourseRatingStats(req.params.courseId);
  sendSuccess(res, { reviews, rating });
});

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.params.courseId, req.body);
  sendSuccess(res, review, 201, 'Review submitted');
});

module.exports = { getReviews, createReview };
