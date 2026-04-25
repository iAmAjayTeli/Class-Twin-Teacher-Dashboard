import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const suggestedPrompts = [
  { icon: 'my_location', text: "What's the current confusion hotspot?", color: '#EF4444', bg: '#FEF2F2' },
  { icon: 'notifications_active', text: "The back row seems distracted. Help them.", color: '#F59E0B', bg: '#FFFBEB' },
  { icon: 'coffee', text: "If I give a 10-min break, how will scores change?", color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: 'trending_down', text: "Show me students with declining attention", color: '#3B82F6', bg: '#EFF6FF' },
  { icon: 'summarize', text: "Summarize the twin state for the last 5 minutes", color: '#10B981', bg: '#ECFDF5' },
];

const simulationPresets = [
  { label: '10-min Break', icon: 'coffee', prompt: 'If I give a 10-minute break now, how will it affect predicted quiz scores?' },
  { label: 'Switch Topic', icon: 'swap_horiz', prompt: 'If I switch to a completely different topic now, what happens to engagement?' },
  { label: 'Pair Students', icon: 'group_work', prompt: 'If I pair struggling students with high-performers, what outcome do you predict?' },
];

/* ═══════════════════════════════════════════════ */
/*  SPARKLINE                                      */
/* ═══════════════════════════════════════════════ */
function Sparkline({ data, color, gradientId, width = 64, height = 28 }) {
  const d = data && data.length >= 2 ? data : [35, 42, 38, 55, 50, 65, 58, 72, 68, 78];
  const max = Math.max(...d);
  const min = Math.min(...d);
  const range = max - min || 1;
  const points = d.map((v, i) =>
    `${(i / (d.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`
  ).join(' ');
  const areaPoints = points + ` ${width},${height} 0,${height}`;
  const gId = gradientId || `g-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const lastX = width;
        const lastY = height - 2 - ((d[d.length - 1] - min) / range) * (height - 4);
        return <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />;
      })()}
    </svg>
  );
}

/* ═══════════════════════════════════════════════ */
/*  ANIMATED COUNTER                               */
/* ═══════════════════════════════════════════════ */
function AnimatedValue({ value, suffix = '%' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const target = parseInt(value);
    const duration = 800;
    const start = display;
    const diff = target - start;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);
  if (value == null) return <span style={{ color: '#D1D5DB' }}>—</span>;
  return <>{display}{suffix}</>;
}

/* ═══════════════════════════════════════════════ */
/*  RICH TEXT — renders **bold**                    */
/* ═══════════════════════════════════════════════ */
function RichText({ text, isUser }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 700, color: isUser ? '#fff' : '#111827' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/* ═══════════════════════════════════════════════ */
/*  SIMULATION CARD                                */
/* ═══════════════════════════════════════════════ */
function SimulationCard({ simulation }) {
  if (!simulation) return null;
  const p = simulation.prediction;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(168,85,247,0.08) 100%)',
      border: '1px solid rgba(139,92,246,0.12)',
      borderRadius: '20px', padding: '20px', marginTop: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(139,92,246,0.25)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>science</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Predictive Simulation
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
          padding: '4px 10px', borderRadius: '20px',
          background: '#EDE9FE', color: '#7C3AED',
        }}>
          {Math.round((simulation.confidence || 0) * 100)}% confidence
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        {[
          { label: 'COLLECTIVE FOCUS', before: p.focusBefore, after: p.focusAfter, delta: p.focusDelta, icon: 'visibility', color: '#3B82F6' },
          { label: 'PASS RATE', before: p.passRateBefore, after: p.passRateAfter, delta: p.passRateDelta, icon: 'school', color: '#10B981' },
        ].map((m, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '16px', padding: '16px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: m.color }}>{m.icon}</span>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.06em' }}>{m.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-headline" style={{ fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>{m.after}%</span>
              <span style={{ fontSize: '12px', color: '#D1D5DB', textDecoration: 'line-through' }}>{m.before}%</span>
            </div>
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: m.delta.startsWith('+') ? '#10B981' : '#EF4444',
              display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '6px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {m.delta.startsWith('+') ? 'trending_up' : 'trending_down'}
              </span>
              {m.delta}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        fontSize: '13px', color: '#374151', lineHeight: 1.75,
        background: 'rgba(255,255,255,0.7)', borderRadius: '14px',
        padding: '14px 16px', border: '1px solid rgba(0,0,0,0.04)',
      }}>
        {simulation.reasoning}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  NUDGE ACTION CARD                              */
/* ═══════════════════════════════════════════════ */
function NudgeCard({ nudgeAction }) {
  if (!nudgeAction) return null;
  const ok = nudgeAction.success;
  return (
    <div style={{
      background: ok
        ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.10))'
        : 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.10))',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)'}`,
      borderRadius: '18px', padding: '16px 18px', marginTop: '12px',
      display: 'flex', alignItems: 'flex-start', gap: '14px',
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '11px', flexShrink: 0,
        background: ok ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: ok ? '0 4px 14px rgba(16,185,129,0.25)' : '0 4px 14px rgba(245,158,11,0.25)',
      }}>
        <span className="material-symbols-outlined filled" style={{ fontSize: '17px', color: '#fff' }}>
          {ok ? 'check_circle' : 'info'}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          {ok ? '✅ Focus Nudge Delivered' : 'ℹ️ No Action Required'}
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65 }}>{nudgeAction.message}</div>
        {nudgeAction.students?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {nudgeAction.students.map((s, i) => (
              <span key={i} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                background: 'rgba(255,255,255,0.8)', color: '#1A5C3B',
                border: '1px solid rgba(26,92,59,0.15)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: '-2px', marginRight: '4px' }}>person</span>
                {s.name} — {s.attention}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════ */
/*  MAIN COMPONENT                                 */
/* ═══════════════════════════════════════════════ */
export default function AITutor() {
  const { session, user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to the **Twin Insight Engine**. I'm your classroom's cognitive orchestrator with real-time access to your Digital Twin — student engagement, gaze vectors, comprehension heatmaps, and predictive models.\n\nAsk me about confusion hotspots, run what-if simulations, or trigger focus-nudges. What do you need?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [twinState, setTwinState] = useState(null);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [hoveredPrompt, setHoveredPrompt] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Teacher';

  const getAuthHeaders = useCallback(() => {
    const token = session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, [session]);

  const fetchTwinState = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/twin-state`, { headers: getAuthHeaders() });
      if (res.ok) setTwinState(await res.json());
    } catch (err) { /* silent */ }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchTwinState();
    const interval = setInterval(fetchTwinState, 15000);
    return () => clearInterval(interval);
  }, [fetchTwinState]);

  // Auto-send prompt from navigation state (e.g. from Analytics page "Generate Remedial Plan")
  const autoPromptHandled = useRef(false);
  useEffect(() => {
    if (location.state?.autoPrompt && !autoPromptHandled.current) {
      autoPromptHandled.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleSend(location.state.autoPrompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text, mode = 'chat') => {
    const msgText = text || input.trim();
    if (!msgText) return;
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setInput('');
    setIsTyping(true);
    setShowSimPanel(false);
    try {
      const res = await fetch(`${API}/api/twin-chat`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ message: msgText, mode, conversationHistory: messages.slice(-6) }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, type: data.type, simulation: data.simulation, nudgeAction: data.nudgeAction, metadata: data.metadata }]);
        fetchTwinState();
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to Twin Engine failed. Please try again.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const focus = twinState?.collectiveFocus;
  const passRate = twinState?.predictedPassRate;
  const isLive = twinState?.isLive;
  const hasOnlyWelcome = messages.length <= 1;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F5F6FA', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* ══════════ HEADER ══════════ */}
        <div style={{
          padding: '14px 28px',
          background: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* Twin Engine Icon */}
          <div className="te-icon-wrap" style={{
            width: '44px', height: '44px', borderRadius: '14px', position: 'relative',
            background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(26, 92, 59, 0.25)',
          }}>
            <span className="material-symbols-outlined filled" style={{ color: '#4DE89A', fontSize: '22px' }}>neurology</span>
            <div className="te-icon-ring" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="font-headline" style={{
              fontSize: '18px', fontWeight: 800, letterSpacing: '-0.01em',
              color: '#111827', lineHeight: 1.2, margin: 0,
            }}>Twin Insight Engine</h1>
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', letterSpacing: '0.02em' }}>
              Cognitive Orchestrator • RAG + Gemini 2.0 Flash
            </p>
          </div>

          {/* Compact metrics */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Focus */}
            <div className="te-metric-pill" style={{ borderLeft: '3px solid #3B82F6' }}>
              <span className="te-metric-label">Focus</span>
              <span className="te-metric-value" style={{ color: '#3B82F6' }}>
                <AnimatedValue value={focus} />
              </span>
              <Sparkline data={null} color="#3B82F6" gradientId="hf" width={48} height={20} />
            </div>
            {/* Pass Rate */}
            <div className="te-metric-pill" style={{ borderLeft: '3px solid #10B981' }}>
              <span className="te-metric-label">Pass</span>
              <span className="te-metric-value" style={{ color: '#10B981' }}>
                <AnimatedValue value={passRate} />
              </span>
              <Sparkline data={null} color="#10B981" gradientId="hp" width={48} height={20} />
            </div>
            {/* Sync / Students */}
            <div className="te-metric-pill" style={{
              borderLeft: `3px solid ${isLive ? '#10B981' : '#F59E0B'}`,
              gap: '6px',
            }}>
              <div className="te-live-dot" data-live={isLive ? 'true' : 'false'} />
              <span style={{
                fontSize: '11px', fontWeight: 700,
                color: isLive ? '#1A5C3B' : '#92400E',
                letterSpacing: '0.06em',
              }}>
                {isLive ? 'LIVE' : 'IDLE'}
              </span>
              <span style={{
                fontSize: '11px', color: '#9CA3AF', fontWeight: 600,
                marginLeft: '2px',
              }}>
                {twinState?.dataPoints || 0} pts
              </span>
              <div style={{
                width: '1px', height: '18px', background: '#EAECF0',
                margin: '0 4px',
              }} />
              <span className="font-headline" style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                {twinState?.totalStudents || 0}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9CA3AF' }}>person</span>
            </div>
          </div>
        </div>

        {/* ══════════ CHAT AREA ══════════ */}
        <div className="te-chat-scroll" style={{
          flex: 1, overflowY: 'auto',
          padding: hasOnlyWelcome ? '0' : '24px 32px',
          display: 'flex', flexDirection: 'column',
          background: '#F5F6FA',
        }}>

          {/* ── WELCOME STATE ── */}
          {hasOnlyWelcome && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '40px 32px',
            }}>
              {/* Hero icon */}
              <div className="te-hero-icon">
                <div className="te-hero-icon-inner">
                  <span className="material-symbols-outlined filled" style={{ color: '#4DE89A', fontSize: '38px' }}>neurology</span>
                </div>
                <div className="te-hero-ring" />
                <div className="te-hero-ring te-hero-ring-2" />
              </div>

              <h2 className="font-headline" style={{
                fontSize: '26px', fontWeight: 800, color: '#111827',
                letterSpacing: '-0.02em', marginBottom: '8px', marginTop: '24px',
              }}>
                What can I help you with?
              </h2>
              <p style={{
                fontSize: '14px', color: '#9CA3AF', lineHeight: 1.7,
                maxWidth: '460px', textAlign: 'center', marginBottom: '36px',
              }}>
                Your cognitive orchestrator with real-time Digital Twin access.
                Try one of the quick actions below.
              </p>

              {/* Prompt grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                maxWidth: '640px', width: '100%',
              }}>
                {suggestedPrompts.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.text)}
                    onMouseEnter={() => setHoveredPrompt(i)}
                    onMouseLeave={() => setHoveredPrompt(null)}
                    className="te-prompt-card"
                    style={{
                      transform: hoveredPrompt === i ? 'translateY(-3px)' : 'translateY(0)',
                      boxShadow: hoveredPrompt === i ? '0 8px 28px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                      borderColor: hoveredPrompt === i ? '#1A5C3B' : '#EAECF0',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '11px',
                      background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: p.color }}>{p.icon}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.5 }}>{p.text}</span>
                  </button>
                ))}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px',
                maxWidth: '426px', width: '100%', marginTop: '10px',
              }}>
                {suggestedPrompts.slice(3).map((p, i) => (
                  <button
                    key={i + 3}
                    onClick={() => handleSend(p.text)}
                    onMouseEnter={() => setHoveredPrompt(i + 3)}
                    onMouseLeave={() => setHoveredPrompt(null)}
                    className="te-prompt-card"
                    style={{
                      transform: hoveredPrompt === i + 3 ? 'translateY(-3px)' : 'translateY(0)',
                      boxShadow: hoveredPrompt === i + 3 ? '0 8px 28px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                      borderColor: hoveredPrompt === i + 3 ? '#1A5C3B' : '#EAECF0',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '11px',
                      background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: p.color }}>{p.icon}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.5 }}>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CONVERSATION MESSAGES ── */}
          {!hasOnlyWelcome && messages.map((msg, i) => (
            <div key={i} className="te-msg-row" style={{
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <div className="te-avatar" style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #1A5C3B, #2D7A52)'
                  : 'linear-gradient(135deg, #0f3d26, #1A5C3B)',
                boxShadow: msg.role === 'user'
                  ? '0 4px 14px rgba(26,92,59,0.2)'
                  : '0 4px 14px rgba(26,92,59,0.25)',
                overflow: 'hidden',
              }}>
                {msg.role === 'user' ? (
                  user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '13px', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{displayName[0]?.toUpperCase()}</span>
                  )
                ) : (
                  <span className="material-symbols-outlined filled" style={{ color: '#4DE89A', fontSize: '18px' }}>neurology</span>
                )}
              </div>

              {/* Content */}
              <div style={{ maxWidth: '68%', minWidth: 0 }}>
                {/* Sender label */}
                <div style={{
                  fontSize: '12px', fontWeight: 600, marginBottom: '5px',
                  color: msg.role === 'user' ? '#6B7280' : '#1A5C3B',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.role === 'user' ? displayName : 'Twin Engine'}
                  {msg.role === 'assistant' && (
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#1A5C3B' }}>verified</span>
                  )}
                </div>

                {/* Context data badge */}
                {msg.metadata?.contextUsed && msg.role === 'assistant' && (
                  <div className="te-context-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>database</span>
                    {msg.metadata.dataPoints} data points grounded
                    {msg.metadata.model && msg.metadata.model !== 'simulated' && (
                      <span style={{ color: '#9CA3AF' }}>• {msg.metadata.model}</span>
                    )}
                  </div>
                )}

                {/* Chat bubble */}
                <div className={`te-bubble ${msg.role === 'user' ? 'te-bubble-user' : 'te-bubble-ai'}`}>
                  <RichText text={msg.content} isUser={msg.role === 'user'} />
                </div>

                {msg.simulation && <SimulationCard simulation={msg.simulation} />}
                {msg.nudgeAction && <NudgeCard nudgeAction={msg.nudgeAction} />}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="te-msg-row">
              <div className="te-avatar" style={{
                background: 'linear-gradient(135deg, #0f3d26, #1A5C3B)',
                boxShadow: '0 4px 14px rgba(26,92,59,0.25)',
              }}>
                <span className="material-symbols-outlined filled" style={{ color: '#4DE89A', fontSize: '18px' }}>neurology</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: '#1A5C3B' }}>
                  Twin Engine
                </div>
                <div className="te-bubble te-bubble-ai" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" style={{ animationDelay: '0.15s' }} />
                  <div className="typing-dot" style={{ animationDelay: '0.3s' }} />
                  <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px', fontWeight: 500 }}>Querying twin state…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ══════════ SIMULATION PANEL ══════════ */}
        {showSimPanel && (
          <div className="te-sim-panel">
            <div style={{
              width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(139, 92, 246, 0.2)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fff' }}>science</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em' }}>WHAT-IF:</span>
            {simulationPresets.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.prompt, 'simulate')}
                className="te-sim-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{p.icon}</span>
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowSimPanel(false)}
              className="te-sim-close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#9CA3AF' }}>close</span>
            </button>
          </div>
        )}

        {/* ══════════ INPUT BAR ══════════ */}
        <div style={{
          padding: '14px 28px 18px',
          background: '#FFFFFF',
          borderTop: '1px solid #EAECF0',
        }}>
          <div className={`te-input-bar ${inputFocused ? 'te-input-focused' : ''}`}>
            {/* Simulate button */}
            <button
              onClick={() => setShowSimPanel(prev => !prev)}
              title="Run What-If Simulation"
              className={`te-input-btn ${showSimPanel ? 'te-input-btn-active-sim' : ''}`}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: '19px', color: showSimPanel ? '#fff' : '#9CA3AF',
              }}>science</span>
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask the Twin Engine anything…"
              rows={1}
              className="te-textarea"
            />

            {/* Send */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="te-send-btn"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #1A5C3B, #2D7A52)'
                  : '#F3F4F6',
                boxShadow: input.trim() ? '0 4px 14px rgba(26,92,59,0.25)' : 'none',
                transform: input.trim() ? 'scale(1)' : 'scale(0.92)',
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: '19px', color: input.trim() ? '#fff' : '#C4C7CE',
              }}>arrow_upward</span>
            </button>
          </div>
          <p style={{ fontSize: '10px', color: '#C4C7CE', marginTop: '8px', textAlign: 'center', letterSpacing: '0.01em' }}>
            Responses grounded in live classroom telemetry via RAG pipeline
          </p>
        </div>
      </main>

      {/* ══════════ STYLES ══════════ */}
      <style>{`
        /* ANIMATIONS */
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes iconPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
          50% { opacity: 0.5; box-shadow: 0 0 2px rgba(16,185,129,0.2); }
        }

        /* TYPING DOTS */
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #1A5C3B;
          animation: typingBounce 1.2s infinite ease-in-out;
        }

        /* HEADER ICON RING */
        .te-icon-ring {
          position: absolute; inset: -3px; border-radius: 17px;
          border: 2px solid rgba(77, 232, 154, 0.25);
          animation: iconPulse 3s ease-in-out infinite;
        }

        /* HERO ICON */
        .te-hero-icon {
          position: relative; width: 80px; height: 80px;
        }
        .te-hero-icon-inner {
          width: 80px; height: 80px; border-radius: 24px;
          background: linear-gradient(135deg, #1A5C3B, #2D7A52);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 32px rgba(26, 92, 59, 0.2);
          position: relative; z-index: 1;
        }
        .te-hero-ring {
          position: absolute; inset: -6px; border-radius: 30px;
          border: 2px solid rgba(26, 92, 59, 0.15);
          animation: iconPulse 3s ease-in-out infinite;
        }
        .te-hero-ring-2 {
          inset: -14px; border-radius: 38px;
          animation: iconPulse2 3s ease-in-out infinite 0.5s;
        }

        /* METRIC PILLS */
        .te-metric-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 12px;
          background: #FAFBFC; border: 1px solid #EAECF0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .te-metric-label {
          font-size: 10px; font-weight: 700; color: #9CA3AF;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .te-metric-value {
          font-size: 16px; font-weight: 800; letter-spacing: -0.02em;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        /* LIVE DOT */
        .te-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
        }
        .te-live-dot[data-live="true"] {
          background: #10B981;
          box-shadow: 0 0 8px rgba(16,185,129,0.5);
          animation: liveDotPulse 2s ease-in-out infinite;
        }
        .te-live-dot[data-live="false"] {
          background: #D1D5DB;
        }

        /* PROMPT CARDS */
        .te-prompt-card {
          padding: 16px 14px; border-radius: 16px;
          background: #FFFFFF;
          border: 1.5px solid #EAECF0;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column; gap: 10px;
          text-align: left;
        }
        .te-prompt-card:hover {
          border-color: #1A5C3B !important;
          box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important;
          transform: translateY(-3px) !important;
        }

        /* MESSAGE ROW */
        .te-msg-row {
          display: flex; gap: 12px; align-items: flex-start;
          margin-bottom: 22px;
          animation: chatSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* AVATAR */
        .te-avatar {
          width: 38px; height: 38px; min-width: 38px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
        }

        /* BUBBLE */
        .te-bubble {
          padding: 14px 18px; font-size: 13.5px; line-height: 1.8;
          white-space: pre-wrap; word-break: break-word;
        }
        .te-bubble-user {
          border-radius: 20px 20px 4px 20px;
          background: linear-gradient(135deg, #1A5C3B, #236B47);
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(26, 92, 59, 0.18);
        }
        .te-bubble-ai {
          border-radius: 20px 20px 20px 4px;
          background: #FFFFFF;
          color: #1F2937;
          border: 1px solid #EAECF0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        /* CONTEXT BADGE */
        .te-context-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px; margin-bottom: 6px;
          background: #EFF6FF;
          border: 1px solid rgba(59,130,246,0.12);
          font-size: 11px; font-weight: 600; color: #3B82F6;
        }

        /* SIM PANEL */
        .te-sim-panel {
          padding: 14px 28px;
          border-top: 1px solid #EAECF0;
          background: linear-gradient(135deg, #FAFBFC, #F5F3FF);
          display: flex; gap: 10px; align-items: center;
          animation: chatSlideIn 0.25s ease forwards;
        }
        .te-sim-btn {
          padding: 7px 14px; border-radius: 10px;
          background: #fff; border: 1px solid rgba(139,92,246,0.15);
          font-size: 12px; font-weight: 600; color: #6D28D9;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .te-sim-btn:hover {
          border-color: #8B5CF6; background: #F5F3FF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139,92,246,0.1);
        }
        .te-sim-close {
          margin-left: auto; width: 28px; height: 28px; border-radius: 8px;
          background: rgba(0,0,0,0.04); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .te-sim-close:hover {
          background: rgba(0,0,0,0.08);
        }

        /* INPUT BAR */
        .te-input-bar {
          display: flex; align-items: flex-end; gap: 8px;
          background: #F9FAFB;
          border-radius: 18px;
          padding: 8px 10px;
          border: 2px solid transparent;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .te-input-focused {
          border-color: #1A5C3B !important;
          background: #FFFFFF !important;
          box-shadow: 0 0 0 4px rgba(26, 92, 59, 0.08), 0 2px 12px rgba(0,0,0,0.06) !important;
        }

        .te-input-btn {
          width: 38px; height: 38px; border-radius: 11px;
          border: none; background: rgba(0,0,0,0.04);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .te-input-btn:hover {
          background: rgba(139,92,246,0.08);
        }
        .te-input-btn:hover .material-symbols-outlined {
          color: #8B5CF6 !important;
        }
        .te-input-btn-active-sim {
          background: linear-gradient(135deg, #8B5CF6, #A78BFA) !important;
          box-shadow: 0 3px 10px rgba(139,92,246,0.25);
        }

        .te-textarea {
          flex: 1; background: none; border: none; outline: none;
          color: #111827; font-size: 14px; resize: none;
          line-height: 1.5; font-family: 'Inter', sans-serif;
          min-height: 24px; max-height: 120px;
          padding: 6px 4px;
        }
        .te-textarea::placeholder {
          color: #B0B6C0;
        }

        .te-send-btn {
          width: 38px; height: 38px; border-radius: 11px;
          border: none;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0;
        }

        /* SCROLLBAR */
        .te-chat-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .te-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .te-chat-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }
        .te-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
