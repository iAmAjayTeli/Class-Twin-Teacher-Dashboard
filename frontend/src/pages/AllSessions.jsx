import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StartSessionModal from '../components/StartSessionModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, CACHE_KEYS, TTL } from '../lib/cache';

const statusColor = { active: '#1A5C3B', archived: '#6B7280', ended: '#6B7280' };
const statusBg = { active: '#E8F5EE', archived: '#F3F4F6', ended: '#F3F4F6' };
const statusLabel = { active: 'Active', archived: 'Archived', ended: 'Ended' };

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const ms = now - d;
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AllSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    // ── Serve cached data instantly ──
    const cached = cacheGet(CACHE_KEYS.ALL_SESSIONS);
    if (cached) {
      setSessions(cached);
      setLoading(false);
    }

    // ── Fetch fresh data ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        cacheSet(CACHE_KEYS.ALL_SESSIONS, data, TTL.MEDIUM);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...sessions];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(s => {
        const st = s.status || 'archived';
        if (statusFilter === 'ended') return st === 'ended' || st === 'archived';
        return st === statusFilter;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.topic || '').toLowerCase().includes(q) ||
        (s.join_code || '').toLowerCase().includes(q) ||
        (s.subject || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'topic') return (a.topic || '').localeCompare(b.topic || '');
      if (sortBy === 'students') return (b.session_students?.length || 0) - (a.session_students?.length || 0);
      return 0;
    });

    return list;
  }, [sessions, statusFilter, search, sortBy]);

  const counts = useMemo(() => ({
    all: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    ended: sessions.filter(s => s.status === 'ended' || s.status === 'archived').length,
  }), [sessions]);

  const handleSessionClick = (card) => {
    if (card.join_code) {
      navigate(`/lobby/${card.join_code}?sessionId=${card.id}`);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: counts.all, icon: 'apps' },
    { key: 'active', label: 'Active', count: counts.active, icon: 'cast_connected' },
    { key: 'ended', label: 'Ended', count: counts.ended, icon: 'check_circle' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar onStartSession={() => setShowModal(true)} />

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#F5F6FA' }}>
        {/* Header */}
        <div style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/sessions')}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#F9FAFB', border: '1px solid #EAECF0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#EAECF0'}
                onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}
                title="Back to Dashboard"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>arrow_back</span>
              </button>
              <div>
                <h1 className="font-headline" style={{ fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                  All Sessions
                </h1>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  {loading ? 'Loading...' : `${sessions.length} total sessions`}
                </p>
              </div>
            </div>
            <button
              className="ct-btn-primary"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              New Session
            </button>
          </div>

          {/* Filter tabs + Search + Sort */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', borderRadius: '10px', padding: '3px' }}>
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: statusFilter === tab.key ? 600 : 500,
                    color: statusFilter === tab.key ? '#1A5C3B' : '#6B7280',
                    background: statusFilter === tab.key ? '#fff' : 'transparent',
                    boxShadow: statusFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{tab.icon}</span>
                  {tab.label}
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    background: statusFilter === tab.key ? '#E8F5EE' : '#E5E7EB',
                    color: statusFilter === tab.key ? '#1A5C3B' : '#6B7280',
                    padding: '1px 6px', borderRadius: '10px',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#F9FAFB', border: '1px solid #EAECF0',
                borderRadius: '10px', padding: '7px 14px', width: '240px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#9CA3AF' }}>search</span>
                <input
                  type="text" placeholder="Search sessions..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', width: '100%', fontFamily: 'Inter, sans-serif' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9CA3AF' }}>close</span>
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: '10px',
                  border: '1px solid #EAECF0', background: '#F9FAFB',
                  fontSize: '13px', color: '#374151', fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="topic">By topic</option>
                <option value="students">Most students</option>
              </select>

              {/* View toggle */}
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
                {['list', 'grid'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: viewMode === mode ? '#fff' : 'transparent',
                      boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: viewMode === mode ? '#1A5C3B' : '#9CA3AF' }}>
                      {mode === 'list' ? 'view_list' : 'grid_view'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#1A5C3B', animation: 'spin 1.5s linear infinite' }}>progress_activity</span>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Loading sessions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#D1D5DB' }}>
                  {search ? 'search_off' : 'school'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                  {search ? 'No sessions match your search' : 'No sessions found'}
                </p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
                  {search ? `Try a different search term` : 'Start your first class to see it here'}
                </p>
              </div>
              {!search && (
                <button className="ct-btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  Start New Session
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            /* ─── List View ─── */
            <div className="ct-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 40px',
                padding: '12px 20px', background: '#F9FAFB',
                borderBottom: '1px solid #EAECF0',
                fontSize: '11px', fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <span>Session</span>
                <span>Code</span>
                <span>Students</span>
                <span>Created</span>
                <span>Status</span>
                <span></span>
              </div>
              {/* Rows */}
              {filtered.map((card, i) => {
                const topic = card.topic || 'General Session';
                const cStatus = card.status || 'archived';
                const studentCount = card.session_students?.length || 0;
                const heatBars = card.heatmapBars;

                return (
                  <div
                    key={card.id || i}
                    onClick={() => handleSessionClick(card)}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 40px',
                      padding: '14px 20px',
                      borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                      cursor: 'pointer', transition: 'all 0.15s',
                      alignItems: 'center',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Topic + subject */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
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
                          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', border: '2px solid #fff' }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{topic}</p>
                        {card.subject && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>{card.subject}</p>}
                      </div>
                    </div>

                    {/* Code */}
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#6B7280', letterSpacing: '0.05em' }}>
                      {card.join_code || '—'}
                    </span>

                    {/* Students */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9CA3AF' }}>group</span>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{studentCount}</span>
                      {/* Mini heatmap */}
                      {heatBars && heatBars.some(b => b > 0) && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '16px', marginLeft: '8px' }}>
                          {heatBars.map((val, bi) => (
                            <div key={bi} style={{
                              width: '2px',
                              height: `${Math.max(2, (val / 100) * 16)}px`,
                              borderRadius: '1px',
                              background: val > 70 ? '#1A5C3B' : val > 40 ? '#F59E0B' : '#EF4444',
                              opacity: val === 0 ? 0.15 : 0.7,
                            }} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{relativeTime(card.created_at)}</span>

                    {/* Status */}
                    <span style={{
                      padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 600,
                      background: statusBg[cStatus] || '#F3F4F6',
                      color: statusColor[cStatus] || '#6B7280',
                      textAlign: 'center', whiteSpace: 'nowrap',
                    }}>
                      {statusLabel[cStatus] || 'Archived'}
                    </span>

                    {/* Arrow */}
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#D1D5DB' }}>chevron_right</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── Grid View ─── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filtered.map((card, i) => {
                const topic = card.topic || 'General Session';
                const cStatus = card.status || 'archived';
                const studentCount = card.session_students?.length || 0;
                const heatBars = card.heatmapBars;

                return (
                  <div
                    key={card.id || i}
                    className="ct-card"
                    onClick={() => handleSessionClick(card)}
                    style={{
                      padding: '20px', cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: cStatus === 'active' ? '3px solid #1A5C3B' : '3px solid transparent',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: cStatus === 'active' ? '#E8F5EE' : '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: cStatus === 'active' ? '#1A5C3B' : '#6B7280' }}>
                          {cStatus === 'active' ? 'cast_connected' : 'menu_book'}
                        </span>
                        {cStatus === 'active' && (
                          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', border: '2px solid #fff', animation: 'pulse-glow 2s infinite' }} />
                        )}
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 600,
                        background: statusBg[cStatus] || '#F3F4F6',
                        color: statusColor[cStatus] || '#6B7280',
                      }}>
                        {statusLabel[cStatus] || 'Archived'}
                      </span>
                    </div>

                    {/* Topic */}
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic}</p>
                    {card.subject && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 12px' }}>{card.subject}</p>}

                    {/* Heatmap bar */}
                    {heatBars && heatBars.some(b => b > 0) && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px', margin: '12px 0' }}>
                        {heatBars.map((val, bi) => (
                          <div key={bi} style={{
                            flex: 1,
                            height: `${Math.max(3, (val / 100) * 28)}px`,
                            borderRadius: '2px',
                            background: val > 70 ? '#1A5C3B' : val > 40 ? '#F59E0B' : '#EF4444',
                            opacity: val === 0 ? 0.1 : 0.7,
                            transition: 'height 0.3s ease',
                          }} />
                        ))}
                      </div>
                    )}

                    {/* Footer meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                      {card.join_code && (
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#9CA3AF', background: '#F9FAFB', padding: '2px 8px', borderRadius: '6px' }}>
                          {card.join_code}
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#9CA3AF' }}>group</span>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{studentCount}</span>
                      </div>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{relativeTime(card.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Results count */}
          {!loading && filtered.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#9CA3AF' }}>
              Showing {filtered.length} of {sessions.length} sessions
            </div>
          )}
        </div>
      </main>

      {showModal && <StartSessionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
