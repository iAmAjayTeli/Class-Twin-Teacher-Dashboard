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

const statusConfig = {
  understood: { bg: '#E8F5EE', border: 'rgba(26,92,59,0.25)', dot: '#1A5C3B', label: 'Understood' },
  confused:   { bg: '#FEE2E2', border: 'rgba(239,68,68,0.25)',  dot: '#EF4444', label: 'Confused' },
  partial:    { bg: '#FEF3C7', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B', label: 'Partial' },
  neutral:    { bg: '#F9FAFB', border: '#E5E7EB',                dot: '#9CA3AF', label: 'Neutral' },
};

export default function LiveDashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionCode = params.get('code') || 'ABC123';
  const sessionId   = params.get('sessionId') || null;
  const { students: liveStudents, aiInsight, classHealth, leaderboard } = useSocket(sessionCode);
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

  const understood = students.filter(s => s.status === 'understood').length;
  const confused   = students.filter(s => s.status === 'confused').length;
  const partial    = students.filter(s => s.status === 'partial').length;
  const comprehension = students.length > 0 ? Math.round((understood / students.length) * 100) : classHealth || 75;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: 'var(--background)', color: 'var(--on-surface)' }}>

        {/* Top NavBar */}
        <nav style={{
          position: 'sticky', top: 0, width: '100%', zIndex: 50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 28px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--outline)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ClassTwin</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>Live Session</span>
              <div style={{ height: '4px', width: '80px', backgroundColor: 'var(--outline)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '40%', backgroundColor: 'var(--primary)' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* LIVE badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse-glow 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DC2626', fontWeight: 700 }}>Live · {students.length} students</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>timer</span>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{formatTime(elapsed)}</span>
            </div>
            <button onClick={() => navigate(`/lobby/${sessionCode}?sessionId=${sessionId || ''}`)} style={{
              padding: '7px 18px', borderRadius: '999px',
              border: '1px solid rgba(26,92,59,0.25)', color: '#1A5C3B', fontSize: '13px', fontWeight: 600,
              background: '#E8F5EE', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Back to Lobby
            </button>
            <button onClick={async () => { if (sessionId) await stopStream(sessionId); navigate('/analytics'); }} style={{
              padding: '7px 18px', borderRadius: '999px',
              border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: 600,
              background: '#FEE2E2', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call_end</span>
              End Session
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ padding: '24px 28px 100px', display: 'flex', gap: '24px' }}>

          {/* Left: Student Heatmap Grid */}
          <section style={{ flexGrow: 1 }}>
            {/* Summary row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: students.length, color: 'var(--primary)', bg: 'var(--primary-light)' },
                { label: 'Understood', value: understood, color: '#1A5C3B', bg: '#E8F5EE' },
                { label: 'Confused', value: confused, color: '#DC2626', bg: '#FEE2E2' },
                { label: 'Partial', value: partial, color: '#D97706', bg: '#FEF3C7' },
              ].map(item => (
                <div key={item.label} style={{ padding: '10px 16px', borderRadius: '12px', backgroundColor: item.bg, border: `1px solid ${item.color}22`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: item.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</span>
                  <span style={{ fontSize: '11px', color: item.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', alignContent: 'start' }}>
              {students.map((student) => {
                const sc = statusConfig[student.status] || statusConfig.neutral;
                return (
                  <div key={student.id} style={{
                    padding: '14px', borderRadius: '14px', aspectRatio: '1',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    transition: 'all 0.25s', cursor: 'default',
                    backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'white', border: `1.5px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: sc.dot }}>
                        {student.name.charAt(0)}
                      </div>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sc.dot }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: sc.dot, fontWeight: 600, marginBottom: '2px', opacity: 0.8 }}>{sc.label}</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{student.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: AI Panel */}
          <aside style={{ width: '360px', minWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

            {/* Comprehension Ring */}
            <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', marginBottom: '20px', fontWeight: 700 }}>Class Comprehension</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '8px 0' }}>
                <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r="58" fill="transparent" stroke="var(--outline)" strokeWidth="8" />
                  <circle cx="70" cy="70" r="58" fill="transparent" stroke="var(--primary)" strokeWidth="10"
                    strokeDasharray="364"
                    strokeDashoffset={364 - (364 * comprehension / 100)}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{comprehension}%</span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: comprehension >= 70 ? 'var(--primary)' : comprehension >= 40 ? '#D97706' : '#DC2626', fontWeight: 600 }}>
                    {comprehension >= 70 ? 'Strong' : comprehension >= 40 ? 'Moderate' : 'Struggling'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Action Card */}
            <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '14px', backgroundColor: 'var(--primary-light)', flexShrink: 0 }}>
                  <span className="material-symbols-outlined filled" style={{ color: 'var(--primary)', fontSize: '20px' }}>psychology</span>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '8px', fontWeight: 700 }}>AI Action</h4>
                  <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4, marginBottom: '14px', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {aiInsight || 'Revisit recursion base case — multiple students are struggling'}
                  </p>
                  <button className="ct-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    Mark as Done
                  </button>
                </div>
              </div>
            </div>

            {/* Confusion Hotspot */}
            {confused > 0 && (
              <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', boxShadow: 'var(--shadow-xs)' }}>
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#92400E', marginBottom: '12px', fontWeight: 700 }}>⚠ Confusion Hotspot</h4>
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'white', border: '1px solid #FDE68A', fontSize: '13px', fontStyle: 'italic', color: '#78350F', lineHeight: 1.5 }}>
                  "{confused} student{confused !== 1 ? 's' : ''} flagged as confused — consider pausing and recapping."
                </div>
              </div>
            )}

            {/* Live Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
              <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span className="material-symbols-outlined filled" style={{ color: '#F59E0B', fontSize: '20px' }}>trophy</span>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>Live Leaderboard</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leaderboard.slice(0, 5).map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', backgroundColor: i === 0 ? '#FFFBEB' : 'var(--surface)', border: i === 0 ? '1px solid #FDE68A' : '1px solid var(--outline)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: i === 0 ? '#F59E0B' : 'var(--on-surface-variant)', width: '16px' }}>{i + 1}.</span>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{l.name}</span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{l.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats summary */}
            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-xs)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Session Stats</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Duration', value: formatTime(elapsed), icon: 'schedule' },
                  { label: 'Students', value: `${students.length}`, icon: 'group' },
                  { label: 'Comprehension', value: `${comprehension}%`, icon: 'trending_up' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--outline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>{item.icon}</span>
                      <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        {/* Floating PiP Video Panel */}
        {token && livekitUrl && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 60,
            width: pipCollapsed ? '52px' : '280px',
            backgroundColor: 'var(--surface)', border: '1px solid var(--outline)',
            borderRadius: '18px', boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden', transition: 'width 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: pipCollapsed ? '10px' : '10px 14px', borderBottom: pipCollapsed ? 'none' : '1px solid var(--outline)' }}>
              {!pipCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.06em' }}>LIVE STREAM</span>
                </div>
              )}
              <button onClick={() => setPipCollapsed(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', marginLeft: pipCollapsed ? 0 : 'auto' }} title={pipCollapsed ? 'Expand' : 'Collapse'}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{pipCollapsed ? 'videocam' : 'picture_in_picture'}</span>
              </button>
            </div>
            {!pipCollapsed && (
              <div style={{ padding: '10px', height: '200px' }}>
                <LiveVideoRoom token={token} serverUrl={livekitUrl} onDisconnect={async () => { if (sessionId) await stopStream(sessionId); navigate('/analytics'); }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
