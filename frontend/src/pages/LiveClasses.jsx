import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatAppDateTime } from '../utils/dateTime';

export default function LiveClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    api.get('/live-classes/upcoming')
      .then((res) => setClasses(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (cls) => {
    setJoining(cls.id);
    setJoinError(null);
    try {
      const res = await api.get(`/live-classes/${cls.id}/join`);
      const { meetingUrl, liveStreamId } = res.data.data;
      const url = meetingUrl || (liveStreamId ? `https://stream.example.com/${liveStreamId}` : null);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setJoinError('No meeting link available for this class.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to join this class';
      setJoinError(message);
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <div className="loading container">Loading...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Upcoming Live Classes</h1>
        <p>Join interactive live sessions with expert instructors</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          You must be logged in. Join opens Google Meet / Zoom in a new tab. The teacher must add a meeting link and click
          {' '}<strong>Start</strong> on the teacher dashboard. You can join from 15 minutes before the scheduled time, or while status is LIVE.
        </p>
      </div>

      {joinError && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {joinError}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No upcoming live classes scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {classes.map((cls) => (
            <div key={cls.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <h3>{cls.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {cls.isPremium && <span className="badge badge-warning">Premium</span>}
                  <span className={`badge ${cls.status === 'LIVE' ? 'badge-danger' : 'badge-primary'}`}>
                    {cls.status}
                  </span>
                </div>
              </div>
              {cls.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{cls.description}</p>}
              <p style={{ fontSize: '0.875rem' }}>
                📅 {formatAppDateTime(cls.scheduledAt)}
              </p>
              {cls.startedAt && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Started: {new Date(cls.startedAt).toLocaleString()}
                </p>
              )}
              {cls.course && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Course: {cls.course.title}
                </p>
              )}
              {(cls.status === 'LIVE' || cls.status === 'SCHEDULED') && (
                <button
                  onClick={() => handleJoin(cls)}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '1rem' }}
                  disabled={joining === cls.id}
                >
                  {joining === cls.id ? 'Checking access...' : cls.status === 'LIVE' ? 'Join Class' : 'Join When Ready'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

