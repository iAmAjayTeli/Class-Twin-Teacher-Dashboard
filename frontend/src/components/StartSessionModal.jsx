import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';

const SUBJECTS = [
  { value: 'Mathematics',  icon: 'calculate',         color: '#3B82F6' },
  { value: 'Physics',      icon: 'bolt',              color: '#8B5CF6' },
  { value: 'Chemistry',    icon: 'science',           color: '#EC4899' },
  { value: 'Biology',      icon: 'biotech',           color: '#10B981' },
  { value: 'Computer Science', icon: 'code',          color: '#F59E0B' },
  { value: 'Python',       icon: 'terminal',          color: '#06B6D4' },
  { value: 'Java',         icon: 'coffee',            color: '#EF4444' },
  { value: 'JavaScript',   icon: 'javascript',        color: '#F59E0B' },
  { value: 'English',      icon: 'menu_book',         color: '#6366F1' },
  { value: 'History',      icon: 'history_edu',       color: '#D97706' },
  { value: 'Geography',    icon: 'public',            color: '#1A5C3B' },
  { value: 'Economics',    icon: 'trending_up',       color: '#0EA5E9' },
  { value: 'Data Science', icon: 'analytics',         color: '#7C3AED' },
  { value: 'AI / ML',      icon: 'psychology',        color: '#DB2777' },
  { value: 'Other',        icon: 'school',            color: '#6B7280' },
];

export default function StartSessionModal({ onClose }) {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createSession } = useSocket();
  const dropdownRef = useRef(null);

  const selectedSubject = SUBJECTS.find(s => s.value === subject);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !subject) return;
    setLoading(true);
    try {
      const result = await createSession({
        topic: topic.trim(),
        subject,
        totalRounds: 8,
      });
      if (result?.code) navigate(`/lobby/${result.code}?sessionId=${result.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = topic.trim() && subject && !loading;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(17, 24, 39, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '520px',
        background: '#FFFFFF',
        borderRadius: '24px', padding: '32px',
        border: '1px solid #EAECF0',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.14)',
        position: 'relative', overflow: 'visible',
      }}>
        {/* Corner glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(26, 92, 59, 0.06)', pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: selectedSubject ? `${selectedSubject.color}18` : '#E8F5EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.3s',
          }}>
            <span className="material-symbols-outlined filled" style={{
              color: selectedSubject?.color || '#1A5C3B', fontSize: '22px',
              transition: 'color 0.3s',
            }}>
              {selectedSubject?.icon || 'videocam'}
            </span>
          </div>
          <div>
            <h2 className="font-headline" style={{ fontSize: '20px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
              Start Live Class
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>Your video goes live instantly</p>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', width: '32px', height: '32px', borderRadius: '50%',
            background: '#F9FAFB', border: '1px solid #EAECF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>close</span>
          </button>
        </div>

        <div style={{ height: '1px', background: '#F3F4F6', margin: '20px 0' }} />

        <form onSubmit={handleSubmit}>

          {/* Subject dropdown */}
          <div style={{ marginBottom: '16px' }} ref={dropdownRef}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              Subject *
            </label>
            <button
              type="button"
              onClick={() => setDropdownOpen(p => !p)}
              style={{
                width: '100%', padding: '11px 14px',
                background: '#F9FAFB', border: `1.5px solid ${dropdownOpen ? '#1A5C3B' : '#EAECF0'}`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: dropdownOpen ? '0 0 0 3px rgba(26,92,59,0.08)' : 'none',
                textAlign: 'left',
              }}
            >
              {selectedSubject ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: selectedSubject.color }}>{selectedSubject.icon}</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: 600, flex: 1 }}>{selectedSubject.value}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9CA3AF' }}>school</span>
                  <span style={{ fontSize: '14px', color: '#9CA3AF', flex: 1 }}>Select a subject...</span>
                </>
              )}
              <span className="material-symbols-outlined" style={{
                fontSize: '18px', color: '#9CA3AF',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>expand_more</span>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute', left: '32px', right: '32px', zIndex: 200,
                background: '#FFFFFF', borderRadius: '14px', marginTop: '6px',
                border: '1px solid #EAECF0',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                maxHeight: '260px', overflowY: 'auto',
                padding: '6px',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
                }}>
                  {SUBJECTS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setSubject(s.value); setDropdownOpen(false); }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: subject === s.value ? `${s.color}15` : 'transparent',
                        outline: subject === s.value ? `1.5px solid ${s.color}40` : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => { if (subject !== s.value) e.currentTarget.style.background = '#F9FAFB'; }}
                      onMouseOut={e => { if (subject !== s.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: s.color }}>{s.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: subject === s.value ? s.color : '#374151', textAlign: 'center', lineHeight: 1.2 }}>{s.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topic */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              Today's Topic *
            </label>
            <input
              type="text"
              placeholder={subject ? `e.g., ${subject === 'Python' ? 'Functions & Recursion' : subject === 'Mathematics' ? 'Integration by Parts' : subject === 'Biology' ? 'Cell Division & Mitosis' : 'Enter your lecture topic...'}` : 'Select a subject first...'}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%', padding: '12px 14px',
                background: '#F9FAFB',
                border: '1px solid #EAECF0',
                borderRadius: '12px', color: '#111827',
                fontSize: '14px', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
              }}
              onFocus={e => { e.target.style.borderColor = '#1A5C3B'; e.target.style.boxShadow = '0 0 0 3px rgba(26,92,59,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#EAECF0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Info badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { icon: 'qr_code_2', label: 'QR code generated' },
              { icon: 'notifications', label: 'Students notified' },
              { icon: 'psychology', label: 'AI insights active' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '8px',
                background: '#E8F5EE', border: '1px solid rgba(26, 92, 59, 0.12)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#1A5C3B' }}>{icon}</span>
                <span style={{ fontSize: '11px', color: '#1A5C3B', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="ct-btn-outline" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px', padding: '12px' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ct-btn-primary"
              style={{
                flex: 2, justifyContent: 'center', borderRadius: '12px', padding: '12px',
                opacity: !canSubmit ? 0.5 : 1,
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                background: loading ? '#9CA3AF' : undefined,
                boxShadow: loading ? 'none' : undefined,
              }}
            >
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
