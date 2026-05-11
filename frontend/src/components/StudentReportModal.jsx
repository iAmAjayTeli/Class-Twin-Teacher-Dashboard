import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.25, duration: 0.5 } },
  exit: { opacity: 0, y: 30, scale: 0.97, transition: { duration: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

function MetricRing({ value, label, color, size = 80 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * ((value || 0) / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${dash} ${c - dash}` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{value != null ? `${value}%` : '—'}</span>
        </div>
      </div>
      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', fontWeight: 700 }}>{label}</span>
    </div>
  );
}

export default function StudentReportModal({ report, onClose, studentName }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(null);

  if (!report) return null;

  const { attendance, performance, engagement, sessionBreakdown, aiSummary, generatedAt, teacherName } = report;

  async function handleSendToParents() {
    setSending(true);
    setSendError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${encodeURIComponent(studentName)}/report/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ report, email: report.studentEmail || null }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send');
      }
      setSent(true);
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  }

  const gradeIcon = performance.grade === 'Excellent' ? 'verified' : performance.grade === 'Good' ? 'thumb_up' : performance.grade === 'Needs Improvement' ? 'warning' : 'error';

  return (
    <AnimatePresence>
      <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFFFFF', borderRadius: '24px',
            width: '100%', maxWidth: '780px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'sticky', top: '16px', float: 'right', marginRight: '16px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#F3F4F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, transition: 'background 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseOut={e => e.currentTarget.style.background = '#F3F4F6'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6B7280' }}>close</span>
          </button>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1A5C3B 0%, #0e3d27 60%, #1e3a5f 100%)',
            padding: '32px 36px 28px', borderRadius: '24px 24px 0 0',
          }}>
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>description</span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Student Performance Report</span>
              </div>
              <h2 className="font-headline" style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                {report.studentName}
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '50px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  By {teacherName}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '50px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 36px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Grade + Attendance Row */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
            >
              {/* Overall Grade */}
              <div style={{
                padding: '20px', borderRadius: '16px',
                background: `${performance.gradeColor}10`,
                border: `1.5px solid ${performance.gradeColor}30`,
                textAlign: 'center',
              }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '32px', color: performance.gradeColor, marginBottom: '8px', display: 'block' }}>{gradeIcon}</span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: performance.gradeColor, lineHeight: 1 }}>{performance.grade}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginTop: '4px' }}>OVERALL GRADE • {performance.avgScore}/100</div>
              </div>

              {/* Attendance */}
              <div style={{
                padding: '20px', borderRadius: '16px',
                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                textAlign: 'center',
              }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '32px', color: '#1D4ED8', marginBottom: '8px', display: 'block' }}>event_available</span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#1D4ED8', lineHeight: 1 }}>
                  {attendance.attended} / {attendance.total}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginTop: '4px' }}>SESSIONS ATTENDED</div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#DBEAFE', marginTop: '10px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${attendance.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '3px', background: '#3B82F6' }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, marginTop: '4px' }}>{attendance.percentage}% attendance rate</div>
              </div>
            </motion.div>

            {/* Performance Stats */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
              style={{ padding: '20px', borderRadius: '16px', background: '#FAFAFA', border: '1px solid #EAECF0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: '#1A5C3B' }}>analytics</span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 700 }}>Performance Metrics</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                {[
                  { label: 'Accuracy', value: performance.overallAccuracy, suffix: '%', color: '#1A5C3B', bg: '#E8F5EE' },
                  { label: 'Comprehension', value: performance.avgComprehension, suffix: '%', color: '#1D4ED8', bg: '#EFF6FF' },
                  { label: 'Correct', value: performance.totalCorrect, suffix: '', color: '#8B5CF6', bg: '#F3E8FF' },
                  { label: 'Answered', value: performance.totalAnswered, suffix: '', color: '#F59E0B', bg: '#FEF9C3' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '14px 8px', borderRadius: '12px', background: s.bg }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value ?? '—'}{s.value != null ? s.suffix : ''}</div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 600, marginTop: '6px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Engagement Rings */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
              style={{ padding: '20px', borderRadius: '16px', background: '#FAFAFA', border: '1px solid #EAECF0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: '#8B5CF6' }}>monitoring</span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 700 }}>Engagement Metrics</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px' }}>
                <MetricRing value={engagement.avgConfidence} label="Confidence" color="#8B5CF6" />
                <MetricRing value={engagement.avgGaze} label="Gaze Focus" color="#1A5C3B" />
                <MetricRing value={engagement.presenceRate} label="Presence" color="#3B82F6" />
                <MetricRing value={engagement.tabActiveRate} label="Tab Active" color="#F59E0B" />
              </div>
            </motion.div>

            {/* AI Summary */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
              style={{
                padding: '20px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 100%)',
                border: '1px solid #DDD6FE',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: '#7C3AED' }}>psychology</span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7C3AED', fontWeight: 700 }}>AI Summary</span>
              </div>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{aiSummary}</p>
            </motion.div>

            {/* Session Breakdown Table */}
            {sessionBreakdown && sessionBreakdown.length > 0 && (
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
                style={{ borderRadius: '16px', border: '1px solid #EAECF0', overflow: 'hidden' }}
              >
                <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #EAECF0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#F59E0B' }}>history_edu</span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 700 }}>Session Breakdown</span>
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '50px', background: '#FEF9C3', color: '#92400E', fontSize: '10px', fontWeight: 700 }}>{sessionBreakdown.length} sessions</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                        {['Topic', 'Date', 'Score', 'Accuracy', 'Risk'].map(col => (
                          <th key={col} style={{ padding: '8px 14px', textAlign: col === 'Topic' ? 'left' : 'center', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', fontWeight: 700 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessionBreakdown.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F9FAFB', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{s.topic}</td>
                          <td style={{ padding: '10px 14px', color: '#9CA3AF', textAlign: 'center' }}>
                            {s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#374151' }}>{s.score}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                              background: s.accuracy >= 70 ? '#E8F5EE' : s.accuracy >= 40 ? '#FEF9C3' : '#FEE2E2',
                              color: s.accuracy >= 70 ? '#1A5C3B' : s.accuracy >= 40 ? '#92400E' : '#991B1B',
                            }}>{s.accuracy != null ? `${s.accuracy}%` : '—'}</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                              background: s.risk === 'high' ? '#FEE2E2' : s.risk === 'medium' ? '#FEF9C3' : '#E8F5EE',
                              color: s.risk === 'high' ? '#991B1B' : s.risk === 'medium' ? '#92400E' : '#1A5C3B',
                            }}>{s.risk}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Send to Parents Button */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '8px' }}
            >
              {sent ? (
                <div style={{
                  padding: '14px 24px', borderRadius: '14px',
                  background: '#E8F5EE', border: '1.5px solid rgba(26,92,59,0.2)',
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '22px', color: '#1A5C3B' }}>check_circle</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1A5C3B', fontSize: '14px' }}>Report Sent to Parents!</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>The report has been saved to the database successfully.</div>
                  </div>
                </div>
              ) : (
                <>
                  <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(26,92,59,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendToParents}
                  disabled={sending}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: '14px',
                    background: sending ? '#9CA3AF' : 'linear-gradient(135deg, #1A5C3B, #0e3d27)',
                    color: '#FFFFFF', border: 'none', cursor: sending ? 'wait' : 'pointer',
                    fontWeight: 700, fontSize: '15px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 4px 16px rgba(26,92,59,0.25)',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                  }}
                >
                  {sending ? (
                    <><span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span> Sending...</>
                  ) : (
                    <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span> Send to Parents</>
                  )}
                </motion.button>
                </>
              )}
              {sendError && (
                <div style={{ padding: '10px 16px', borderRadius: '10px', background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '13px', width: '100%', textAlign: 'center' }}>
                  {sendError}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
