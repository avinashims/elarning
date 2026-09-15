const { asyncHandler, sendSuccess } = require('../utils/helpers');
const subscriptionService = require('../services/subscriptionService');

const getPlans = asyncHandler(async (req, res) => {
  const plans = await subscriptionService.getActivePlans();
  sendSuccess(res, plans);
});

const createPaymentOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const order = await subscriptionService.createSubscriptionOrder(req.user.id, planId);
  sendSuccess(res, order);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await subscriptionService.verifyAndActivatePayment(
    req.user.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (result.alreadyVerified) {
    return sendSuccess(res, result, 200, 'Payment already verified');
  }

  sendSuccess(res, result, 200, 'Payment verified');
});

const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserActiveSubscription(req.user.id);
  sendSuccess(res, subscription);
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await subscriptionService.getPaymentHistory(req.user.id);
  sendSuccess(res, payments);
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await subscriptionService.createPlan(req.body);
  sendSuccess(res, plan, 201, 'Plan created');
});

const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await subscriptionService.updatePlan(id, req.body);
  sendSuccess(res, plan, 200, 'Plan updated');
});

module.exports = {
  getPlans,
  createPaymentOrder,
  verifyPayment,
  getMySubscription,
  getPaymentHistory,
  createPlan,
  updatePlan,
};
