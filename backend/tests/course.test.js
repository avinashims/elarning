jest.mock('../src/services/progressService', () => ({
  getProgress: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/config/database', () => ({
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chapter: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enrollment: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  videoProgress: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((operations) => Promise.all(operations)),
}));

jest.mock('../src/services/cacheService', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDel: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');

const teacher = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'teacher@test.com',
  name: 'Teacher',
  role: 'TEACHER',
};

const student = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'student@test.com',
  name: 'Student',
  role: 'STUDENT',
};

const courseId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const chapterId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const lessonId1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const lessonId2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const premiumLessonId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const usersById = {
  [teacher.id]: teacher,
  [student.id]: student,
};

function authHeader(user) {
  return { Authorization: `Bearer ${generateAccessToken(user.id, user.role)}` };
}

function mockAuthUsers() {
  prisma.user.findUnique.mockImplementation(({ where }) =>
    Promise.resolve(usersById[where.id] || null)
  );
}

describe('Course Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUsers();
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.videoProgress.findUnique.mockResolvedValue(null);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.enrollment.findUnique.mockResolvedValue(null);
  });

  describe('GET /api/courses', () => {
    it('allows students to list published courses', async () => {
      const courses = [
        {
          id: courseId,
          title: 'Test Course',
          isPublished: true,
          teacher: { id: teacher.id, name: 'Teacher' },
          chapters: [],
          _count: { enrollments: 0, reviews: 0 },
          price: 0,
        },
      ];
      prisma.course.findMany.mockResolvedValue(courses);

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Test Course');
    });
  });

  describe('GET /api/courses/:id', () => {
    const publishedCourse = {
      id: courseId,
      title: 'Test Course',
      description: 'A test course description',
      isPublished: true,
      price: 0,
      teacherId: teacher.id,
      teacher: { id: teacher.id, name: 'Teacher' },
      chapters: [
        {
          id: chapterId,
          title: 'Chapter 1',
          order: 0,
          lessons: [
            {
              id: lessonId1,
              title: 'Free Lesson',
              description: 'Free content',
              duration: 300,
              isPremium: false,
              order: 0,
              videoUrl: 'https://example.com/free.mp4',
            },
            {
              id: premiumLessonId,
              title: 'Premium Lesson',
              description: 'Premium content',
              duration: 600,
              isPremium: true,
              order: 1,
              videoUrl: 'https://example.com/premium.mp4',
            },
          ],
        },
      ],
    };

    it('allows students to view course details with locked premium lessons', async () => {
      prisma.course.findUnique.mockResolvedValue(publishedCourse);

      const res = await request(app)
        .get(`/api/courses/${courseId}`)
        .set(authHeader(student));

      expect(res.status).toBe(200);
      expect(res.body.data.chapters[0].lessons[0].hasVideo).toBe(true);
      expect(res.body.data.chapters[0].lessons[0].locked).toBeFalsy();
      expect(res.body.data.chapters[0].lessons[1].videoUrl).toBeUndefined();
      expect(res.body.data.chapters[0].lessons[1].locked).toBe(true);
    });

    it('grants premium lesson visibility with active subscription', async () => {
      prisma.course.findUnique.mockResolvedValue(publishedCourse);
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        endDate: new Date('2099-01-01'),
      });

      const res = await request(app)
        .get(`/api/courses/${courseId}`)
        .set(authHeader(student));

      expect(res.status).toBe(200);
      expect(res.body.data.chapters[0].lessons[1].locked).toBe(false);
      expect(res.body.data.chapters[0].lessons[1].hasVideo).toBe(true);
    });
  });

  describe('POST /api/courses', () => {
    it('allows teacher to create a course', async () => {
      const created = {
        id: courseId,
        title: 'New Course',
        description: 'Course description here',
        teacherId: teacher.id,
        teacher: { id: teacher.id, name: 'Teacher' },
      };
      prisma.course.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/courses')
        .set(authHeader(teacher))
        .send({
          title: 'New Course',
          description: 'Course description here',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Course');
      expect(prisma.course.create).toHaveBeenCalled();
    });

    it('blocks students from creating courses', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set(authHeader(student))
        .send({
          title: 'New Course',
          description: 'Course description here',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Insufficient permissions');
    });

    it('returns 400 for invalid course data', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set(authHeader(teacher))
        .send({ title: 'ab', description: 'short' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('allows teacher to update own course', async () => {
      prisma.course.findUnique.mockResolvedValue({
        id: courseId,
        teacherId: teacher.id,
      });
      prisma.course.update.mockResolvedValue({
        id: courseId,
        title: 'Updated Course',
        description: 'Updated description here',
        teacherId: teacher.id,
      });

      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set(authHeader(teacher))
        .send({
          title: 'Updated Course',
          description: 'Updated description here',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Course');
    });

    it('allows teacher to delete own course', async () => {
      prisma.course.findUnique.mockResolvedValue({
        id: courseId,
        teacherId: teacher.id,
      });
      prisma.course.delete.mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set(authHeader(teacher));

      expect(res.status).toBe(200);
      expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: courseId } });
    });
  });

  describe('Chapter and lesson management', () => {
    it('allows teacher to create a chapter', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: courseId, teacherId: teacher.id });
      prisma.chapter.create.mockResolvedValue({
        id: chapterId,
        title: 'Chapter 1',
        order: 0,
        courseId,
      });

      const res = await request(app)
        .post(`/api/courses/${courseId}/chapters`)
        .set(authHeader(teacher))
        .send({ title: 'Chapter 1' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Chapter 1');
    });

    it('allows teacher to create a lesson', async () => {
      prisma.chapter.findUnique.mockResolvedValue({
        id: chapterId,
        courseId,
        course: { id: courseId, teacherId: teacher.id },
      });
      prisma.course.findUnique.mockResolvedValue({ id: courseId, teacherId: teacher.id });
      prisma.lesson.create.mockResolvedValue({
        id: lessonId1,
        title: 'Lesson 1',
        chapterId,
        isPremium: false,
      });

      const res = await request(app)
        .post(`/api/chapters/${chapterId}/lessons`)
        .set(authHeader(teacher))
        .send({ title: 'Lesson 1' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Lesson 1');
    });

    it('reorders lessons correctly', async () => {
      const lessons = [
        { id: lessonId1, order: 0 },
        { id: lessonId2, order: 1 },
      ];

      prisma.chapter.findUnique.mockResolvedValue({
        id: chapterId,
        courseId,
        course: { id: courseId, teacherId: teacher.id },
        lessons,
      });
      prisma.course.findUnique.mockResolvedValue({ id: courseId, teacherId: teacher.id });
      prisma.lesson.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, order: data.order })
      );
      prisma.lesson.findMany.mockResolvedValue([
        { id: lessonId2, order: 0 },
        { id: lessonId1, order: 1 },
      ]);

      const res = await request(app)
        .put(`/api/chapters/${chapterId}/lessons/reorder`)
        .set(authHeader(teacher))
        .send({ lessonIds: [lessonId2, lessonId1] });

      expect(res.status).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(res.body.data[0].id).toBe(lessonId2);
      expect(res.body.data[1].id).toBe(lessonId1);
    });

    it('returns 400 for invalid reorder payload', async () => {
      const res = await request(app)
        .put(`/api/chapters/${chapterId}/lessons/reorder`)
        .set(authHeader(teacher))
        .send({ lessonIds: ['not-a-uuid'] });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/lessons/:id', () => {
    const premiumLesson = {
      id: premiumLessonId,
      title: 'Premium Lesson',
      description: 'Premium content',
      videoUrl: 'https://example.com/premium.mp4',
      duration: 600,
      isPremium: true,
      order: 0,
      chapterId,
      chapter: {
        id: chapterId,
        course: { id: courseId, title: 'Test Course' },
      },
    };

    it('denies premium lesson access without subscription', async () => {
      prisma.lesson.findUnique.mockResolvedValue(premiumLesson);

      const res = await request(app)
        .get(`/api/lessons/${premiumLessonId}`)
        .set(authHeader(student));

      expect(res.status).toBe(200);
      expect(res.body.data.locked).toBe(true);
      expect(res.body.data.videoUrl).toBeUndefined();
      expect(res.body.data.message).toBe('Premium subscription required');
    });

    it('grants premium lesson access with active subscription', async () => {
      prisma.lesson.findUnique.mockResolvedValue(premiumLesson);
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        endDate: new Date('2099-01-01'),
      });

      const res = await request(app)
        .get(`/api/lessons/${premiumLessonId}`)
        .set(authHeader(student));

      expect(res.status).toBe(200);
      expect(res.body.data.locked).toBeFalsy();
      expect(res.body.data.hasVideo).toBe(true);
    });

    it('blocks students from creating chapters', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/chapters`)
        .set(authHeader(student))
        .send({ title: 'Chapter 1' });

      expect(res.status).toBe(403);
    });
  });
});
