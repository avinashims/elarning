const { canAccessPremiumContent } = require('../services/subscriptionService');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const hasAccess = await canAccessPremiumContent(req.user.id);
  if (!hasAccess) {
    throw new AppError('Premium subscription required', 403);
  }
  next();
});

module.exports = { requirePremium: requireActiveSubscription, requireActiveSubscription };
