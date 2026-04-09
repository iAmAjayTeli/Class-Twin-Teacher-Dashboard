import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { key: 'getting-started', label: 'Getting Started', icon: 'rocket_launch', color: '#1A5C3B' },
    { key: 'sessions', label: 'Sessions', icon: 'cast_connected', color: '#3B82F6' },
    { key: 'students', label: 'Students', icon: 'groups', color: '#8B5CF6' },
    { key: 'analytics', label: 'Analytics & AI', icon: 'monitoring', color: '#F59E0B' },
    { key: 'troubleshooting', label: 'Troubleshooting', icon: 'build', color: '#EF4444' },
    { key: 'account', label: 'Account', icon: 'shield_person', color: '#06B6D4' },
  ];

  const faqs = {
    'getting-started': [
      { q: 'How do I create my first session?', a: 'Click the "Start New Session" button from the Dashboard. Enter a topic, subject, and optionally upload materials. A unique join code will be generated for your students to join.' },
      { q: 'How do students join a session?', a: 'Students visit the ClassTwin student portal and enter the 5-character join code displayed in your session lobby. No account required for students.' },
      { q: 'What is the AI Oracle?', a: 'The AI Oracle analyzes real-time engagement patterns during your sessions and provides a cognitive sync score. It tells you how well your students are following along and offers actionable teaching suggestions.' },
      { q: 'What devices are supported?', a: 'ClassTwin works on any modern browser (Chrome, Firefox, Safari, Edge). Students can join from laptops, tablets, or phones. For the best teaching experience, we recommend using a desktop/laptop.' },
    ],
    'sessions': [
      { q: 'How do I start streaming in a session?', a: 'From the session lobby, click "Start Stream". This enables the live video/audio feed and activates real-time engagement tracking for students who have joined.' },
      { q: 'Can I resume an ended session?', a: 'No, ended sessions are archived. However, you can create a new session with the same topic and your previous materials will be available in the Materials section.' },
      { q: 'How many students can join a session?', a: 'ClassTwin supports up to 100 concurrent students per session. For larger classes, consider splitting into multiple sessions.' },
      { q: 'What happens when I end a session?', a: 'The session is archived, the live stream stops, and post-session analytics become available. Students are disconnected and the join code is deactivated.' },
    ],
    'students': [
      { q: 'How do I track individual student performance?', a: 'Navigate to the Students page from the sidebar. Click on any student to see their detailed engagement history, attention scores, and session participation.' },
      { q: 'Can I import student lists?', a: 'Yes! Use the "Import Data" button on the Dashboard to upload CSV files with student information. The system will automatically match students to their session records.' },
      { q: 'What engagement metrics are tracked?', a: 'ClassTwin tracks attention levels, participation frequency, question responses, session duration, and cognitive sync patterns using AI analysis.' },
    ],
    'analytics': [
      { q: 'What does the cognitive sync score mean?', a: 'The sync score (0-100%) measures how well students are cognitively engaged with your material. Scores above 70% indicate strong engagement. Below 40% suggests the material may need adjustment.' },
      { q: 'How do I access post-session reports?', a: 'Click the "Insights" link in the sidebar, or click "View Full Report" in the AI Oracle section of the Dashboard. Reports include engagement heatmaps, attention timelines, and AI recommendations.' },
      { q: 'What is the Twin Engine?', a: 'The Twin Engine is an AI-powered teaching assistant that analyzes your session data and provides personalized recommendations to optimize your teaching materials and delivery style.' },
    ],
    'troubleshooting': [
      { q: 'My stream isn\'t starting', a: 'Ensure your browser has camera/microphone permissions enabled. Try refreshing the page. If the issue persists, check that your LiveKit service is properly configured in the backend.' },
      { q: 'Students can\'t join with the code', a: 'Verify the session is still active (not ended). Double-check the join code. Ensure students are using the correct student portal URL.' },
      { q: 'The dashboard shows no data', a: 'Data appears after your first session. If you\'ve had sessions but see no data, try refreshing the page or checking your internet connection.' },
      { q: 'Getting "invalid token" errors', a: 'This usually means your API credentials need to be refreshed. Check your environment variables for any trailing whitespace, and ensure your LiveKit/Supabase keys are valid and not expired.' },
    ],
    'account': [
      { q: 'How do I change my profile picture?', a: 'Your profile picture is synced from your Google account. Update it in your Google account settings and it will be reflected in ClassTwin on your next sign-in.' },
      { q: 'Can I use ClassTwin without Google sign-in?', a: 'Currently, ClassTwin uses Google OAuth for secure authentication. We\'re working on adding email/password and other sign-in methods in future updates.' },
      { q: 'How do I delete my data?', a: 'Go to Settings → Account tab → Delete Account. This will permanently remove all your sessions, student data, and analytics. This action cannot be undone.' },
    ],
  };

  const filteredFaqs = search.trim()
    ? Object.values(faqs).flat().filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs[activeCategory] || [];

  const quickLinks = [
    { label: 'Start a Session', icon: 'add_circle', path: '/sessions', color: '#1A5C3B' },
    { label: 'View Analytics', icon: 'monitoring', path: '/analytics', color: '#3B82F6' },
    { label: 'Manage Students', icon: 'groups', path: '/students', color: '#8B5CF6' },
    { label: 'Open Settings', icon: 'settings', path: '/settings', color: '#6B7280' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#F5F6FA' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1A5C3B 0%, #0f3d26 100%)',
          padding: '40px 32px 48px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

          <h1 className="font-headline" style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '6px', position: 'relative' }}>
            Help Center
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', position: 'relative' }}>
            Find answers, guides, and troubleshooting tips
          </p>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '14px', padding: '12px 18px', maxWidth: '520px', position: 'relative',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>search</span>
            <input
              type="text" placeholder="Search for help..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '15px', color: '#fff', width: '100%',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>close</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '32px', marginTop: '-24px', position: 'relative', zIndex: 5 }}>
          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {quickLinks.map((link, i) => (
              <div
                key={i}
                className="ct-card"
                onClick={() => navigate(link.path)}
                style={{
                  padding: '16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${link.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: link.color }}>{link.icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{link.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
            {/* Category sidebar */}
            {!search && (
              <div className="ct-card" style={{ padding: '12px', height: 'fit-content', position: 'sticky', top: '96px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '8px 12px 6px' }}>Categories</p>
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setExpandedFaq(null); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontSize: '13px', fontWeight: activeCategory === cat.key ? 600 : 500,
                      color: activeCategory === cat.key ? '#1A5C3B' : '#6B7280',
                      background: activeCategory === cat.key ? '#E8F5EE' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{
                      fontSize: '16px', color: activeCategory === cat.key ? '#1A5C3B' : '#9CA3AF'
                    }}>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* FAQ content */}
            <div className="ct-card" style={{ padding: '24px', gridColumn: search ? '1 / -1' : 'auto' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {search
                  ? `Search results for "${search}"`
                  : categories.find(c => c.key === activeCategory)?.label
                }
              </h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px' }}>
                {search ? `${filteredFaqs.length} result(s) found` : `${filteredFaqs.length} articles`}
              </p>

              {filteredFaqs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#D1D5DB' }}>search_off</span>
                  <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>No articles found</p>
                  <button onClick={() => setSearch('')} style={{ fontSize: '12px', color: '#1A5C3B', background: '#E8F5EE', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                    Clear search
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredFaqs.map((faq, i) => {
                    const isOpen = expandedFaq === `${activeCategory}-${i}`;
                    return (
                      <div key={i} style={{
                        borderRadius: '10px', border: '1px solid #F3F4F6',
                        overflow: 'hidden', transition: 'all 0.2s',
                        background: isOpen ? '#F9FAFB' : '#fff',
                      }}>
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : `${activeCategory}-${i}`)}
                          style={{
                            width: '100%', padding: '14px 16px', border: 'none',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            textAlign: 'left', gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isOpen ? '#1A5C3B' : '#9CA3AF' }}>
                              {isOpen ? 'help' : 'help_outline'}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: isOpen ? '#1A5C3B' : '#374151' }}>{faq.q}</span>
                          </div>
                          <span className="material-symbols-outlined" style={{
                            fontSize: '18px', color: '#9CA3AF',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                          }}>expand_more</span>
                        </button>
                        {isOpen && (
                          <div style={{
                            padding: '0 16px 16px 42px',
                            fontSize: '13px', color: '#6B7280', lineHeight: 1.7,
                          }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="ct-card" style={{
            marginTop: '24px', padding: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F0FDF4, #E8F5EE)',
            border: '1px solid #BBF7D0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: '#1A5C3B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#fff' }}>support_agent</span>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Still need help?</p>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>Our support team is here to assist you</p>
              </div>
            </div>
            <button
              className="ct-btn-primary"
              onClick={() => window.open('mailto:support@classtwin.ai', '_blank')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
              Contact Support
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
