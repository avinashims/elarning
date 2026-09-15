const prisma = require('../config/database');

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: { name: 'asc' },
  });
}

async function getCategoryBySlug(slug) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      courses: {
        where: { isPublished: true },
        include: {
          teacher: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true, reviews: true } },
        },
      },
    },
  });
}

module.exports = { getCategories, getCategoryBySlug };
