import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SUBJECTS = [
  { value: 'Mathematics',   icon: 'calculate',    color: '#8B5CF6' },
  { value: 'Science',       icon: 'biotech',       color: '#10B981' },
  { value: 'Physics',       icon: 'explore',       color: '#3B82F6' },
  { value: 'Chemistry',     icon: 'science',       color: '#EC4899' },
  { value: 'Biology',       icon: 'genetics',      color: '#22C55E' },
  { value: 'History',       icon: 'history_edu',   color: '#F59E0B' },
  { value: 'Geography',     icon: 'public',        color: '#06B6D4' },
  { value: 'English',       icon: 'menu_book',     color: '#F43F5E' },
  { value: 'Python',        icon: 'terminal',      color: '#14B8A6' },
  { value: 'Java',          icon: 'code_blocks',   color: '#F97316' },
  { value: 'Computer',      icon: 'computer',      color: '#6366F1' },
  { value: 'Economics',     icon: 'trending_up',   color: '#84CC16' },
  { value: 'General',       icon: 'folder',        color: '#9CA3AF' },
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.value, s]));

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ═══════════════════════════════════════════════ */
/*  UPLOAD MODAL                                    */
/* ═══════════════════════════════════════════════ */
function UploadModal({ onClose, onUploaded }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=subject, 2=topic, 3=file
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileSelect = (f) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png', 'image/jpeg'];
    if (!allowed.includes(f.type)) {
      setError('Only PDF, Word, PNG, or JPEG files are allowed.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File must be under 50 MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !subject || !topic.trim() || !user) return;
    setUploading(true); setProgress(0); setError('');
    try {
      // unique path: {teacher_id}/{timestamp}_{filename}
      const ext = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${safeName}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('materials')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      // Simulate progress (Supabase client doesn't expose real upload progress)
      setProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      // Save metadata to DB
      const { data, error: dbErr } = await supabase
        .from('materials')
        .insert({
          teacher_id: user.id,
          title: topic.trim(),
          subject,
          topic: topic.trim(),
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          storage_url: publicUrl,
          status: 'published',
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      setProgress(100);
      onUploaded(data);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const subj = SUBJECT_MAP[subject];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      backdropFilter: 'blur(8px)', padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '36px',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
        animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(26,92,59,0.3)',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>upload_file</span>
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
              Upload Material
            </h2>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
              Step {step} of 3 — {step === 1 ? 'Choose Subject' : step === 2 ? 'Add Topic' : 'Upload File'}
            </p>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', width: '32px', height: '32px', borderRadius: '8px',
            background: '#F3F4F6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>close</span>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: s <= step ? '#1A5C3B' : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ── STEP 1: Subject ── */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
              What subject is this material for?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {SUBJECTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  style={{
                    padding: '14px 10px', borderRadius: '14px', border: '2px solid',
                    borderColor: subject === s.value ? s.color : '#EAECF0',
                    background: subject === s.value ? `${s.color}12` : '#fff',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: s.color }}>{s.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: subject === s.value ? s.color : '#374151' }}>{s.value}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => subject && setStep(2)}
              disabled={!subject}
              style={{
                marginTop: '24px', width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: subject ? 'linear-gradient(135deg, #1A5C3B, #2D7A52)' : '#F3F4F6',
                color: subject ? '#fff' : '#9CA3AF',
                fontWeight: 700, fontSize: '14px', cursor: subject ? 'pointer' : 'not-allowed',
                boxShadow: subject ? '0 4px 14px rgba(26,92,59,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Topic ── */}
        {step === 2 && (
          <div>
            {subj && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
                padding: '12px 16px', borderRadius: '12px',
                background: `${subj.color}10`, border: `1px solid ${subj.color}30`,
              }}>
                <span className="material-symbols-outlined" style={{ color: subj.color, fontSize: '20px' }}>{subj.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: subj.color }}>{subject}</span>
              </div>
            )}
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
              What is the topic or title of this material?
            </p>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && topic.trim() && setStep(3)}
              placeholder="e.g. Introduction to Quadratic Equations"
              autoFocus
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: '1px solid #E5E7EB', fontSize: '14px', color: '#111827',
                background: '#F9FAFB', outline: 'none', boxSizing: 'border-box',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1px solid #E5E7EB', background: '#fff',
                color: '#374151', fontWeight: 600, cursor: 'pointer',
              }}>← Back</button>
              <button
                onClick={() => topic.trim() && setStep(3)}
                disabled={!topic.trim()}
                style={{
                  flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                  background: topic.trim() ? 'linear-gradient(135deg, #1A5C3B, #2D7A52)' : '#F3F4F6',
                  color: topic.trim() ? '#fff' : '#9CA3AF',
                  fontWeight: 700, cursor: topic.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: topic.trim() ? '0 4px 14px rgba(26,92,59,0.25)' : 'none',
                }}
              >Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: File upload ── */}
        {step === 3 && (
          <div>
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap',
            }}>
              {subj && (
                <span style={{
                  padding: '4px 12px', borderRadius: '20px',
                  background: `${subj.color}15`, color: subj.color,
                  fontSize: '12px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{subj.icon}</span>
                  {subject}
                </span>
              )}
              <span style={{
                padding: '4px 12px', borderRadius: '20px',
                background: '#F0FDF4', color: '#1A5C3B',
                fontSize: '12px', fontWeight: 600,
              }}>📝 {topic}</span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#1A5C3B' : file ? '#22C55E' : '#D1D5DB'}`,
                borderRadius: '16px', padding: '36px 28px', textAlign: 'center',
                background: dragging ? '#F0FDF4' : file ? '#F0FDF480' : '#F9FAFB',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {file ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#22C55E', marginBottom: '8px', display: 'block' }}>check_circle</span>
                  <p style={{ fontWeight: 700, color: '#111827', fontSize: '14px', marginBottom: '4px' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>{formatBytes(file.size)}</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Click to change file</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#9CA3AF', marginBottom: '12px', display: 'block' }}>upload_file</span>
                  <p style={{ fontWeight: 700, color: '#111827', fontSize: '14px', marginBottom: '4px' }}>
                    Drop your file here or click to browse
                  </p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>PDF, Word, PNG, JPEG · Max 50 MB</p>
                </>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: '13px', color: '#DC2626' }}>⚠️ {error}</p>
              </div>
            )}

            {uploading && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Uploading...</span>
                  <span style={{ fontSize: '12px', color: '#1A5C3B', fontWeight: 700 }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', width: `${progress}%`,
                    background: 'linear-gradient(90deg, #1A5C3B, #2D7A52)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} disabled={uploading} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1px solid #E5E7EB', background: '#fff',
                color: '#374151', fontWeight: 600, cursor: 'pointer',
              }}>← Back</button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  flex: 2, padding: '13px', borderRadius: '12px', border: 'none',
                  background: !file || uploading ? '#F3F4F6' : 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                  color: !file || uploading ? '#9CA3AF' : '#fff',
                  fontWeight: 700, fontSize: '14px',
                  cursor: !file || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: file && !uploading ? '0 4px 14px rgba(26,92,59,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {uploading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Uploading…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_upload</span>
                    Upload & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  MATERIAL CARD                                   */
/* ═══════════════════════════════════════════════ */
function MaterialCard({ material, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const subj = SUBJECT_MAP[material.subject] || SUBJECT_MAP['General'];

  const getFileIcon = (name) => {
    const ext = (name || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
    return 'insert_drive_file';
  };

  const getFileColor = (name) => {
    const ext = (name || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return '#EF4444';
    if (['doc', 'docx'].includes(ext)) return '#3B82F6';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return '#EC4899';
    return '#9CA3AF';
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this material? Students will no longer see it.')) return;
    setDeleting(true);
    // Delete from storage
    await supabase.storage.from('materials').remove([material.file_path]);
    // Delete from DB
    await supabase.from('materials').delete().eq('id', material.id);
    onDelete(material.id);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: '18px', padding: '22px',
        border: hovered ? '1px solid #D1D5DB' : '1px solid #EAECF0',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        cursor: 'default', position: 'relative',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
        <div style={{
          width: '48px', height: '48px', flexShrink: 0, borderRadius: '14px',
          background: `${subj.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ color: subj.color, fontSize: '24px' }}>{subj.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px', lineHeight: 1.3 }}>
            {material.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
              background: `${subj.color}15`, color: subj.color,
            }}>{material.subject}</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo(material.created_at)}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            width: '28px', height: '28px', borderRadius: '8px', border: 'none',
            background: hovered ? '#FEF2F2' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: hovered ? '#EF4444' : '#D1D5DB' }}>delete</span>
        </button>
      </div>

      {/* File info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: '10px',
        background: '#F9FAFB', border: '1px solid #EAECF0', marginBottom: '14px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: getFileColor(material.file_name) }}>
          {getFileIcon(material.file_name)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {material.file_name}
          </p>
          {material.file_size && (
            <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatBytes(material.file_size)}</p>
          )}
        </div>
      </div>

      {/* Status + actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{
          padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
          background: material.status === 'published' ? '#E8F5EE' : '#FEF9C3',
          color: material.status === 'published' ? '#1A5C3B' : '#92400E',
          border: material.status === 'published' ? '1px solid rgba(26,92,59,0.15)' : '1px solid rgba(146,64,14,0.15)',
        }}>
          {material.status === 'published' ? '✓ Published' : '✎ Draft'}
        </span>
        <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>smartphone</span>
          Visible to students
        </span>
        {material.storage_url && (
          <a
            href={material.storage_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px',
              background: '#F0FDF4', border: '1px solid rgba(26,92,59,0.15)',
              color: '#1A5C3B', fontSize: '12px', fontWeight: 600,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
            View
          </a>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  MAIN COMPONENT                                 */
/* ═══════════════════════════════════════════════ */
export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setMaterials(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleUploaded = (newMaterial) => {
    setMaterials(prev => [newMaterial, ...prev]);
    setShowUpload(false);
  };

  const handleDelete = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const allSubjects = ['All', ...Array.from(new Set(materials.map(m => m.subject)))];

  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = activeSubject === 'All' || m.subject === activeSubject;
    return matchSearch && matchSubject;
  });

  const stats = {
    total: materials.length,
    published: materials.filter(m => m.status === 'published').length,
    totalSize: materials.reduce((acc, m) => acc + (m.file_size || 0), 0),
    subjects: new Set(materials.map(m => m.subject)).size,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F5F6FA', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Teaching Materials
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '6px' }}>
              Upload PDFs and notes — instantly visible to students in the mobile app.
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 22px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
              color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26, 92, 59, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,92,59,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,92,59,0.3)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            Upload Material
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Materials', value: stats.total, icon: 'folder', color: '#6366F1' },
            { label: 'Published', value: stats.published, icon: 'check_circle', color: '#10B981' },
            { label: 'Subjects Covered', value: stats.subjects, icon: 'category', color: '#F59E0B' },
            { label: 'Storage Used', value: formatBytes(stats.totalSize) || '0 B', icon: 'cloud_upload', color: '#1A5C3B', highlight: true },
          ].map((s, i) => (
            <div key={i} style={{
              background: s.highlight ? '#F0FDF4' : '#fff', borderRadius: '16px',
              padding: '20px', border: s.highlight ? '1px solid rgba(26,92,59,0.15)' : '1px solid #EAECF0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: s.highlight ? 'linear-gradient(135deg, #1A5C3B, #2D7A52)' : `${s.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: s.highlight ? '0 4px 12px rgba(26,92,59,0.2)' : 'none',
              }}>
                <span className="material-symbols-outlined" style={{ color: s.highlight ? '#4DE89A' : s.color, fontSize: '22px' }}>{s.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Subject filter ── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: '260px',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#fff', borderRadius: '12px', padding: '10px 16px',
            border: '1px solid #EAECF0',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#9CA3AF', fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#111827', fontSize: '14px', width: '100%', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </div>

        {/* Subject filter chips */}
        {allSubjects.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {allSubjects.map(s => {
              const subj = SUBJECT_MAP[s];
              return (
                <button key={s} onClick={() => setActiveSubject(s)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeSubject === s ? (subj ? `${subj.color}15` : '#E8F5EE') : '#F9FAFB',
                  color: activeSubject === s ? (subj ? subj.color : '#1A5C3B') : '#6B7280',
                  border: activeSubject === s ? `1px solid ${subj ? subj.color + '40' : 'rgba(26,92,59,0.2)'}` : '1px solid #EAECF0',
                }}>
                  {subj && <><span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>{subj.icon}</span></>}
                  {s}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Materials Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #E5E7EB', borderTopColor: '#1A5C3B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading materials...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: '20px', border: '1px solid #EAECF0',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: '#D1D5DB', marginBottom: '16px', display: 'block' }}>upload_file</span>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              {materials.length === 0 ? 'No materials yet' : 'No materials match your search'}
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              {materials.length === 0
                ? 'Upload your first PDF or document — students can view it instantly in the app.'
                : 'Try adjusting your search or filter.'}
            </p>
            {materials.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(26,92,59,0.25)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                Upload First Material
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
            {filtered.map(m => (
              <MaterialCard key={m.id} material={m} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
