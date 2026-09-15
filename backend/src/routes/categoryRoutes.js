const express = require('express');
const { getCategories, getCategoryCourses } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryCourses);

module.exports = router;
