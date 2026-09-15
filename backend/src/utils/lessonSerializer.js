function lessonHasVideo(lesson) {
  return !!(lesson.videoKey || lesson.videoUrl);
}

function sanitizeLessonForClient(lesson, hasPremiumAccess) {
  const locked = lesson.isPremium && !hasPremiumAccess;
  const { videoUrl, videoKey, ...rest } = lesson;

  return {
    ...rest,
    hasVideo: lessonHasVideo(lesson),
    locked,
  };
}

module.exports = { lessonHasVideo, sanitizeLessonForClient };
