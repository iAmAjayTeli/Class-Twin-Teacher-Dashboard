import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const sampleMaterials = [
  {
    id: 1, title: 'Introduction to Algebra', type: 'Lesson Plan', subject: 'Mathematics',
    status: 'Published', date: 'Nov 12, 2024', icon: 'calculate', color: '#8083ff',
    description: 'Covers variables, expressions, and basic equations for Grade 8.',
    slides: 24, duration: '45 min',
  },
  {
    id: 2, title: 'Cell Biology Fundamentals', type: 'Presentation', subject: 'Science',
    status: 'Draft', date: 'Nov 10, 2024', icon: 'biotech', color: '#4ae176',
    description: 'Cell structure, organelles, and cellular processes with interactive diagrams.',
    slides: 32, duration: '50 min',
  },
  {
    id: 3, title: 'World War II Timeline', type: 'Worksheet', subject: 'History',
    status: 'Published', date: 'Nov 8, 2024', icon: 'history_edu', color: '#ffb95f',
    description: 'Key events from 1939–1945 with map activities and comprehension questions.',
    slides: 12, duration: '30 min',
  },
  {
    id: 4, title: 'Creative Writing Prompts', type: 'Activity', subject: 'English',
    status: 'Published', date: 'Nov 5, 2024', icon: 'edit_note', color: '#ff6b9d',
    description: 'Collection of 20 imaginative prompts for narrative and descriptive writing.',
    slides: 20, duration: '40 min',
  },
  {
    id: 5, title: 'Quadratic Equations Deep Dive', type: 'Lesson Plan', subject: 'Mathematics',
    status: 'Review', date: 'Nov 3, 2024', icon: 'functions', color: '#8083ff',
    description: 'Advanced quadratic formula, discriminant analysis, and graphing parabolas.',
    slides: 28, duration: '55 min',
  },
  {
    id: 6, title: 'Climate Change & Ecosystems', type: 'Presentation', subject: 'Science',
    status: 'Published', date: 'Oct 28, 2024', icon: 'eco', color: '#4ae176',
    description: 'Impact of climate change on global ecosystems with case studies.',
    slides: 36, duration: '60 min',
  },
];

const typeFilters = ['All', 'Lesson Plan', 'Presentation', 'Worksheet', 'Activity'];
const subjectFilters = ['All', 'Mathematics', 'Science', 'History', 'English'];

export default function Materials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeSubject, setActiveSubject] = useState('All');
  const [hoveredCard, setHoveredCard] = useState(null);

  const filtered = sampleMaterials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'All' || m.type === activeType;
    const matchesSubject = activeSubject === 'All' || m.subject === activeSubject;
    return matchesSearch && matchesType && matchesSubject;
  });

  const statusStyle = (status) => {
    switch (status) {
      case 'Published': return { background: 'rgba(74, 225, 118, 0.1)', color: '#4ae176', border: '1px solid rgba(74, 225, 118, 0.2)' };
      case 'Draft': return { background: 'rgba(255, 185, 95, 0.1)', color: '#ffb95f', border: '1px solid rgba(255, 185, 95, 0.2)' };
      case 'Review': return { background: 'rgba(128, 131, 255, 0.1)', color: '#c0c1ff', border: '1px solid rgba(128, 131, 255, 0.2)' };
      default: return {};
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--background)', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-headline" style={{
            fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em',
            background: 'linear-gradient(to right, #e0e2ea, #c0c1ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Teaching Materials</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px', marginTop: '8px' }}>
            Organize, create, and share your lesson plans and resources.
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Materials', value: '24', icon: 'folder', color: '#8083ff' },
            { label: 'Published', value: '18', icon: 'check_circle', color: '#4ae176' },
            { label: 'In Draft', value: '4', icon: 'edit_note', color: '#ffb95f' },
            { label: 'AI Generated', value: '6', icon: 'auto_awesome', color: '#c0c1ff' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: 'var(--surface-container)', borderRadius: '16px',
              padding: '20px', border: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${stat.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined filled" style={{ color: stat.color, fontSize: '22px' }}>{stat.icon}</span>
              </div>
              <div>
                <div className="font-headline" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-surface)' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: '260px',
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: 'var(--surface-container)', borderRadius: '12px',
            padding: '10px 16px', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--on-surface)', fontSize: '14px', width: '100%',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #8083ff, #494bd6)',
            color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(128, 131, 255, 0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Material
          </button>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600, alignSelf: 'center', marginRight: '4px' }}>TYPE:</span>
          {typeFilters.map(f => (
            <button key={f} onClick={() => setActiveType(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeType === f ? 'rgba(128, 131, 255, 0.15)' : 'rgba(224, 226, 234, 0.04)',
              color: activeType === f ? '#c0c1ff' : 'var(--on-surface-variant)',
              border: activeType === f ? '1px solid rgba(192, 193, 255, 0.2)' : '1px solid rgba(255,255,255,0.04)',
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600, alignSelf: 'center', marginRight: '4px' }}>SUBJECT:</span>
          {subjectFilters.map(f => (
            <button key={f} onClick={() => setActiveSubject(f)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeSubject === f ? 'rgba(74, 225, 118, 0.12)' : 'rgba(224, 226, 234, 0.04)',
              color: activeSubject === f ? '#4ae176' : 'var(--on-surface-variant)',
              border: activeSubject === f ? '1px solid rgba(74, 225, 118, 0.2)' : '1px solid rgba(255,255,255,0.04)',
            }}>{f}</button>
          ))}
        </div>

        {/* Materials Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filtered.map(m => (
            <div
              key={m.id}
              onMouseEnter={() => setHoveredCard(m.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                backgroundColor: hoveredCard === m.id ? 'var(--surface-container-high)' : 'var(--surface-container)',
                borderRadius: '20px', padding: '24px',
                border: hoveredCard === m.id ? '1px solid rgba(192, 193, 255, 0.12)' : '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === m.id ? 'translateY(-2px)' : 'none',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Glow effect on hover */}
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '100px', height: '100px', borderRadius: '50%',
                background: `${m.color}10`, filter: 'blur(30px)',
                opacity: hoveredCard === m.id ? 1 : 0, transition: 'opacity 0.3s',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Top row: icon + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${m.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined filled" style={{ color: m.color, fontSize: '24px' }}>{m.icon}</span>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em',
                    ...statusStyle(m.status),
                  }}>{m.status.toUpperCase()}</span>
                </div>

                {/* Title & description */}
                <h3 className="font-headline" style={{
                  fontSize: '17px', fontWeight: 700, color: 'var(--on-surface)',
                  marginBottom: '8px', lineHeight: 1.3,
                }}>{m.title}</h3>
                <p style={{
                  fontSize: '13px', color: 'var(--on-surface-variant)',
                  lineHeight: 1.5, marginBottom: '16px',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{m.description}</p>

                {/* Meta row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  fontSize: '12px', color: 'rgba(224, 226, 234, 0.4)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>slideshow</span>
                    {m.slides} slides
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                    {m.duration}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>science</span>
                    {m.subject}
                  </span>
                </div>

                {/* Divider */}
                <div style={{
                  height: '1px', margin: '16px 0',
                  background: 'linear-gradient(to right, transparent, rgba(192, 193, 255, 0.08), transparent)',
                }} />

                {/* Bottom row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '11px', color: 'rgba(224, 226, 234, 0.35)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                    {m.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>label</span>
                    {m.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: 'var(--on-surface-variant)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', opacity: 0.3, marginBottom: '16px', display: 'block' }}>search_off</span>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>No materials found</p>
            <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
}
