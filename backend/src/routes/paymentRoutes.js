const express = require('express');
const {
  getPlans,
  createPaymentOrder,
  verifyPayment,
  getMySubscription,
  getPaymentHistory,
  createPlan,
  updatePlan,
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createPlanValidation,
  updatePlanValidation,
  createOrderValidation,
  verifyPaymentValidation,
} = require('../validators/subscriptionValidators');

const router = express.Router();

router.get('/plans', getPlans);
router.get('/subscription', authenticate, getMySubscription);
router.get('/history', authenticate, getPaymentHistory);
router.post('/create-order', authenticate, createOrderValidation, validate, createPaymentOrder);
router.post('/verify', authenticate, verifyPaymentValidation, validate, verifyPayment);
router.post('/plans', authenticate, authorize('ADMIN'), createPlanValidation, validate, createPlan);
router.put('/plans/:id', authenticate, authorize('ADMIN'), updatePlanValidation, validate, updatePlan);

module.exports = router;
