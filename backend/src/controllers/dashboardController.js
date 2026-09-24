const prisma = require('../config/database');
const { asyncHandler, sendSuccess } = require('../utils/helpers');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    activeSubscriptions,
    totalRevenue,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  sendSuccess(res, {
    stats: {
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
    recentUsers,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, users);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  sendSuccess(res, user, 200, 'User role updated');
});

const getTeacherStats = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  const [courses, totalStudents, liveClasses, recordings] = await Promise.all([
    prisma.course.findMany({
      where: { teacherId },
      include: { _count: { select: { enrollments: true, chapters: true } } },
    }),
    prisma.enrollment.count({
      where: { course: { teacherId } },
    }),
    prisma.liveClass.count({
      where: { course: { teacherId }, status: { in: ['SCHEDULED', 'LIVE'] } },
    }),
    prisma.recordedClass.count({
      where: { liveClass: { course: { teacherId } } },
    }),
  ]);

  sendSuccess(res, {
    stats: {
      totalCourses: courses.length,
      totalStudents,
      upcomingLiveClasses: liveClasses,
      totalRecordings: recordings,
    },
    courses,
  });
});

const getAdminCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, chapters: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, courses);
});

module.exports = { getDashboardStats, getUsers, updateUserRole, getTeacherStats, getAdminCourses };
