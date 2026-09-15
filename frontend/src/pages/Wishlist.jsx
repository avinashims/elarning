import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import './Wishlist.css';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist')
      .then((res) => setItems(res.data.data.map((w) => w.course || w)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading container">Loading...</div>;

  return (
    <div className="container wishlist-page">
      <h1>Wishlist</h1>
      <p className="wishlist-subtitle">{items.length} course{items.length !== 1 ? 's' : ''} saved</p>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <p>Your wishlist is empty.</p>
          <Link to="/courses" className="btn btn-primary">Explore courses</Link>
        </div>
      ) : (
        <div className="grid grid-4">
          {items.map((course) => (
            <CourseCard key={course.id} course={course} compact />
          ))}
        </div>
      )}
    </div>
  );
}
