import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user) navigate('/sessions', { replace: true });
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
        <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F6FA', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle green glow */}
      <div style={{ position: 'absolute', top: '-100px', right: '10%', width: '400px', height: '400px', background: 'rgba(26, 92, 59, 0.06)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '15%', width: '300px', height: '300px', background: 'rgba(26, 92, 59, 0.04)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '440px', width: '100%', padding: '0 24px' }}>

        {/* Logo */}
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #1A5C3B, #2D7A52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(26, 92, 59, 0.25)', marginBottom: '20px',
        }}>
          <span className="material-symbols-outlined filled" style={{ color: '#fff', fontSize: '28px' }}>neurology</span>
        </div>

        <h1 className="font-headline" style={{ fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' }}>
          Welcome to ClassTwin
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, textAlign: 'center', marginBottom: '32px' }}>
          Sign in to access your AI-powered teacher dashboard.
        </p>

        {/* Card */}
        <div style={{
          width: '100%', background: '#FFFFFF',
          borderRadius: '20px', padding: '28px',
          border: '1px solid #EAECF0',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            style={{
              width: '100%', padding: '13px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              background: '#FFFFFF', color: '#111827',
              fontWeight: 600, fontSize: '14px',
              borderRadius: '50px', border: '1px solid #EAECF0',
              cursor: signingIn ? 'not-allowed' : 'pointer',
              opacity: signingIn ? 0.6 : 1,
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            onMouseOver={e => { if (!signingIn) e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#EAECF0'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          {error && <p style={{ marginTop: '14px', color: '#EF4444', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#9CA3AF' }}>
          Teacher Dashboard • Powered by AI
        </p>
      </div>
    </div>
  );
}
