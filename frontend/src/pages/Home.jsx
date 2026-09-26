import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import { formatAppDateTime } from '../utils/dateTime';
import './Home.css';

const TRACK_TO_FILTER = {
  'iit-jee': 'IIT-JEE',
  neet: 'NEET',
  ssc: 'SSC',
  cbse: 'CBSE',
  icse: 'ICSE',
  'up-board': 'UP Board',
  upsc: 'UPSC',
  gate: 'GATE',
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.get('/platform/home')
      .then((res) => setPlatform(res.data.data))
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'Could not load home');
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/batches?q=${encodeURIComponent(search.trim())}`);
  };

  const examTracks = platform?.examTracks || [];
  const exploreCategories = platform?.exploreCategories || [];
  const featuredBatches = platform?.featuredBatches || [];
  const upcomingLive = platform?.upcomingLive || [];
  const stats = platform?.stats || {};

  return (
    <div className="home">
      <section className="hero hero-pw">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="hero-kicker">Live-first exam prep</p>
            <h1>Crack your exam with Avi SkillStream</h1>
            <p>
              Join live batches, test series, and recorded revision — JEE, NEET, SSC, and more.
            </p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search batches & subjects"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
            {!user && (
              <p className="hero-cta">
                New here?{' '}
                <Link to="/register">Create free account</Link>
              </p>
            )}
          </div>
          <div className="hero-visual">
            <div className="hero-illustration" />
          </div>
        </div>
      </section>

      {loadError && (
        <div className="container" style={{ paddingTop: '1rem' }}>
          <div className="alert alert-error">{loadError}</div>
        </div>
      )}

      <section className="stats-strip container">
        <div className="stats-strip-inner">
          <div className="stat-pill">
            <strong>{stats.batches ?? '—'}</strong>
            <span>Active batches</span>
          </div>
          <div className="stat-pill">
            <strong>{stats.testSeries ?? '—'}</strong>
            <span>Test series</span>
          </div>
          <div className="stat-pill">
            <strong>{stats.liveToday ?? 0}</strong>
            <span>Live today</span>
          </div>
          <Link to="/live-classes" className="btn btn-primary btn-sm">View schedule</Link>
        </div>
      </section>

      <section className="explore-categories container">
        <div className="section-header">
          <h2>Browse categories</h2>
        </div>
        <div className="explore-category-grid">
          {exploreCategories.map((cat) => (
            <article key={cat.slug} className="explore-category-card">
              <div className="explore-category-body">
                <h3>{cat.title}</h3>
                {cat.pills?.length > 0 ? (
                  <div className="explore-pills">
                    {cat.pills.map((pill) => (
                      <Link key={pill.path} to={pill.path} className="board-chip">
                        {pill.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link to={cat.explorePath} className="explore-link">
                    Explore Category <span aria-hidden>→</span>
                  </Link>
                )}
                {cat.pills?.length > 0 && (
                  <Link to={cat.explorePath} className="explore-link explore-link-bottom">
                    Explore Category <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
              <span className="explore-category-art" aria-hidden>{cat.icon}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="exam-tracks container">
        <div className="section-header">
          <h2>Choose your exam</h2>
          <Link to="/batches" className="see-all">All batches</Link>
        </div>
        <div className="exam-track-grid">
          {examTracks.map((track) => (
            <Link
              key={track.slug}
              to={`/batches?examTrack=${encodeURIComponent(TRACK_TO_FILTER[track.slug] || track.name)}`}
              className="exam-track-card"
            >
              <span className="exam-track-icon">{track.icon}</span>
              <h3>{track.name}</h3>
              <p>{track.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {upcomingLive.length > 0 && (
        <section className="live-today container">
          <div className="section-header">
            <h2>Upcoming live classes</h2>
            <Link to="/live-classes" className="see-all">Full calendar</Link>
          </div>
          <ul className="live-list">
            {upcomingLive.slice(0, 4).map((lc) => (
              <li key={lc.id}>
                <div>
                  <strong>{lc.title}</strong>
                  <span className="live-meta">
                    {lc.course?.title && `${lc.course.title} · `}
                    {formatAppDateTime(lc.scheduledAt)}
                  </span>
                </div>
                {lc.status === 'LIVE' && <span className="badge badge-danger">LIVE</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {featuredBatches.length > 0 && (
        <section className="featured container">
          <div className="section-header">
            <h2>Featured batches</h2>
            <Link to="/batches" className="see-all">See all</Link>
          </div>
          <div className="grid grid-4">
            {featuredBatches.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} compact />
            ))}
          </div>
        </section>
      )}

      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2>Test series & mocks</h2>
            <p>All-India tests with detailed analytics — practice like exam day.</p>
          </div>
          <Link to="/test-series" className="btn btn-dark btn-lg">Browse tests</Link>
        </div>
      </section>
    </div>
  );
}
