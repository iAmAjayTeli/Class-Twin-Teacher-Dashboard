import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Teacher';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    sessionAlerts: true,
    weeklyReport: false,
    studentJoinSound: true,
    autoEndSession: true,
    sessionTimeout: 60,
    defaultSubject: '',
    language: 'en',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
    { key: 'sessions', label: 'Session Defaults', icon: 'cast_connected' },
    { key: 'appearance', label: 'Appearance', icon: 'palette' },
    { key: 'account', label: 'Account', icon: 'shield_person' },
  ];

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none',
        background: checked ? '#1A5C3B' : '#D1D5DB',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );

  const SettingRow = ({ icon, title, description, children }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 0', borderBottom: '1px solid #F3F4F6',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>{icon}</span>
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>{description}</p>
        </div>
      </div>
      <div style={{ marginLeft: '16px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F5F6FA' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#F5F6FA' }}>
        {/* Header */}
        <div style={{
          background: '#FFFFFF', borderBottom: '1px solid #EAECF0',
          padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div>
            <h1 className="font-headline" style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>Settings</h1>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Manage your account and preferences</p>
          </div>
        </div>

        <div style={{ padding: '32px', maxWidth: '900px' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '10px 12px', borderRadius: '9px', border: 'none',
                fontSize: '13px', fontWeight: activeTab === tab.key ? 600 : 500,
                color: activeTab === tab.key ? '#1A5C3B' : '#6B7280',
                background: activeTab === tab.key ? '#fff' : 'transparent',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Profile Tab ─── */}
          {activeTab === 'profile' && (
            <div className="ct-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Profile Information</h2>
              
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #F3F4F6' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid #EAECF0' }} />
                ) : (
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 700, color: '#fff',
                  }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{displayName}</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>{user?.email}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#1A5C3B' }}>verified</span>
                    Signed in via Google
                  </p>
                </div>
              </div>

              {/* Info fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Full Name', value: displayName, icon: 'badge' },
                  { label: 'Email Address', value: user?.email, icon: 'mail' },
                  { label: 'User ID', value: user?.id?.slice(0, 8) + '...', icon: 'fingerprint' },
                  { label: 'Last Sign In', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A', icon: 'schedule' },
                ].map((field, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#9CA3AF' }}>{field.icon}</span>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#111827', fontWeight: 500, wordBreak: 'break-all' }}>{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Notifications Tab ─── */}
          {activeTab === 'notifications' && (
            <div className="ct-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Notification Preferences</h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Choose what updates you'd like to receive</p>

              <SettingRow icon="mail" title="Email Notifications" description="Receive session summaries and reports via email">
                <Toggle checked={preferences.emailNotifications} onChange={v => setPreferences(p => ({ ...p, emailNotifications: v }))} />
              </SettingRow>
              <SettingRow icon="campaign" title="Session Alerts" description="Get notified when students join or raise hands">
                <Toggle checked={preferences.sessionAlerts} onChange={v => setPreferences(p => ({ ...p, sessionAlerts: v }))} />
              </SettingRow>
              <SettingRow icon="summarize" title="Weekly Report" description="Receive a weekly performance digest every Monday">
                <Toggle checked={preferences.weeklyReport} onChange={v => setPreferences(p => ({ ...p, weeklyReport: v }))} />
              </SettingRow>
              <SettingRow icon="volume_up" title="Student Join Sound" description="Play a chime when students join your session">
                <Toggle checked={preferences.studentJoinSound} onChange={v => setPreferences(p => ({ ...p, studentJoinSound: v }))} />
              </SettingRow>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ct-btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saved ? <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span> Saved!</> : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Session Defaults Tab ─── */}
          {activeTab === 'sessions' && (
            <div className="ct-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Session Defaults</h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Configure default behaviors for new sessions</p>

              <SettingRow icon="timer" title="Auto-End Sessions" description="Automatically end sessions after the timeout period">
                <Toggle checked={preferences.autoEndSession} onChange={v => setPreferences(p => ({ ...p, autoEndSession: v }))} />
              </SettingRow>

              <div style={{ padding: '16px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>schedule</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Session Timeout</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 12px' }}>Minutes before auto-ending an idle session</p>
                    <select
                      value={preferences.sessionTimeout}
                      onChange={e => setPreferences(p => ({ ...p, sessionTimeout: Number(e.target.value) }))}
                      style={{
                        padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAECF0',
                        background: '#F9FAFB', fontSize: '13px', color: '#374151',
                        fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>book</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Default Subject</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 12px' }}>Pre-fill subject when creating new sessions</p>
                    <input
                      type="text" placeholder="e.g. Mathematics, Computer Science..."
                      value={preferences.defaultSubject}
                      onChange={e => setPreferences(p => ({ ...p, defaultSubject: e.target.value }))}
                      style={{
                        padding: '8px 14px', borderRadius: '8px', border: '1px solid #EAECF0',
                        background: '#F9FAFB', fontSize: '13px', color: '#374151', width: '300px',
                        fontFamily: 'Inter, sans-serif', outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ct-btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saved ? <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span> Saved!</> : 'Save Defaults'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Appearance Tab ─── */}
          {activeTab === 'appearance' && (
            <div className="ct-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Appearance</h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Customize how ClassTwin looks</p>

              <div style={{ padding: '16px 0', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Theme</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { key: 'light', label: 'Light', icon: 'light_mode', bg: '#FFFFFF', border: '#EAECF0' },
                    { key: 'dark', label: 'Dark', icon: 'dark_mode', bg: '#1F2937', border: '#374151' },
                    { key: 'system', label: 'System', icon: 'desktop_windows', bg: 'linear-gradient(135deg, #fff 50%, #1F2937 50%)', border: '#EAECF0' },
                  ].map(theme => (
                    <div key={theme.key} style={{
                      padding: '16px 20px', borderRadius: '12px',
                      border: theme.key === 'light' ? '2px solid #1A5C3B' : `1px solid ${theme.border}`,
                      cursor: 'pointer', textAlign: 'center', flex: 1,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: '48px', height: '32px', borderRadius: '8px', margin: '0 auto 10px',
                        background: theme.bg, border: `1px solid ${theme.border}`,
                      }} />
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: theme.key === 'light' ? '#1A5C3B' : '#9CA3AF', display: 'block', marginBottom: '4px' }}>{theme.icon}</span>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: theme.key === 'light' ? '#1A5C3B' : '#6B7280' }}>{theme.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SettingRow icon="language" title="Language" description="Interface language">
                <select value={preferences.language} onChange={e => setPreferences(p => ({ ...p, language: e.target.value }))}
                  style={{ padding: '6px 10px', border: '1px solid #EAECF0', borderRadius: '8px', background: '#F9FAFB', fontSize: '13px', color: '#374151', fontFamily: 'Inter, sans-serif', cursor: 'pointer', outline: 'none' }}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="hi">हिंदी</option>
                </select>
              </SettingRow>
            </div>
          )}

          {/* ─── Account Tab ─── */}
          {activeTab === 'account' && (
            <div className="ct-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Account & Security</h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Manage your account access and data</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6B7280' }}>download</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Export Data</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Download all your sessions and analytics</p>
                    </div>
                  </div>
                  <button className="ct-btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>Export</button>
                </div>

                <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6B7280' }}>logout</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Sign Out</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Sign out of your ClassTwin account</p>
                    </div>
                  </div>
                  <button onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Sign Out
                  </button>
                </div>

                <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#EF4444' }}>delete_forever</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>Delete Account</p>
                      <p style={{ fontSize: '12px', color: '#B91C1C' }}>Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <button style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#DC2626', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Saved toast */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
          background: '#1A5C3B', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(26,92,59,0.3)',
          animation: 'slideUp 0.3s ease',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          Settings saved successfully
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
