const express = require('express');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/:courseId', toggleWishlist);

module.exports = router;
