import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SessionLibrary from './pages/SessionLibrary';
import SessionLobby from './pages/SessionLobby';
import LiveDashboard from './pages/LiveDashboard';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import PostSessionAnalytics from './pages/PostSessionAnalytics';
import Materials from './pages/Materials';
import AITutor from './pages/AITutor';
import AllSessions from './pages/AllSessions';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import TestStudentAssignment from './pages/TestStudentAssignment';

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
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sessions" element={<ProtectedRoute><SessionLibrary /></ProtectedRoute>} />
          <Route path="/all-sessions" element={<ProtectedRoute><AllSessions /></ProtectedRoute>} />
          <Route path="/lobby/:code" element={<ProtectedRoute><SessionLobby /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><LiveDashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/students/:studentName" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><PostSessionAnalytics /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
          <Route path="/test-student-assignment/:id" element={<TestStudentAssignment />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
