import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';

/**
 * Reusable language selector dropdown.
 * Displays language with native name and flag emoji.
 *
 * @param {Object} props
 * @param {string} props.value - Selected language code
 * @param {function} props.onChange - Callback with language code
 * @param {boolean} props.compact - Show compact (icon-only) mode
 * @param {string[]} props.exclude - Language codes to exclude
 * @param {string} props.label - Optional label above selector
 */
export default function LanguageSelector({ value = 'en', onChange, compact = false, exclude = [], label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = getLanguageByCode(value);
  const languages = SUPPORTED_LANGUAGES.filter(l => !exclude.includes(l.code));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {label && (
        <span style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '4px',
          display: 'block',
        }}>
          {label}
        </span>
      )}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? '4px' : '8px',
          padding: compact ? '6px 10px' : '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--outline)',
          backgroundColor: open ? 'var(--primary-light)' : 'var(--surface)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          color: 'var(--on-surface)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: compact ? '14px' : '16px' }}>{selected.flag}</span>
        {!compact && <span>{selected.native}</span>}
        <span className="material-symbols-outlined" style={{
          fontSize: '16px', color: 'var(--on-surface-variant)',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }}>
          expand_more
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          marginTop: '6px', minWidth: '200px',
          backgroundColor: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--outline)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'slideDown 0.15s ease-out',
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--outline)',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--on-surface-variant)',
          }}>
            Select Language
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
            {languages.map((lang) => {
              const isActive = lang.code === value;
              return (
                <button
                  key={lang.code}
                  onClick={() => { onChange(lang.code); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--on-surface)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-container-low)'; }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block' }}>{lang.native}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--on-surface-dim)', fontWeight: 400 }}>
                      {lang.name}
                    </span>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
