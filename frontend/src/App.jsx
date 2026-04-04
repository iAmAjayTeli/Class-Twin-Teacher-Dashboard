import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import SessionLibrary from './pages/SessionLibrary';
import SessionLobby from './pages/SessionLobby';
import LiveDashboard from './pages/LiveDashboard';
import PostSessionAnalytics from './pages/PostSessionAnalytics';
import './index.css';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isLobby = location.pathname.startsWith('/lobby');
  const showSidebar = !isLanding && !isLobby;

  return (
    <div className={showSidebar ? 'app-layout' : ''}>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sessions" element={<SessionLibrary />} />
          <Route path="/lobby/:code" element={<SessionLobby />} />
          <Route path="/dashboard" element={<LiveDashboard />} />
          <Route path="/analytics" element={<PostSessionAnalytics />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
