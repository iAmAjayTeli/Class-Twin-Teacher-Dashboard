import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useLiveKit from '../hooks/useLiveKit';
import LiveVideoRoom from '../components/LiveVideoRoom';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

export default function SessionLobby() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const [resolvedSessionId, setResolvedSessionId] = useState(sessionIdFromUrl || null);
  const [sessionSubject, setSessionSubject] = useState('');

  const { students, qrCode, quizResults, leaderboard: socketLeaderboard } = useSocket(code);
  const { token, livekitUrl, isStreaming, loading: lkLoading, error: lkError, startStream, stopStream, rejoinStream } = useLiveKit();
  const rejoinAttemptedRef = useRef(false);

  const [sessionCode] = useState(code || 'ABC123');
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveViewers, setLiveViewers] = useState([]);

  // Quiz state
  const [quizTopic, setQuizTopic] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizError, setQuizError] = useState(null);
  const [quizSent, setQuizSent] = useState(false);
  const [quizSending, setQuizSending] = useState(false);
  const [quizSentCount, setQuizSentCount] = useState(0);
  const [showQuizPanel, setShowQuizPanel] = useState(false);

  // Hand raise + Chat state (from Supabase Realtime)
  const [handRaises, setHandRaises] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [teacherReply, setTeacherReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const chatEndRef = useRef(null);
  
  // Realtime Leaderboard (from Supabase Realtime DB subscription)
  const [realtimeLeaderboard, setRealtimeLeaderboard] = useState([]);

  // Merge socket-based and Supabase-based leaderboards — prefer whichever has more entries (more recent data)
  const mergedLeaderboard = (socketLeaderboard && socketLeaderboard.length > 0)
    ? socketLeaderboard
    : realtimeLeaderboard;

  const joinUrl = `${window.location.origin.replace(':5173', ':5174')}/join?code=${sessionCode}`;

  const joinedStudents = liveViewers.length > 0 ? liveViewers : (students || []);

  const handleParticipantsChange = useCallback((viewers) => {
    setLiveViewers(viewers);
  }, []);

  // Elapsed timer once streaming
  useEffect(() => {
    if (!isStreaming) return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isStreaming]);

  // Resolve sessionId (and subject + streaming state) from DB by join code
  useEffect(() => {
    if (!code) return;
    supabase
      .from('sessions')
      .select('id, subject, is_streaming, stream_started_at')
      .eq('join_code', code)
      .single()
      .then(({ data }) => {
        if (data?.id && !resolvedSessionId) setResolvedSessionId(data.id);
        if (data?.subject) setSessionSubject(data.subject);
        // If session is still live, compute elapsed time from stream_started_at
        if (data?.is_streaming && data?.stream_started_at) {
          const startedAt = new Date(data.stream_started_at).getTime();
          const now = Date.now();
          const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
          setElapsed(elapsedSec);
        }
      });
  }, [code]);

  // Auto-rejoin stream on page refresh if session is still live in DB
  useEffect(() => {
    if (!resolvedSessionId || isStreaming || token || lkLoading || rejoinAttemptedRef.current) return;
    rejoinAttemptedRef.current = true;
    rejoinStream(resolvedSessionId).then((result) => {
      if (result) {
        console.log('🔄 Auto-rejoined live stream after refresh');
      }
    });
  }, [resolvedSessionId, isStreaming, token, lkLoading, rejoinStream]);

  // Supabase Realtime: hand raises + chat messages
  useEffect(() => {
    if (!resolvedSessionId) return;

    supabase
      .from('hand_raises')
      .select('id, student_id, raised_at, lowered_at, session_students(student_name)')
      .eq('session_id', resolvedSessionId)
      .is('lowered_at', null)
      .then(({ data }) => { if (data) setHandRaises(data); });

    supabase
      .from('chat_messages')
      .select('id, student_name, message_text, is_anonymous, is_teacher, sent_at')
      .eq('session_id', resolvedSessionId)
      .order('sent_at', { ascending: true })
      .limit(50)
      .then(({ data }) => { if (data) setChatMessages(data); });

    const handSub = supabase
      .channel(`hand_raises:${resolvedSessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hand_raises', filter: `session_id=eq.${resolvedSessionId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          supabase.from('hand_raises').select('id, student_id, raised_at, lowered_at, session_students(student_name)').eq('id', payload.new.id).single()
            .then(({ data }) => { if (data) setHandRaises(prev => [...prev.filter(h => h.id !== data.id), data]); });
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.lowered_at) setHandRaises(prev => prev.filter(h => h.id !== payload.new.id));
        } else if (payload.eventType === 'DELETE') {
          setHandRaises(prev => prev.filter(h => h.id !== payload.old.id));
        }
      }).subscribe();

    const chatSub = supabase
      .channel(`chat_messages:${resolvedSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${resolvedSessionId}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new]);
        setShowChatPanel(true);
      }).subscribe();

    // Compute Leaderboard
    const fetchLeaderboard = async () => {
      if (!resolvedSessionId) return;
      const { data: sessionResponses } = await supabase
        .from('student_responses')
        .select('response, responded_at, session_students!student_responses_student_id_fkey(student_name), questions!student_responses_question_id_fkey(correct_option)')
        .eq('session_id', resolvedSessionId);

      const scoreBoard = {};
      if (sessionResponses) {
        sessionResponses.forEach(r => {
          const studentName = r.session_students?.student_name || 'Unknown';
          if (!scoreBoard[studentName]) scoreBoard[studentName] = { name: studentName, score: 0, lastCorrectTime: 0 };
          
          if (r.questions?.correct_option === String(r.response)) {
            scoreBoard[studentName].score += 10;
            const ansTime = new Date(r.responded_at || 0).getTime();
            if (ansTime > scoreBoard[studentName].lastCorrectTime) {
               scoreBoard[studentName].lastCorrectTime = ansTime;
            }
          }
        });
      }

      const board = Object.values(scoreBoard)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.lastCorrectTime - b.lastCorrectTime;
        })
        .map(({ name, score }) => ({ name, score }));
        
      setRealtimeLeaderboard(board);
    };

    fetchLeaderboard();

    const responseSub = supabase
      .channel(`student_responses:${resolvedSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_responses', filter: `session_id=eq.${resolvedSessionId}` }, () => {
        fetchLeaderboard();
      }).subscribe();

    return () => {
      supabase.removeChannel(handSub);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(responseSub);
    };
  }, [resolvedSessionId]);

  useEffect(() => {
    if (showChatPanel) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatPanel]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoLive = async () => {
    if (!resolvedSessionId) { navigate(`/dashboard?code=${sessionCode}`); return; }
    try { await startStream(resolvedSessionId); } catch (err) { console.error('Failed to start stream:', err); }
  };

  const endingRef = useRef(false);
  const handleEndStream = async () => {
    // Guard against double-fire (DisconnectButton click + onDisconnected event)
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      if (resolvedSessionId) {
        await stopStream(resolvedSessionId);
      }
    } catch (err) {
      console.error('Error ending stream:', err);
    }
    navigate(`/dashboard?code=${sessionCode}`);
  };

  const handleSendTeacherReply = async () => {
    if (!teacherReply.trim() || !resolvedSessionId || sendingReply) return;
    setSendingReply(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${resolvedSessionId}/teacher-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ message: teacherReply.trim() }),
      });
      if (res.ok) setTeacherReply('');
      else console.error('Teacher reply failed:', await res.text());
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim() || !resolvedSessionId) return;
    setQuizLoading(true); setQuizError(null); setGeneratedQuiz(null); setQuizSent(false); setQuizSentCount(0);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) { setQuizError('Not authenticated'); return; }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${resolvedSessionId}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ topic: quizTopic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedQuiz(data);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate quiz');
      }
    } catch (err) { setQuizError(err.message); } finally { setQuizLoading(false); }
  };

  const handleSendQuizToStudents = async () => {
    if (!generatedQuiz?.roundNumber || !resolvedSessionId || quizSending || quizSent) return;
    setQuizSending(true); setQuizError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${resolvedSessionId}/send-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ roundNumber: generatedQuiz.roundNumber, questions: generatedQuiz.questions }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuizSent(true);
        setQuizSentCount(data.studentCount || 0);
      } else {
        const err = await res.json();
        setQuizError(err.error || 'Failed to send quiz');
      }
    } catch (err) { setQuizError(err.message); } finally { setQuizSending(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', backgroundColor: 'var(--background)', color: 'var(--on-surface)', fontFamily: "'Inter', sans-serif" }}>

        {/* Top bar */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 32px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--outline)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ClassTwin</span>
            <div style={{ height: '14px', width: '1px', backgroundColor: 'var(--outline)' }} />
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Lobby</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isStreaming && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '999px',
                backgroundColor: '#FEE2E2', border: '1px solid #FECACA',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', letterSpacing: '0.06em' }}>LIVE · {formatTime(elapsed)}</span>
              </div>
            )}
            {handRaises.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '999px',
                backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
                animation: 'pulse-glow 1.8s ease-in-out infinite',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#D97706' }}>front_hand</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309' }}>{handRaises.length} raised</span>
              </div>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '999px',
              backgroundColor: 'var(--primary-light)', border: '1px solid rgba(26,92,59,0.2)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>{joinedStudents.length} Students</span>
            </div>
          </div>
        </nav>

        {/* Title */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 32px 0px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            {sessionSubject && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 12px', borderRadius: '999px',
                background: 'var(--primary-light)', border: '1px solid rgba(26,92,59,0.2)',
                fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>school</span>
                {sessionSubject}
              </span>
            )}
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 600, margin: 0 }}>
              Today's Topic
            </p>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {sessionCode}
          </h1>
        </div>

        {/* Main 2-column layout */}
        <main style={{
          position: 'relative', zIndex: 10,
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '28px', maxWidth: '1280px', margin: '0 auto',
          padding: '20px 32px 48px', alignItems: 'start',
        }}>

          {/* LEFT — Video */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Video Room */}
            <div style={{
              borderRadius: '20px', overflow: 'hidden',
              backgroundColor: isStreaming ? '#000' : 'var(--surface-container)',
              border: '1px solid var(--outline)',
              boxShadow: 'var(--shadow-sm)',
              minHeight: '360px',
              display: 'flex', flexDirection: 'column',
            }}>
              {isStreaming ? (
                <div style={{ padding: '12px', height: '100%', width: '100%', boxSizing: 'border-box', minHeight: '380px' }}>
                  <LiveVideoRoom
                    token={token}
                    serverUrl={livekitUrl}
                    onDisconnect={handleEndStream}
                    onParticipantsChange={handleParticipantsChange}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 32px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '20px',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '38px', color: 'var(--primary)' }}>videocam</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ready to go live?</p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '13px', lineHeight: 1.6 }}>
                      Students will be notified automatically via Supabase Realtime.<br />
                      They can join via the QR code or session code →
                    </p>
                  </div>
                  {lkError && (
                    <div style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'var(--error-container)', border: '1px solid #FECACA', fontSize: '13px', color: 'var(--error)', maxWidth: '320px', textAlign: 'center' }}>
                      {lkError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Students strip */}
            {joinedStudents.length > 0 && (
              <div style={{ padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-xs)' }}>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {joinedStudents.length} joined
                </span>
                <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
                  {joinedStudents.slice(0, 8).map((s, i) => (
                    <span key={s.id || i} style={{
                      padding: '3px 10px', borderRadius: '999px',
                      backgroundColor: 'var(--primary-light)', border: '1px solid rgba(26,92,59,0.2)',
                      fontSize: '11px', fontWeight: 600, color: 'var(--primary)',
                    }}>{s.name}</span>
                  ))}
                  {joinedStudents.length > 8 && (
                    <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', alignSelf: 'center' }}>+{joinedStudents.length - 8} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Quiz Panel */}
            {isStreaming && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setShowQuizPanel(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '13px', borderRadius: '14px', cursor: 'pointer', border: '1px solid var(--outline)',
                    background: showQuizPanel ? 'var(--primary-light)' : 'var(--surface)',
                    color: showQuizPanel ? 'var(--primary)' : 'var(--on-surface)',
                    fontWeight: 700, fontSize: '14px', transition: 'all 0.25s',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>quiz</span>
                  {showQuizPanel ? 'Hide Quiz Panel' : 'Send Quiz to Students'}
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', transition: 'transform 0.3s', transform: showQuizPanel ? 'rotate(180deg)' : 'none', marginLeft: 'auto' }}>expand_more</span>
                </button>

                {showQuizPanel && (
                  <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                        Quiz Topic
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="e.g. Binary Search Trees, Photosynthesis..."
                          value={quizTopic}
                          onChange={e => setQuizTopic(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !quizLoading && handleGenerateQuiz()}
                          disabled={quizLoading}
                          style={{
                            flex: 1, padding: '10px 14px', borderRadius: '10px',
                            backgroundColor: 'var(--surface-container-low)',
                            border: '1px solid var(--outline)',
                            color: 'var(--on-surface)', fontSize: '14px', fontWeight: 500, outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleGenerateQuiz}
                          disabled={quizLoading || !quizTopic.trim()}
                          className="ct-btn-primary"
                          style={{ opacity: (!quizTopic.trim() || quizLoading) ? 0.5 : 1, whiteSpace: 'nowrap', padding: '10px 18px' }}
                        >
                          {quizLoading ? (
                            <><span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Generating...</>
                          ) : (
                            <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>Generate</>
                          )}
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--on-surface-dim)', marginTop: '6px' }}>
                        Gemini AI will create 3 MCQ questions and send them to all students instantly
                      </p>
                    </div>

                    {quizError && (
                      <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--error-container)', border: '1px solid #FECACA', fontSize: '13px', color: 'var(--error)' }}>
                        {quizError}
                      </div>
                    )}

                    {generatedQuiz?.questions && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>quiz</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>
                              {generatedQuiz.questions.length} Questions · Round {generatedQuiz.roundNumber}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#E0F2FE', color: '#0284C7', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                              {generatedQuiz.source === 'gemini' ? 'Gemini AI' : 'Fallback'}
                            </span>
                          </div>
                        </div>

                        {/* Questions preview */}
                        {generatedQuiz.questions.map((q, qi) => {
                          const results = quizResults[q.id];
                          return (
                            <div key={q.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline)' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ width: '26px', height: '26px', minWidth: '26px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>{qi + 1}</span>
                                <p style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.5, flex: 1, color: 'var(--on-surface)' }}>{q.question}</p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '36px' }}>
                                {q.options.map((opt, oi) => {
                                  const isCorrect = oi === q.correctIndex;
                                  return (
                                    <div key={oi} style={{
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      padding: '7px 10px', borderRadius: '8px',
                                      backgroundColor: isCorrect ? 'var(--primary-light)' : 'var(--surface)',
                                      border: `1px solid ${isCorrect ? 'rgba(26,92,59,0.3)' : 'var(--outline)'}`,
                                    }}>
                                      <span style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, backgroundColor: isCorrect ? 'rgba(26,92,59,0.15)' : 'var(--surface-container)', color: isCorrect ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                                        {String.fromCharCode(65 + oi)}
                                      </span>
                                      <span style={{ fontSize: '13px', color: isCorrect ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: isCorrect ? 600 : 400, flex: 1 }}>{opt}</span>
                                      {isCorrect && <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check</span>}
                                    </div>
                                  );
                                })}
                              </div>
                              {results && (
                                <div style={{ marginTop: '10px', marginLeft: '36px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Responses</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: results.correctPercent >= 70 ? 'var(--primary)' : results.correctPercent >= 40 ? '#D97706' : 'var(--error)' }}>
                                      {results.correctPercent}% correct · {results.totalResponses} answered
                                    </span>
                                  </div>
                                  <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--outline)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', width: `${results.correctPercent}%`, backgroundColor: results.correctPercent >= 70 ? 'var(--primary)' : results.correctPercent >= 40 ? '#F59E0B' : 'var(--error)', transition: 'width 0.5s ease' }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* ── SEND TO STUDENTS BUTTON ── */}
                        {!quizSent ? (
                          <button
                            onClick={handleSendQuizToStudents}
                            disabled={quizSending}
                            style={{
                              width: '100%', padding: '15px 20px',
                              borderRadius: '14px', border: 'none', cursor: quizSending ? 'not-allowed' : 'pointer',
                              background: quizSending ? '#9CA3AF' : 'linear-gradient(135deg, #1A5C3B 0%, #2D7A52 100%)',
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                              fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em',
                              boxShadow: quizSending ? 'none' : '0 4px 20px rgba(26,92,59,0.4)',
                              transition: 'all 0.2s',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            {quizSending ? (
                              <>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                                Sending to Students...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span>
                                🚀 Send to All Students
                              </>
                            )}
                          </button>
                        ) : (
                          <div style={{
                            padding: '14px 18px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #E8F5EE, #D1FAE5)',
                            border: '1px solid rgba(26,92,59,0.25)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1A5C3B' }}>check_circle</span>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A5C3B', margin: 0 }}>Quiz Sent Successfully!</p>
                              <p style={{ fontSize: '12px', color: '#2D7A52', margin: '2px 0 0' }}>
                                {quizSentCount > 0 ? `Delivered to ${quizSentCount} student${quizSentCount === 1 ? '' : 's'} in this session` : 'Quiz delivered to students in session'}
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => { setGeneratedQuiz(null); setQuizTopic(''); setQuizSent(false); setQuizSentCount(0); }}
                          className="ct-btn-outline"
                          style={{ padding: '9px 16px', justifyContent: 'center', fontWeight: 600, fontSize: '13px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                          Generate New Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT — Sidebar panel */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Hand Raise Panel */}
            {isStreaming && handRaises.length > 0 && (
              <div style={{
                padding: '16px', borderRadius: '16px',
                backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D97706' }}>front_hand</span>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', margin: 0 }}>Hand Raises ({handRaises.length})</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {handRaises.map((h) => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                        {(h.session_students?.student_name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#78350F', flex: 1 }}>
                        {h.session_students?.student_name || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#D97706' }}>
                        {new Date(h.raised_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {isStreaming && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-xs)' }}>
                <button
                  onClick={() => setShowChatPanel(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '12px 16px',
                    backgroundColor: showChatPanel ? 'var(--primary-light)' : 'var(--surface)',
                    border: 'none', borderBottom: showChatPanel ? '1px solid var(--outline)' : 'none',
                    cursor: 'pointer', color: showChatPanel ? 'var(--primary)' : 'var(--on-surface)',
                    fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                  Student Chat
                  {chatMessages.length > 0 && (
                    <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--primary)', color: '#fff', fontSize: '11px', fontWeight: 800 }}>
                      {chatMessages.length}
                    </span>
                  )}
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: chatMessages.length > 0 ? '0' : 'auto', transition: 'transform 0.2s', transform: showChatPanel ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                </button>

                {showChatPanel && (
                  <>
                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', backgroundColor: 'var(--surface-container-low)' }}>
                    {chatMessages.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>No messages yet</p>
                    ) : (
                      chatMessages.map((msg) => {
                        const isTeacher = msg.is_teacher;
                        return (
                          <div key={msg.id} style={{
                            padding: '8px 11px', borderRadius: '10px',
                            borderTopLeftRadius: isTeacher ? '10px' : '2px',
                            borderTopRightRadius: isTeacher ? '2px' : '10px',
                            backgroundColor: isTeacher ? 'var(--primary-light)' : 'var(--surface)',
                            border: `1px solid ${isTeacher ? 'rgba(26,92,59,0.25)' : 'var(--outline)'}`,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: isTeacher ? 'var(--primary)' : '#6366F1' }}>
                                {isTeacher ? '🎓 You (Teacher)' : (msg.is_anonymous ? 'Anonymous' : msg.student_name)}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--on-surface-dim)', whiteSpace: 'nowrap' }}>
                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--on-surface)', margin: 0, lineHeight: 1.5 }}>{msg.message_text}</p>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {/* Teacher reply input */}
                  <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--outline)' }}>
                    <input
                      type="text"
                      placeholder="Reply to class..."
                      value={teacherReply}
                      onChange={e => setTeacherReply(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !sendingReply && handleSendTeacherReply()}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-low)',
                        fontSize: '13px', color: 'var(--on-surface)', outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleSendTeacherReply}
                      disabled={!teacherReply.trim() || sendingReply}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        backgroundColor: teacherReply.trim() ? 'var(--primary)' : 'var(--outline)',
                        color: teacherReply.trim() ? '#fff' : 'var(--on-surface-variant)',
                        fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
                      }}
                    >
                      {sendingReply ? '...' : 'Send'}
                    </button>
                  </div>
                  </>
                )}
              </div>
            )}

            {/* QR + Code card — show when not streaming with students */}
            {!(isStreaming && joinedStudents.length > 0) && (
              <>
                <div style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '3px' }}>Scan to Join</p>
                    <p style={{ fontSize: '12px', color: 'var(--on-surface-dim)' }}>Works on any phone, no app needed</p>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '14px', borderRadius: '14px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--outline)' }}>
                    {qrCode ? (
                      <img src={qrCode} alt="Session QR Code" style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#111827" style={{ display: 'block' }} />
                    )}
                  </div>
                  <button onClick={handleCopy} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--outline)',
                    backgroundColor: 'var(--surface-container-low)', transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-low)'}
                  >
                    <div>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '2px' }}>Session Code</p>
                      <p style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.12em', color: 'var(--primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sessionCode}</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: copied ? 'var(--primary)' : 'var(--on-surface-variant)', fontSize: '22px', transition: 'color 0.2s' }}>
                      {copied ? 'check_circle' : 'content_copy'}
                    </span>
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--on-surface-dim)', textAlign: 'center' }}>
                    Students go to → {joinUrl}
                  </p>
                </div>

                <div style={{
                  padding: '13px 16px', borderRadius: '12px',
                  backgroundColor: isStreaming ? 'var(--primary-light)' : 'var(--surface-container-low)',
                  border: `1px solid ${isStreaming ? 'rgba(26,92,59,0.25)' : 'var(--outline)'}`,
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                    {isStreaming ? 'notifications_active' : 'notifications'}
                  </span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                      {isStreaming ? 'Students Notified!' : 'Notifications Ready'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                      {isStreaming ? 'Your student app shows the live class now' : 'Students get notified when you go live'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Students list when streaming */}
            {isStreaming && joinedStudents.length > 0 && (
              <div style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', boxShadow: 'var(--shadow-sm)', maxHeight: '280px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Students in Class</p>
                  <span className="ct-badge ct-badge-green">{joinedStudents.length} Online</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {joinedStudents.map((student, i) => (
                    <div key={student.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline)' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{student.name}</p>
                        <p style={{ fontSize: '11px', margin: 0, color: 'var(--primary)' }}>Active now</p>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-surface-dim)' }}>graphic_eq</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Go Live / End buttons */}
            {!isStreaming ? (
              <button
                onClick={handleGoLive}
                disabled={lkLoading || !resolvedSessionId}
                className="ct-btn-primary"
                style={{ width: '100%', padding: '16px', justifyContent: 'center', fontSize: '15px', fontWeight: 800, opacity: (lkLoading || !resolvedSessionId) ? 0.6 : 1, cursor: (lkLoading || !resolvedSessionId) ? 'not-allowed' : 'pointer' }}
              >
                {lkLoading ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: '22px', animation: 'spin 1s linear infinite' }}>progress_activity</span>Starting Stream...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>videocam</span>Go Live</>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/dashboard?code=${sessionCode}&sessionId=${resolvedSessionId || ''}`)}
                  className="ct-btn-primary"
                  style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '14px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                  Open Dashboard
                </button>
                <button
                  onClick={handleEndStream}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: '#FEE2E2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: '12px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call_end</span>
                  End Stream
                </button>
                
                {mergedLeaderboard && (
                  <div style={{
                    marginTop: '8px',
                    padding: '20px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1f2937, #111827)',
                    color: '#fff', border: '1px solid #374151',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#FCD34D', fontSize: '20px' }}>emoji_events</span>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live Leaderboard</h3>
                    </div>
                    {mergedLeaderboard.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mergedLeaderboard.slice(0, 5).map((student, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: '10px',
                            backgroundColor: idx === 0 ? 'rgba(252, 211, 77, 0.15)' : 'rgba(255,255,255,0.05)',
                            border: idx === 0 ? '1px solid rgba(252, 211, 77, 0.3)' : '1px solid transparent',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: idx === 0 ? '#FCD34D' : '#9CA3AF', width: '16px' }}>
                                {idx + 1}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: idx === 0 ? '#FDE68A' : '#F3F4F6' }}>
                                {student.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: idx === 0 ? '#F59E0B' : '#4B5563', padding: '2px 8px', borderRadius: '999px', color: '#fff' }}>
                              {student.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Waiting for first quiz answers...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
