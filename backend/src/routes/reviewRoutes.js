const express = require('express');
const { getReviews, createReview } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/courses/:courseId', getReviews);
router.post('/courses/:courseId', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().trim().isLength({ max: 1000 }),
], validate, createReview);

module.exports = router;
