import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="flex items-center gap-sm">
          <div className="logo-icon" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary-container), var(--inverse-primary))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🧠</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>ClassTwin</span>
        </div>
        <div className="flex gap-md items-center">
          <button className="btn btn-ghost" onClick={() => navigate('/sessions')}>Dashboard</button>
          <button className="btn btn-primary" onClick={() => navigate('/sessions')}>Get Started →</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div className="badge badge-info" style={{ marginBottom: 24, padding: '6px 16px' }}>
            🏆 AI & Intelligent Digital Twins — Hackathon Track 01
          </div>

          <h1 className="display-lg" style={{ marginBottom: 20 }}>
            The Real-Time
            <span className="text-primary" style={{ display: 'block' }}>Digital Twin</span>
            of Your Classroom
          </h1>

          <p className="body-lg text-muted" style={{ maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.8 }}>
            ClassTwin mirrors every student's cognitive state in real time. Know who's lost, what concept broke them, and what to do <em>right now</em> — before a single student fails.
          </p>

          <div className="flex gap-md justify-center" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/sessions')} style={{ padding: '16px 40px', fontSize: '1rem' }}>
              🚀 Start Teaching →
            </button>
            <button className="btn btn-secondary btn-lg" style={{ padding: '16px 40px' }}>
              📖 How It Works
            </button>
          </div>

          {/* Stats */}
          <div className="grid-3" style={{ marginTop: 80, maxWidth: 600, margin: '80px auto 0' }}>
            <div className="text-center">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>2min</div>
              <div className="label-md text-muted" style={{ marginTop: 4 }}>Update Cycle</div>
            </div>
            <div className="text-center">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)' }}>98%</div>
              <div className="label-md text-muted" style={{ marginTop: 4 }}>Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--tertiary)' }}>0s</div>
              <div className="label-md text-muted" style={{ marginTop: 4 }}>Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="text-center" style={{ marginBottom: 64 }}>
          <div className="label-md text-primary" style={{ marginBottom: 12 }}>Core Capabilities</div>
          <h2 className="display-md">Everything a Teacher Needs</h2>
        </div>

        <div className="grid-3" style={{ gap: 24 }}>
          {[
            { icon: '🔥', title: 'Live Comprehension Heatmap', desc: 'See every student\'s understanding level color-coded in real time. Green, yellow, red — at a glance.', color: 'var(--secondary)' },
            { icon: '⚠️', title: 'Risk Prediction Engine', desc: 'AI identifies students trending toward failure 3 rounds before it happens. Intervene early.', color: 'var(--error)' },
            { icon: '🤖', title: 'AI Teaching Assistant', desc: 'Claude analyzes classroom data every 2 rounds and gives you one specific action to take right now.', color: 'var(--primary)' },
            { icon: '📱', title: 'Zero Friction Student Join', desc: 'Students scan a QR code. No app download, no login. Just scan, enter name, and start answering.', color: 'var(--tertiary)' },
            { icon: '⚡', title: 'Real-Time WebSocket Sync', desc: 'Every answer streams live to your dashboard via WebSocket. No refreshing, no delays.', color: 'var(--primary)' },
            { icon: '📊', title: 'Post-Session Analytics', desc: 'Deep dive into session performance. See trends, identify weak concepts, and track improvement.', color: 'var(--secondary)' },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon" style={{ background: `${f.color}15` }}>
                {f.icon}
              </div>
              <h3 className="title-lg" style={{ marginBottom: 8 }}>{f.title}</h3>
              <p className="body-md text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div className="card-glass" style={{ maxWidth: 600, margin: '0 auto', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--primary-container), var(--secondary), var(--tertiary))' }} />
          <h2 className="headline-lg" style={{ marginBottom: 12 }}>Ready to Twin Your Classroom?</h2>
          <p className="body-md text-muted" style={{ marginBottom: 32 }}>Start your first session in under 60 seconds. No setup needed.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/sessions')} style={{ padding: '16px 48px' }}>
            Start Now — It's Free 🚀
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid rgba(70,69,84,0.1)' }}>
        <p className="body-md text-muted">ClassTwin © 2026 • Built for Hackathon Track 01: AI & Intelligent Digital Twins</p>
      </footer>
    </div>
  );
}
