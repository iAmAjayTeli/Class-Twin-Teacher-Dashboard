import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useLiveKit from '../hooks/useLiveKit';
import LiveVideoRoom from '../components/LiveVideoRoom';
import Sidebar from '../components/Sidebar';

const mockStudents = [
  { id: 1, name: 'Alex Chen', status: 'understood', label: 'Student 01' },
  { id: 2, name: 'Mia Wong', status: 'confused', label: 'Student 02' },
  { id: 3, name: 'Jordan S.', status: 'partial', label: 'Student 03' },
  { id: 4, name: 'Elena R.', status: 'neutral', label: 'Student 04' },
  { id: 5, name: 'Sam Taylor', status: 'understood', label: 'Student 05' },
  { id: 6, name: 'Liam N.', status: 'understood', label: 'Student 06' },
  { id: 7, name: 'Zoe Bell', status: 'confused', label: 'Student 07' },
  { id: 8, name: 'Chris P.', status: 'understood', label: 'Student 08' },
  { id: 9, name: 'Noah J.', status: 'partial', label: 'Student 09' },
  { id: 10, name: 'Ava Liu', status: 'understood', label: 'Student 10' },
  { id: 11, name: 'Leo G.', status: 'understood', label: 'Student 11' },
  { id: 12, name: 'Ruby K.', status: 'neutral', label: 'Student 12' },
];

const statusColors = {
  understood: { dot: 'var(--secondary)', shadow: '0 0 10px #4ae176', border: 'rgba(74, 225, 118, 0.3)', hoverShadow: '0 0 20px rgba(74, 225, 118, 0.2)' },
  confused: { dot: 'var(--error)', shadow: '0 0 10px #ffb4ab', border: 'rgba(255, 180, 171, 0.3)', hoverShadow: '0 0 20px rgba(255, 180, 171, 0.2)' },
  partial: { dot: 'var(--tertiary)', shadow: '0 0 10px #ffb95f', border: 'rgba(255, 185, 95, 0.3)', hoverShadow: '0 0 20px rgba(255, 185, 95, 0.2)' },
  neutral: { dot: 'var(--surface-container-highest)', shadow: 'none', border: 'rgba(70, 69, 84, 0.3)', hoverShadow: 'none' },
};

export default function LiveDashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionCode = params.get('code') || 'ABC123';
  const sessionId   = params.get('sessionId') || null;
  const { students: liveStudents, aiInsight, classHealth } = useSocket(sessionCode);
  const { token, livekitUrl, stopStream } = useLiveKit();
  const [elapsed, setElapsed] = useState(0);
  const [pipCollapsed, setPipCollapsed] = useState(false);

  const students = liveStudents?.length > 0 ? liveStudents : mockStudents;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: '#0b0f14', backgroundImage: 'radial-gradient(at 0% 0%, rgba(128, 131, 255, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(74, 225, 118, 0.05) 0px, transparent 50%)', position: 'relative' }}>
      {/* Top NavBar */}
      <nav style={{
        position: 'sticky', top: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'rgba(24, 28, 33, 0.6)',
        backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span className="font-headline" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: '#e0e2ea' }}>ClassTwin</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="font-headline" style={{ color: '#a5b4fc', fontWeight: 600, letterSpacing: '-0.01em' }}>Question 2 of 5</span>
            <div style={{ height: '4px', width: '96px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '40%', backgroundColor: 'var(--primary-container)' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', borderRadius: '999px',
            backgroundColor: 'var(--surface-container-low)', border: '1px solid rgba(70, 69, 84, 0.2)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)' }}>Live Responses: {students.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>timer</span>
            <span className="font-headline" style={{ fontWeight: 500 }}>{formatTime(elapsed)}</span>
          </div>
          <span className="material-symbols-outlined" style={{ color: 'rgba(224, 226, 234, 0.6)' }}>sensors</span>
          <button onClick={async () => { if (sessionId) await stopStream(sessionId); navigate('/analytics'); }} style={{
            padding: '8px 20px', borderRadius: '999px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#ef4444', fontSize: '14px', fontWeight: 600,
            background: 'rgba(220,38,38,0.08)', cursor: 'pointer',
            transition: 'all 0.3s',
          }}>End Session</button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '24px 32px 128px', display: 'flex', gap: '32px' }}>
        {/* Left: Heatmap Grid */}
        <section style={{ flexGrow: 1 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px',
            height: '100%', alignContent: 'start', overflowY: 'auto', paddingRight: '8px',
          }}>
            {students.map((student) => {
              const sc = statusColors[student.status] || statusColors.neutral;
              return (
                <div key={student.id} className="prism-glass" style={{
                  padding: '16px', borderRadius: '16px', aspectRatio: '1',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.3s', cursor: 'default',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = sc.hoverShadow; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden',
                      border: `1px solid ${sc.border}`,
                      backgroundColor: 'var(--surface-container-high)',
                    }} />
                    <span style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      backgroundColor: sc.dot, boxShadow: sc.shadow,
                    }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(224, 226, 234, 0.6)' }}>{student.label || `Student ${String(student.id).padStart(2, '0')}`}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{student.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: AI Insight Panel */}
        <aside style={{ width: '420px', minWidth: '420px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
          {/* Class Comprehension Ring */}
          <div className="prism-glass" style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '128px', height: '128px', background: 'rgba(192, 193, 255, 0.1)', filter: 'blur(60px)', borderRadius: '50%' }} />
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 226, 234, 0.6)', marginBottom: '24px' }}>Class Comprehension</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '16px 0' }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="var(--surface-container-highest)" strokeWidth="8" />
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="url(#compGradient)" strokeWidth="12" strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" />
                <defs>
                  <linearGradient id="compGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c0c1ff" />
                    <stop offset="100%" stopColor="#4ae176" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-headline" style={{ fontSize: '36px', fontWeight: 800 }}>{classHealth || 75}%</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--secondary)' }}>Strong Pulse</span>
              </div>
            </div>
          </div>

          {/* AI Action Card */}
          <div className="prism-glass refraction-edge" style={{ padding: '24px', borderRadius: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(192, 193, 255, 0.1)' }}>
                <span className="material-symbols-outlined filled" style={{ color: 'var(--primary)' }}>psychology</span>
              </div>
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '8px' }}>AI Action</h4>
                <p className="font-headline" style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.3, marginBottom: '16px' }}>
                  {aiInsight || 'Revisit recursion base case — multiple students are struggling'}
                </p>
                <button style={{
                  width: '100%', padding: '12px', borderRadius: '16px',
                  backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)',
                  fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'filter 0.2s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  Mark as Done
                </button>
              </div>
            </div>
          </div>

          {/* Confusion Hotspot */}
          <div className="prism-glass" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid var(--tertiary)' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tertiary)', marginBottom: '16px' }}>Confusion Hotspot</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                padding: '12px', borderRadius: '16px', borderTopLeftRadius: '0',
                backgroundColor: 'rgba(38, 42, 48, 0.6)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(70, 69, 84, 0.1)', fontSize: '14px', fontStyle: 'italic',
              }}>
                "I don't get why the function calls itself..."
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255, 180, 171, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
                </div>
                <span style={{ fontSize: '10px', color: 'rgba(224, 226, 234, 0.4)' }}>3 similar queries flagged</span>
              </div>
            </div>
          </div>

          {/* Next Question */}
          <div className="prism-glass" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(38, 42, 48, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="font-headline" style={{ fontWeight: 700, fontSize: '14px' }}>Up Next: Recursive Steps</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(192, 193, 255, 0.2)', color: 'var(--primary)' }}>ADVANCED</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                backgroundColor: 'var(--surface-bright)', color: 'var(--on-surface)',
                fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
              }}>Modify Quest</button>
              <button style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                background: 'linear-gradient(to right, var(--primary), var(--inverse-primary))',
                color: 'var(--on-primary)', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(192, 193, 255, 0.3)',
              }}>Release Now</button>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Stats Bar */}
      <div style={{
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px',
        backgroundColor: 'rgba(28, 32, 37, 0.4)',
        backdropFilter: 'blur(40px)',
        borderRadius: '999px',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)',
      }}>
        {[
          { icon: 'group', label: 'Students', value: `${students.length}/34` },
          null,
          { icon: 'psychology', label: 'Comprehension', active: true },
          null,
          { icon: 'schedule', label: 'Duration', value: `00:${formatTime(elapsed)}` },
          null,
          { icon: 'speed', label: 'Speed', value: '1.4s Avg' },
        ].map((item, i) => {
          if (!item) return <div key={i} style={{ height: '24px', width: '1px', backgroundColor: 'rgba(70, 69, 84, 0.2)' }} />;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px',
              ...(item.active ? { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '999px', flexDirection: 'column', color: '#a5b4fc' } : {}),
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#818cf8' }}>{item.icon}</span>
              {item.active ? (
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprehension</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 226, 234, 0.4)' }}>{item.label}</span>
                  <span className="font-headline" style={{ fontSize: '12px', fontWeight: 700 }}>{item.value}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating PiP Video Panel */}
      {token && livekitUrl && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '32px',
          zIndex: 60,
          width: pipCollapsed ? '56px' : '300px',
          backgroundColor: 'rgba(11, 15, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
          overflow: 'hidden',
          transition: 'width 0.3s ease',
        }}>
          {/* PiP header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: pipCollapsed ? '12px' : '10px 14px',
            borderBottom: pipCollapsed ? 'none' : '1px solid rgba(99,102,241,0.15)',
          }}>
            {!pipCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em' }}>LIVE STREAM</span>
              </div>
            )}
            <button
              onClick={() => setPipCollapsed(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', marginLeft: pipCollapsed ? 0 : 'auto' }}
              title={pipCollapsed ? 'Expand' : 'Collapse'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {pipCollapsed ? 'videocam' : 'picture_in_picture'}
              </span>
            </button>
          </div>

          {/* PiP video body */}
          {!pipCollapsed && (
            <div style={{ padding: '12px', height: '220px' }}>
              <LiveVideoRoom
                token={token}
                serverUrl={livekitUrl}
                onDisconnect={async () => {
                  if (sessionId) await stopStream(sessionId);
                  navigate('/analytics');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Decorative Atmosphere */}
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '30vw', height: '30vw', background: 'rgba(49, 46, 129, 0.1)', filter: 'blur(150px)', zIndex: -10, borderRadius: '50%' }} />
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '40vw', height: '40vw', background: 'rgba(6, 78, 59, 0.05)', filter: 'blur(150px)', zIndex: -10, borderRadius: '50%' }} />
      </div>
    </div>
  );
}
