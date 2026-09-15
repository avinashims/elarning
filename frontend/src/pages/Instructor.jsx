import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import './Instructor.css';

export default function Instructor() {
  const { id } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/instructor/${id}`)
      .then((res) => setInstructor(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading container">Loading...</div>;
  if (!instructor) return <div className="container"><div className="alert alert-error">Instructor not found</div></div>;

  return (
    <div className="instructor-page">
      <section className="instructor-hero">
        <div className="container instructor-hero-inner">
          {instructor.avatar ? (
            <img src={instructor.avatar} alt={instructor.name} className="instructor-avatar-lg" />
          ) : (
            <div className="instructor-avatar-lg placeholder">{instructor.name[0]}</div>
          )}
          <div>
            <h1>{instructor.name}</h1>
            {instructor.headline && <p className="headline">{instructor.headline}</p>}
            {instructor.website && (
              <a href={instructor.website} target="_blank" rel="noreferrer" className="website-link">
                {instructor.website}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container instructor-body">
        {instructor.bio && (
          <section className="instructor-about">
            <h2>About me</h2>
            <p>{instructor.bio}</p>
          </section>
        )}

        <section>
          <h2>My courses ({instructor.coursesTaught?.length || 0})</h2>
          <div className="grid grid-4" style={{ marginTop: '1.5rem' }}>
            {instructor.coursesTaught?.map((course) => (
              <CourseCard key={course.id} course={course} compact />
            ))}
          </div>
          {(!instructor.coursesTaught || instructor.coursesTaught.length === 0) && (
            <p className="muted">No published courses yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
