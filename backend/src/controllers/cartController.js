const { asyncHandler, sendSuccess } = require('../utils/helpers');
const cartService = require('../services/cartService');
const coursePurchaseService = require('../services/coursePurchaseService');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  sendSuccess(res, cart);
});

const addToCart = asyncHandler(async (req, res) => {
  const item = await cartService.addToCart(req.user.id, req.body.courseId);
  sendSuccess(res, item, 201, 'Added to cart');
});

const removeFromCart = asyncHandler(async (req, res) => {
  const result = await cartService.removeFromCart(req.user.id, req.params.courseId);
  sendSuccess(res, result, 200, 'Removed from cart');
});

const checkoutCart = asyncHandler(async (req, res) => {
  const order = await coursePurchaseService.checkoutCart(req.user.id);
  sendSuccess(res, order);
});

const verifyCart = asyncHandler(async (req, res) => {
  const result = await coursePurchaseService.verifyCartPurchase(req.user.id, req.body);
  sendSuccess(res, result, 200, 'Purchase complete');
});

const buyCourse = asyncHandler(async (req, res) => {
  const order = await coursePurchaseService.createCourseOrder(req.user.id, req.params.courseId);
  sendSuccess(res, order);
});

const verifyCourse = asyncHandler(async (req, res) => {
  const result = await coursePurchaseService.verifyCoursePurchase(req.user.id, req.body);
  sendSuccess(res, result, 200, 'Course purchased');
});

module.exports = { getCart, addToCart, removeFromCart, checkoutCart, verifyCart, buyCourse, verifyCourse };
