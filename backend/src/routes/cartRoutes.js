const express = require('express');
const {
  getCart, addToCart, removeFromCart, checkoutCart, verifyCart, buyCourse, verifyCourse,
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', [body('courseId').notEmpty()], validate, addToCart);
router.delete('/:courseId', removeFromCart);
router.post('/checkout', checkoutCart);
router.post('/verify', verifyCart);
router.post('/buy/:courseId', buyCourse);
router.post('/buy/:courseId/verify', verifyCourse);

module.exports = router;
