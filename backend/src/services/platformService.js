const prisma = require('../config/database');
const { EXAM_TRACKS } = require('../constants/examTracks');
const { getUpcomingLiveClasses } = require('./liveClassService');
const { attachRatingStats } = require('./courseService');

async function getHomePlatformData() {
  const [featuredBatches, upcomingLive, testSeriesCount, batchCount] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        teacher: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    getUpcomingLiveClasses(),
    prisma.testSeries.count({ where: { isPublished: true } }),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  const batchesWithRating = await attachRatingStats(featuredBatches);

  return {
    examTracks: EXAM_TRACKS,
    stats: {
      batches: batchCount,
      testSeries: testSeriesCount,
      liveToday: upcomingLive.filter((lc) => {
        const d = new Date(lc.scheduledAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length,
    },
    featuredBatches: batchesWithRating,
    upcomingLive: upcomingLive.slice(0, 6),
  };
}

async function listTestSeries(filters = {}) {
  const where = { isPublished: true };
  if (filters.examTrack) {
    where.examTrack = { equals: filters.examTrack, mode: 'insensitive' };
  }
  return prisma.testSeries.findMany({
    where,
    include: {
      course: { select: { id: true, title: true, thumbnail: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { getHomePlatformData, listTestSeries };
