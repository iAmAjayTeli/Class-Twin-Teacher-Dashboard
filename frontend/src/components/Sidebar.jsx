import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🧠</div>
        <span className="logo-text">ClassTwin</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </NavLink>

        <NavLink to="/sessions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📚</span>
          <span>Sessions</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          <span>Live Dashboard</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📈</span>
          <span>Analytics</span>
        </NavLink>
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(70,69,84,0.1)' }}>
        <div className="flex items-center gap-sm">
          <div className="student-avatar" style={{ background: 'linear-gradient(135deg, var(--primary-container), var(--inverse-primary))', width: 32, height: 32, fontSize: '0.65rem' }}>
            TC
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teacher</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>ClassTwin Pro</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
