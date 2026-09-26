import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Courses.css';

const TRACKS = [
  { value: '', label: 'All exams' },
  { value: 'IIT-JEE', label: 'IIT JEE' },
  { value: 'NEET', label: 'NEET' },
  { value: 'SSC', label: 'SSC' },
  { value: 'CBSE', label: 'CBSE' },
  { value: 'UPSC', label: 'UPSC' },
  { value: 'GATE', label: 'GATE' },
];

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function TestSeries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const examTrack = searchParams.get('examTrack') || '';
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = examTrack ? { examTrack } : {};
    api.get('/platform/test-series', { params })
      .then((res) => setTests(res.data.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [examTrack]);

  const setTrack = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('examTrack', value);
    else next.delete('examTrack');
    setSearchParams(next);
  };

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div className="container">
          <h1>Test series</h1>
          <p>Mock tests and all-India series for your target exam</p>
        </div>
      </div>

      <div className="container courses-layout">
        <aside className="courses-sidebar">
          <h3>Exam</h3>
          <div className="filter-group">
            {TRACKS.map((t) => (
              <label key={t.value || 'all'} className="filter-option">
                <input
                  type="radio"
                  checked={examTrack === t.value}
                  onChange={() => setTrack(t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </aside>

        <div className="courses-results">
          {loading ? (
            <div className="loading">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="empty-state">
              <p>No test series found for this filter.</p>
            </div>
          ) : (
            <div className="test-series-list">
              {tests.map((test) => (
                <article key={test.id} className="test-series-card card">
                  <div>
                    {test.examTrack && (
                      <span className="badge badge-primary">{test.examTrack}</span>
                    )}
                    <h3>{test.title}</h3>
                    {test.description && <p className="text-muted">{test.description}</p>}
                    <p className="test-meta">
                      {test.totalQuestions} questions · {test.durationMinutes} min
                    </p>
                    {test.course && (
                      <Link to={`/courses/${test.course.id}`} className="see-all">
                        Linked batch: {test.course.title}
                      </Link>
                    )}
                  </div>
                  <div className="test-series-action">
                    <span className="price">{formatPrice(test.price)}</span>
                    <button type="button" className="btn btn-primary btn-sm" disabled title="Coming soon">
                      Start test
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
