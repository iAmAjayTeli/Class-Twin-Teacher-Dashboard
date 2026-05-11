import { useState, useEffect } from 'react';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * TranslationPanel — Teacher-side panel for real-time message translation.
 * 
 * Features:
 * - Auto-translate toggle
 * - Preview translations in any student's language
 * - Language distribution badges showing how many students use each language
 * - Send translated messages to all language groups
 *
 * @param {Object} props
 * @param {string} props.sessionId
 * @param {Object[]} props.students - Array of { name, language }
 * @param {function} props.onSendTranslated - Callback when teacher sends a translated message
 */
export default function TranslationPanel({ sessionId, students = [], onSendTranslated }) {
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [previewLang, setPreviewLang] = useState('hi');
  const [inputText, setInputText] = useState('');
  const [translatedPreview, setTranslatedPreview] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [allTranslations, setAllTranslations] = useState(null);
  const [sending, setSending] = useState(false);

  // Compute language distribution from students
  const langDistribution = {};
  students.forEach(s => {
    const lang = s.language || 'en';
    langDistribution[lang] = (langDistribution[lang] || 0) + 1;
  });

  // Unique student languages (excluding English)
  const studentLanguages = [...new Set(students.map(s => s.language || 'en').filter(l => l !== 'en'))];

  // Auto-translate preview when input changes
  useEffect(() => {
    if (!autoTranslate || !inputText.trim() || previewLang === 'en') {
      setTranslatedPreview('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const res = await fetch(`${API_URL}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputText.trim(),
            sourceLang: 'en',
            targetLang: previewLang,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTranslatedPreview(data.translatedText || '');
        }
      } catch (err) {
        console.error('Translation preview error:', err);
      } finally {
        setIsTranslating(false);
      }
    }, 600); // Debounce 600ms

    return () => clearTimeout(timer);
  }, [inputText, previewLang, autoTranslate]);

  // Send translated message to all language groups
  const handleSendTranslated = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);

    try {
      const targetLangs = studentLanguages.length > 0 ? studentLanguages : ['hi'];
      const res = await fetch(`${API_URL}/api/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          sourceLang: 'en',
          targetLangs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAllTranslations(data.translations);
        setLastSent({ original: inputText.trim(), translations: data.translations });

        // Notify parent to send via WebSocket
        if (onSendTranslated) {
          onSendTranslated({
            originalText: inputText.trim(),
            sourceLang: 'en',
            translations: data.translations,
            sessionId,
          });
        }
        setInputText('');
        setTranslatedPreview('');
      }
    } catch (err) {
      console.error('Batch translation error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid var(--outline)',
      boxShadow: 'var(--shadow-sm)',
      backgroundColor: 'var(--surface)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
        borderBottom: '1px solid var(--outline)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4F46E5' }}>translate</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#312E81' }}>Lingua Translate</span>
          {studentLanguages.length > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: '999px',
              background: '#C7D2FE', color: '#4338CA',
              fontSize: '10px', fontWeight: 700,
            }}>
              {studentLanguages.length + 1} languages
            </span>
          )}
        </div>
        
        {/* Auto-translate toggle */}
        <button
          onClick={() => setAutoTranslate(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px',
            border: 'none', cursor: 'pointer',
            backgroundColor: autoTranslate ? '#C7D2FE' : 'var(--surface-container-low)',
            color: autoTranslate ? '#4338CA' : 'var(--on-surface-variant)',
            fontSize: '11px', fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {autoTranslate ? 'toggle_on' : 'toggle_off'}
          </span>
          Auto
        </button>
      </div>

      {/* Language Distribution Badges */}
      {Object.keys(langDistribution).length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--outline)',
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          backgroundColor: 'var(--surface-container-low)',
        }}>
          {Object.entries(langDistribution).map(([code, count]) => {
            const lang = getLanguageByCode(code);
            return (
              <span key={code} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '999px',
                backgroundColor: code === 'en' ? 'var(--primary-light)' : '#EEF2FF',
                border: `1px solid ${code === 'en' ? 'rgba(26,92,59,0.2)' : '#C7D2FE'}`,
                fontSize: '11px', fontWeight: 600,
                color: code === 'en' ? 'var(--primary)' : '#4338CA',
              }}>
                {lang.flag} {lang.native}
                <span style={{
                  marginLeft: '2px',
                  padding: '0 4px', borderRadius: '999px',
                  backgroundColor: code === 'en' ? 'rgba(26,92,59,0.12)' : 'rgba(79,70,229,0.12)',
                  fontSize: '10px', fontWeight: 800,
                }}>
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Input + Translate Area */}
      <div style={{ padding: '14px' }}>
        {/* Teacher input */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type a message in English to translate for all students..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--outline)',
              backgroundColor: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#818CF8'}
            onBlur={e => e.target.style.borderColor = 'var(--outline)'}
          />
          {isTranslating && (
            <div style={{
              position: 'absolute', top: '10px', right: '12px',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '999px',
              backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '12px', color: '#4F46E5',
                animation: 'spin 1s linear infinite',
              }}>progress_activity</span>
              <span style={{ fontSize: '10px', color: '#4F46E5', fontWeight: 600 }}>Translating...</span>
            </div>
          )}
        </div>

        {/* Translation Preview */}
        {autoTranslate && inputText.trim() && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Preview in
              </span>
              <LanguageSelector
                value={previewLang}
                onChange={setPreviewLang}
                compact
                exclude={['en']}
              />
            </div>
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
              border: '1px solid #DDD6FE',
              minHeight: '40px',
            }}>
              {translatedPreview ? (
                <p style={{ fontSize: '14px', color: '#4C1D95', margin: 0, lineHeight: 1.6 }}>
                  {translatedPreview}
                </p>
              ) : (
                <p style={{ fontSize: '12px', color: '#A78BFA', margin: 0, fontStyle: 'italic' }}>
                  {isTranslating ? 'Translating...' : 'Translation preview will appear here...'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendTranslated}
          disabled={!inputText.trim() || sending}
          style={{
            width: '100%', marginTop: '12px',
            padding: '13px', borderRadius: '12px',
            border: 'none', cursor: inputText.trim() && !sending ? 'pointer' : 'not-allowed',
            background: inputText.trim() && !sending
              ? 'linear-gradient(135deg, #4F46E5, #6366F1)'
              : '#E5E7EB',
            color: inputText.trim() && !sending ? '#fff' : '#9CA3AF',
            fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s',
            boxShadow: inputText.trim() && !sending ? '0 4px 16px rgba(79,70,229,0.3)' : 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {sending ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Translating & Sending...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
              🌐 Translate & Send to All
            </>
          )}
        </button>
      </div>

      {/* Last Sent Confirmation */}
      {lastSent && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--outline)',
          background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#059669' }}>check_circle</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sent in {Object.keys(lastSent.translations).length} languages
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Object.entries(lastSent.translations).map(([code, text]) => {
              const lang = getLanguageByCode(code);
              return (
                <span key={code} title={text} style={{
                  padding: '2px 8px', borderRadius: '999px',
                  background: '#A7F3D0', border: '1px solid #6EE7B7',
                  fontSize: '10px', fontWeight: 600, color: '#065F46',
                  cursor: 'help',
                }}>
                  {lang.flag} {lang.code.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
