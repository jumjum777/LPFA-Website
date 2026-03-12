import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import FireworksClient from '@/components/fireworks/FireworksClient';

export const metadata = { title: 'July 4th Fireworks — Lorain Waterfront' };

export default function FireworksPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* HERO */}
      <section className="fireworks-hero">
        <div className="fireworks-hero-bg"></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <nav className="breadcrumb breadcrumb-light" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/events">Events</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">July 4th Fireworks</span>
          </nav>
          <div className="fireworks-hero-content" data-animate="fade-up">
            <div className="fireworks-hero-badge">
              <i className="fas fa-video"></i> RECORDINGS
            </div>
            <h1>July 4th Fireworks</h1>
            <p>Every Independence Day, Lorain lights up the sky over Lake Erie with a spectacular fireworks display launched from the historic Mile-Long Pier. Relive the magic with recordings from past celebrations.</p>
          </div>
        </div>
      </section>

      {/* VIDEO PLAYER */}
      <section className="section">
        <div className="container">
          <FireworksClient />
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="section bg-light">
        <div className="container">
          <div className="livecam-info-grid" data-animate="fade-up">
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3>Waterfront Events</h3>
              <p>See what&apos;s happening at Black River Landing and along Lorain&apos;s waterfront.</p>
              <Link href="/events" className="pillar-link">View Events <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
                <i className="fas fa-video"></i>
              </div>
              <h3>Live Cams</h3>
              <p>Watch real-time views of Lake Erie and the Black River from Lorain&apos;s waterfront.</p>
              <Link href="/live-cams" className="pillar-link">Live Cams <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
                <i className="fas fa-water"></i>
              </div>
              <h3>Lake Conditions</h3>
              <p>Check wave heights, water temps, and wind conditions before heading out on the water.</p>
              <Link href="/marine" className="pillar-link">Marine Forecast <i className="fas fa-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(217,119,6,0.15) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Join Us</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>See the Next Show Live</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Join thousands of spectators along Lorain&apos;s waterfront every July 4th for one of the best fireworks displays on Lake Erie.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/events" className="btn btn-gold">View Events</Link>
              <Link href="/facilities" className="btn btn-outline-white">Explore Facilities</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
