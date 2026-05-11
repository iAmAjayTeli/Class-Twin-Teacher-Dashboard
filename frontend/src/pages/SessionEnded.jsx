import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

export default function SessionEnded() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Pull session info from query params (passed by LiveDashboard)
  const sessionCode = params.get('code') || '—';
  const duration = parseInt(params.get('duration') || '0', 10);
  const studentCount = parseInt(params.get('students') || '0', 10);
  const comprehension = parseInt(params.get('comprehension') || '0', 10);
  const understood = parseInt(params.get('understood') || '0', 10);
  const confused = parseInt(params.get('confused') || '0', 10);
  const partial = parseInt(params.get('partial') || '0', 10);
  const topic = params.get('topic') || '';

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getComprehensionLabel = (val) => {
    if (val >= 80) return { text: 'Excellent', color: '#059669', bg: '#D1FAE5' };
    if (val >= 60) return { text: 'Good', color: '#1A5C3B', bg: '#E8F5EE' };
    if (val >= 40) return { text: 'Moderate', color: '#D97706', bg: '#FEF3C7' };
    return { text: 'Needs Attention', color: '#DC2626', bg: '#FEE2E2' };
  };

  const compLabel = getComprehensionLabel(comprehension);

  const stats = [
    { icon: 'group', label: 'Students Attended', value: studentCount || '—', color: '#3B82F6', bg: '#EFF6FF' },
    { icon: 'timer', label: 'Session Duration', value: duration > 0 ? formatDuration(duration) : '—', color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: 'psychology', label: 'Avg. Comprehension', value: comprehension > 0 ? `${comprehension}%` : '—', color: compLabel.color, bg: compLabel.bg },
    { icon: 'tag', label: 'Session Code', value: sessionCode, color: '#6B7280', bg: '#F3F4F6' },
  ];

  const breakdownItems = [
    { label: 'Understood', value: understood, icon: 'check_circle', color: '#059669', bg: '#D1FAE5' },
    { label: 'Confused', value: confused, icon: 'error', color: '#DC2626', bg: '#FEE2E2' },
    { label: 'Partially', value: partial, icon: 'help', color: '#D97706', bg: '#FEF3C7' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        flex: 1, height: '100vh', overflowY: 'auto',
        backgroundColor: 'var(--background)', color: 'var(--on-surface)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}>

        {/* Confetti animation overlay */}
        {showConfetti && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none',
            overflow: 'hidden',
          }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: ['#1A5C3B', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 1.5}s`,
                opacity: 0.85,
              }} />
            ))}
          </div>
        )}

        <main style={{ maxWidth: '860px', margin: '0 auto', padding: '56px 32px 96px' }}>

          {/* Hero */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8F5EE, #D1FAE5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(26,92,59,0.15)',
            }}>
              <span className="material-symbols-outlined filled" style={{ fontSize: '40px', color: '#1A5C3B' }}>
                check_circle
              </span>
            </div>
            <h1 style={{
              fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--on-surface)', marginBottom: '10px',
            }}>
              Session Ended
            </h1>
            <p style={{
              fontSize: '16px', color: 'var(--on-surface-variant)',
              maxWidth: '480px', margin: '0 auto', lineHeight: 1.6,
            }}>
              {topic
                ? <>Your session on <strong style={{ color: 'var(--on-surface)' }}>{topic}</strong> has been completed successfully.</>
                : 'Your live session has been completed successfully.'
              }
            </p>
          </motion.div>

          {/* Comprehension Hero Card */}
          {comprehension > 0 && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                padding: '32px', borderRadius: '24px', marginBottom: '24px',
                background: 'linear-gradient(135deg, #1A5C3B 0%, #2D7A52 50%, #34D399 100%)',
                color: 'white', textAlign: 'center',
                boxShadow: '0 12px 40px rgba(26,92,59,0.25)',
              }}
            >
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8, fontWeight: 600, marginBottom: '12px' }}>
                Overall Class Comprehension
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#fff" strokeWidth="8"
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * comprehension / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1 }}>{comprehension}%</span>
                  <p style={{ fontSize: '14px', opacity: 0.85, fontWeight: 500, marginTop: '4px' }}>{compLabel.text}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px', marginBottom: '24px',
            }}
          >
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: '22px', borderRadius: '18px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--outline)',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: s.color }}>{s.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Breakdown */}
          {studentCount > 0 && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                padding: '24px', borderRadius: '20px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--outline)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '32px',
              }}
            >
              <h3 style={{
                fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '18px',
              }}>
                Student Comprehension Breakdown
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                {breakdownItems.map((item, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '18px', borderRadius: '14px',
                    backgroundColor: item.bg, border: `1px solid ${item.color}22`,
                    textAlign: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: item.color, marginBottom: '8px', display: 'block' }}>
                      {item.icon}
                    </span>
                    <p style={{ fontSize: '28px', fontWeight: 800, color: item.color, marginBottom: '4px' }}>{item.value}</p>
                    <p style={{ fontSize: '12px', color: item.color, fontWeight: 600, opacity: 0.8 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              {/* Bar visualization */}
              {studentCount > 0 && (
                <div style={{
                  marginTop: '16px', height: '8px', borderRadius: '999px',
                  backgroundColor: '#F3F4F6', overflow: 'hidden',
                  display: 'flex',
                }}>
                  <div style={{ width: `${(understood / studentCount) * 100}%`, backgroundColor: '#059669', transition: 'width 1s ease' }} />
                  <div style={{ width: `${(partial / studentCount) * 100}%`, backgroundColor: '#F59E0B', transition: 'width 1s ease' }} />
                  <div style={{ width: `${(confused / studentCount) * 100}%`, backgroundColor: '#EF4444', transition: 'width 1s ease' }} />
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              display: 'flex', gap: '14px', justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => navigate('/analytics')}
              style={{
                padding: '14px 28px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 16px rgba(26,92,59,0.25)',
                transition: 'all 0.25s',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,92,59,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,92,59,0.25)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
              View Full Analytics
            </button>

            <button
              onClick={() => navigate('/sessions')}
              style={{
                padding: '14px 28px', borderRadius: '14px',
                backgroundColor: 'var(--surface)', color: 'var(--on-surface)',
                border: '1px solid var(--outline)', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.25s',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
              Back to Sessions
            </button>

            <button
              onClick={() => navigate('/ai-tutor', {
                state: {
                  autoPrompt: `Generate a post-session review and improvement suggestions for my ${topic || 'latest'} class session. ${comprehension > 0 ? `The class comprehension was ${comprehension}%. ${confused > 0 ? `${confused} students were confused.` : ''}` : ''} Provide actionable next steps for improving student understanding.`,
                },
              })}
              style={{
                padding: '14px 28px', borderRadius: '14px',
                backgroundColor: '#F5F3FF', color: '#7C3AED',
                border: '1px solid #E9D5FF', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.25s',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_fix_high</span>
              AI Session Review
            </button>
          </motion.div>

        </main>
      </div>

      {/* Confetti keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
