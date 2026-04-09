import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StartSessionModal from '../components/StartSessionModal';
import ImportDataModal from '../components/ImportDataModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function SessionLibrary() {
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [oracle, setOracle] = useState({ loading: true, message: '', score: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Professor';

  useEffect(() => { fetchDashboardData(); }, []);

  async function fetchDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const [statsRes, oracleRes] = await Promise.all([
        fetch(`${baseUrl}/api/dashboard/stats`, { headers }),
        fetch(`${baseUrl}/api/dashboard/oracle`, { headers })
      ]);

      if (statsRes.ok) setPastSessions(await statsRes.json());
      if (oracleRes.ok) {
        const d = await oracleRes.json();
        setOracle({ loading: false, message: d.message, score: d.score });
      } else {
        setOracle({ loading: false, message: 'Oracle is currently unavailable.', score: 0 });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setOracle({ loading: false, message: 'Oracle analysis failed.', score: 0 });
    } finally {
      setLoadingSessions(false);
    }
  }

  const totalSessions = pastSessions.length;
  const endedSessions = pastSessions.filter(s => s.status === 'archived' || s.status === 'ended').length;
  const runningSessions = pastSessions.filter(s => s.status === 'active').length;

  const statusColor = { active: '#1A5C3B', archived: '#6B7280', ended: '#6B7280' };
  const statusBg = { active: '#E8F5EE', archived: '#F3F4F6', ended: '#F3F4F6' };
  const statusLabel = { active: 'Active', archived: 'Archived', ended: 'Ended' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar onStartSession={() => setShowModal(true)} />

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative', background: '#F5F6FA' }}>

        {/* Topbar */}
        <div style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#F9FAFB', border: '1px solid #EAECF0',
            borderRadius: '10px', padding: '8px 16px',
            width: '320px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9CA3AF' }}>search</span>
            <input type="text" placeholder="Search sessions..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#111827', width: '100%', fontFamily: 'Inter, sans-serif' }}
            />
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, background: '#EAECF0', padding: '2px 6px', borderRadius: '5px' }}>⌘ F</span>
          </div>
          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F9FAFB', border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>mail</span>
            </button>
            <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F9FAFB', border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>notifications</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 4px 4px 12px', background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '50px' }}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ paddingRight: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1 }}>{displayName}</p>
                <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h1 className="font-headline" style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Dashboard
              </h1>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>Plan, teach, and track your students with AI precision.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="ct-btn-primary" onClick={() => setShowModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Start New Session
              </button>
              <button className="ct-btn-outline" onClick={() => setShowImportModal(true)}>
                Import Data
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Highlight card */}
            <div style={{
              background: 'linear-gradient(135deg, #1A5C3B 0%, #0f3d26 100%)',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(26, 92, 59, 0.25)',
            }}>
              <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Total Sessions</p>
                <button style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fff', transform: 'rotate(-45deg)' }}>arrow_forward</span>
                </button>
              </div>
              <p className="font-headline" style={{ fontSize: '40px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{loadingSessions ? '--' : totalSessions}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#4DE89A' }}>trending_up</span>
                Active teaching sessions
              </p>
            </div>

            {[
              { label: 'Ended Sessions', value: loadingSessions ? '--' : endedSessions, note: 'Archived sessions' },
              { label: 'Running Sessions', value: loadingSessions ? '--' : runningSessions, note: 'Currently active' },
              { label: 'Insights Ready', value: loadingSessions ? '--' : oracle.score + '%', note: 'Cognitive sync score' },
            ].map((stat, i) => (
              <div key={i} className="ct-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>{stat.label}</p>
                  <button style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F9FAFB', border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6B7280', transform: 'rotate(-45deg)' }}>arrow_forward</span>
                  </button>
                </div>
                <p className="font-headline" style={{ fontSize: '40px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#1A5C3B' }}>trending_up</span>
                  {stat.note}
                </p>
              </div>
            ))}
          </div>

          {/* Sessions + Oracle two-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>

            {/* Session List */}
            <div className="ct-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Recent Sessions</h2>
                <button
                  onClick={() => setShowAllSessions(prev => !prev)}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#1A5C3B', background: '#E8F5EE', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#1A5C3B'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#E8F5EE'; e.currentTarget.style.color = '#1A5C3B'; }}
                >
                  {showAllSessions ? 'Show less' : `View all (${pastSessions.length})`}
                </button>
              </div>
              {loadingSessions ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#1A5C3B', animation: 'spin 1.5s linear infinite' }}>progress_activity</span>
                  <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Loading sessions...</p>
                </div>
              ) : pastSessions.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#D1D5DB' }}>school</span>
                  <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center' }}>No sessions yet. Start your first class!</p>
                  <button className="ct-btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Start New Session
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: showAllSessions ? '600px' : 'none', overflowY: showAllSessions ? 'auto' : 'visible' }}>
                  {pastSessions.slice(0, showAllSessions ? pastSessions.length : 6).map((card, i) => {
                    const topic = card.topic || 'General Session';
                    const cStatus = card.status || 'archived';
                    const studentCount = card.session_students?.length || 0;
                    const heatBars = card.heatmapBars;

                    // Relative time
                    const now = new Date();
                    const created = new Date(card.created_at);
                    const diffMs = now - created;
                    const diffMin = Math.floor(diffMs / 60000);
                    const diffHr = Math.floor(diffMin / 60);
                    const diffDay = Math.floor(diffHr / 24);
                    let timeAgo;
                    if (diffMin < 1) timeAgo = 'Just now';
                    else if (diffMin < 60) timeAgo = `${diffMin}m ago`;
                    else if (diffHr < 24) timeAgo = `${diffHr}h ago`;
                    else if (diffDay < 7) timeAgo = `${diffDay}d ago`;
                    else timeAgo = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    const handleSessionClick = () => {
                      if (cStatus === 'active' && card.join_code) {
                        navigate(`/lobby/${card.join_code}?sessionId=${card.id}`);
                      } else if (card.join_code) {
                        navigate(`/lobby/${card.join_code}?sessionId=${card.id}`);
                      }
                    };

                    return (
                      <div key={card.id || i}
                        onClick={handleSessionClick}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '12px 10px', borderRadius: '10px',
                          cursor: 'pointer', transition: 'all 0.2s',
                          borderLeft: cStatus === 'active' ? '3px solid #1A5C3B' : '3px solid transparent',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                      >
                        <div style={{
                          width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px',
                          background: cStatus === 'active' ? '#E8F5EE' : '#F3F4F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: cStatus === 'active' ? '#1A5C3B' : '#6B7280' }}>
                            {cStatus === 'active' ? 'cast_connected' : 'menu_book'}
                          </span>
                          {cStatus === 'active' && (
                            <span style={{
                              position: 'absolute', top: '-2px', right: '-2px',
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: '#22C55E', border: '2px solid #fff',
                              animation: 'pulse-glow 2s infinite',
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{topic}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo}</span>
                            {studentCount > 0 && (
                              <>
                                <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
                                <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>group</span>
                                  {studentCount}
                                </span>
                              </>
                            )}
                            {card.join_code && (
                              <>
                                <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{card.join_code}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Mini engagement heatmap */}
                        {heatBars && heatBars.some(b => b > 0) && (
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '24px', marginRight: '8px' }}>
                            {heatBars.map((val, bi) => (
                              <div key={bi} style={{
                                width: '3px',
                                height: `${Math.max(3, (val / 100) * 24)}px`,
                                borderRadius: '1.5px',
                                background: val > 70 ? '#1A5C3B' : val > 40 ? '#F59E0B' : '#EF4444',
                                opacity: val === 0 ? 0.15 : 0.8,
                                transition: 'height 0.3s ease',
                              }} />
                            ))}
                          </div>
                        )}
                        <span style={{
                          padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 600,
                          background: statusBg[cStatus] || '#F3F4F6',
                          color: statusColor[cStatus] || '#6B7280',
                          whiteSpace: 'nowrap',
                        }}>
                          {statusLabel[cStatus] || 'Archived'}
                        </span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#D1D5DB' }}>chevron_right</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Oracle */}
            <div className="ct-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1A5C3B', animation: 'pulse-glow 2s infinite' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>AI Oracle</h2>
              </div>

              {/* Score ring */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1A5C3B" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50 * (oracle.score / 100)} ${2 * Math.PI * 50}`}
                      strokeDashoffset={2 * Math.PI * 50 * 0.25}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-headline" style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{oracle.loading ? '--' : oracle.score}%</span>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sync</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, flex: 1, marginBottom: '16px' }}>
                {oracle.loading ? 'Gathering cognitive telemetry...' : oracle.message || 'Waiting for active session data.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="ct-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: '13px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>monitoring</span>
                  View Full Report
                </button>
                <button className="ct-btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: '13px' }}>
                  Optimize My Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && <StartSessionModal onClose={() => setShowModal(false)} />}
      {showImportModal && <ImportDataModal onClose={() => setShowImportModal(false)} onImportComplete={() => fetchDashboardData()} />}
    </div>
  );
}
