import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';

export default function StartSessionModal({ onClose }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createSession } = useSocket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      // totalRounds kept at 8 internally — hidden from teacher UI
      const result = await createSession({ topic: topic.trim(), totalRounds: 8 });
      if (result?.code) {
        navigate(`/lobby/${result.code}?sessionId=${result.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{
        width: '100%', maxWidth: '480px',
        borderRadius: '32px', padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined filled" style={{ color: 'var(--primary)', fontSize: '22px' }}>videocam</span>
          </div>
          <div>
            <h2 className="font-headline" style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>Start Live Class</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>Your video goes live instantly</p>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        <form onSubmit={handleSubmit}>
          {/* Topic */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--on-surface-variant)', fontWeight: 700,
            }}>
              Topic / Subject *
            </label>
            <input
              type="text"
              placeholder="e.g., Recursion in Python, Photosynthesis, World War II..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%', padding: '14px 16px',
                backgroundColor: 'rgba(11, 15, 20, 0.6)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '14px', color: 'var(--on-surface)',
                fontSize: '14px', outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
            />
          </div>

          {/* Info badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[
              { icon: 'qr_code_2', label: 'QR code generated' },
              { icon: 'notifications', label: 'Students notified' },
              { icon: 'psychology', label: 'AI insights active' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>{icon}</span>
                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '14px',
              backgroundColor: 'rgba(70, 69, 84, 0.2)', color: 'var(--on-surface)',
              borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'background 0.2s',
            }}>Cancel</button>
            <button type="submit" disabled={loading || !topic.trim()} style={{
              flex: 2, padding: '14px',
              background: loading ? 'rgba(99, 102, 241, 0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '14px',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              opacity: (!topic.trim() && !loading) ? 0.6 : 1,
            }}>
              {loading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  Creating Room...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>videocam</span>
                  Go Live
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
