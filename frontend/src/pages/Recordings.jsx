import { useState, useEffect } from 'react';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';

export default function Recordings() {
  const [recordings, setRecordings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-classes/recordings')
      .then((res) => setRecordings(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading container">Loading...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Recorded Classes</h1>
        <p>Watch recordings of previous live sessions</p>
      </div>

      {selected && (
        <div style={{ marginBottom: '2rem' }}>
          <VideoPlayer src={selected.videoUrl} />
          <h2 style={{ marginTop: '1rem' }}>{selected.title}</h2>
          <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
            Close Player
          </button>
        </div>
      )}

      {recordings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No recordings available yet.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {recordings.map((rec) => (
            <div key={rec.id} className="card">
              <h3>{rec.title}</h3>
              {rec.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.5rem 0' }}>{rec.description}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
                {rec.isPremium && <span className="badge badge-warning">Premium</span>}
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {new Date(rec.recordedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelected(rec)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                disabled={rec.locked}
              >
                {rec.locked ? '🔒 Premium Required' : 'Watch Recording'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
