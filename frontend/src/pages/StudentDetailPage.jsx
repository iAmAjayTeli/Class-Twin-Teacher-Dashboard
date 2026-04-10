import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, CACHE_KEYS, TTL } from '../lib/cache';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Animation Variants ────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.3, duration: 0.6 } },
};

// ─── Emoji Maps ──────────────────────────────────────────────
const EMOTION_EMOJI = {
  focused: '🎯', confused: '😕', distracted: '😵‍💫', tired: '😴',
  happy: '😊', sad: '😢', angry: '😠', neutral: '😐', absent: '👻',
  surprised: '😲', bored: '🥱', anxious: '😰',
};
const HEAD_POSE_EMOJI = {
  centered: '🧑‍💻', down: '👇', up: '👆', turned_away: '🙈',
  left: '👈', right: '👉',
};
const NETWORK_EMOJI = {
  good: '🟢', fair: '🟡', poor: '🔴', excellent: '🟢',
  bad: '🔴', ok: '🟡', unknown: '⚪',
};
const getEmoji = (map, key) =>
  map[key?.toLowerCase?.()] ||
  map[Object.keys(map).find(k => key?.toLowerCase?.().includes(k))] ||
  '📊';

// ─── Section Card ──────────────────────────────────────────────
const SectionCard = ({ children, accentColor = '#1A5C3B', padding = '28px', style = {} }) => (
  <motion.div
    variants={cardVariants}
    whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
    style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      border: '1px solid #EAECF0',
      borderTop: `3px solid ${accentColor}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      padding,
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

// ─── Section Label ─────────────────────────────────────────────
const SectionLabel = ({ icon, label, color = '#1A5C3B' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '8px',
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color }}>{icon}</span>
    </div>
    <h4 style={{
      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em',
      color: '#6B7280', fontWeight: 700, margin: 0,
    }}>{label}</h4>
  </div>
);

// ─── Stat Ring ──────────────────────────────────────────────────
function StatRing({ value, label, color, size = 90 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLen = circumference * ((value || 0) / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{
        padding: '12px', borderRadius: '16px',
        background: `${color}10`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#F3F4F6" strokeWidth="7" />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="transparent" stroke={color} strokeWidth="7"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLen} ${circumference - dashLen}` }}
              transition={{ duration: 1.4, ease: 'easeOut', type: 'spring', bounce: 0.2 }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="font-headline"
              style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}
            >
              {value != null ? `${value}%` : '—'}
            </motion.span>
          </div>
        </div>
      </div>
      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', fontWeight: 700 }}>{label}</span>
    </div>
  );
}

// ─── Mini Donut Chart ──────────────────────────────────────────
function MiniDonut({ data, size = 130, colors, centerEmoji, centerLabel }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const entries = Object.entries(data);
  const radius = (size - 20) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {entries.map(([key, value], i) => {
          const pct = value / total;
          const dashLen = circumference * pct;
          const dashOff = circumference * offset;
          offset += pct;
          return (
            <motion.circle
              key={key} cx={cx} cy={cy} r={radius}
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="12"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: -dashOff }}
              transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={radius - 16} fill="#FFFFFF" />
      </svg>
      {centerEmoji && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '2px',
        }}>
          <span style={{ fontSize: '22px' }}>{centerEmoji}</span>
          {centerLabel && <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function StudentDetailPage() {
  const { studentName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  const [generatingAssignment, setGeneratingAssignment] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [sendingAssignment, setSendingAssignment] = useState(false);
  const [assignmentSent, setAssignmentSent] = useState(false);

  // ── Time-range filter ──────────────────────────────────────────
  const [filterRange, setFilterRange] = useState('all');
  // 'all' | '7d' | '30d' | '3m'

  const FILTER_OPTIONS = [
    { value: 'all',  label: 'All Time',      icon: 'history' },
    { value: '7d',   label: 'Last 7 Days',   icon: 'date_range' },
    { value: '30d',  label: 'Last 30 Days',  icon: 'calendar_month' },
    { value: '3m',   label: 'Last 3 Months', icon: 'calendar_today' },
  ];

  const getCutoffDate = (range) => {
    const d = new Date();
    if (range === '7d')  d.setDate(d.getDate() - 7);
    if (range === '30d') d.setDate(d.getDate() - 30);
    if (range === '3m')  d.setMonth(d.getMonth() - 3);
    return d;
  };

  // Filtered session history
  const filteredSessions = useMemo(() => {
    if (!studentStats?.sessionHistory) return [];
    if (filterRange === 'all') return studentStats.sessionHistory;
    const cutoff = getCutoffDate(filterRange);
    return studentStats.sessionHistory.filter(
      sh => sh.joinedAt && new Date(sh.joinedAt) >= cutoff
    );
  }, [filterRange, studentStats]);

  // Filtered confidence timeline
  const filteredTimeline = useMemo(() => {
    if (!studentStats?.confidenceOverTime) return [];
    if (filterRange === 'all') return studentStats.confidenceOverTime;
    const cutoff = getCutoffDate(filterRange);
    return studentStats.confidenceOverTime.filter(
      pt => pt.time && new Date(pt.time) >= cutoff
    );
  }, [filterRange, studentStats]);

  // Derived stats from filtered sessions
  const filteredStats = useMemo(() => {
    const count = filteredSessions.length;
    const answered = filteredSessions.reduce((s, sh) => s + (sh.totalAnswered || 0), 0);
    const correct  = filteredSessions.reduce((s, sh) => s + (sh.totalCorrect  || 0), 0);
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
    const lastSeen = filteredSessions.reduce((latest, sh) => {
      if (!sh.joinedAt) return latest;
      return (!latest || new Date(sh.joinedAt) > new Date(latest)) ? sh.joinedAt : latest;
    }, null);
    return { count, accuracy, answered, correct, lastSeen };
  }, [filteredSessions]);

  const isFiltered = filterRange !== 'all';
  const activeFilterLabel = FILTER_OPTIONS.find(o => o.value === filterRange)?.label || 'All Time';

  const donutColors = ['#8B5CF6', '#1A5C3B', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  // Colour palette for score
  const scoreColor = (s) => s >= 70 ? '#1A5C3B' : s >= 45 ? '#F59E0B' : '#EF4444';
  const scoreBg = (s) => s >= 70 ? '#E8F5EE' : s >= 45 ? '#FEF9C3' : '#FEE2E2';
  const scoreLabel = (s) => s >= 70 ? 'Likely to Pass' : s >= 45 ? 'At Risk' : 'Likely to Fail';
  const scoreIcon = (s) => s >= 70 ? 'check_circle' : s >= 45 ? 'warning' : 'cancel';

  useEffect(() => {
    if (studentName) {
      fetchStudentStats(studentName);
      loadSavedPrediction(studentName);
    }
  }, [studentName]);

  async function loadSavedPrediction(name) {
    setLoadingPrediction(true);
    try {
      if (!user) return;
      const { data } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('student_name', name)
        .eq('teacher_id', user.id)
        .maybeSingle();
      if (data) {
        setPrediction({
          passScore: data.pass_score,
          summary: data.summary,
          strengths: data.strengths,
          improvements: data.improvements,
          predictedAt: data.predicted_at,
        });
      }
    } catch (_) {}
    finally { setLoadingPrediction(false); }
  }

  async function fetchStudentStats(name) {
    // ── Serve cached data instantly ──
    const cacheKey = CACHE_KEYS.STUDENT_DETAIL(name);
    const cached = cacheGet(cacheKey);
    if (cached) {
      setStudentStats(cached);
      setLoadingStats(false);
    }

    // ── Fetch fresh data ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${encodeURIComponent(name)}/stats`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStudentStats(data);
        cacheSet(cacheKey, data, TTL.MEDIUM);
      }
    } catch (err) {
      console.error('Error fetching student stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  async function fetchAIPrediction() {
    if (!studentStats) return;
    setPredictionLoading(true);
    setPredictionError(null);
    try {
      const s = studentStats.summary;
      const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://woulwfbaejlwlgfbpnqu.supabase.co'}/functions/v1/predict-student`;
      const { data: { session } } = await supabase.auth.getSession();

      // ── Compute aggregated quiz accuracy across all sessions ──
      const totalCorrect = studentStats.sessionHistory?.reduce((sum, sh) => sum + (sh.totalCorrect || 0), 0) ?? 0;
      const totalAnswered = studentStats.sessionHistory?.reduce((sum, sh) => sum + (sh.totalAnswered || 0), 0) ?? 0;
      const avgAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

      // ── Compute avg comprehension across sessions ──
      const compSessions = studentStats.sessionHistory?.filter(sh => sh.comprehension != null) ?? [];
      const avgComprehension = compSessions.length > 0
        ? Math.round(compSessions.reduce((sum, sh) => sum + sh.comprehension, 0) / compSessions.length)
        : null;

      const payload = {
        studentName: s.name,
        totalSessions: s.totalSessions,
        totalEngagementLogs: s.totalEngagementLogs,
        // Core engagement metrics
        avgConfidence: s.avgConfidence,
        avgGazeOnScreen: s.avgGazeOnScreen,
        presenceRate: s.presenceRate,
        tabActiveRate: s.tabActiveRate,
        avgComprehension,
        // Quiz performance — strongest signal for pass/fail
        avgAccuracy,
        totalCorrect,
        totalAnswered,
        // Behavioural patterns
        dominantEmotion: s.dominantEmotion,
        dominantEngagementState: s.dominantEngagementState,
        emotionDistribution: s.emotionDistribution,
        headPoseDistribution: s.headPoseDistribution,
        networkQualityDistribution: s.networkQualityDistribution,
        // Per-session detail with computed accuracy per session
        sessionHistory: studentStats.sessionHistory?.map(sh => ({
          topic: sh.topic,
          status: sh.status,
          mode: sh.mode,
          risk: sh.risk,
          comprehension: sh.comprehension,
          totalCorrect: sh.totalCorrect,
          totalAnswered: sh.totalAnswered,
          accuracy: sh.totalAnswered > 0
            ? Math.round((sh.totalCorrect / sh.totalAnswered) * 100)
            : null,
        })),
      };

      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Prediction service unavailable');
      const data = await res.json();

      const now = new Date().toISOString();

      // ── Build visible signal chips ──
      const dataSignals = [
        avgAccuracy !== null && `Quiz accuracy: ${avgAccuracy}%`,
        payload.avgConfidence != null && `Confidence: ${payload.avgConfidence}%`,
        payload.avgGazeOnScreen != null && `Gaze: ${payload.avgGazeOnScreen}%`,
        payload.presenceRate != null && `Presence: ${payload.presenceRate}%`,
        `${payload.totalSessions} sessions`,
      ].filter(Boolean);

      const result = { ...data, predictedAt: now, dataSignals };
      setPrediction(result);

      // ── Persist to Supabase ──
      if (user) {
        await supabase.from('ai_predictions').upsert({
          student_name: studentName,
          teacher_id: user.id,
          pass_score: data.passScore,
          summary: data.summary,
          strengths: data.strengths,
          improvements: data.improvements,
          predicted_at: now,
          updated_at: now,
        }, { onConflict: 'student_name,teacher_id' });
      }
    } catch (err) {
      console.error('AI prediction error:', err);
      setPredictionError(err.message);
    } finally {
      setPredictionLoading(false);
    }
  }

  async function handleSendAssignment() {
    if (!assignmentResult) return;
    setSendingAssignment(true);
    try {
      const { error } = await supabase
        .from('remedial_assignments')
        .update({ status: 'assigned' })
        .eq('id', assignmentResult);
      if (error) throw error;
      setAssignmentSent(true);
    } catch (e) {
      console.error('Send failed:', e);
      alert('Failed to send assignment to student.');
    } finally {
      setSendingAssignment(false);
    }
  }

  async function handleGenerateAssignment() {
    if (!prediction?.improvements?.length) return;
    setGeneratingAssignment(true);
    setAssignmentSent(false);
    setAssignmentResult(null);
    try {
      const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://woulwfbaejlwlgfbpnqu.supabase.co'}/functions/v1/generate-assignment`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ studentName, weaknesses: prediction.improvements }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setAssignmentResult(data.assignmentId);
    } catch (e) {
      console.error(e);
      alert('Failed to generate assignment.');
    } finally {
      setGeneratingAssignment(false);
    }
  }

  // ─── Avatar initials ───────────────────────────────────────────
  const name = studentStats?.summary?.name || studentName || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar />

      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#F5F6FA' }}>

        {/* ── Gradient Hero Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1A5C3B 0%, #0e3d27 60%, #1e3a5f 100%)',
          padding: '32px 40px 0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background circles */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '30%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          {/* Back button */}
          <button onClick={() => navigate('/students')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '50px',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', marginBottom: '28px', transition: 'background 0.2s',
            fontFamily: 'Inter, sans-serif',
          }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Students
          </button>

          {/* Student identity row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Avatar */}
              <div style={{
                width: '64px', height: '64px', minWidth: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
                border: '3px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: 800, color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
              }}>
                {initials || '?'}
              </div>
              <div>
                <h1 className="font-headline" style={{ fontSize: '30px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  {name || studentName}
                </h1>
                {studentStats && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                      {studentStats.summary.totalSessions} sessions
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                      {studentStats.summary.totalEngagementLogs} engagement logs
                    </span>
                    {studentStats.summary.dominantEmotion && (
                      <span style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(139,92,246,0.3)', color: '#DDD6FE', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(139,92,246,0.4)' }}>
                        {getEmoji(EMOTION_EMOJI, studentStats.summary.dominantEmotion)} {studentStats.summary.dominantEmotion}
                      </span>
                    )}
                    {studentStats.summary.dominantEngagementState && (
                      <span style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(74,222,128,0.2)', color: '#86EFAC', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(74,222,128,0.25)' }}>
                        ⚡ {studentStats.summary.dominantEngagementState}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Predict Button */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchAIPrediction}
              disabled={predictionLoading || loadingStats}
              style={{
                padding: '13px 26px', borderRadius: '50px', border: 'none', cursor: predictionLoading ? 'wait' : 'pointer',
                background: predictionLoading
                  ? 'rgba(255,255,255,0.15)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))',
                color: '#FFFFFF', fontWeight: 700, fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {predictionLoading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  Analyzing with AI...
                </>
              ) : prediction ? (
                <>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '20px' }}>psychology</span>
                  Re-run AI Prediction
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '20px' }}>psychology</span>
                  AI Predict Pass / Fail
                </>
              )}
            </motion.button>
          </div>

          {/* Wave divider */}
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ display: 'block', marginTop: '24px', height: '40px', width: '100%', marginBottom: '-2px' }}>
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#F5F6FA" />
          </svg>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '24px 40px 80px' }}>
          {loadingStats ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#1A5C3B', animation: 'spin 1.5s linear infinite' }}>progress_activity</span>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Loading engagement data...</p>
              </div>
            </div>
          ) : studentStats ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>

              {/* ── Saved Prediction Banner (if loaded from DB and not currently showing full card) ── */}

              {/* ── AI Prediction Error ── */}
              <AnimatePresence>
                {predictionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    style={{ padding: '14px 20px', borderRadius: '14px', background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                    {predictionError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── AI PREDICTION RESULT CARD ── */}
              <AnimatePresence>
                {prediction && (
                  <motion.div
                    variants={cardVariants}
                    initial="hidden" animate="show"
                    style={{
                      borderRadius: '24px',
                      background: `linear-gradient(135deg, ${scoreBg(prediction.passScore)} 0%, #FFFFFF 60%)`,
                      border: `2px solid ${scoreColor(prediction.passScore)}30`,
                      boxShadow: `0 8px 32px ${scoreColor(prediction.passScore)}20`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Decorative bg circle */}
                    <div style={{
                      position: 'absolute', top: '-40px', right: '-40px',
                      width: '200px', height: '200px', borderRadius: '50%',
                      background: `${scoreColor(prediction.passScore)}08`,
                      pointerEvents: 'none',
                    }} />

                    <div style={{ padding: '28px 32px' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${scoreColor(prediction.passScore)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: scoreColor(prediction.passScore) }}>psychology</span>
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>AI Performance Prediction</h4>
                        <span style={{
                          padding: '3px 10px', borderRadius: '50px', fontSize: '10px', fontWeight: 700,
                          background: `${scoreColor(prediction.passScore)}15`, color: scoreColor(prediction.passScore),
                          border: `1px solid ${scoreColor(prediction.passScore)}30`,
                          letterSpacing: '0.08em', marginLeft: 'auto',
                        }}>GEMINI AI</span>
                      </div>

                      {/* Score + summary row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {/* Score gauge */}
                        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
                          <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={65} cy={65} r={54} fill="transparent" stroke="#F3F4F6" strokeWidth="9" />
                            <motion.circle
                              cx={65} cy={65} r={54}
                              fill="transparent"
                              stroke={scoreColor(prediction.passScore)}
                              strokeWidth="9"
                              strokeLinecap="round"
                              initial={{ strokeDasharray: `0 ${2 * Math.PI * 54}` }}
                              animate={{ strokeDasharray: `${2 * Math.PI * 54 * (prediction.passScore / 100)} ${2 * Math.PI * 54 * (1 - prediction.passScore / 100)}` }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                              style={{ filter: `drop-shadow(0 0 6px ${scoreColor(prediction.passScore)}60)` }}
                            />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="font-headline" style={{ fontSize: '30px', fontWeight: 900, color: scoreColor(prediction.passScore), lineHeight: 1 }}>
                              {prediction.passScore}
                            </span>
                            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.05em' }}>/ 100</span>
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                          {/* Verdict pill */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '50px',
                            background: scoreColor(prediction.passScore),
                            marginBottom: '12px',
                            boxShadow: `0 4px 14px ${scoreColor(prediction.passScore)}40`,
                          }}>
                            <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: '#fff' }}>{scoreIcon(prediction.passScore)}</span>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{scoreLabel(prediction.passScore)}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
                            {prediction.summary}
                          </p>
                          {/* ── Data signals used by Gemini ── */}
                          {prediction.dataSignals && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                              {prediction.dataSignals.map((sig, i) => (
                                <span key={i} style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                                  background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB',
                                }}>{sig}</span>
                              ))}
                            </div>
                          )}
                          {prediction.predictedAt && (
                            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                              Last predicted: {new Date(prediction.predictedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Strengths */}
                        <div style={{ padding: '18px', borderRadius: '16px', background: '#E8F5EE', border: '1px solid rgba(26,92,59,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '16px' }}>💪</span>
                            <h5 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1A5C3B', fontWeight: 700, margin: 0 }}>Strengths</h5>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(prediction.strengths || []).map((s, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                                <span style={{ color: '#1A5C3B', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Improvements + Assignment */}
                        <div style={{ padding: '18px', borderRadius: '16px', background: '#FEF9C3', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '16px' }}>📈</span>
                            <h5 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#92400E', fontWeight: 700, margin: 0 }}>Needs Improvement</h5>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {(prediction.improvements || []).map((s, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                                <span style={{ color: '#F59E0B', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>→</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>

                          {/* Assignment flow */}
                          <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: '14px' }}>
                            {assignmentResult ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#E8F5EE', border: '1px solid rgba(26,92,59,0.2)', color: '#1A5C3B', fontSize: '13px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                    <span className="material-symbols-outlined filled" style={{ fontSize: '16px' }}>check_circle</span>
                                    AI Quiz Generated (10 Questions)
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                                    Targeting {prediction.improvements.length} weakness area{prediction.improvements.length !== 1 ? 's' : ''}.
                                  </div>
                                  <a href={`/test-student-assignment/${assignmentResult}`} target="_blank" rel="noreferrer"
                                    style={{ color: '#1A5C3B', fontWeight: 700, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                    Preview student view <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>open_in_new</span>
                                  </a>
                                </div>
                                {assignmentSent ? (
                                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: '#3B82F6' }}>send</span>
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#1D4ED8' }}>Sent to {studentName}!</div>
                                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Student can now attempt this quiz in their mobile app.</div>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={handleSendAssignment} disabled={sendingAssignment}
                                    className="ct-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: sendingAssignment ? 'wait' : 'pointer', opacity: sendingAssignment ? 0.7 : 1 }}>
                                    {sendingAssignment ? (
                                      <><span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>progress_activity</span> Sending...</>
                                    ) : (
                                      <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span> Send to {studentName}&apos;s App</>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button onClick={handleGenerateAssignment} disabled={generatingAssignment}
                                style={{
                                  width: '100%', padding: '10px', borderRadius: '10px',
                                  background: '#F59E0B', color: '#fff',
                                  border: 'none', fontWeight: 700, fontSize: '13px',
                                  cursor: generatingAssignment ? 'wait' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                                }}>
                                {generatingAssignment ? (
                                  <><span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>autorenew</span> Generating...</>
                                ) : (
                                  <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span> Generate Remedial Assignment</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Engagement Metrics ── */}
              <SectionCard accentColor="#1A5C3B">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1A5C3B18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: '#1A5C3B' }}>monitoring</span>
                  </div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontWeight: 700, margin: 0 }}>Engagement Metrics</h4>
                  {isFiltered && (
                    <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '50px', background: '#F3F4F6', color: '#6B7280', fontSize: '10px', fontWeight: 600, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>info</span>
                      All-time averages
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
                  <StatRing value={studentStats.summary.avgConfidence} label="Confidence" color="#8B5CF6" size={100} />
                  <StatRing value={studentStats.summary.avgGazeOnScreen} label="Gaze Focus" color="#1A5C3B" size={100} />
                  <StatRing value={studentStats.summary.presenceRate} label="Presence" color="#3B82F6" size={100} />
                  <StatRing value={studentStats.summary.tabActiveRate} label="Tab Active" color="#F59E0B" size={100} />
                </div>
              </SectionCard>

              {/* ── Distribution Charts 3-col ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {/* Emotion */}
                {Object.keys(studentStats.summary.emotionDistribution).length > 0 && (
                  <SectionCard accentColor="#8B5CF6" padding="22px">
                    <SectionLabel icon="mood" label="Emotions" color="#8B5CF6" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MiniDonut
                        data={studentStats.summary.emotionDistribution}
                        colors={donutColors} size={130}
                        centerEmoji={getEmoji(EMOTION_EMOJI, studentStats.summary.dominantEmotion)}
                        centerLabel={studentStats.summary.dominantEmotion}
                      />
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        {Object.entries(studentStats.summary.emotionDistribution).map(([k, v], i) => (
                          <motion.div key={k} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                            <span style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', background: donutColors[i % donutColors.length] }} />
                            <span style={{ fontSize: '15px' }}>{getEmoji(EMOTION_EMOJI, k)}</span>
                            <span style={{ color: '#6B7280', textTransform: 'capitalize', flex: 1 }}>{k}</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Head Pose */}
                {Object.keys(studentStats.summary.headPoseDistribution).length > 0 && (
                  <SectionCard accentColor="#3B82F6" padding="22px">
                    <SectionLabel icon="face" label="Head Pose" color="#3B82F6" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MiniDonut
                        data={studentStats.summary.headPoseDistribution}
                        colors={['#3B82F6', '#8B5CF6', '#F59E0B']} size={130}
                        centerEmoji={getEmoji(HEAD_POSE_EMOJI, studentStats.summary.dominantHeadPose || 'centered')}
                        centerLabel={studentStats.summary.dominantHeadPose || 'centered'}
                      />
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        {Object.entries(studentStats.summary.headPoseDistribution).map(([k, v], i) => (
                          <motion.div key={k} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                            <span style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', background: ['#3B82F6', '#8B5CF6', '#F59E0B'][i % 3] }} />
                            <span style={{ fontSize: '15px' }}>{getEmoji(HEAD_POSE_EMOJI, k)}</span>
                            <span style={{ color: '#6B7280', textTransform: 'capitalize', flex: 1 }}>{k}</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Network */}
                {Object.keys(studentStats.summary.networkQualityDistribution).length > 0 && (
                  <SectionCard accentColor="#1A5C3B" padding="22px">
                    <SectionLabel icon="wifi" label="Network" color="#1A5C3B" />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MiniDonut
                        data={studentStats.summary.networkQualityDistribution}
                        colors={['#1A5C3B', '#F59E0B', '#EF4444']} size={130}
                        centerEmoji={getEmoji(NETWORK_EMOJI, 'good')}
                        centerLabel="network"
                      />
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        {Object.entries(studentStats.summary.networkQualityDistribution).map(([k, v], i) => (
                          <motion.div key={k} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                            <span style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', background: ['#1A5C3B', '#F59E0B', '#EF4444'][i % 3] }} />
                            <span style={{ fontSize: '15px' }}>{getEmoji(NETWORK_EMOJI, k)}</span>
                            <span style={{ color: '#6B7280', textTransform: 'capitalize', flex: 1 }}>{k}</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* ── Confidence Timeline ── */}
              {filteredTimeline.length > 0 && (
                <SectionCard accentColor="#8B5CF6">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#8B5CF618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: '#8B5CF6' }}>timeline</span>
                    </div>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontWeight: 700, margin: 0 }}>Confidence Timeline</h4>
                    {isFiltered && (
                      <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '50px', background: '#EDE9FE', color: '#7C3AED', fontSize: '10px', fontWeight: 700, border: '1px solid #DDD6FE' }}>
                        {filteredTimeline.length} logs · {activeFilterLabel}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    {/* Y-axis labels */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                    </div>
                    <div style={{ marginLeft: '32px' }}>
                      <svg width="100%" height="160" viewBox={`0 0 ${Math.max(filteredTimeline.length * 50, 300)} 160`} preserveAspectRatio="none" style={{ display: 'block' }}>
                        <defs>
                          <linearGradient id="confGradNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {[0.25, 0.5, 0.75, 1.0].map((f, i) => (
                          <line key={i} x1="0" y1={155 - f * 140} x2="100%" y2={155 - f * 140}
                            stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
                        ))}
                        {(() => {
                          const pts = filteredTimeline;
                          const w = Math.max(pts.length * 50, 300);
                          const path = pts.map((p, i) => {
                            const x = (i / Math.max(pts.length - 1, 1)) * (w - 30) + 15;
                            const y = 145 - (p.confidence || 0) * 125;
                            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                          }).join(' ');
                          const lastX = ((pts.length - 1) / Math.max(pts.length - 1, 1)) * (w - 30) + 15;
                          const areaPath = path + ` L${lastX},155 L15,155 Z`;
                          return (
                            <>
                              <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} d={areaPath} fill="url(#confGradNew)" />
                              <motion.path
                                key={`line-${filterRange}`}
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                                d={path} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"
                              />
                              {pts.map((p, i) => {
                                const x = (i / Math.max(pts.length - 1, 1)) * (w - 30) + 15;
                                const y = 145 - (p.confidence || 0) * 125;
                                return <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.05, type: 'spring' }} key={`${filterRange}-${i}`} cx={x} cy={y} r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />;
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* ── Session History Table ── */}
              <SectionCard accentColor="#F59E0B" padding="0">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#F59E0B' }}>history_edu</span>
                  </div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontWeight: 700, margin: 0 }}>Session History</h4>

                  {/* ── Filter Dropdown ── */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Accuracy badge updates with filter */}
                    {filteredStats.accuracy !== null && (
                      <span style={{
                        padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                        background: filteredStats.accuracy >= 70 ? '#E8F5EE' : filteredStats.accuracy >= 40 ? '#FEF9C3' : '#FEE2E2',
                        color: filteredStats.accuracy >= 70 ? '#1A5C3B' : filteredStats.accuracy >= 40 ? '#92400E' : '#991B1B',
                      }}>
                        {filteredStats.accuracy}% accuracy
                      </span>
                    )}
                    <span style={{ padding: '3px 10px', borderRadius: '50px', background: '#FEF9C3', color: '#92400E', fontSize: '11px', fontWeight: 700 }}>
                      {filteredStats.count} sessions
                    </span>

                    {/* Filter select pill */}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{
                        position: 'absolute', left: '10px', fontSize: '14px', pointerEvents: 'none',
                        color: isFiltered ? '#1A5C3B' : '#9CA3AF',
                      }}>calendar_month</span>
                      <select
                        value={filterRange}
                        onChange={e => setFilterRange(e.target.value)}
                        style={{
                          paddingLeft: '28px', paddingRight: '28px', paddingTop: '5px', paddingBottom: '5px',
                          borderRadius: '50px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          border: isFiltered ? '1.5px solid #1A5C3B' : '1.5px solid #E5E7EB',
                          background: isFiltered ? '#E8F5EE' : '#FFFFFF',
                          color: isFiltered ? '#1A5C3B' : '#374151',
                          outline: 'none',
                          appearance: 'none', WebkitAppearance: 'none',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {FILTER_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined" style={{
                        position: 'absolute', right: '8px', fontSize: '14px', pointerEvents: 'none',
                        color: isFiltered ? '#1A5C3B' : '#9CA3AF',
                      }}>expand_more</span>
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                        {['Topic', 'Date', 'Status', 'Mode', 'Score', 'Risk'].map((col, i) => (
                          <th key={col} style={{
                            padding: '10px 16px', textAlign: i > 1 ? 'center' : 'left',
                            fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: '#9CA3AF', fontWeight: 700,
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>event_busy</span>
                            No sessions found for {activeFilterLabel.toLowerCase()}
                          </td>
                        </tr>
                      ) : filteredSessions.map((sh, i) => {
                        const pct = sh.totalAnswered > 0 ? Math.round((sh.totalCorrect / sh.totalAnswered) * 100) : null;
                        return (
                          <motion.tr
                            key={sh.sessionStudentId}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 + i * 0.04 }}
                            style={{ borderBottom: '1px solid #F9FAFB', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                            onMouseOver={e => e.currentTarget.style.background = '#F0FDF4'}
                            onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                          >
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827' }}>{sh.topic}</td>
                            <td style={{ padding: '14px 16px', color: '#9CA3AF', fontSize: '12px' }}>
                              {sh.joinedAt ? new Date(sh.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                                background: sh.status === 'ended' ? '#E8F5EE' : sh.status === 'active' ? '#EFF6FF' : '#FEF9C3',
                                color: sh.status === 'ended' ? '#1A5C3B' : sh.status === 'active' ? '#1D4ED8' : '#92400E',
                              }}>{sh.status}</span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6B7280', textTransform: 'capitalize', fontSize: '12px' }}>{sh.mode || '—'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, color: pct != null ? (pct >= 70 ? '#1A5C3B' : pct >= 40 ? '#F59E0B' : '#EF4444') : '#9CA3AF' }}>
                                {sh.totalCorrect}/{sh.totalAnswered}
                                {pct != null && <span style={{ fontSize: '10px', fontWeight: 600, marginLeft: '4px', opacity: 0.7 }}>({pct}%)</span>}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                                background: sh.risk === 'high' ? '#FEE2E2' : sh.risk === 'medium' ? '#FEF9C3' : '#E8F5EE',
                                color: sh.risk === 'high' ? '#991B1B' : sh.risk === 'medium' ? '#92400E' : '#1A5C3B',
                              }}>{sh.risk || '—'}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D1D5DB' }}>person_off</span>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No data found for this student</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
