import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, CACHE_KEYS, TTL } from '../lib/cache';

const avatarColors = [
  { bg: '#E8F5EE', text: '#1A5C3B' },
  { bg: '#EFF6FF', text: '#1D4ED8' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#F3E8FF', text: '#6D28D9' },
  { bg: '#ECFDF5', text: '#065F46' },
];

export default function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    // ── Serve cached data instantly ──
    const cached = cacheGet(CACHE_KEYS.STUDENTS);
    if (cached) {
      setStudents(cached);
      setLoading(false);
    }

    // ── Fetch fresh data ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        cacheSet(CACHE_KEYS.STUDENTS, data, TTL.MEDIUM);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleStudentClick(student) {
    navigate(`/students/${encodeURIComponent(student.name)}`);
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar />

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#F5F6FA' }}>

        {/* Topbar */}
        <div style={{
          background: '#FFFFFF', borderBottom: '1px solid #EAECF0',
          padding: '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '10px', padding: '8px 16px', width: '320px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9CA3AF' }}>search</span>
            <input type="text" placeholder="Search students by name..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#111827', width: '100%', fontFamily: 'Inter, sans-serif' }}
            />
            {search && (
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, background: '#EAECF0', padding: '2px 6px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                {filteredStudents.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EAECF0' }} />
            )}
          </div>
        </div>

        <div style={{ padding: '32px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 className="font-headline" style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1A5C3B' }}>groups</span>
              Students
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              {students.length} student{students.length !== 1 ? 's' : ''} across all sessions
            </p>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D1D5DB' }}>school</span>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
                {search ? 'No students match your search' : 'No students have joined any sessions yet'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filteredStudents.map((student, i) => {
                const color = avatarColors[i % avatarColors.length];
                return (
                  <div key={student.deviceId || student.name}
                    onClick={() => handleStudentClick(student)}
                    className="ct-card ct-card-hover"
                    style={{ padding: '20px', cursor: 'pointer', borderRadius: '16px' }}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%',
                        background: color.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: 700, color: color.text,
                      }}>
                        {student.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.name}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {student.totalSessions} session{student.totalSessions !== 1 ? 's' : ''} attended
                        </p>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D1D5DB' }}>chevron_right</span>
                    </div>

                    {/* Stats mini-row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Comprehension', value: student.avgComprehension != null ? `${student.avgComprehension}%` : '—', color: '#1D4ED8', bg: '#EFF6FF' },
                        { label: 'Accuracy', value: student.accuracy != null ? `${student.accuracy}%` : '—', color: '#1A5C3B', bg: '#E8F5EE' },
                        { label: 'Score', value: `${student.totalCorrect}/${student.totalAnswered}`, color: '#92400E', bg: '#FEF3C7' },
                      ].map((stat, si) => (
                        <div key={si} style={{ padding: '10px 8px', borderRadius: '10px', background: stat.bg, textAlign: 'center' }}>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                          <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginTop: '4px', fontWeight: 600 }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Last seen */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#D1D5DB' }}>schedule</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        Last seen {student.lastSeen ? new Date(student.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
