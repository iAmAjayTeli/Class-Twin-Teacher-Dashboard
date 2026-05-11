import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import LanguageSelector from '../components/LanguageSelector';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TranslatePage() {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState([]);

  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim(), sourceLang, targetLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translatedText);
        setHistory(prev => [{
          original: inputText.trim(),
          translated: data.translatedText,
          from: sourceLang,
          to: targetLang,
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error('Translation error:', err);
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 32px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--outline)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#4F46E5' }}>translate</span>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Lingua Translate
            </span>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '999px',
            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
            border: '1px solid #C7D2FE',
            fontSize: '11px', fontWeight: 700, color: '#4338CA',
          }}>
            Powered by Gemini AI
          </span>
        </nav>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>

          {/* Translation Card */}
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid var(--outline)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
            backgroundColor: 'var(--surface)',
          }}>
            {/* Language Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
              borderBottom: '1px solid var(--outline)',
            }}>
              <LanguageSelector value={sourceLang} onChange={setSourceLang} />

              <button
                onClick={swapLanguages}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  border: '1px solid var(--outline)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.25s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'rotate(180deg)'; e.currentTarget.style.backgroundColor = '#EEF2FF'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'rotate(0deg)'; e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4F46E5' }}>swap_horiz</span>
              </button>

              <LanguageSelector value={targetLang} onChange={setTargetLang} />
            </div>

            {/* Input / Output Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '250px' }}>
              {/* Source */}
              <div style={{ padding: '20px', borderRight: '1px solid var(--outline)' }}>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type or paste text here..."
                  style={{
                    width: '100%', height: '200px',
                    border: 'none', outline: 'none', resize: 'none',
                    fontSize: '16px', lineHeight: 1.7,
                    color: 'var(--on-surface)',
                    backgroundColor: 'transparent',
                    fontFamily: "'Inter', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-dim)' }}>
                    {inputText.length} characters
                  </span>
                  {inputText && (
                    <button
                      onClick={() => { setInputText(''); setTranslatedText(''); }}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: '12px', color: 'var(--on-surface-variant)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Target */}
              <div style={{ padding: '20px', backgroundColor: 'var(--surface-container-low)' }}>
                {isTranslating ? (
                  <div style={{
                    height: '200px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '32px', color: '#4F46E5',
                      animation: 'spin 1s linear infinite',
                    }}>progress_activity</span>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                      Translating to {getLanguageByCode(targetLang).native}...
                    </p>
                  </div>
                ) : translatedText ? (
                  <div>
                    <p style={{
                      fontSize: '16px', lineHeight: 1.7,
                      color: 'var(--on-surface)', margin: 0,
                      minHeight: '200px',
                    }}>
                      {translatedText}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => navigator.clipboard?.writeText(translatedText)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', borderRadius: '8px',
                          border: '1px solid var(--outline)', backgroundColor: 'var(--surface)',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          color: 'var(--on-surface-variant)', transition: 'all 0.15s',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                        Copy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p style={{ fontSize: '14px', color: 'var(--on-surface-dim)', fontStyle: 'italic' }}>
                      Translation will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Translate Button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--outline)', backgroundColor: 'var(--surface)' }}>
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isTranslating}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '14px', border: 'none',
                  background: inputText.trim() && !isTranslating
                    ? 'linear-gradient(135deg, #4F46E5, #6366F1)'
                    : '#E5E7EB',
                  color: inputText.trim() && !isTranslating ? '#fff' : '#9CA3AF',
                  fontSize: '15px', fontWeight: 800, cursor: inputText.trim() && !isTranslating ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: inputText.trim() && !isTranslating ? '0 4px 20px rgba(79,70,229,0.3)' : 'none',
                  transition: 'all 0.2s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>translate</span>
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>
          </div>

          {/* Translation History */}
          {history.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <h3 style={{
                fontSize: '13px', fontWeight: 700, color: 'var(--on-surface-variant)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                Recent Translations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((item, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', borderRadius: '14px',
                    backgroundColor: 'var(--surface)', border: '1px solid var(--outline)',
                    boxShadow: 'var(--shadow-xs)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onClick={() => {
                      setInputText(item.original);
                      setTranslatedText(item.translated);
                      setSourceLang(item.from);
                      setTargetLang(item.to);
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#818CF8'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--outline)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px',
                          background: '#EEF2FF', border: '1px solid #C7D2FE',
                          fontSize: '10px', fontWeight: 700, color: '#4338CA',
                        }}>
                          {getLanguageByCode(item.from).flag} → {getLanguageByCode(item.to).flag}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--on-surface-dim)' }}>{item.time}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--on-surface)', margin: 0, lineHeight: 1.5 }}>
                        {item.original.slice(0, 80)}{item.original.length > 80 ? '...' : ''}
                      </p>
                      <p style={{ fontSize: '13px', color: '#4F46E5', margin: 0, lineHeight: 1.5 }}>
                        {item.translated.slice(0, 80)}{item.translated.length > 80 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
