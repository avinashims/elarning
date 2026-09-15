const { asyncHandler, sendSuccess } = require('../utils/helpers');
const categoryService = require('../services/categoryService');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories();
  sendSuccess(res, categories);
});

const getCategoryCourses = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, category);
});

module.exports = { getCategories, getCategoryCourses };
