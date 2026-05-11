import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SAMPLE_CSV = `name,email,roll_number
Rahul Sharma,rahul@example.com,CS2025001
Priya Desai,priya@example.com,CS2025002
Arjun Nair,arjun@example.com,CS2025003`;

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}


export default function ImportDataModal({ onClose, onImportComplete }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState({ success: 0, failed: 0 });
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a .csv file');
      return;
    }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setRawText(text);
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError('No valid data rows found. Make sure the first row contains headers.');
        return;
      }
      setParsedRows(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Not authenticated'); setStep('preview'); return; }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/students/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ students: parsedRows }),
      });

      if (!res.ok) throw new Error('Import failed');
      const result = await res.json();
      setImportResult({ success: result.imported || parsedRows.length, failed: result.failed || 0 });
      setStep('done');
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message || 'Import failed. Please try again.');
      setStep('preview');
    }
  };

  const handleUseSample = () => {
    setRawText(SAMPLE_CSV);
    setFileName('sample_students.csv');
    const rows = parseCSV(SAMPLE_CSV);
    setParsedRows(rows);
    setStep('preview');
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.2s ease',
  };

  const modalStyle = {
    background: '#FFFFFF', borderRadius: '20px',
    width: '560px', maxHeight: '85vh',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    animation: 'slideUp 0.25s ease',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #EAECF0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #E8F5EE, #D1FAE5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1A5C3B' }}>upload_file</span>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Import Student Data</h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Upload a CSV file with student information</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #EAECF0',
            background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* Upload Step */}
          {step === 'upload' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#1A5C3B' : '#D1D5DB'}`,
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? '#F0FDF4' : '#FAFAFA',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: dragActive ? '#DCFCE7' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  transition: 'all 0.2s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: dragActive ? '#1A5C3B' : '#9CA3AF' }}>
                    cloud_upload
                  </span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                  {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
                </p>
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>CSV files only (max 500 students)</p>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#EAECF0' }} />
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#EAECF0' }} />
              </div>

              {/* Sample data */}
              <button onClick={handleUseSample} style={{
                width: '100%', padding: '14px 16px',
                background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1A5C3B' }}>table_view</span>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Use sample data</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Import 3 demo students to try it out</p>
                </div>
              </button>

              {/* Format hint */}
              <div style={{
                marginTop: '20px', padding: '14px 16px',
                background: '#FEFCE8', border: '1px solid #FDE68A',
                borderRadius: '12px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
                  Expected CSV format
                </p>
                <code style={{ fontSize: '11px', color: '#78350F', lineHeight: 1.6, display: 'block', fontFamily: 'monospace' }}>
                  name, email, roll_number
                </code>
              </div>
            </>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '12px', marginBottom: '20px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1A5C3B' }}>description</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fileName}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>{parsedRows.length} student{parsedRows.length !== 1 ? 's' : ''} found</p>
                </div>
                <button onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); setError(''); }}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Change file
                </button>
              </div>

              {/* Table preview */}
              <div style={{ borderRadius: '12px', border: '1px solid #EAECF0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                      {Object.keys(parsedRows[0] || {}).map(key => (
                        <th key={key} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 14px', color: '#9CA3AF', fontWeight: 500 }}>{i + 1}</td>
                        {Object.values(row).map((val, j) => (
                          <td key={j} style={{ padding: '10px 14px', color: '#111827', fontWeight: 500 }}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 10 && (
                  <div style={{ padding: '10px 14px', background: '#F9FAFB', fontSize: '12px', color: '#9CA3AF', textAlign: 'center', borderTop: '1px solid #F3F4F6' }}>
                    ...and {parsedRows.length - 10} more rows
                  </div>
                )}
              </div>
            </>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                border: '3px solid #F3F4F6', borderTopColor: '#1A5C3B',
                margin: '0 auto 20px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Importing students...</p>
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Processing {parsedRows.length} records</p>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1A5C3B' }}>check_circle</span>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Import Complete!</p>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#1A5C3B' }}>{importResult.success}</span> students imported successfully
              </p>
              {importResult.failed > 0 && (
                <p style={{ fontSize: '12px', color: '#EF4444' }}>{importResult.failed} records failed</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', fontSize: '13px', color: '#DC2626',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #EAECF0',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
        }}>
          {step === 'upload' && (
            <button onClick={onClose} className="ct-btn-outline" style={{ padding: '10px 20px', fontSize: '13px' }}>Cancel</button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => { setStep('upload'); setParsedRows([]); }} className="ct-btn-outline" style={{ padding: '10px 20px', fontSize: '13px' }}>Back</button>
              <button onClick={handleImport} className="ct-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                Import {parsedRows.length} Student{parsedRows.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="ct-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>Done</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
