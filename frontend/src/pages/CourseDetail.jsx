import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { formatAppDateTime } from '../utils/dateTime';
import './CourseDetail.css';

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

/** First lesson the learner can open (skips locked premium without access). */
function findFirstLesson(course, isOwned) {
  for (const chapter of course.chapters || []) {
    for (const lesson of chapter.lessons || []) {
      if (lesson.locked && !isOwned) continue;
      if (lesson.id) return lesson;
    }
  }
  return null;
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, refreshCart } = useCart();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loadError, setLoadError] = useState('');
  const [liveClasses, setLiveClasses] = useState([]);
  const [liveJoining, setLiveJoining] = useState(null);
  const [liveJoinError, setLiveJoinError] = useState('');

  useEffect(() => {
    setLoadError('');
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/reviews/courses/${id}`).catch(() => ({ data: { data: [] } })),
      user ? api.get(`/progress/course/${id}`).catch(() => null) : Promise.resolve(null),
      user ? api.get('/wishlist').catch(() => ({ data: { data: [] } })) : Promise.resolve(null),
    ])
      .then(([courseRes, reviewsRes, progressRes, wishlistRes]) => {
        setCourse(courseRes.data.data);
        setReviews(reviewsRes.data.data);
        if (progressRes) setProgress(progressRes.data.data);
        if (wishlistRes) {
          setWishlisted(wishlistRes.data.data.some((w) => w.courseId === id || w.course?.id === id));
        }
      })
      .catch((err) => {
        setCourse(null);
        setLoadError(err.response?.data?.message || 'Course not found');
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    const applyList = (list) => {
      const filtered = (list || []).filter(
        (lc) => lc.course?.id === id || lc.courseId === id
      );
      setLiveClasses(filtered);
    };

    api.get('/live-classes/upcoming', { params: { courseId: id } })
      .then((res) => applyList(res.data.data))
      .catch(() => {
        api.get('/live-classes/upcoming')
          .then((res) => applyList(res.data.data))
          .catch(() => setLiveClasses([]));
      });
  }, [id]);

  const handleJoinLive = async (cls) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLiveJoining(cls.id);
    setLiveJoinError('');
    try {
      const res = await api.get(`/live-classes/${cls.id}/join`);
      const { meetingUrl, liveStreamId } = res.data.data;
      const url = meetingUrl || (liveStreamId ? `https://stream.example.com/${liveStreamId}` : null);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setLiveJoinError('No meeting link set for this class. Ask your instructor to add a Google Meet URL.');
      }
    } catch (err) {
      setLiveJoinError(err.response?.data?.message || 'Unable to join this class');
    } finally {
      setLiveJoining(null);
    }
  };

  const activeLive = liveClasses.find((lc) => lc.status === 'LIVE');

  const renderLiveSessions = (compact = false) => (
    <div className={compact ? 'course-live-panel compact' : 'course-live-panel'}>
      {liveClasses.length === 0 ? (
        <p className="course-live-empty">
          No live class is scheduled for <strong>{course?.title}</strong> yet.
          {' '}Your instructor adds one from the{' '}
          <Link to="/teacher">teacher dashboard</Link> (Schedule Live Class → pick this course → Google Meet link).
          {' '}You can also open{' '}
          <Link to="/live-classes">Live classes</Link> in the top menu.
        </p>
      ) : (
        liveClasses.map((cls) => (
          <div key={cls.id} className="course-live-item">
            <div className="course-live-item-head">
              <strong>{cls.title}</strong>
              <span className={`badge ${cls.status === 'LIVE' ? 'badge-danger' : 'badge-primary'}`}>
                {cls.status === 'LIVE' ? 'LIVE NOW' : cls.status}
              </span>
            </div>
            <p className="course-live-time">{formatAppDateTime(cls.scheduledAt)}</p>
            {(cls.status === 'LIVE' || cls.status === 'SCHEDULED') && (
              <button
                type="button"
                className={`btn btn-sm ${cls.status === 'LIVE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ marginTop: '0.5rem', width: compact ? '100%' : 'auto' }}
                disabled={liveJoining === cls.id}
                onClick={() => handleJoinLive(cls)}
              >
                {liveJoining === cls.id
                  ? 'Opening meet...'
                  : cls.status === 'LIVE'
                    ? 'Join live (Google Meet / Zoom)'
                    : 'Join when ready'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setCourse((c) => ({ ...c, isEnrolled: true, isOwned: true }));
      alert('Enrolled successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading(true);
    try {
      await addToCart(id);
      alert('Added to cart');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading(true);
    try {
      const orderRes = await api.post(`/cart/buy/${id}`);
      const { orderId, amount, course: courseData } = orderRes.data.data;
      await loadRazorpay();

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Udemy',
        description: courseData?.title || course.title,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post(`/cart/buy/${id}/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await refreshCart();
            setCourse((c) => ({ ...c, isEnrolled: true, isOwned: true }));
            alert('Purchase successful!');
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: '#5624d0' },
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const result = await toggleWishlist(id);
      setWishlisted(result);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update wishlist');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/reviews/courses/${id}`, reviewForm);
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.userId !== user.id);
        return [res.data.data, ...filtered];
      });
      alert('Review submitted!');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit review');
    }
  };

  if (loading) return <div className="loading container">Loading...</div>;
  if (!course) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-error">{loadError || 'Course not found'}</div>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          This course may have been deleted, is still a draft, or the link is outdated.
          To join a live session, use <Link to="/live-classes">Live classes</Link> — not the course page URL.
        </p>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Browse courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.chapters?.reduce((n, ch) => n + (ch.lessons?.length || 0), 0) || 0;
  const rating = course.rating || { average: 0, count: 0 };
  const isFree = !course.price || course.price === 0;
  const isOwned = course.isOwned || course.isEnrolled;
  const firstLesson = findFirstLesson(course, isOwned);

  return (
    <div className="course-detail-page">
      <section className="course-hero">
        <div className="container">
          {course.category && (
            <Link to={`/courses?category=${course.category.slug}`} className="course-category-link">
              {course.category.name}
            </Link>
          )}
          <h1>{course.title}</h1>
          {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
          <div className="course-hero-meta">
            {rating.average > 0 && (
              <>
                <span className="rating">{rating.average.toFixed(1)}</span>
                <span className="stars" style={{ color: '#f3ca8c' }}>★★★★★</span>
                <span className="rating-count">({rating.count} ratings)</span>
              </>
            )}
            {course._count && <span>{course._count.enrollments || 0} students</span>}
            {course.teacher && (
              <span className="teacher-info">
                Created by <Link to={`/instructor/${course.teacher.id}`}>{course.teacher.name}</Link>
              </span>
            )}
          </div>
          {progress && (
            <div className="course-progress">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress.stats.progressPercent}%` }} />
              </div>
              <span>{progress.stats.progressPercent}% complete</span>
            </div>
          )}
          {activeLive && (
            <div className="course-live-hero-banner">
              <span>🔴 Live class in progress — {activeLive.title}</span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => handleJoinLive(activeLive)}
                disabled={liveJoining === activeLive.id}
              >
                {liveJoining === activeLive.id ? 'Opening...' : 'Join now'}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="container course-body">
        <div className="course-main">
          <div className="course-tabs">
            {['overview', 'curriculum', 'live', 'instructor', 'reviews'].map((t) => (
              <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                {t === 'live' ? (
                  <>
                    Live
                    {activeLive && <span className="badge badge-danger" style={{ marginLeft: '0.35rem', fontSize: '0.65rem' }}>ON AIR</span>}
                  </>
                ) : (
                  t.charAt(0).toUpperCase() + t.slice(1)
                )}
              </button>
            ))}
          </div>

          {liveJoinError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{liveJoinError}</div>
          )}

          {tab === 'overview' && (
            <div className="tab-content">
              <h2>Live sessions</h2>
              {renderLiveSessions()}
              <h2 style={{ marginTop: '2rem' }}>What you'll learn</h2>
              {course.learningObjectives?.length > 0 ? (
                <ul className="objectives-grid">
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i}>✓ {obj}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{course.description}</p>
              )}

              {course.requirements?.length > 0 && (
                <>
                  <h2>Requirements</h2>
                  <ul className="simple-list">
                    {course.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </>
              )}

              {course.targetAudience?.length > 0 && (
                <>
                  <h2>Who this course is for</h2>
                  <ul className="simple-list">
                    {course.targetAudience.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </>
              )}

              <h2>Description</h2>
              <p className="course-description">{course.description}</p>
            </div>
          )}

          {tab === 'live' && (
            <div className="tab-content">
              <h2>Live classes</h2>
              <p className="muted" style={{ marginBottom: '1rem' }}>
                Join opens your instructor&apos;s meeting link in a new tab. The teacher must click <strong>Start</strong> on the teacher dashboard.
              </p>
              {renderLiveSessions()}
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="tab-content chapters-list">
              <h2>Course content</h2>
              <p className="curriculum-meta">
                {course.chapters?.length || 0} sections · {totalLessons} lectures
                {course.level && ` · ${course.level.replace('_', ' ').toLowerCase()}`}
              </p>
              {course.chapters?.map((chapter) => (
                <div key={chapter.id} className="chapter-card">
                  <h3>{chapter.title}</h3>
                  <ul className="lessons-list">
                    {chapter.lessons?.map((lesson) => (
                      <li key={lesson.id} className={lesson.locked ? 'locked' : ''}>
                        <Link to={lesson.locked && !isOwned ? '/pricing' : `/lessons/${lesson.id}`}>
                          <span className="lesson-title">
                            {lesson.locked && !isOwned ? '🔒' : '▶'} {lesson.title}
                          </span>
                          <span className="lesson-meta">
                            {lesson.isPremium && <span className="badge badge-premium">Premium</span>}
                            {lesson.duration > 0 && (
                              <span>{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {tab === 'instructor' && course.teacher && (
            <div className="tab-content instructor-tab">
              <div className="instructor-header">
                {course.teacher.avatar ? (
                  <img src={course.teacher.avatar} alt={course.teacher.name} className="instructor-avatar" />
                ) : (
                  <div className="instructor-avatar-placeholder">{course.teacher.name[0]}</div>
                )}
                <div>
                  <h2>{course.teacher.name}</h2>
                  {course.teacher.headline && <p className="instructor-headline">{course.teacher.headline}</p>}
                  <Link to={`/instructor/${course.teacher.id}`} className="btn btn-sm btn-secondary">View profile</Link>
                </div>
              </div>
              {course.teacher.bio && <p className="instructor-bio">{course.teacher.bio}</p>}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="tab-content reviews-tab">
              <div className="reviews-summary">
                <span className="big-rating">{rating.average > 0 ? rating.average.toFixed(1) : '—'}</span>
                <div>
                  <span className="stars" style={{ color: '#f3ca8c' }}>★★★★★</span>
                  <p>{rating.count} ratings</p>
                </div>
              </div>

              {course.isEnrolled && user && (
                <form className="review-form" onSubmit={handleReview}>
                  <h3>Leave a rating</h3>
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: +e.target.value })}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                  </select>
                  <textarea
                    placeholder="Tell us about your experience"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows={3}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Submit review</button>
                </form>
              )}

              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p className="muted">No reviews yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <strong>{r.user?.name}</strong>
                        <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && <p>{r.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="course-sidebar">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="sidebar-preview" />
          ) : (
            <div className="sidebar-preview-placeholder" />
          )}
          <div className="sidebar-content">
            <div className="sidebar-price">
              {formatPrice(course.price)}
              {course.originalPrice > course.price && (
                <span className="sidebar-original">₹{course.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            {isOwned ? (
              <>
                {firstLesson ? (
                  <Link
                    to={`/lessons/${firstLesson.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '0.75rem', textAlign: 'center' }}
                  >
                    Go to course
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '0.75rem' }}
                    onClick={() => setTab(isOwned ? 'live' : 'curriculum')}
                  >
                    {totalLessons === 0 ? 'View course (no videos yet)' : 'Open curriculum'}
                  </button>
                )}
              </>
            ) : isFree ? (
              <button onClick={handleEnroll} className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Enroll now'}
              </button>
            ) : (
              <>
                <button onClick={handleBuyNow} className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} disabled={actionLoading}>
                  Buy now
                </button>
                <button onClick={handleAddToCart} className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }} disabled={actionLoading}>
                  Add to cart
                </button>
              </>
            )}

            <button onClick={handleWishlist} className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              {wishlisted ? '♥ Saved' : '♡ Save for later'}
            </button>

            <h4 className="sidebar-live-heading">📺 Live sessions</h4>
            {renderLiveSessions(true)}

            <ul className="sidebar-features">
              <li>Full lifetime access</li>
              <li>Access on mobile and desktop</li>
              {course.language && <li>Language: {course.language}</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
