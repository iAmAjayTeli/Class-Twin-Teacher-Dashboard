import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const LANG_LABELS = {
  en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', bn: 'Bengali', gu: 'Gujarati', ml: 'Malayalam', pa: 'Punjabi',
  ur: 'Urdu', or: 'Odia', as: 'Assamese', fr: 'French', es: 'Spanish',
  de: 'German', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
};

const BAR_COLORS = [
  { fill: '#10B981', glow: 'rgba(16,185,129,0.3)' },
  { fill: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
  { fill: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  { fill: '#8B5CF6', glow: 'rgba(139,92,246,0.3)' },
  { fill: '#EF4444', glow: 'rgba(239,68,68,0.3)' },
  { fill: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
  { fill: '#06B6D4', glow: 'rgba(6,182,212,0.3)' },
  { fill: '#F97316', glow: 'rgba(249,115,22,0.3)' },
];

/* ────────────────────── Premium Bar Graph ────────────────────── */
function LanguageBarGraph({ distribution, total }) {
  const [active, setActive] = useState(null);
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
  const barMaxH = 170;

  return (
    <div className="ct-card" style={{
      padding: 0, borderRadius: '24px', overflow: 'hidden',
      background: '#FFFFFF', border: '1px solid #EAECF0',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '22px 28px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #F3F4F6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #C4B5FD',
          }}>
            <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: '#7C3AED' }}>translate</span>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Language Preference</h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              Preferred languages across {total} student{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ padding: '4px 12px', borderRadius: '50px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>{total} Students</span>
          </div>
          <div style={{ padding: '4px 12px', borderRadius: '50px', background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>{distribution.length} Languages</span>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ padding: '32px 32px 28px' }}>
        <div style={{ position: 'relative', height: `${barMaxH + 70}px` }}>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, gi) => (
            <div key={gi} style={{
              position: 'absolute', left: '28px', right: 0,
              top: `${(1 - f) * barMaxH}px`,
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{
                position: 'absolute', left: '-28px', fontSize: '10px',
                color: '#C0C5CC', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              }}>
                {Math.round(f * maxCount)}
              </span>
              <div style={{
                flex: 1,
                borderBottom: f === 0 ? '1.5px solid #E5E7EB' : '1px solid #F3F4F6',
              }} />
            </div>
          ))}

          {/* Bars container */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-evenly',
            height: `${barMaxH}px`, marginLeft: '28px',
            position: 'relative', zIndex: 1,
          }}>
            {distribution.map((item, i) => {
              const c = BAR_COLORS[i % BAR_COLORS.length];
              const pct = total > 0 ? item.count / total : 0;
              const barH = Math.max((item.count / maxCount) * barMaxH, 6);
              const isHover = active === i;
              const label = LANG_LABELS[item.language] || item.language;

              return (
                <div
                  key={item.language}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer', position: 'relative',
                  }}
                >
                  {/* Floating tooltip on hover */}
                  {isHover && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        position: 'absolute', bottom: `${barH + 50}px`,
                        background: '#111827', color: '#FFF', padding: '6px 12px',
                        borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                        whiteSpace: 'nowrap', zIndex: 20,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      }}
                    >
                      {item.count} student{item.count !== 1 ? 's' : ''} · {Math.round(pct * 100)}%
                      <div style={{
                        position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px', height: '8px', background: '#111827',
                      }} />
                    </motion.div>
                  )}

                  {/* Count above bar */}
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    style={{
                      fontSize: '14px', fontWeight: 900,
                      color: isHover ? c.fill : '#111827',
                      marginBottom: '6px', transition: 'color 0.2s',
                    }}
                  >
                    {item.count}
                  </motion.span>

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ duration: 0.7, delay: i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      width: isHover ? '46px' : '38px',
                      borderRadius: '10px 10px 4px 4px',
                      background: `linear-gradient(180deg, ${c.fill}, ${c.fill}AA)`,
                      boxShadow: isHover
                        ? `0 10px 28px ${c.glow}`
                        : `0 2px 8px ${c.glow.replace('0.3', '0.08')}`,
                      transition: 'width 0.25s ease, box-shadow 0.25s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* Shine effect */}
                    <div style={{
                      position: 'absolute', top: '4px', left: '6px', right: '6px',
                      height: '5px', borderRadius: '3px',
                      background: 'rgba(255,255,255,0.35)',
                    }} />
                  </motion.div>

                  {/* Percentage label */}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    style={{
                      marginTop: '8px', fontSize: '10px', fontWeight: 700,
                      color: '#9CA3AF',
                    }}
                  >
                    {Math.round(pct * 100)}%
                  </motion.span>

                  {/* Language name */}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    style={{
                      marginTop: '2px', fontSize: '12px',
                      fontWeight: isHover ? 800 : 600,
                      color: isHover ? c.fill : '#374151',
                      transition: 'all 0.2s',
                      maxWidth: '80px', textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */
export default function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langData, setLangData] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchLanguages();
    const channel = supabase
      .channel('students-lang-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        console.log('📡 Students table updated — refreshing bar graph');
        fetchLanguages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchLanguages() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/languages`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setLangData(await res.json());
    } catch (err) { console.error('Error fetching languages:', err); }
  }

  async function fetchStudents() {
    const cached = cacheGet(CACHE_KEYS.STUDENTS);
    if (cached) { setStudents(cached); setLoading(false); }
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
    } catch (err) { console.error('Error fetching students:', err); }
    finally { setLoading(false); }
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

          {/* Student Grid */}
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
                    onClick={() => navigate(`/students/${encodeURIComponent(student.name)}`)}
                    className="ct-card ct-card-hover"
                    style={{ padding: '20px', cursor: 'pointer', borderRadius: '16px' }}
                  >
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

          {/* Language Bar Graph — below students */}
          {langData && langData.distribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginTop: '32px' }}
            >
              <LanguageBarGraph distribution={langData.distribution} total={langData.total} />
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
