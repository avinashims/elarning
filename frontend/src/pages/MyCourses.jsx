import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import './MyCourses.css';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/my')
      .then((res) => setCourses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading container">Loading...</div>;

  return (
    <div className="my-learning-page">
      <div className="my-learning-header">
        <div className="container">
          <h1>My learning</h1>
          <p>Pick up where you left off</p>
        </div>
      </div>

      <div className="container">
        {courses.length === 0 ? (
          <div className="my-learning-empty">
            <h2>Start learning today</h2>
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn btn-primary">Explore courses</Link>
          </div>
        ) : (
          <div className="grid grid-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
