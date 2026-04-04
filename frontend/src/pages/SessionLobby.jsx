import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

export default function SessionLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { connected, students, startSession } = useSocket();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      fetch(`http://localhost:3001/api/sessions/${code}`)
        .then(r => r.json())
        .then(data => {
          setSession(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [code]);

  const handleStart = async () => {
    if (!code) return;
    await startSession(code);
    navigate(`/dashboard?code=${code}`);
  };

  if (loading) {
    return (
      <div className="lobby-page">
        <div className="pulse" style={{ fontSize: '2rem' }}>⏳</div>
        <p className="body-lg text-muted mt-md">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="lobby-page">
        <p className="headline-md">Session not found</p>
        <button className="btn btn-primary mt-lg" onClick={() => navigate('/sessions')}>← Back to Sessions</button>
      </div>
    );
  }

  return (
    <div className="lobby-page">
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, textAlign: 'center' }}>
        {/* Header */}
        <div className="flex items-center justify-center gap-sm" style={{ marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, var(--primary-container), var(--inverse-primary))', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🧠</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>ClassTwin</span>
        </div>

        <div className="flex items-center justify-center gap-md mb-lg">
          <span className="badge badge-info">📖 {session.topic}</span>
          <span className="flex items-center gap-sm" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
            <span className="pulse-dot" />
            Waiting for students...
          </span>
        </div>

        {/* QR Code */}
        <div className="qr-container" style={{ margin: '0 auto', maxWidth: 420 }}>
          <div className="label-md text-muted">Scan to Join</div>
          {session.qrCode && (
            <img src={session.qrCode} alt="QR Code" style={{ width: 280, height: 280, borderRadius: 'var(--radius-lg)' }} />
          )}
          <div>
            <div className="label-md text-muted" style={{ marginBottom: 8 }}>Or enter this code manually</div>
            <div className="session-code">{session.code}</div>
          </div>
        </div>

        {/* Student Counter */}
        <div style={{ marginTop: 40 }}>
          <div className="flex items-center justify-center gap-sm mb-md">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--secondary)' }}>
              {students.length || Object.keys(session.students || {}).length}
            </div>
            <span className="body-lg">Students Joined</span>
          </div>

          {/* Student Chips */}
          <div className="lobby-students">
            {(students.length > 0 ? students : Object.values(session.students || {})).map((s, i) => (
              <div key={s.id || i} className="lobby-student-chip" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="student-avatar" style={{ width: 24, height: 24, fontSize: '0.5rem', background: `hsl(${(i * 47) % 360}, 50%, 45%)` }}>
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          style={{ marginTop: 48, padding: '18px 60px', fontSize: '1.1rem' }}
          disabled={students.length === 0 && Object.keys(session.students || {}).length === 0}
        >
          🚀 Start Session →
        </button>

        <p className="body-md text-muted" style={{ marginTop: 16 }}>
          {connected ? '🟢 Server connected' : '🔴 Connecting to server...'}
        </p>
      </div>
    </div>
  );
}
