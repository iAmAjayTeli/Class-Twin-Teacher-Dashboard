import { useState, useEffect, useRef, useCallback } from 'react';
import useTranscription from '../hooks/useTranscription';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * LiveTranscription — Real-time audio translation for live sessions.
 *
 * Flow:
 * 1. Teacher speaks → Web Speech API transcribes in real-time
 * 2. Transcripts sent to server → Gemini translates to student languages
 * 3. Server pushes translations to students via WebSocket
 * 4. Students' app uses TTS to speak the translation aloud
 *
 * @param {Object} props
 * @param {string} props.sessionId - Current session ID
 * @param {Object[]} props.students - Array of { name, language }
 * @param {Object} props.socket - Socket.io client instance (for emitting transcription events)
 * @param {string} props.sessionCode - Join code for the session room
 */
export default function LiveTranscription({ sessionId, students = [], socket, sessionCode }) {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [translationStatus, setTranslationStatus] = useState(null); // { count, languages }
  const [stats, setStats] = useState({ segments: 0, translated: 0 });
  const [dbStudentLangs, setDbStudentLangs] = useState({}); // name → language from DB
  const transcriptEndRef = useRef(null);
  const processingRef = useRef(false);

  // Fetch student language preferences directly from Supabase
  // (mobile students join via REST/WebRTC, not Socket.io, so props may lack language data)
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function fetchLangs() {
      try {
        // Get student names from session_students table
        const { data: sessionStudents } = await supabase
          .from('session_students')
          .select('student_name')
          .eq('session_id', sessionId);

        if (!sessionStudents?.length) return;

        const names = sessionStudents.map(s => s.student_name);
        // Get their language preferences from students table
        const { data: profiles } = await supabase
          .from('students')
          .select('name, language')
          .in('name', names);

        if (!cancelled && profiles) {
          const langMap = {};
          profiles.forEach(p => { langMap[p.name] = p.language || 'en'; });
          console.log('📡 Fetched student languages from DB:', langMap);
          setDbStudentLangs(langMap);
        }
      } catch (err) {
        console.error('Failed to fetch student languages:', err);
      }
    }

    fetchLangs();
    // Re-fetch every 15s to pick up new students
    const interval = setInterval(fetchLangs, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sessionId]);

  // Merge prop languages with DB languages (DB takes priority)
  const enrichedStudents = students.map(s => ({
    ...s,
    language: dbStudentLangs[s.name] || s.language || 'en',
  }));
  // Also add DB-only students not in the props (e.g., mobile-only students)
  Object.entries(dbStudentLangs).forEach(([name, lang]) => {
    if (!enrichedStudents.find(s => s.name === name)) {
      enrichedStudents.push({ name, language: lang });
    }
  });

  // Compute unique student languages (excluding English)
  const studentLanguages = [...new Set(
    enrichedStudents.map(s => s.language || 'en').filter(l => l !== 'en')
  )];
  const hasMultilingualStudents = studentLanguages.length > 0;

  // Language distribution
  const langDistribution = {};
  enrichedStudents.forEach(s => {
    const lang = s.language || 'en';
    langDistribution[lang] = (langDistribution[lang] || 0) + 1;
  });

  // Handle finalized transcript segment — translate and broadcast
  const handleTranscript = useCallback(async (text) => {
    if (!text.trim() || processingRef.current) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEntry = { text, timestamp, translations: null, id: Date.now() };

    setTranscripts(prev => [...prev.slice(-30), newEntry]); // Keep last 30 segments
    setStats(prev => ({ ...prev, segments: prev.segments + 1 }));

    // Translate to all student languages
    const targetLangs = studentLanguages.length > 0 ? studentLanguages : ['hi']; // Default to Hindi if no preference
    processingRef.current = true;

    try {
      const res = await fetch(`${API_URL}/api/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang: 'en',
          targetLangs,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Update the transcript entry with translations
        setTranscripts(prev => prev.map(t =>
          t.id === newEntry.id ? { ...t, translations: data.translations } : t
        ));

        setTranslationStatus({ count: Object.keys(data.translations).length, languages: Object.keys(data.translations) });
        setStats(prev => ({ ...prev, translated: prev.translated + 1 }));

        // Emit to server for broadcasting to students
        if (socket) {
          socket.emit('live_translation', {
            sessionCode,
            sessionId,
            originalText: text.trim(),
            sourceLang: 'en',
            translations: data.translations,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      console.error('Translation pipeline error:', err);
    } finally {
      processingRef.current = false;
    }
  }, [studentLanguages, socket, sessionCode, sessionId]);

  // Handle interim (partial) text
  const handleInterim = useCallback((text) => {
    setInterimText(text);
  }, []);

  // Speech recognition hook
  const { isListening, error: speechError, supported } = useTranscription({
    language: 'en-IN',
    onTranscript: handleTranscript,
    onInterim: handleInterim,
    enabled: isActive,
  });

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimText]);

  if (!supported) {
    return (
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: '#FEF2F2', border: '1px solid #FECACA',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#DC2626' }}>error</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', margin: 0 }}>Browser Not Supported</p>
          <p style={{ fontSize: '12px', color: '#991B1B', margin: '2px 0 0' }}>
            Live translation requires Chrome or Edge browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      border: `1px solid ${isActive ? '#818CF8' : 'var(--outline)'}`,
      boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.1)' : 'var(--shadow-xs)',
      transition: 'all 0.3s',
    }}>
      {/* Header — Toggle + Status */}
      <div style={{
        padding: '14px 16px',
        background: isActive
          ? 'linear-gradient(135deg, #4F46E5, #6366F1)'
          : 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isActive && (
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#FCD34D',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(252,211,77,0.6)',
            }} />
          )}
          <span className="material-symbols-outlined" style={{
            fontSize: '20px', color: isActive ? '#fff' : '#4F46E5',
          }}>
            {isActive ? 'hearing' : 'translate'}
          </span>
          <div>
            <span style={{
              fontSize: '13px', fontWeight: 700,
              color: isActive ? '#fff' : '#312E81',
            }}>
              {isActive ? 'Live Translating...' : 'Live Audio Translation'}
            </span>
            {isActive && (
              <p style={{
                fontSize: '10px', color: 'rgba(255,255,255,0.7)',
                margin: '1px 0 0', fontWeight: 500,
              }}>
                {stats.segments} spoken · {stats.translated} translated
              </p>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsActive(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '999px',
            border: 'none', cursor: 'pointer',
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#4F46E5',
            color: '#fff',
            fontSize: '12px', fontWeight: 700,
            transition: 'all 0.2s',
            backdropFilter: isActive ? 'blur(4px)' : 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {isActive ? 'stop_circle' : 'play_circle'}
          </span>
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Language Distribution */}
      {isActive && Object.keys(langDistribution).length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--outline)',
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          backgroundColor: 'var(--surface-container-low)',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            alignSelf: 'center', marginRight: '4px',
          }}>
            Translating to:
          </span>
          {Object.entries(langDistribution).map(([code, count]) => {
            if (code === 'en') return null;
            const lang = getLanguageByCode(code);
            return (
              <span key={code} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '999px',
                backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE',
                fontSize: '11px', fontWeight: 600, color: '#4338CA',
              }}>
                {lang.flag} {lang.native}
                <span style={{
                  padding: '0 4px', borderRadius: '999px',
                  backgroundColor: 'rgba(79,70,229,0.12)',
                  fontSize: '10px', fontWeight: 800,
                }}>
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Live Transcript Feed */}
      {isActive && (
        <div style={{
          maxHeight: '200px', overflowY: 'auto',
          padding: '12px 14px',
          backgroundColor: 'var(--surface)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {transcripts.length === 0 && !interimText ? (
            <div style={{
              padding: '24px 0', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '28px', color: '#A5B4FC',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}>mic</span>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
                Listening... Start speaking to translate in real-time
              </p>
            </div>
          ) : (
            <>
              {transcripts.map((t) => (
                <div key={t.id} style={{
                  padding: '8px 12px', borderRadius: '10px',
                  backgroundColor: 'var(--surface-container-low)',
                  border: '1px solid var(--outline)',
                }}>
                  {/* Original text */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                      🇬🇧 English
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--on-surface-dim)' }}>{t.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface)', margin: 0, lineHeight: 1.5 }}>
                    {t.text}
                  </p>
                  
                  {/* Translation previews */}
                  {t.translations && (
                    <div style={{
                      marginTop: '6px', paddingTop: '6px',
                      borderTop: '1px solid var(--outline)',
                      display: 'flex', flexDirection: 'column', gap: '3px',
                    }}>
                      {Object.entries(t.translations).filter(([code]) => code !== 'en').map(([code, translated]) => {
                        const lang = getLanguageByCode(code);
                        return (
                          <div key={code} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, color: '#4338CA',
                              padding: '1px 6px', borderRadius: '999px',
                              backgroundColor: '#EEF2FF',
                              whiteSpace: 'nowrap', marginTop: '2px',
                            }}>
                              {lang.flag} {lang.code.toUpperCase()}
                            </span>
                            <p style={{
                              fontSize: '12px', color: '#4F46E5', margin: 0,
                              lineHeight: 1.4, fontStyle: 'italic',
                            }}>
                              {translated}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading indicator for pending translation */}
                  {!t.translations && (
                    <div style={{
                      marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '12px', color: '#818CF8',
                        animation: 'spin 1s linear infinite',
                      }}>progress_activity</span>
                      <span style={{ fontSize: '10px', color: '#818CF8' }}>Translating...</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Interim text (currently being spoken) */}
              {interimText && (
                <div style={{
                  padding: '8px 12px', borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px dashed #FCD34D',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: '#F59E0B',
                      animation: 'pulse-glow 0.8s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#D97706' }}>Speaking now...</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#92400E', margin: 0, fontStyle: 'italic' }}>
                    {interimText}
                  </p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </>
          )}
        </div>
      )}

      {/* Inactive — Info card */}
      {!isActive && (
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--surface)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4F46E5', marginTop: '1px' }}>info</span>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.6 }}>
                When active, your speech is <strong>transcribed in real-time</strong> and translated 
                to each student's preferred language. Students will hear the translation spoken aloud 
                in their language.
              </p>
            </div>
          </div>

          {hasMultilingualStudents ? (
            <div style={{
              padding: '10px 12px', borderRadius: '10px',
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#059669' }}>check_circle</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#065F46' }}>
                {studentLanguages.length} language{studentLanguages.length > 1 ? 's' : ''} detected in your classroom
              </span>
            </div>
          ) : (
            <div style={{
              padding: '10px 12px', borderRadius: '10px',
              background: '#FFFBEB', border: '1px solid #FDE68A',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#D97706' }}>translate</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>
                No multilingual students yet — will default to Hindi translation
              </span>
            </div>
          )}

          {speechError && (
            <div style={{
              padding: '10px 12px', borderRadius: '10px',
              background: '#FEF2F2', border: '1px solid #FECACA',
              fontSize: '12px', color: '#DC2626',
            }}>
              ⚠️ {speechError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
