import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/courses').then((res) => res.data.data.slice(0, 4)),
      api.get('/categories').then((res) => res.data.data),
    ]).then(([courseData, catData]) => {
      setCourses(courseData);
      setCategories(catData);
    }).catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/courses?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>Learn without limits</h1>
            <p>
              Start, switch, or advance your career with thousands of courses,
              live classes, and expert instructors.
            </p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="What do you want to learn?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
            {!user && (
              <p className="hero-cta">
                New to Udemy?{' '}
                <Link to="/register">Sign up today</Link>
              </p>
            )}
          </div>
          <div className="hero-visual">
            <div className="hero-illustration" />
          </div>
        </div>
      </section>

      <section className="categories container">
        <h2>Top categories</h2>
        <div className="category-grid">
          {categories.slice(0, 6).map((cat) => (
            <Link key={cat.id} to={`/courses?category=${cat.slug}`} className="category-card">
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {courses.length > 0 && (
        <section className="featured container">
          <div className="section-header">
            <h2>Students are viewing</h2>
            <Link to="/courses" className="see-all">See all</Link>
          </div>
          <div className="grid grid-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} compact />
            ))}
          </div>
        </section>
      )}

      <section className="trust-section">
        <div className="container trust-grid">
          <div className="trust-item">
            <span className="trust-num">10K+</span>
            <span className="trust-label">Video lessons</span>
          </div>
          <div className="trust-item">
            <span className="trust-num">Live</span>
            <span className="trust-label">Interactive classes</span>
          </div>
          <div className="trust-item">
            <span className="trust-num">Premium</span>
            <span className="trust-label">Expert content</span>
          </div>
          <div className="trust-item">
            <span className="trust-num">Track</span>
            <span className="trust-label">Your progress</span>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2>Become an instructor</h2>
            <p>Instructors from around the world teach millions of students on Udemy.</p>
          </div>
          <Link to="/register" className="btn btn-dark btn-lg">Get started</Link>
        </div>
      </section>
    </div>
  );
}
