const { asyncHandler, sendSuccess } = require('../utils/helpers');
const wishlistService = require('../services/wishlistService');

const getWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistService.getWishlist(req.user.id);
  sendSuccess(res, items);
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleWishlist(req.user.id, req.params.courseId);
  sendSuccess(res, result);
});

module.exports = { getWishlist, toggleWishlist };
