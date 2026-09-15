import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import './Courses.css';

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'ALL_LEVELS', label: 'All levels' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Most relevant' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title', label: 'Title A-Z' },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const level = searchParams.get('level') || '';
  const sort = searchParams.get('sort') || '';
  const priceFilter = searchParams.get('price') || '';

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    if (sort) params.set('sort', sort);
    if (priceFilter === 'free') params.set('maxPrice', '0');
    if (priceFilter === 'paid') params.set('minPrice', '1');

    api.get(`/courses?${params.toString()}`)
      .then((res) => setCourses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, category, level, sort, priceFilter]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const categoryName = categories.find((c) => c.slug === category)?.name;

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div className="container">
          <h1>
            {query ? `"${query}"` : categoryName || 'All courses'}
          </h1>
          <p>{courses.length} result{courses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container courses-layout">
        <aside className="courses-sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <h4>Category</h4>
            <label className="filter-option">
              <input type="radio" checked={!category} onChange={() => updateFilter('category', '')} />
              All categories
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="filter-option">
                <input type="radio" checked={category === cat.slug} onChange={() => updateFilter('category', cat.slug)} />
                {cat.icon} {cat.name}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Level</h4>
            {LEVELS.filter((l, i, arr) => i === 0 || l.value !== arr[0].value).map((l) => (
              <label key={l.value || 'all'} className="filter-option">
                <input type="radio" checked={level === l.value} onChange={() => updateFilter('level', l.value)} />
                {l.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Price</h4>
            {[
              { value: '', label: 'All' },
              { value: 'free', label: 'Free' },
              { value: 'paid', label: 'Paid' },
            ].map((p) => (
              <label key={p.value || 'all'} className="filter-option">
                <input type="radio" checked={priceFilter === p.value} onChange={() => updateFilter('price', p.value)} />
                {p.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Sort by</h4>
            <select value={sort} onChange={(e) => updateFilter('sort', e.target.value)} className="sort-select">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value || 'default'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </aside>

        <div className="courses-results">
          {loading ? (
            <div className="loading">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <p>No courses found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
