import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

/* ═══ Feature Data ═══ */
const features = [
  {
    icon: 'auto_awesome', title: 'Digital Twin Technology', color: 'var(--primary)',
    bg: 'var(--primary-light)',
    desc: 'Create a real-time heatmap of student understanding. Every interaction is mapped to a digital mirror of your physical classroom.',
    illustration: 'bar_chart',
  },
  {
    icon: 'bolt', title: 'AI Interventions', color: 'var(--accent-blue)',
    bg: '#EFF6FF',
    desc: 'Context-aware suggestions triggered the moment a student hits a cognitive block. Move from passive lecturing to active orchestration.',
    illustration: null,
  },
  {
    icon: 'star', title: 'Reflective Loops', color: 'var(--accent-amber)',
    bg: '#FEF9C3',
    desc: 'Generate longitudinal growth profiles for every student, automatically identifying hidden potential and systemic gaps.',
    illustration: null,
  },
  {
    icon: 'insights', title: 'Post-Session Insights', color: 'var(--accent-purple)',
    bg: '#F3E8FF',
    desc: 'Review your teaching efficacy through a new lens. AI-powered analytics refine your future lesson plans based on actual student reception.',
    illustration: null,
  },
];

/* ═══════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════ */

/* ─── Intersection Observer for scroll-reveal ─── */
function useReveal(options = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Triple-layer cursor tracker with cinematic lerp ─── */
function useCursorGlow() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const spotRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({
    outer: { x: 0, y: 0 },
    inner: { x: 0, y: 0 },
    spot: { x: 0, y: 0 },
  });
  const raf = useRef(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice.current) return;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      // Layer 1: Massive ambient field — ultra-slow dreamy trail
      pos.current.outer.x = lerp(pos.current.outer.x, mouse.current.x, 0.035);
      pos.current.outer.y = lerp(pos.current.outer.y, mouse.current.y, 0.035);
      // Layer 2: Prismatic core — medium follow
      pos.current.inner.x = lerp(pos.current.inner.x, mouse.current.x, 0.09);
      pos.current.inner.y = lerp(pos.current.inner.y, mouse.current.y, 0.09);
      // Layer 3: Tight highlight spot — near-instant
      pos.current.spot.x = lerp(pos.current.spot.x, mouse.current.x, 0.2);
      pos.current.spot.y = lerp(pos.current.spot.y, mouse.current.y, 0.2);

      if (outerRef.current) {
        outerRef.current.style.transform =
          `translate3d(${pos.current.outer.x - 350}px, ${pos.current.outer.y - 350}px, 0)`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform =
          `translate3d(${pos.current.inner.x - 140}px, ${pos.current.inner.y - 140}px, 0)`;
      }
      if (spotRef.current) {
        spotRef.current.style.transform =
          `translate3d(${pos.current.spot.x - 60}px, ${pos.current.spot.y - 60}px, 0)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return { outerRef, innerRef, spotRef, isTouchDevice: isTouchDevice.current };
}

/* ─── Parallax scroll offset ─── */
function useParallax(speed = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    let raf;
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      const offset = scrolled * speed;
      ref.current.style.transform = `translate3d(0, ${offset}px, 0)`;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return ref;
}

/* ─── Card 3D tilt — deep perspective with realism ─── */
function useCardTilt() {
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el || window.innerWidth < 768) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Deep perspective with 10° range + subtle depth translation
    el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-8px) translateZ(12px) scale(1.03)`;
    // Dynamic inner-light based on cursor position
    el.style.background = `
      radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%),
      var(--surface)`;
  }, []);

  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0) translateZ(0) scale(1)';
      ref.current.style.background = 'var(--surface)';
    }
  }, []);

  return { ref, onMove, onLeave };
}

/* ─── Ripple on click ─── */
function createRipple(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ═══════════════════════════════════════════════
   VANTA.JS NET — REACTIVE 3D NETWORK BACKGROUND
   ═══════════════════════════════════════════════ */
function VantaBackground() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (!vantaRef.current || vantaEffect.current) return;

    let mounted = true;

    // Dynamic import to avoid SSR/build issues with THREE.js
    const initVanta = async () => {
      try {
        const threeModule = await import('three');
        const vantaModule = await import('vanta/src/vanta.net.js');

        if (!mounted || !vantaRef.current) return;

        // Vanta source files use window.VANTA.NET or default export
        const NET = vantaModule.default || vantaModule;

        vantaEffect.current = NET({
          el: vantaRef.current,
          THREE: threeModule,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xff7a7a,
          backgroundColor: 0xffffff,
          points: 11.00,
          maxDistance: 0,
          spacing: 13.00,
        });
      } catch (err) {
        console.warn('Vanta.js failed to initialize:', err);
      }
    };

    initVanta();

    return () => {
      mounted = false;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="vanta-bg"
    />
  );
}


/* ═══════════════════════════════════════════════
   FEATURE CARD with 3D tilt
   ═══════════════════════════════════════════════ */
function FeatureCard({ f, i }) {
  const { ref, onMove, onLeave } = useCardTilt();
  const revealRef = useReveal();

  // Merge refs
  const mergedRef = useCallback((node) => {
    ref.current = node;
    revealRef.current = node;
  }, []);

  return (
    <div
      ref={mergedRef}
      className={`ct-card card-tilt card-shimmer reveal reveal-delay-${i + 1}`}
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '32px',
        overflow: 'hidden',
        cursor: 'default',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="float-medium"
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            animationDelay: `${i * 0.5}s`,
          }}
        >
          <span className="material-symbols-outlined filled" style={{ color: f.color, fontSize: '22px' }}>{f.icon}</span>
        </div>
        <h3 className="font-headline" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--on-surface)' }}>{f.title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>{f.desc}</p>
        {f.illustration && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--outline-variant)' }}>{f.illustration}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STAT CARD with count-up animation
   ═══════════════════════════════════════════════ */
function StatCard({ stat, i }) {
  const revealRef = useReveal();
  const { ref: tiltRef, onMove, onLeave } = useCardTilt();

  const mergedRef = useCallback((node) => {
    revealRef.current = node;
    tiltRef.current = node;
  }, []);

  return (
    <div
      ref={mergedRef}
      className={`ct-card card-tilt reveal reveal-delay-${i + 1}`}
      style={{
        textAlign: 'center', padding: '32px 20px', borderRadius: '20px',
        cursor: 'default',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <span className="material-symbols-outlined filled float-slow" style={{
        fontSize: '28px', color: 'var(--primary)', marginBottom: '12px', display: 'block',
        animationDelay: `${i * 0.3}s`,
      }}>{stat.icon}</span>
      <div className="font-headline stat-value" style={{
        fontSize: '32px', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em',
      }}>{stat.value}</div>
      <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  const { outerRef, innerRef, spotRef } = useCursorGlow();
  const heroParallaxRef = useParallax(-0.12);

  // Reveal refs for each section
  const featuresHeaderRef = useReveal();
  const howItWorksHeaderRef = useReveal();
  const contactRef = useReveal();
  const ctaRef = useReveal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuth = async () => {
    if (user) {
      navigate('/sessions');
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  return (
    <div className="landing-root" style={{ backgroundColor: 'var(--background)', color: 'var(--on-surface)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── Cursor Glow — Triple Layer ─── */}
      <div ref={outerRef} className="cursor-glow" />
      <div ref={innerRef} className="cursor-glow-inner" />
      <div ref={spotRef} className="cursor-glow-spot" />

      {/* ─── Vanta.js NET Reactive Background ─── */}
      <VantaBackground />

      {/* ─── Ambient Floating Blobs ─── */}
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />
      <div className="ambient-blob blob-3" />

      {/* ─── Top Nav ─── */}
      <nav className="landing-nav" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: scrolled ? '12px 40px' : '16px 40px',
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid var(--outline)' : '1px solid transparent',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 1px 12px rgba(0, 0, 0, 0.06)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--inverse-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(26, 92, 59, 0.2)',
            transition: 'transform 0.3s var(--anim-spring)',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'rotate(-8deg) scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'rotate(0) scale(1)'}
          >
            <span className="material-symbols-outlined filled" style={{ color: '#fff', fontSize: '18px' }}>auto_awesome</span>
          </div>
          <span className="font-headline" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>ClassTwin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Features', 'Pricing', 'Case Studies', 'Contact'].map((label) => (
            <a
              key={label}
              href={label === 'Features' ? '#features' : label === 'Contact' ? '#contact' : '#'}
              className="nav-link"
              style={{
                color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 500,
                transition: 'color 0.25s',
                position: 'relative',
                padding: '4px 0',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
            >{label}</a>
          ))}
          <button onClick={(e) => { createRipple(e); handleAuth(); }} className="ct-btn-primary btn-premium ripple-container" style={{
            padding: '10px 24px',
            fontSize: '14px',
            borderRadius: '50px',
          }}>Get Started</button>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '100px 40px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient Glows — with parallax layer */}
        <div ref={heroParallaxRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="float-slow" style={{ position: 'absolute', top: '-15%', left: '15%', width: '600px', height: '600px', background: 'rgba(26, 92, 59, 0.05)', filter: 'blur(120px)', borderRadius: '50%' }} />
          <div className="float-medium" style={{ position: 'absolute', bottom: '-10%', right: '15%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.04)', filter: 'blur(100px)', borderRadius: '50%' }} />
        </div>

        {/* Floating decorative shapes */}
        <div className="float-fast" style={{ position: 'absolute', top: '15%', right: '10%', width: '60px', height: '60px', borderRadius: '16px', border: '2px solid rgba(26, 92, 59, 0.08)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
        <div className="float-slow" style={{ position: 'absolute', bottom: '20%', left: '8%', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.06)', pointerEvents: 'none', animationDelay: '2s' }} />
        <div className="float-medium" style={{ position: 'absolute', top: '30%', left: '5%', width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.08)', pointerEvents: 'none', animationDelay: '1s' }} />

        <p className="hero-badge" style={{
          fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em',
          color: 'var(--primary)', fontWeight: 700, marginBottom: '24px',
          padding: '6px 16px', borderRadius: '50px',
          backgroundColor: 'var(--primary-light)',
          display: 'inline-block',
          position: 'relative', zIndex: 2,
        }}>CLASSROOM AI ENGINE</p>

        <h1 className="font-headline hero-title" style={{
          fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px',
          maxWidth: '820px', color: 'var(--on-surface)',
          position: 'relative', zIndex: 2,
        }}>
          The First AI Digital Twin for{' '}
          <span className="gradient-text-animated" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--inverse-primary), var(--accent-blue), var(--primary))',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Your Classroom</span>.
        </h1>

        <p className="hero-subtitle" style={{
          fontSize: '18px', color: 'var(--on-surface-variant)', maxWidth: '600px',
          lineHeight: 1.7, marginBottom: '48px',
          position: 'relative', zIndex: 2,
        }}>
          Orchestrate high-fidelity learning experiences with real-time student comprehension monitoring.
        </p>

        <div className="hero-buttons" style={{ display: 'flex', gap: '16px', marginBottom: '80px', position: 'relative', zIndex: 2 }}>
          <button onClick={(e) => { createRipple(e); handleAuth(); }} className="ct-btn-primary btn-premium ripple-container" style={{
            padding: '16px 32px', fontSize: '16px', borderRadius: '50px',
          }}>Launch Live Classroom</button>
          <button className="ct-btn-outline btn-outline-premium ripple-container" onClick={createRipple} style={{
            padding: '16px 32px', fontSize: '16px', borderRadius: '50px',
          }}>Watch Demo</button>
        </div>

        {/* Dashboard Preview Card */}
        <div className="ct-card preview-card hero-preview" style={{
          width: '100%', maxWidth: '900px',
          borderRadius: '24px', padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative', overflow: 'hidden',
          zIndex: 2,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26, 92, 59, 0.02), transparent, rgba(59, 130, 246, 0.02))', pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', position: 'relative' }}>
            {/* Chart Area */}
            <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '24px', height: '200px', position: 'relative' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', marginBottom: '8px', fontWeight: 600 }}>CLASS PERFORMANCE</div>
              <svg width="100%" height="140" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(26, 92, 59, 0.25)" /><stop offset="100%" stopColor="rgba(26, 92, 59, 0)" />
                  </linearGradient>
                </defs>
                <path d="M0,80 Q50,60 100,50 T200,40 T300,30 T400,20 L400,100 L0,100 Z" fill="url(#previewGrad)" />
                <path className="svg-draw animate" d="M0,80 Q50,60 100,50 T200,40 T300,30 T400,20" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Sidebar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--surface-container)', borderRadius: '16px', padding: '16px', flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI INSIGHT</div>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, lineHeight: 1.5 }}>3 students struggling with 'Quadratic Roots'. Trigger visual scaffold B.</div>
              </div>
              <div style={{
                backgroundColor: 'var(--primary-light)', borderRadius: '16px', padding: '12px',
                display: 'flex', alignItems: 'center', gap: '8px',
                border: '1px solid rgba(26, 92, 59, 0.1)',
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>sensors</span>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Trusted by Innovation Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={featuresHeaderRef} className="reveal" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px' }}>FEATURES</p>
          <h2 className="font-headline" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Everything you need to teach smarter
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {features.map((f, i) => (
            <FeatureCard key={i} f={f} i={i} />
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ padding: '100px 40px', background: 'var(--surface-container)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(26,92,59,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div ref={howItWorksHeaderRef} className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px' }}>HOW IT WORKS</p>
            <h2 className="font-headline" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>Three steps to a smarter classroom</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', position: 'relative' }}>
            {/* Connector line */}
            <div className="connector-line" style={{ position: 'absolute', top: '48px', left: '16.6%', right: '16.6%', height: '2px', background: 'linear-gradient(90deg, var(--primary), var(--accent-blue), var(--accent-purple))', opacity: 0.2, zIndex: 0 }} />
            {[
              { step: '01', icon: 'cast_for_education', title: 'Launch a Session', desc: 'Create a live classroom session in one click. Students join via a unique code — no downloads, no accounts required.', color: 'var(--primary)', bg: 'var(--primary-light)' },
              { step: '02', icon: 'monitoring', title: 'Monitor in Real-Time', desc: 'Watch comprehension levels update live on your dashboard. AI flags at-risk students and suggests targeted interventions.', color: 'var(--accent-blue)', bg: '#EFF6FF' },
              { step: '03', icon: 'lab_profile', title: 'Review & Improve', desc: 'After class, dive into rich analytics. See what worked, what didn\'t, and get AI-crafted recommendations for next time.', color: 'var(--accent-purple)', bg: '#F3E8FF' },
            ].map((s, i) => (
              <StepCard key={i} s={s} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section style={{ padding: '60px 40px', background: 'var(--background)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { value: '2,500+', label: 'Educators Worldwide', icon: 'school' },
            { value: '1.2M', label: 'Sessions Conducted', icon: 'play_circle' },
            { value: '98%', label: 'Teacher Satisfaction', icon: 'thumb_up' },
            { value: '42%', label: 'Better Outcomes', icon: 'trending_up' },
          ].map((stat, i) => (
            <StatCard key={i} stat={stat} i={i} />
          ))}
        </div>
      </section>

      {/* ─── Contact Section ─── */}
      <section id="contact" style={{ padding: '80px 40px', maxWidth: '960px', margin: '0 auto' }}>
        <div ref={contactRef} className="ct-card reveal" style={{ borderRadius: '32px', padding: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          {/* Contact Form */}
          <div>
            <h2 className="font-headline" style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', color: 'var(--on-surface)' }}>Get in Touch</h2>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '32px' }}>Have questions? We'd love to hear from you.</p>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="text" placeholder="Your Name" className="input-glow" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '14px', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s, background-color 0.3s' }} />
              <input type="email" placeholder="Email Address" className="input-glow" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '14px', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s, background-color 0.3s' }} />
              <textarea placeholder="Your Message" rows="4" className="input-glow" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '14px', outline: 'none', resize: 'none', transition: 'border-color 0.3s, box-shadow 0.3s, background-color 0.3s' }} />
              <button type="submit" className="btn-premium ripple-container" onClick={createRipple} style={{ padding: '16px 32px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--inverse-primary))', color: '#fff', fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer', transition: 'transform 0.3s var(--anim-ease-out), box-shadow 0.3s var(--anim-ease-out)' }}>
                Send Message
              </button>
            </form>
          </div>
          {/* Support Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h3 className="font-headline" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--on-surface)' }}>Support Options</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: 'mail', color: 'var(--primary)', title: 'Email Support', sub: 'support@classtwin.io' },
                  { icon: 'chat', color: 'var(--accent-blue)', title: 'Live Chat', sub: 'Available 24/7' },
                  { icon: 'menu_book', color: 'var(--accent-amber)', title: 'Knowledge Base', sub: 'help.classtwin.io' },
                ].map((item, idx) => (
                  <div key={idx} className="card-shimmer" style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px',
                    background: 'var(--surface-container)', border: '1px solid var(--outline)',
                    transition: 'transform 0.3s var(--anim-ease-out), box-shadow 0.3s',
                    cursor: 'default', overflow: 'hidden', position: 'relative',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span className="material-symbols-outlined" style={{ color: item.color, fontSize: '24px' }}>{item.icon}</span>
                    <div>
                      <div style={{ color: 'var(--on-surface)', fontWeight: 500 }}>{item.title}</div>
                      <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--surface-container)', border: '1px solid var(--outline)' }}>
              <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginBottom: '8px' }}>Hours</div>
              <div style={{ color: 'var(--on-surface)', fontWeight: 500 }}>Mon - Fri, 9AM - 6PM EST</div>
              <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '8px' }}>Response time: Usually within 2 hours</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section ref={ctaRef} className="cta-section reveal" style={{
        margin: '0 40px 80px',
        borderRadius: '32px',
        padding: '80px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--inverse-primary) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated decorative circles */}
        <div className="float-slow" style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div className="float-medium" style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', animationDelay: '1.5s' }} />
        <div className="float-fast" style={{ position: 'absolute', top: '20%', left: '15%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none', animationDelay: '0.8s' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-headline" style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>Connect your classroom today.</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Join over 2,500 educators redefining the limits of classroom intelligence. Experience the future of pedagogy.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={(e) => { createRipple(e); handleAuth(); }} className="ripple-container" style={{
              padding: '14px 28px',
              background: '#fff', color: 'var(--primary)', fontWeight: 700, borderRadius: '50px',
              border: 'none', cursor: 'pointer', fontSize: '15px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.35s var(--anim-ease-out)',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.25)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)' }}
            >Start Your Free Trial</button>
            <button className="ripple-container" onClick={createRipple} style={{
              padding: '14px 28px',
              backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
              fontWeight: 700, borderRadius: '50px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '15px',
              backdropFilter: 'blur(10px)', transition: 'all 0.35s var(--anim-ease-out)',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Schedule a Demo</button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        padding: '24px 40px',
        borderTop: '1px solid var(--outline)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '12px', color: 'var(--on-surface-variant)',
        position: 'relative', zIndex: 2,
      }}>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--on-surface)' }}>ClassTwin</p>
          <p style={{ opacity: 0.6, marginTop: '2px' }}>© 2025 ClassTwin. AI-Powered Excellence.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Twitter', 'LinkedIn', 'Status', 'Security', 'Privacy'].map(link => (
            <a
              key={link} href="#"
              className="footer-link"
              style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
            >{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   STEP CARD COMPONENT (How It Works)
   ═══════════════════════════════════════════════ */
function StepCard({ s, i }) {
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className={`reveal reveal-delay-${i + 1}`} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div className="step-icon-pulse" style={{
        width: '96px', height: '96px', borderRadius: '28px', background: s.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        border: `2px solid ${s.color}22`,
        boxShadow: `0 12px 40px ${s.color}15`,
        transition: 'transform 0.4s var(--anim-spring), box-shadow 0.4s var(--anim-ease-out)',
        color: s.color,
        position: 'relative',
      }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.08)'; e.currentTarget.style.boxShadow = `0 24px 60px ${s.color}30`; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = `0 12px 40px ${s.color}15`; }}
      >
        <span className="material-symbols-outlined filled" style={{ fontSize: '40px', color: s.color }}>{s.icon}</span>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: s.color, letterSpacing: '0.15em', marginBottom: '8px' }}>STEP {s.step}</div>
      <h3 className="font-headline" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--on-surface)' }}>{s.title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto' }}>{s.desc}</p>
    </div>
  );
}
