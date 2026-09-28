import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { datetimeLocalToIso, formatAppDateTime, defaultDatetimeLocalValue } from '../utils/dateTime';

const emptyCourseForm = {
  title: '',
  description: '',
  thumbnail: '',
  price: '0',
  originalPrice: '',
  isPublished: true,
  examTrack: '',
  classLevel: '',
  targetExamYear: '',
  medium: '',
};

const EXAM_TRACK_OPTIONS = [
  '', 'IIT-JEE', 'NEET', 'SSC', 'CBSE', 'ICSE', 'UP Board', 'UPSC', 'GATE',
  'MERN', 'PHP', 'WordPress',
];

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return `₹${Number(price).toLocaleString('en-IN')}`;
}

export default function TeacherDashboard() {
  const { isApprovedTeacher } = useAuth();
  const [data, setData] = useState(null);
  const [teacherApproved, setTeacherApproved] = useState(true);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [form, setForm] = useState(emptyCourseForm);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveForm, setLiveForm] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledAt: '',
    meetingUrl: '',
    liveStreamId: '',
    isPremium: false,
  });
  const [endForm, setEndForm] = useState({ id: null, recordingUrl: '' });
  const [loadError, setLoadError] = useState('');
  const [curriculumCourseId, setCurriculumCourseId] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [lessonForm, setLessonForm] = useState({
    chapterId: '',
    title: '',
    description: '',
    isPremium: false,
  });
  const [lessonVideoFile, setLessonVideoFile] = useState(null);
  const [curriculumSaving, setCurriculumSaving] = useState(false);

  const fetchData = () => {
    setLoadError('');
    setLoading(true);
    Promise.all([
      api.get('/dashboard/teacher'),
      api.get('/live-classes'),
    ])
      .then(([dashRes, liveRes]) => {
        const payload = dashRes.data?.data;
        if (!payload?.stats || !Array.isArray(payload.courses)) {
          throw new Error('Invalid dashboard response');
        }
        setData(payload);
        setTeacherApproved(payload.teacherApproved !== false);
        setLiveClasses(liveRes.data?.data || []);
      })
      .catch((err) => {
        setData(null);
        setLoadError(err.response?.data?.message || 'Could not load dashboard. Is the API running?');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetCourseForm = () => {
    setForm(emptyCourseForm);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setEditingCourseId(null);
    setShowForm(null);
  };

  const openCreateCourse = () => {
    setEditingCourseId(null);
    setForm(emptyCourseForm);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShowForm('course');
  };

  const openEditCourse = (course) => {
    setEditingCourseId(course.id);
    setForm({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail || '',
      price: String(course.price ?? 0),
      originalPrice: course.originalPrice != null ? String(course.originalPrice) : '',
      isPublished: course.isPublished,
      examTrack: course.examTrack || '',
      classLevel: course.classLevel || '',
      targetExamYear: course.targetExamYear || '',
      medium: course.medium || '',
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail || '');
    setShowForm('course');
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile) return form.thumbnail || undefined;

    const payload = new FormData();
    payload.append('thumbnail', thumbnailFile);
    const res = await api.post('/uploads/thumbnail', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const price = parseInt(form.price, 10);
      const originalPriceRaw = form.originalPrice.trim();
      const originalPrice = originalPriceRaw === '' ? undefined : parseInt(originalPriceRaw, 10);

      if (Number.isNaN(price) || price < 0) {
        alert('Enter a valid price (0 for free)');
        setSaving(false);
        return;
      }
      if (originalPrice !== undefined && (Number.isNaN(originalPrice) || originalPrice < 0)) {
        alert('Enter a valid original price or leave it empty');
        setSaving(false);
        return;
      }

      const thumbnail = await uploadThumbnail();
      const body = {
        title: form.title,
        description: form.description,
        isPublished: form.isPublished,
        price,
        ...(originalPrice !== undefined ? { originalPrice } : {}),
        ...(thumbnail ? { thumbnail } : {}),
        ...(form.examTrack ? { examTrack: form.examTrack } : {}),
        ...(form.classLevel ? { classLevel: form.classLevel } : {}),
        ...(form.targetExamYear ? { targetExamYear: form.targetExamYear } : {}),
        ...(form.medium ? { medium: form.medium } : {}),
      };

      if (editingCourseId) {
        await api.put(`/courses/${editingCourseId}`, body);
        alert('Course updated!');
      } else {
        await api.post('/courses', body);
        alert('Course created!');
      }

      resetCourseForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      fetchData();
      alert('Course deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const openScheduleLive = () => {
    setLiveForm({
      courseId: '',
      title: '',
      description: '',
      scheduledAt: defaultDatetimeLocalValue(),
      meetingUrl: '',
      liveStreamId: '',
      isPremium: false,
    });
    setShowForm('live');
  };

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!liveForm.meetingUrl?.trim()) {
      alert('Add a Meeting URL (Google Meet or Zoom link) so students can join.');
      return;
    }
    try {
      await api.post('/live-classes', {
        ...liveForm,
        meetingUrl: liveForm.meetingUrl.trim(),
        scheduledAt: datetimeLocalToIso(liveForm.scheduledAt),
        isPremium: liveForm.isPremium,
      });
      setShowForm(null);
      setLiveForm({
        courseId: '',
        title: '',
        description: '',
        scheduledAt: '',
        meetingUrl: '',
        liveStreamId: '',
        isPremium: false,
      });
      fetchData();
      alert('Live class scheduled!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule class');
    }
  };

  const handleStartClass = async (id) => {
    try {
      await api.post(`/live-classes/${id}/start`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start class');
    }
  };

  const handleEndClass = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/live-classes/${endForm.id}/end`, {
        recordingUrl: endForm.recordingUrl || undefined,
      });
      setEndForm({ id: null, recordingUrl: '' });
      fetchData();
      alert('Live class ended!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end class');
    }
  };

  const loadCurriculum = async (courseId) => {
    if (!courseId) {
      setCurriculum(null);
      return;
    }
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCurriculum(res.data.data);
      const firstChapter = res.data.data?.chapters?.[0];
      setLessonForm((prev) => ({
        ...prev,
        chapterId: firstChapter?.id || '',
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load course curriculum');
      setCurriculum(null);
    }
  };

  const handleCurriculumCourseChange = (courseId) => {
    setCurriculumCourseId(courseId);
    loadCurriculum(courseId);
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!curriculumCourseId || !chapterTitle.trim()) return;
    setCurriculumSaving(true);
    try {
      await api.post(`/courses/${curriculumCourseId}/chapters`, {
        title: chapterTitle.trim(),
      });
      setChapterTitle('');
      await loadCurriculum(curriculumCourseId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add chapter');
    } finally {
      setCurriculumSaving(false);
    }
  };

  const uploadLessonVideo = async () => {
    if (!lessonVideoFile) return undefined;
    const payload = new FormData();
    payload.append('video', lessonVideoFile);
    const res = await api.post('/uploads/lesson-video', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.videoKey;
  };

  const handleAddRecordedLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.chapterId || !lessonForm.title.trim()) {
      alert('Select a chapter and enter a lesson title');
      return;
    }
    if (!lessonVideoFile) {
      alert('Choose a recorded video file (MP4, WEBM, MOV, or M4V)');
      return;
    }
    setCurriculumSaving(true);
    try {
      const videoKey = await uploadLessonVideo();
      await api.post(`/chapters/${lessonForm.chapterId}/lessons`, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || undefined,
        videoKey,
        isPremium: lessonForm.isPremium,
      });
      setLessonForm({
        chapterId: lessonForm.chapterId,
        title: '',
        description: '',
        isPremium: false,
      });
      setLessonVideoFile(null);
      await loadCurriculum(curriculumCourseId);
      alert('Recorded lesson added!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lesson');
    } finally {
      setCurriculumSaving(false);
    }
  };

  const canTeach = isApprovedTeacher && teacherApproved;

  if (loading) return <div className="loading container">Loading...</div>;

  if (!data) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-error">{loadError || 'Could not load teacher dashboard.'}</div>
        <button type="button" className="btn btn-primary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const { stats, courses } = data;

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Manage your courses and live classes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openCreateCourse} className="btn btn-primary btn-sm" disabled={!canTeach}>
            + New Course
          </button>
          <button
            type="button"
            onClick={() => {
              if (showForm === 'live') setShowForm(null);
              else openScheduleLive();
            }}
            className="btn btn-secondary btn-sm"
            disabled={!canTeach}
          >
            + Schedule Live Class
          </button>
        </div>
      </div>

      {!canTeach && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          Your teacher account is disapproved. You can view this page but cannot create courses, upload videos, or schedule live classes until an admin approves you.
        </div>
      )}

      {showForm === 'course' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingCourseId ? 'Edit Course' : 'Create Course'}</h3>
          <form onSubmit={handleSaveCourse}>
            <div className="form-group">
              <label>Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-muted)' }}>Use 0 for a free course</small>
              </div>
              <div>
                <label>Original price (₹) — optional</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="e.g. 4999"
                />
                <small style={{ color: 'var(--text-muted)' }}>Shows as strikethrough discount</small>
              </div>
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label>Exam track</label>
                <select
                  className="form-control"
                  value={form.examTrack}
                  onChange={(e) => setForm({ ...form, examTrack: e.target.value })}
                >
                  {EXAM_TRACK_OPTIONS.map((t) => (
                    <option key={t || 'none'} value={t}>{t || 'Not set'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Class / level</label>
                <input
                  className="form-control"
                  placeholder="e.g. Class 12, Dropper"
                  value={form.classLevel}
                  onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                />
              </div>
              <div>
                <label>Target exam year</label>
                <input
                  className="form-control"
                  placeholder="e.g. 2027"
                  value={form.targetExamYear}
                  onChange={(e) => setForm({ ...form, targetExamYear: e.target.value })}
                />
              </div>
              <div>
                <label>Medium</label>
                <input
                  className="form-control"
                  placeholder="English / Hindi / Hinglish"
                  value={form.medium}
                  onChange={(e) => setForm({ ...form, medium: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Thumbnail image</label>
              <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleThumbnailChange} />
              <small style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP or GIF — max 5MB</small>
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Preview" style={{ display: 'block', marginTop: '0.75rem', maxWidth: 240, borderRadius: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                {' '}Published (visible to students)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingCourseId ? 'Update Course' : 'Create Course'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetCourseForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showForm === 'live' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Schedule Live Class</h3>
          <form onSubmit={handleCreateLiveClass}>
            <div className="form-group">
              <label>Course</label>
              <select className="form-control" value={liveForm.courseId} onChange={(e) => setLiveForm({ ...liveForm, courseId: e.target.value })} required>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input className="form-control" value={liveForm.title} onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={2} value={liveForm.description} onChange={(e) => setLiveForm({ ...liveForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Scheduled At (your local time)</label>
              <input type="datetime-local" className="form-control" value={liveForm.scheduledAt} onChange={(e) => setLiveForm({ ...liveForm, scheduledAt: e.target.value })} required />
              <small style={{ color: 'var(--text-muted)' }}>Shown to students in their local timezone after save.</small>
            </div>
            <div className="form-group">
              <label>Meeting URL</label>
              <input className="form-control" value={liveForm.meetingUrl} onChange={(e) => setLiveForm({ ...liveForm, meetingUrl: e.target.value })} placeholder="https://meet.google.com/..." />
            </div>
            <div className="form-group">
              <label>Live Stream ID (external)</label>
              <input className="form-control" value={liveForm.liveStreamId} onChange={(e) => setLiveForm({ ...liveForm, liveStreamId: e.target.value })} placeholder="stream-abc123" />
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" checked={liveForm.isPremium} onChange={(e) => setLiveForm({ ...liveForm, isPremium: e.target.checked })} />
                {' '}Premium class (requires subscription)
              </label>
            </div>
            <button type="submit" className="btn btn-primary">Schedule Class</button>
          </form>
        </div>
      )}

      {endForm.id && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>End Live Class</h3>
          <form onSubmit={handleEndClass}>
            <div className="form-group">
              <label>Recording URL (optional)</label>
              <input
                className="form-control"
                value={endForm.recordingUrl}
                onChange={(e) => setEndForm({ ...endForm, recordingUrl: e.target.value })}
                placeholder="https://recordings.example.com/class.mp4"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-danger">End Class</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEndForm({ id: null, recordingUrl: '' })}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalCourses}</div>
          <div className="stat-label">My Courses</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.upcomingLiveClasses}</div>
          <div className="stat-label">Upcoming Live Classes</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Live Classes</h2>
        {liveClasses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No live classes scheduled yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.map((lc) => (
                <tr key={lc.id}>
                  <td>
                    {lc.title}
                    {lc.isPremium && <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Premium</span>}
                  </td>
                  <td>{lc.course?.title}</td>
                  <td>{formatAppDateTime(lc.scheduledAt)}</td>
                  <td>
                    <span className={`badge ${lc.status === 'LIVE' ? 'badge-danger' : lc.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                      {lc.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {lc.status === 'SCHEDULED' && (
                      <button onClick={() => handleStartClass(lc.id)} className="btn btn-sm btn-primary">Start</button>
                    )}
                    {lc.status === 'LIVE' && (
                      <button onClick={() => setEndForm({ id: lc.id, recordingUrl: '' })} className="btn btn-sm btn-danger">End</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>My Courses</h2>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No courses yet. Create your first course!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Chapters</th>
                <th>Students</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{formatPrice(c.price)}</td>
                  <td>{c._count?.chapters || 0}</td>
                  <td>{c._count?.enrollments || 0}</td>
                  <td>{c.isPublished ? <span className="badge badge-success">Yes</span> : <span className="badge badge-warning">Draft</span>}</td>
                  <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/courses/${c.id}`} className="btn btn-sm btn-secondary">View</Link>
                    <button type="button" onClick={() => openEditCourse(c)} className="btn btn-sm btn-primary" disabled={!canTeach}>Edit</button>
                    <button type="button" onClick={() => handleDeleteCourse(c)} className="btn btn-sm btn-danger" disabled={!canTeach}>Delete</button>
                    <button type="button" onClick={() => handleCurriculumCourseChange(c.id)} className="btn btn-sm btn-secondary">Videos</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Recorded video lessons</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Add chapters and upload MP4/WEBM recordings for students to watch in the course player.
        </p>
        <div className="form-group">
          <label>Course</label>
          <select
            className="form-control"
            value={curriculumCourseId}
            onChange={(e) => handleCurriculumCourseChange(e.target.value)}
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {curriculum && (
          <>
            <form onSubmit={handleAddChapter} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input
                className="form-control"
                placeholder="New chapter title"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                style={{ flex: '1 1 200px' }}
                disabled={!canTeach}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!canTeach || curriculumSaving}>
                Add chapter
              </button>
            </form>

            {curriculum.chapters?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.25rem' }}>
                {curriculum.chapters.map((ch) => (
                  <li key={ch.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)' }}>
                    <strong>{ch.title}</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                      {(ch.lessons || []).map((lesson) => (
                        <li key={lesson.id}>
                          {lesson.title}
                          {lesson.hasVideo && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Video</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No chapters yet. Add a chapter first.</p>
            )}

            <form onSubmit={handleAddRecordedLesson}>
              <div className="form-group">
                <label>Chapter</label>
                <select
                  className="form-control"
                  value={lessonForm.chapterId}
                  onChange={(e) => setLessonForm({ ...lessonForm, chapterId: e.target.value })}
                  required
                  disabled={!canTeach}
                >
                  <option value="">Select chapter</option>
                  {(curriculum.chapters || []).map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lesson title</label>
                <input
                  className="form-control"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                  disabled={!canTeach}
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  disabled={!canTeach}
                />
              </div>
              <div className="form-group">
                <label>Recorded video file</label>
                <input
                  type="file"
                  className="form-control"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
                  onChange={(e) => setLessonVideoFile(e.target.files?.[0] || null)}
                  disabled={!canTeach}
                />
                <small style={{ color: 'var(--text-muted)' }}>Max 500MB — MP4 recommended</small>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={lessonForm.isPremium}
                    onChange={(e) => setLessonForm({ ...lessonForm, isPremium: e.target.checked })}
                    disabled={!canTeach}
                  />
                  {' '}Premium lesson (subscription required)
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!canTeach || curriculumSaving}>
                {curriculumSaving ? 'Uploading…' : 'Upload & add lesson'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

