import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = () => {
    setLoadError('');
    setLoading(true);
    Promise.all([
      api.get('/dashboard/admin'),
      api.get('/dashboard/admin/users'),
      api.get('/dashboard/admin/courses'),
    ])
      .then(([statsRes, usersRes, coursesRes]) => {
        const payload = statsRes.data?.data;
        if (!payload?.stats) {
          throw new Error('Invalid admin dashboard response');
        }
        setData(payload);
        setUsers(usersRes.data?.data || []);
        setCourses(coursesRes.data?.data || []);
      })
      .catch((err) => {
        setData(null);
        setLoadError(err.response?.data?.message || 'Could not load admin dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/dashboard/admin/users/${userId}/role`, { role });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? All chapters and lessons will be removed.`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      setCourses(courses.filter((c) => c.id !== course.id));
      alert('Course deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  if (loading) return <div className="loading container">Loading dashboard...</div>;

  if (!data?.stats) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-error">{loadError || 'Could not load admin dashboard.'}</div>
        <button type="button" className="btn btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and user management</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalCourses}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalEnrollments}</div>
          <div className="stat-label">Enrollments</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.activeSubscriptions}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">₹{stats.totalRevenue?.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>All Courses</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Remove demo courses (e.g. Python bootcamp) or any course on the platform.
        </p>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No courses.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Teacher</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.teacher?.name || c.teacher?.email}</td>
                  <td>{c.isPublished ? <span className="badge badge-success">Yes</span> : <span className="badge badge-warning">Draft</span>}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteCourse(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>User Management</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge badge-${u.role === 'ADMIN' ? 'danger' : u.role === 'TEACHER' ? 'warning' : 'primary'}`}>{u.role}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="form-control"
                    style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
