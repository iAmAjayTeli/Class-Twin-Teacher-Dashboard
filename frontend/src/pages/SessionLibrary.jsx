import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StartSessionModal from '../components/StartSessionModal';
import { useSocket } from '../hooks/useSocket';

export default function SessionLibrary() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const { createSession } = useSocket();

  useEffect(() => {
    fetch('http://localhost:3001/api/sessions')
      .then(r => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  const handleCreate = async (data) => {
    const session = await createSession(data);
    setShowModal(false);
    if (session) {
      navigate(`/lobby/${session.code}`);
    }
  };

  const statusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="badge badge-success">● Live</span>;
      case 'waiting': return <span className="badge badge-info">◆ Waiting</span>;
      case 'ended': return <span className="badge" style={{ background: 'rgba(144,143,160,0.12)', color: 'var(--outline)' }}>○ Ended</span>;
      default: return null;
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Sessions</h1>
          <p className="subtitle">Create and manage your classroom sessions</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
          ✨ New Session
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Now</div>
          <div className="stat-value text-secondary">{sessions.filter(s => s.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value text-primary">{sessions.reduce((acc, s) => acc + s.studentCount, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Health</div>
          <div className="stat-value text-tertiary">—</div>
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="card-glass text-center" style={{ padding: 64, maxWidth: 500, margin: '40px auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
          <h3 className="headline-md" style={{ marginBottom: 8 }}>No Sessions Yet</h3>
          <p className="body-md text-muted" style={{ marginBottom: 24 }}>
            Create your first session to start twinning your classroom.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create First Session →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px' }}
              onClick={() => {
                if (session.status === 'waiting') navigate(`/lobby/${session.code}`);
                else if (session.status === 'active') navigate(`/dashboard?code=${session.code}`);
                else navigate('/analytics');
              }}
            >
              <div style={{ width: 48, height: 48, background: 'rgba(128,131,255,0.1)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                📖
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-sm">
                  <span className="title-md">{session.topic}</span>
                  {statusBadge(session.status)}
                </div>
                <div className="body-md text-muted" style={{ marginTop: 2 }}>
                  Code: {session.code} • {session.studentCount} students • Round {session.currentRound}/{session.totalRounds}
                </div>
              </div>
              <div style={{ color: 'var(--on-surface-variant)', fontSize: '1.2rem' }}>→</div>
            </div>
          ))}
        </div>
      )}

      <StartSessionModal isOpen={showModal} onClose={() => setShowModal(false)} onCreate={handleCreate} />
    </>
  );
}
