import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: 'auto_awesome', title: 'Digital Twin Technology', color: 'var(--primary-fixed-dim)',
    desc: 'Create a real-time heatmap of student understanding. Every interaction is mapped to a digital mirror of your physical classroom.',
    illustration: 'bar_chart',
  },
  {
    icon: 'bolt', title: 'AI Interventions', color: 'var(--secondary)',
    desc: 'Context-aware suggestions triggered the moment a student hits a cognitive block. Move from passive lecturing to active orchestration.',
    illustration: null,
  },
  {
    icon: 'star', title: 'Reflective Loops', color: 'var(--tertiary)',
    desc: 'Generate longitudinal growth profiles for every student, automatically identifying hidden potential and systemic gaps.',
    illustration: null,
  },
  {
    icon: 'insights', title: 'Post-Session Insights', color: 'var(--primary-fixed-dim)',
    desc: 'Review your teaching efficacy through a new lens. AI-powered analytics refine your future lesson plans based on actual student reception.',
    illustration: null,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: 'var(--background)', color: 'var(--on-surface)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px',
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(16, 20, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(224, 226, 234, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(to bottom right, var(--primary), var(--inverse-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(192, 193, 255, 0.2)',
          }}>
            <span className="material-symbols-outlined filled" style={{ color: 'var(--on-primary-fixed)', fontSize: '18px' }}>auto_awesome</span>
          </div>
          <span className="font-headline" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>ClassTwin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ color: 'rgba(224, 226, 234, 0.6)', fontSize: '14px', transition: 'color 0.3s' }}>Features</a>
          <a href="#" style={{ color: 'rgba(224, 226, 234, 0.6)', fontSize: '14px' }}>Pricing</a>
          <a href="#" style={{ color: 'rgba(224, 226, 234, 0.6)', fontSize: '14px' }}>Case Studies</a>
          <button onClick={() => navigate('/sessions')} style={{
            padding: '10px 24px',
            background: 'linear-gradient(to right, var(--primary), var(--inverse-primary))',
            color: 'var(--on-primary-fixed)', fontWeight: 700, borderRadius: '12px',
            border: 'none', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 8px 20px rgba(73, 75, 214, 0.3)',
          }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 40px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '-20%', left: '20%', width: '600px', height: '600px', background: 'rgba(128, 131, 255, 0.08)', filter: 'blur(120px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '20%', width: '400px', height: '400px', background: 'rgba(74, 225, 118, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />

        <p style={{
          fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em',
          color: 'var(--primary-fixed-dim)', fontWeight: 600, marginBottom: '24px',
        }}>CLASSROOM AI ENGINE</p>

        <h1 className="font-headline" style={{
          fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px',
          maxWidth: '900px',
        }}>
          The First AI Digital Twin for <span style={{ color: 'var(--primary)' }}>Your Classroom</span>.
        </h1>

        <p style={{
          fontSize: '18px', color: 'var(--on-surface-variant)', maxWidth: '640px',
          lineHeight: 1.6, marginBottom: '48px',
        }}>
          Orchestrate high-fidelity learning experiences with real-time student comprehension monitoring.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '80px' }}>
          <button onClick={() => navigate('/sessions')} style={{
            padding: '16px 32px',
            background: 'linear-gradient(to right, var(--primary), var(--inverse-primary))',
            color: 'var(--on-primary-fixed)', fontWeight: 700, borderRadius: '16px',
            border: 'none', cursor: 'pointer', fontSize: '16px',
            boxShadow: '0 20px 50px rgba(73, 75, 214, 0.3)',
            transition: 'all 0.3s',
          }}>Launch Live Classroom</button>
          <button style={{
            padding: '16px 32px',
            backgroundColor: 'transparent', color: 'var(--on-surface)',
            fontWeight: 600, borderRadius: '16px',
            border: '1px solid rgba(224, 226, 234, 0.15)',
            cursor: 'pointer', fontSize: '16px',
            transition: 'all 0.3s',
          }}>Watch Demo</button>
        </div>

        {/* Dashboard Preview */}
        <div style={{
          width: '100%', maxWidth: '900px',
          backgroundColor: 'var(--surface-container-low)',
          borderRadius: '24px', padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 40px 80px rgba(0, 0, 0, 0.4)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(128, 131, 255, 0.05), transparent, rgba(74, 225, 118, 0.03))', pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', position: 'relative' }}>
            {/* Chart Area */}
            <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '24px', height: '200px', position: 'relative' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>VS.</div>
              <svg width="100%" height="140" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(74, 225, 118, 0.4)" /><stop offset="100%" stopColor="rgba(74, 225, 118, 0)" />
                  </linearGradient>
                </defs>
                <path d="M0,80 Q50,60 100,50 T200,40 T300,30 T400,20 L400,100 L0,100 Z" fill="url(#previewGrad)" />
                <path d="M0,80 Q50,60 100,50 T200,40 T300,30 T400,20" fill="none" stroke="#4ae176" strokeWidth="2" />
              </svg>
            </div>
            {/* Sidebar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '16px', flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>AI INSIGHT</div>
                <div style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 500 }}>3 students struggling with 'Quadratic Roots'. Suggested action: Trigger visual scaffold B.</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>sensors</span>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Trusted by Innovation Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {features.map((f, i) => (
            <div key={i} className="glass-highlight" style={{
              position: 'relative',
              backgroundColor: 'rgba(28, 32, 37, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              transition: 'all 0.5s',
            }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(38, 42, 48, 0.6)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(28, 32, 37, 0.4)'}
            >
              <div className="noise-texture" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span className="material-symbols-outlined filled" style={{ color: f.color, fontSize: '24px', marginBottom: '16px', display: 'block' }}>{f.icon}</span>
                <h3 className="font-headline" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{f.desc}</p>
                {f.illustration && (
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'rgba(192, 193, 255, 0.15)' }}>{f.illustration}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        margin: '0 40px 80px',
        borderRadius: '32px',
        padding: '80px 40px',
        textAlign: 'center',
        backgroundColor: 'rgba(28, 32, 37, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="noise-texture" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-headline" style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>Connect your classroom today.</h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Join over 2,500 educators redefining the limits of classroom intelligence. Experience the future of pedagogy.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/sessions')} style={{
              padding: '14px 28px',
              background: 'linear-gradient(to right, var(--primary), var(--inverse-primary))',
              color: 'var(--on-primary-fixed)', fontWeight: 700, borderRadius: '14px',
              border: 'none', cursor: 'pointer', fontSize: '15px',
              boxShadow: '0 15px 40px rgba(73, 75, 214, 0.3)',
            }}>Start Your Free Trial</button>
            <button style={{
              padding: '14px 28px',
              backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface)',
              fontWeight: 700, borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '15px',
            }}>Schedule a Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px',
        borderTop: '1px solid rgba(224, 226, 234, 0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '12px', color: 'var(--on-surface-variant)',
      }}>
        <div>
          <p style={{ fontWeight: 600 }}>ClassTwin</p>
          <p style={{ opacity: 0.6 }}>© 2024 ClassTwin. AI-Powered Excellence.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Twitter', 'LinkedIn', 'Status', 'Security', 'Privacy'].map(link => (
            <a key={link} href="#" style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
