import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SessionLibrary from './pages/SessionLibrary';
import SessionLobby from './pages/SessionLobby';
import LiveDashboard from './pages/LiveDashboard';
import PostSessionAnalytics from './pages/PostSessionAnalytics';
import Materials from './pages/Materials';
import AITutor from './pages/AITutor';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--background)', color: 'var(--on-surface)',
      }}>
        <div style={{ fontSize: '18px', opacity: 0.6 }}>Loading...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sessions" element={<ProtectedRoute><SessionLibrary /></ProtectedRoute>} />
          <Route path="/lobby/:code" element={<ProtectedRoute><SessionLobby /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><LiveDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><PostSessionAnalytics /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
