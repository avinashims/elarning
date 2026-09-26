import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import CourseCard from '../components/CourseCard';
import { EXAM_LANDING_PAGES } from '../constants/examLanding';
import './ExamLanding.css';

export default function ExamLanding({ pageSlug }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const config = pageSlug ? EXAM_LANDING_PAGES[pageSlug] : null;

  const classLevel = searchParams.get('classLevel') || '';
  const stream = searchParams.get('stream') || config?.defaultStream || '';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config || pageSlug === 'school-boards') {
      setLoading(false);
      setCourses([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (config.category) params.set('category', config.category);
    if (config.examTrack) params.set('examTrack', config.examTrack);
    if (classLevel) params.set('classLevel', classLevel);
    if (stream) params.set('stream', stream);

    api.get(`/courses?${params.toString()}`)
      .then((res) => setCourses(res.data.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [config, pageSlug, classLevel, stream]);

  const setClassFilter = (level) => {
    const next = new URLSearchParams(searchParams);
    if (level) next.set('classLevel', level);
    else next.delete('classLevel');
    if (!next.get('came_from')) next.set('came_from', 'exam_cards');
    setSearchParams(next);
  };

  if (!config) {
    return (
      <div className="container exam-landing">
        <p className="alert alert-error">Category not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const isHub = pageSlug === 'school-boards';

  return (
    <div className="exam-landing">
      <section className="exam-landing-hero">
        <div className="container">
          <p className="exam-landing-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            {isHub ? 'School Boards' : config.title}
          </p>
          <h1>{config.title}</h1>
          <p className="exam-landing-sub">{config.subtitle}</p>

          {isHub && config.boardLinks?.length > 0 && (
            <div className="exam-landing-boards">
              {config.boardLinks.map((b) => (
                <Link key={b.path} to={b.path} className="board-chip board-chip-lg">
                  {b.label}
                </Link>
              ))}
            </div>
          )}

          {!isHub && config.classLevels?.length > 0 && (
            <div className="exam-landing-filters">
              <button
                type="button"
                className={`filter-chip ${!classLevel ? 'active' : ''}`}
                onClick={() => setClassFilter('')}
              >
                All classes
              </button>
              {config.classLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`filter-chip ${classLevel === level ? 'active' : ''}`}
                  onClick={() => setClassFilter(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {!isHub && (
        <section className="container exam-landing-results">
          <div className="section-header">
            <h2>Batches</h2>
            <span className="result-count">
              {loading ? 'Loading…' : `${courses.length} result${courses.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {loading ? (
            <p className="text-muted">Loading batches…</p>
          ) : courses.length === 0 ? (
            <p className="text-muted">No batches yet for this filter. Check back soon or browse all batches.</p>
          ) : (
            <div className="grid grid-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} compact />
              ))}
            </div>
          )}
          <p className="exam-landing-more">
            <Link to={`/batches?category=${config.category}&came_from=exam_cards`}>View all {config.title} batches →</Link>
          </p>
        </section>
      )}

      {isHub && (
        <section className="container exam-landing-hub">
          <p className="text-muted">Pick a board above to see live batches, class filters, and test series — similar to PW exam pages.</p>
        </section>
      )}
    </div>
  );
}
