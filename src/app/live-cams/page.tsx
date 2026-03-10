import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import LiveCamsClient from '@/components/livecams/LiveCamsClient';

export const metadata = { title: 'Live Cams — Lorain Waterfront' };

export default function LiveCamsPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* HERO */}
      <section className="livecam-hero">
        <div className="livecam-hero-bg"></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <nav className="breadcrumb breadcrumb-light" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Live Cams</span>
          </nav>
          <div className="livecam-hero-content" data-animate="fade-up">
            <div className="livecam-hero-badge">
              <span className="livecam-live-dot"></span> LIVE
            </div>
            <h1>Lorain Waterfront Live Cams</h1>
            <p>Watch real-time views of Lake Erie and the Black River from Lorain&apos;s waterfront &mdash; 24 hours a day, 7 days a week.</p>
          </div>
        </div>
      </section>

      {/* CAMS */}
      <section className="section livecam-section">
        <div className="container">
          <LiveCamsClient />
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="section bg-light">
        <div className="container">
          <div className="livecam-info-grid" data-animate="fade-up">
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
                <i className="fas fa-water"></i>
              </div>
              <h3>Lake Conditions</h3>
              <p>Check wave heights, water temps, and wind conditions before heading out on the water.</p>
              <Link href="/marine" className="pillar-link">Marine Forecast <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3>Waterfront Events</h3>
              <p>See what&apos;s happening at Black River Landing and along Lorain&apos;s waterfront.</p>
              <Link href="/events" className="pillar-link">View Events <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="livecam-info-card">
              <div className="livecam-info-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                <i className="fas fa-ship"></i>
              </div>
              <h3>Boat Tours</h3>
              <p>Book a guided boat tour and experience the views from these cameras up close.</p>
              <Link href="/events" className="pillar-link">Book a Tour <i className="fas fa-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Visit Us</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Come See It in Person</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Nothing beats the real thing. Visit Lorain&apos;s waterfront and experience Lake Erie for yourself.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/facilities" className="btn btn-gold">Explore Facilities</Link>
              <Link href="/marine" className="btn btn-outline-white">Marine Forecast</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
