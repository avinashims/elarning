import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';

export default function LessonView() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/lessons/${id}`)
      .then((res) => setLesson(res.data.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load lesson');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading container">Loading lesson...</div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!lesson) return <div className="container"><div className="alert alert-error">Lesson not found</div></div>;

  const initialTime = lesson.progress?.watchedSeconds || 0;

  return (
    <div className="container">
      <div className="page-header">
        <Link to={`/courses/${lesson.chapter?.course?.id}`} style={{ color: 'var(--primary-light)', fontSize: '0.875rem' }}>
          ← Back to {lesson.chapter?.course?.title}
        </Link>
        <h1>{lesson.title}</h1>
        {lesson.description && <p>{lesson.description}</p>}
      </div>

      <VideoPlayer
        lessonId={lesson.id}
        locked={lesson.locked}
        initialTime={initialTime}
      />

      {initialTime > 0 && !lesson.locked && (
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Resuming from {Math.floor(initialTime / 60)}:{String(initialTime % 60).padStart(2, '0')}
        </p>
      )}
    </div>
  );
}
