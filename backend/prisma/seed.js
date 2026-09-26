const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const studentPassword = await bcrypt.hash('student123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elearning.com' },
    update: {},
    create: {
      email: 'admin@elearning.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@elearning.com' },
    update: {
      headline: 'Full Stack Developer & Instructor',
      bio: '10+ years building web applications. Taught 500,000+ students worldwide.',
      website: 'https://example.com',
    },
    create: {
      email: 'teacher@elearning.com',
      password: teacherPassword,
      name: 'John Teacher',
      role: 'TEACHER',
      headline: 'Full Stack Developer & Instructor',
      bio: '10+ years building web applications. Taught 500,000+ students worldwide.',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@elearning.com' },
    update: {},
    create: {
      email: 'student@elearning.com',
      password: studentPassword,
      name: 'Jane Student',
      role: 'STUDENT',
    },
  });

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-basic' },
    update: {},
    create: {
      id: 'plan-basic',
      name: 'Basic',
      description: 'Access to premium lessons for 30 days',
      price: 499,
      durationDays: 30,
      features: ['Premium lessons', 'Recorded classes', 'Progress tracking'],
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Personal Plan',
      description: 'Udemy-style unlimited access — all premium courses for 90 days',
      price: 1299,
      durationDays: 90,
      features: ['All premium content', 'Live classes', 'Priority support', 'Certificates'],
    },
  });

  const categories = [
    { id: 'cat-jee', name: 'IIT JEE', slug: 'iit-jee', icon: '🎯' },
    { id: 'cat-neet', name: 'NEET', slug: 'neet', icon: '🩺' },
    { id: 'cat-ssc', name: 'SSC & Govt', slug: 'ssc', icon: '📋' },
    { id: 'cat-cbse', name: 'CBSE', slug: 'cbse', icon: '📚' },
    { id: 'cat-upsc', name: 'UPSC', slug: 'upsc', icon: '🏛️' },
    { id: 'cat-gate', name: 'GATE', slug: 'gate', icon: '⚙️' },
    { id: 'cat-dev', name: 'Development', slug: 'development', icon: '💻' },
    { id: 'cat-business', name: 'Business', slug: 'business', icon: '📊' },
  ];

  const batchFeaturesDefault = [
    'Live interactive classes',
    'Recorded lectures',
    'DPP & practice sheets',
    'Mock tests & analytics',
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  const course = await prisma.course.upsert({
    where: { id: 'course-web-dev' },
    update: {
      examTrack: 'IIT-JEE',
      classLevel: 'Dropper',
      targetExamYear: '2027',
      medium: 'English',
      batchFeatures: batchFeaturesDefault,
    },
    create: {
      id: 'course-web-dev',
      title: 'Complete Web Development Bootcamp',
      subtitle: 'Become a Full-Stack Web Developer with HTML, CSS, Javascript, Node, React, PostgreSQL, and more!',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js and build real-world projects from scratch. This comprehensive course takes you from zero to job-ready developer.',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      price: 3199,
      originalPrice: 6499,
      level: 'ALL_LEVELS',
      language: 'English',
      learningObjectives: [
        'Build 16 web development projects',
        'Master frontend and backend development',
        'Learn React, Node.js, and PostgreSQL',
        'Deploy applications to production',
      ],
      requirements: ['No programming experience needed', 'A computer with internet access'],
      targetAudience: ['Anyone who wants to learn web development', 'Career changers entering tech'],
      isPublished: true,
      teacherId: teacher.id,
      categoryId: 'cat-dev',
      examTrack: 'IIT-JEE',
      classLevel: 'Dropper',
      targetExamYear: '2027',
      medium: 'English',
      batchFeatures: batchFeaturesDefault,
    },
  });

  await prisma.course.upsert({
    where: { id: 'course-ssc-batch' },
    update: {
      examTrack: 'SSC',
      classLevel: 'Tier 1',
      targetExamYear: '2026',
      medium: 'Hindi',
      batchFeatures: batchFeaturesDefault,
    },
    create: {
      id: 'course-ssc-batch',
      title: 'SSC CGL Complete Batch 2026',
      subtitle: 'Live classes, DPP, mock tests & previous year questions',
      description: 'Prepare for SSC CGL with structured live batches, recorded revision, and weekly mock tests.',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      price: 0,
      originalPrice: 4999,
      level: 'ALL_LEVELS',
      language: 'Hindi',
      learningObjectives: ['Complete SSC syllabus coverage', 'Weekly mock tests', 'Doubt solving sessions'],
      requirements: ['Basic aptitude'],
      targetAudience: ['SSC CGL aspirants'],
      isPublished: true,
      teacherId: teacher.id,
      categoryId: 'cat-ssc',
      examTrack: 'SSC',
      classLevel: 'Tier 1',
      targetExamYear: '2026',
      medium: 'Hindi',
      batchFeatures: batchFeaturesDefault,
    },
  });

  await prisma.course.upsert({
    where: { id: 'course-neet-batch' },
    update: {
      examTrack: 'NEET',
      classLevel: 'Class 12',
      targetExamYear: '2027',
      medium: 'Hinglish',
      batchFeatures: batchFeaturesDefault,
    },
    create: {
      id: 'course-neet-batch',
      title: 'NEET UG Arjuna Batch 2027',
      subtitle: 'Class 12 + droppers | Live + recorded | AITS included',
      description: 'NEET-focused batch with live classes, recorded lectures, DPP, and all-India test series.',
      thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
      price: 2999,
      originalPrice: 8999,
      level: 'ADVANCED',
      language: 'Hinglish',
      learningObjectives: ['NCERT + advanced MCQs', 'Live doubt solving', 'Full syllabus mock tests'],
      requirements: ['Class 11/12 or dropper'],
      targetAudience: ['NEET aspirants'],
      isPublished: true,
      teacherId: teacher.id,
      categoryId: 'cat-neet',
      examTrack: 'NEET',
      classLevel: 'Class 12',
      targetExamYear: '2027',
      medium: 'Hinglish',
      batchFeatures: batchFeaturesDefault,
    },
  });

  await prisma.course.upsert({
    where: { id: 'course-python' },
    update: {},
    create: {
      id: 'course-python',
      title: '100 Days of Code: Python Pro Bootcamp',
      subtitle: 'Master Python by building 100 projects in 100 days. Data science, automation, web dev, and more!',
      description: 'Learn Python from scratch through hands-on projects every single day.',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      price: 0,
      originalPrice: 4999,
      level: 'BEGINNER',
      language: 'English',
      learningObjectives: ['Master Python programming', 'Build 100 unique projects', 'Learn data science basics'],
      requirements: ['No prior experience required'],
      targetAudience: ['Beginners who want to learn Python'],
      isPublished: true,
      teacherId: teacher.id,
      categoryId: 'cat-dev',
    },
  });

  const chapter1 = await prisma.chapter.upsert({
    where: { id: 'chapter-html' },
    update: {},
    create: {
      id: 'chapter-html',
      title: 'HTML Fundamentals',
      order: 1,
      courseId: course.id,
    },
  });

  const chapter2 = await prisma.chapter.upsert({
    where: { id: 'chapter-react' },
    update: {},
    create: {
      id: 'chapter-react',
      title: 'React.js Mastery',
      order: 2,
      courseId: course.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-intro-html' },
    update: {},
    create: {
      id: 'lesson-intro-html',
      title: 'Introduction to HTML',
      description: 'Learn the basics of HTML structure and tags',
      videoKey: 'samples/big-buck-bunny.mp4',
      videoUrl: null,
      duration: 596,
      isPremium: false,
      order: 1,
      chapterId: chapter1.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-advanced-html' },
    update: {},
    create: {
      id: 'lesson-advanced-html',
      title: 'Advanced HTML & Semantic Tags',
      description: 'Master semantic HTML5 elements',
      videoKey: 'samples/elephants-dream.mp4',
      videoUrl: null,
      duration: 653,
      isPremium: true,
      order: 2,
      chapterId: chapter1.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-react-intro' },
    update: {},
    create: {
      id: 'lesson-react-intro',
      title: 'Getting Started with React',
      description: 'Setup React and create your first component',
      videoKey: 'samples/for-bigger-blazes.mp4',
      videoUrl: null,
      duration: 15,
      isPremium: false,
      order: 1,
      chapterId: chapter2.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-react-hooks' },
    update: {},
    create: {
      id: 'lesson-react-hooks',
      title: 'React Hooks Deep Dive',
      description: 'useState, useEffect, and custom hooks',
      videoKey: 'samples/for-bigger-escapes.mp4',
      videoUrl: null,
      duration: 45,
      isPremium: true,
      order: 2,
      chapterId: chapter2.id,
    },
  });

  const liveClass = await prisma.liveClass.upsert({
    where: { id: 'live-react-workshop' },
    update: {},
    create: {
      id: 'live-react-workshop',
      title: 'Live React Workshop',
      description: 'Build a todo app live with Q&A',
      courseId: course.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      liveStreamId: 'stream-react-workshop-001',
      isPremium: false,
      status: 'SCHEDULED',
    },
  });

  await prisma.liveClass.upsert({
    where: { id: 'live-premium-masterclass' },
    update: {},
    create: {
      id: 'live-premium-masterclass',
      title: 'Premium JavaScript Masterclass',
      description: 'Advanced JS patterns live session for subscribers',
      courseId: course.id,
      scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      meetingUrl: 'https://meet.google.com/xyz-premium-class',
      liveStreamId: 'stream-js-masterclass-002',
      isPremium: true,
      status: 'SCHEDULED',
    },
  });

  await prisma.liveClass.upsert({
    where: { id: 'live-completed-session' },
    update: {},
    create: {
      id: 'live-completed-session',
      title: 'CSS Grid Deep Dive (Recorded)',
      description: 'Previous live session on CSS Grid',
      courseId: course.id,
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3600000),
      meetingUrl: 'https://meet.google.com/past-session',
      liveStreamId: 'stream-css-grid-003',
      recordingUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      isPremium: true,
      status: 'COMPLETED',
    },
  });

  await prisma.recordedClass.upsert({
    where: { id: 'rec-js-basics' },
    update: {},
    create: {
      id: 'rec-js-basics',
      title: 'JavaScript Basics - Recorded Session',
      description: 'Previous live class on JavaScript fundamentals',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      liveClassId: liveClass.id,
      courseId: course.id,
      duration: 3600,
      isPremium: false,
    },
  });

  await prisma.review.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id, rating: 5, comment: 'Excellent course! Very comprehensive and well structured.' },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id },
  });

  await prisma.testSeries.upsert({
    where: { id: 'test-ssc-mock-1' },
    update: {},
    create: {
      id: 'test-ssc-mock-1',
      title: 'SSC CGL Full Length Mock Test 01',
      description: '100 questions | 60 minutes | All sections',
      examTrack: 'SSC',
      durationMinutes: 60,
      totalQuestions: 100,
      price: 0,
      isPublished: true,
    },
  });

  await prisma.testSeries.upsert({
    where: { id: 'test-neet-aits-1' },
    update: {},
    create: {
      id: 'test-neet-aits-1',
      title: 'NEET All India Test Series - Paper 1',
      description: '180 questions | 3 hours | NEET pattern',
      examTrack: 'NEET',
      durationMinutes: 180,
      totalQuestions: 180,
      price: 499,
      isPublished: true,
      courseId: 'course-neet-batch',
    },
  });

  await prisma.testSeries.upsert({
    where: { id: 'test-jee-mock-1' },
    update: {},
    create: {
      id: 'test-jee-mock-1',
      title: 'JEE Main Mock Test - Physics & Chemistry',
      description: 'Sectional mock for Main 2027',
      examTrack: 'IIT-JEE',
      durationMinutes: 120,
      totalQuestions: 75,
      price: 199,
      isPublished: true,
    },
  });

  console.log('Seed completed!');
  console.log('\nDemo accounts:');
  console.log('  Admin:   admin@elearning.com / admin123');
  console.log('  Teacher: teacher@elearning.com / teacher123');
  console.log('  Student: student@elearning.com / student123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
