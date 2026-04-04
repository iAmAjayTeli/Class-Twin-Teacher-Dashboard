import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ onStartSession }) {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: 'space_dashboard', label: 'Dashboard', path: '/sessions', badge: null, end: true },
    { icon: 'cast_for_education', label: 'Active Class', path: '/dashboard', badge: 'LIVE', end: false },
    { icon: 'auto_stories', label: 'Materials', path: '/materials', badge: null, end: true },
    { icon: 'monitoring', label: 'Insights', path: '/analytics', badge: '3', end: true },
    { icon: 'smart_toy', label: 'AI Tutor', path: '/ai-tutor', badge: 'NEW', end: true },
  ];

  const bottomItems = [
    { icon: 'settings', label: 'Settings', path: '#' },
    { icon: 'help', label: 'Help Center', path: '#' },
  ];

  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: collapsed ? '80px' : '272px',
      minWidth: collapsed ? '80px' : '272px',
      background: 'linear-gradient(180deg, rgba(16, 20, 25, 0.98) 0%, rgba(12, 15, 20, 1) 100%)',
      borderRight: '1px solid rgba(192, 193, 255, 0.06)',
      padding: collapsed ? '20px 12px' : '20px 16px',
      gap: '8px',
      position: 'relative',
      zIndex: 20,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
    }}>
      {/* Ambient glow accent */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-40px',
        width: '180px', height: '180px',
        background: 'radial-gradient(circle, rgba(192, 193, 255, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(40px)',
      }} />

      {/* Logo Section */}
      <div style={{
        display: 'flex', flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center', gap: collapsed ? '8px' : '12px',
        padding: '8px 8px 12px 8px',
      }}>
        <div style={{
          width: '42px', height: '42px', minWidth: '42px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #8083ff 0%, #494bd6 50%, #6c5ce7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(128, 131, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            animation: 'shimmer 3s infinite',
          }} />
          <span className="material-symbols-outlined filled" style={{
            color: '#fff', fontSize: '22px', position: 'relative', zIndex: 1,
          }}>neurology</span>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <h1 className="font-headline" style={{
              fontSize: '18px', fontWeight: 800,
              background: 'linear-gradient(to right, #e0e2ea, #c0c1ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>ClassTwin</h1>
            <p style={{
              fontSize: '9px', textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'rgba(192, 193, 255, 0.5)',
              fontWeight: 600, marginTop: '2px',
            }}>AI Teaching Engine</p>
          </div>
        )}
        {/* Collapse/Expand Toggle */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={() => setHoveredItem('toggle')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            width: collapsed ? '42px' : '32px',
            height: collapsed ? '36px' : '32px',
            minWidth: collapsed ? '42px' : '32px',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: hoveredItem === 'toggle'
              ? 'rgba(192, 193, 255, 0.1)'
              : collapsed
                ? 'rgba(224, 226, 234, 0.04)'
                : 'transparent',
            border: collapsed ? '1px solid rgba(192, 193, 255, 0.08)' : '1px solid transparent',
          }}
        >
          <span className="material-symbols-outlined" style={{
            fontSize: '18px',
            color: hoveredItem === 'toggle' ? 'var(--primary-fixed-dim)' : 'rgba(224, 226, 234, 0.4)',
            transition: 'all 0.3s',
          }}>{collapsed ? 'menu_open' : 'keyboard_double_arrow_left'}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px', margin: '4px 8px',
        background: 'linear-gradient(to right, transparent, rgba(192, 193, 255, 0.08), transparent)',
      }} />

      {/* Section Label */}
      {!collapsed && (
        <p style={{
          fontSize: '10px', textTransform: 'uppercase',
          letterSpacing: '0.12em', color: 'rgba(224, 226, 234, 0.25)',
          fontWeight: 600, padding: '4px 12px 0',
        }}>Navigation</p>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            onMouseEnter={() => setHoveredItem(item.label)}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) => isActive ? 'nav-active' : 'nav-inactive'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '12px' : '11px 14px',
              borderRadius: '12px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: isActive ? '#e0e2ea' : 'rgba(224, 226, 234, 0.45)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(128, 131, 255, 0.12), rgba(73, 75, 214, 0.08))'
                : hoveredItem === item.label
                  ? 'rgba(224, 226, 234, 0.04)'
                  : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13.5px',
              textDecoration: 'none',
              position: 'relative',
              justifyContent: collapsed ? 'center' : 'flex-start',
              border: isActive ? '1px solid rgba(192, 193, 255, 0.1)' : '1px solid transparent',
            })}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: '20px',
              transition: 'all 0.2s',
            }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge && (
              <span style={{
                marginLeft: 'auto',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                ...(item.badge === 'LIVE' ? {
                  background: 'rgba(74, 225, 118, 0.12)',
                  color: '#4ae176',
                  border: '1px solid rgba(74, 225, 118, 0.2)',
                } : item.badge === 'NEW' ? {
                  background: 'linear-gradient(135deg, rgba(128, 131, 255, 0.15), rgba(108, 92, 231, 0.15))',
                  color: '#c0c1ff',
                  border: '1px solid rgba(192, 193, 255, 0.15)',
                } : {
                  background: 'rgba(255, 185, 95, 0.12)',
                  color: '#ffb95f',
                  border: '1px solid rgba(255, 185, 95, 0.2)',
                }),
              }}>{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '2px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(192, 193, 255, 0.06)',
      }}>
        {/* Bottom nav items */}
        {bottomItems.map((item) => (
          <div
            key={item.label}
            onMouseEnter={() => setHoveredItem(item.label)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: collapsed ? '10px' : '10px 14px',
              borderRadius: '12px', cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'rgba(224, 226, 234, 0.35)',
              background: hoveredItem === item.label ? 'rgba(224, 226, 234, 0.04)' : 'transparent',
              fontSize: '13px', fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}

        {/* Divider */}
        <div style={{
          height: '1px', margin: '6px 8px',
          background: 'linear-gradient(to right, transparent, rgba(192, 193, 255, 0.06), transparent)',
        }} />

        {/* User Profile */}
        <div
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: collapsed ? '10px' : '10px 14px',
            borderRadius: '14px', cursor: 'pointer',
            transition: 'all 0.2s',
            background: hoveredItem === 'profile' ? 'rgba(224, 226, 234, 0.04)' : 'transparent',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div style={{
            width: '34px', height: '34px', minWidth: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4ae176, #2dd573)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#0a1a0f',
            boxShadow: '0 4px 12px rgba(74, 225, 118, 0.2)',
          }}>PS</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e2ea', lineHeight: 1.2 }}>Prof. Smith</p>
              <p style={{ fontSize: '10px', color: 'rgba(224, 226, 234, 0.35)', marginTop: '1px' }}>Computer Science</p>
            </div>
          )}
          {!collapsed && (
            <span className="material-symbols-outlined" style={{
              fontSize: '16px', color: 'rgba(224, 226, 234, 0.25)',
            }}>more_horiz</span>
          )}
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </aside>
  );
}
