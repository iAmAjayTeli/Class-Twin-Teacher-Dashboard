import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Shared context so pages can read collapsed state if needed
export const SidebarContext = createContext({ collapsed: false });
export const useSidebar = () => useContext(SidebarContext);

export default function Sidebar({ onStartSession }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [liveSession, setLiveSession] = useState(null); // { id, join_code }

  // Check for active streaming sessions
  useEffect(() => {
    if (!user) return;
    const checkLiveSession = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, join_code, topic, is_streaming')
        .eq('created_by', user.id)
        .eq('is_streaming', true)
        .limit(1)
        .single();
      setLiveSession(data || null);
    };
    checkLiveSession();
    // Re-check when navigating between pages
    const interval = setInterval(checkLiveSession, 5000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: 'space_dashboard', label: 'Dashboard', path: '/sessions', badge: null, end: true },
    { icon: 'groups', label: 'Students', path: '/students', badge: null, end: true },
    { icon: 'auto_stories', label: 'Materials', path: '/materials', badge: null, end: true },
    { icon: 'monitoring', label: 'Insights', path: '/analytics', badge: '3', end: true },
    { icon: 'neurology', label: 'Twin Engine', path: '/ai-tutor', badge: 'NEW', end: true },
  ];

  const generalItems = [
    { icon: 'settings', label: 'Settings', path: '/settings' },
    { icon: 'help', label: 'Help Center', path: '/help' },
  ];

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Teacher';

  const sidebarWidth = collapsed ? 72 : 240;

  const renderNavItem = (item) => {
    const isHovered = hoveredItem === item.label;
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: collapsed ? '0px' : '12px',
      padding: collapsed ? '10px 0' : '10px 14px',
      borderRadius: '10px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      textDecoration: 'none',
      color: isHovered ? '#1F2937' : '#6B7280',
      background: isHovered ? '#F9FAFB' : 'transparent',
      position: 'relative',
      justifyContent: collapsed ? 'center' : 'flex-start',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    };

    if (item.isLogout) {
      return (
        <div
          key={item.label}
          onClick={handleLogout}
          onMouseEnter={() => setHoveredItem(item.label)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ ...baseStyle, color: isHovered ? '#EF4444' : '#9CA3AF', background: isHovered ? '#FEF2F2' : 'transparent' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'inherit', minWidth: '20px' }}>{item.icon}</span>
          {!collapsed && <span>{item.label}</span>}
        </div>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.path}
        end={item.end}
        onMouseEnter={() => setHoveredItem(item.label)}
        onMouseLeave={() => setHoveredItem(null)}
        className={({ isActive }) => isActive ? 'nav-active' : ''}
        title={collapsed ? item.label : undefined}
        style={({ isActive }) => ({
          ...baseStyle,
          color: isActive ? '#1A5C3B' : isHovered ? '#1F2937' : '#6B7280',
          background: isActive ? 'rgba(26, 92, 59, 0.07)' : isHovered ? '#F9FAFB' : 'transparent',
          fontWeight: isActive ? 600 : 500,
        })}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'inherit', transition: 'all 0.15s', minWidth: '20px' }}>
          {item.icon}
        </span>
        {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
        {!collapsed && item.badge && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 700,
            ...(item.badge === 'NEW'
              ? { background: '#E8F5EE', color: '#1A5C3B' }
              : { background: '#F3F4F6', color: '#374151' }
            ),
          }}>
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        background: '#FFFFFF',
        borderRight: '1px solid #EAECF0',
        padding: collapsed ? '20px 10px' : '20px 12px',
        gap: '2px',
        position: 'relative',
        zIndex: 20,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

        {/* Logo + Collapse Toggle */}
        <div style={{
          padding: collapsed ? '4px 0 16px 0' : '4px 8px 20px 8px',
          display: 'flex', alignItems: 'center', gap: '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
        }}>
          <div style={{
            width: '36px', height: '36px', minWidth: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(26, 92, 59, 0.25)',
            cursor: collapsed ? 'pointer' : 'default',
          }}
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            title={collapsed ? 'Expand sidebar' : undefined}
          >
            <span className="material-symbols-outlined filled" style={{ color: '#fff', fontSize: '20px' }}>neurology</span>
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <h1 className="font-headline" style={{ fontSize: '16px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                ClassTwin
              </h1>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF', fontWeight: 600, marginTop: '1px' }}>
                AI Teaching Engine
              </p>
            </div>
          )}

          {/* Collapse / Expand button */}
          <button
            onClick={() => setCollapsed(prev => !prev)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-toggle-btn"
            style={{
              position: collapsed ? 'relative' : 'absolute',
              right: collapsed ? 'auto' : '-2px',
              top: collapsed ? 'auto' : '50%',
              transform: collapsed ? 'none' : 'translateY(-50%)',
              width: '28px', height: '28px',
              borderRadius: '8px',
              border: '1px solid #EAECF0',
              background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: 0,
              marginTop: collapsed ? '8px' : 0,
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: '16px', color: '#6B7280',
              transition: 'transform 0.25s ease',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}>
              chevron_right
            </span>
          </button>
        </div>

        {/* MENU section */}
        {!collapsed && (
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', fontWeight: 700, padding: '4px 14px 6px' }}>
            Menu
          </p>
        )}
        {collapsed && <div style={{ height: '8px' }} />}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {menuItems.map(renderNavItem)}
        </nav>

        {/* Back to Live Session banner */}
        {liveSession && !location.pathname.startsWith('/lobby') && (
          <div
            onClick={() => navigate(`/lobby/${liveSession.join_code}?sessionId=${liveSession.id}`)}
            style={{
              margin: collapsed ? '8px 0' : '10px 0',
              padding: collapsed ? '10px 0' : '12px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
              border: '1px solid #FECACA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: collapsed ? 'center' : 'flex-start',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '10px',
              flexDirection: collapsed ? 'column' : 'row',
              transition: 'all 0.2s ease',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
            title={collapsed ? 'Back to Live Session' : undefined}
          >
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#EF4444',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
              flexShrink: 0, marginTop: collapsed ? 0 : '4px',
            }} />
            {!collapsed && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', margin: 0, lineHeight: 1.3 }}>
                  Live Session Active
                </p>
                <p style={{ fontSize: '10px', color: '#B91C1C', margin: '2px 0 0', fontWeight: 500 }}>
                  Tap to return →
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: '20px' }} />

        {/* GENERAL section */}
        <div style={{ borderTop: '1px solid #EAECF0', paddingTop: '12px' }}>
          {!collapsed && (
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', fontWeight: 700, padding: '4px 14px 6px' }}>
              General
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {generalItems.map(renderNavItem)}
          </div>
        </div>

        {/* User profile + Logout */}
        {user && (
          <div style={{
            marginTop: '12px',
            borderRadius: collapsed ? '10px' : '14px',
            border: '1px solid #EAECF0',
            overflow: 'hidden',
            transition: 'all 0.25s ease',
          }}>
            {collapsed ? (
              /* Collapsed: avatar only */
              <div style={{
                padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EAECF0' }} />
                ) : (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff',
                  }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              /* Expanded: full profile */
              <div style={{
                padding: '14px',
                background: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%', border: '2px solid #EAECF0' }} />
                ) : (
                  <div style={{
                    width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, color: '#fff',
                  }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Sign Out' : undefined}
              style={{
                width: '100%',
                padding: collapsed ? '8px' : '10px 14px',
                background: '#FFFFFF',
                border: 'none',
                borderTop: '1px solid #EAECF0',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: collapsed ? '0' : '8px',
                transition: 'background 0.15s ease',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseOut={e => e.currentTarget.style.background = '#FFFFFF'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              {!collapsed && 'Sign Out'}
            </button>
          </div>
        )}

        <style>{`
          .sidebar-toggle-btn:hover {
            background: #F3F4F6 !important;
            border-color: #D1D5DB !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
          }
          .sidebar-toggle-btn:hover .material-symbols-outlined {
            color: #1A5C3B !important;
          }
        `}</style>
      </aside>
    </SidebarContext.Provider>
  );
}
