import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/admin'),
      api.get('/dashboard/admin/users'),
    ])
      .then(([statsRes, usersRes]) => {
        setData(statsRes.data.data);
        setUsers(usersRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/dashboard/admin/users/${userId}/role`, { role });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="loading container">Loading dashboard...</div>;

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
