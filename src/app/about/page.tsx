import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">About Us</span>
          </nav>
          <div className="page-hero-label">Our Story</div>
          <h1>About the Lorain Port &amp; Finance Authority</h1>
          <p>A public authority committed to the economic vitality, maritime commerce, and public enjoyment of Lorain&apos;s Lake Erie waterfront.</p>
        </div>
      </section>

      {/* ABOUT INTRO */}
      <section className="section">
        <div className="container">
          <div className="about-intro">
            <div data-animate="fade-right">
              <div className="section-label">Who We Are</div>
              <p style={{ marginBottom: '1rem' }}>The Lorain Port &amp; Finance Authority (LPFA) is a public authority established to manage and develop Lorain&apos;s invaluable waterfront resources along the Black River and Lake Erie shoreline.</p>
              <p style={{ marginBottom: '1rem' }}>We serve as the driving force behind economic development, waterborne commerce, and public access to Lorain&apos;s waterways — working to transform our waterfront into a thriving hub for business, recreation, and community life.</p>
              <p style={{ marginBottom: '2rem' }}>As a quasi-governmental body, we partner with city, county, and state agencies, private developers, and community organizations to maximize the potential of one of Northeast Ohio&apos;s most valuable assets.</p>
              <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
            </div>
            <div data-animate="fade-left">
              <img src="/images/freighter and big boat in lorain copy.jpg" alt="Freighter passing through the Black River bascule bridge in Lorain" className="about-intro-photo" />
            </div>
          </div>
        </div>
      </section>

      {/* MISSION BANNER */}
      <div className="container">
        <div className="mission-banner" data-animate="fade-up">
          <div className="quote-mark">&ldquo;</div>
          <h2>To advance economic development, facilitate waterborne commerce, and provide meaningful public access to Lorain&apos;s waterways for the benefit of all.</h2>
          <div style={{ marginTop: '1.5rem', color: 'var(--gold-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, position: 'relative' as const }}>Our Mission</div>
        </div>
      </div>

      {/* THREE PILLARS */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">What We Do</div>
            <h2 className="section-title">Our Three Core Pillars</h2>
          </div>
          <div className="pillars-row">
            <div className="content-card" data-animate="fade-up" data-delay="0" style={{ borderTop: '3px solid var(--blue-accent)' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(27,139,235,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: 'var(--blue-accent)', marginBottom: '1.25rem' }}><i className="fas fa-city"></i></div>
              <h3 style={{ marginBottom: '0.75rem' }}>Economic Development</h3>
              <p>We manage property financing, brownfields remediation grants, and strategic partnerships to attract private investment and catalyze the revitalization of Lorain&apos;s waterfront economy.</p>
            </div>
            <div className="content-card" data-animate="fade-up" data-delay="100" style={{ borderTop: '3px solid var(--gold)' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(217,119,6,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: 'var(--gold)', marginBottom: '1.25rem' }}><i className="fas fa-ship"></i></div>
              <h3 style={{ marginBottom: '0.75rem' }}>Waterborne Commerce</h3>
              <p>We support and facilitate commercial shipping, maritime operations, and trade activity along the Black River and Lake Erie — maintaining Lorain&apos;s proud heritage as a working port city.</p>
            </div>
            <div className="content-card" data-animate="fade-up" data-delay="200" style={{ borderTop: '3px solid #0D9488' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(13,148,136,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: '#0D9488', marginBottom: '1.25rem' }}><i className="fas fa-water"></i></div>
              <h3 style={{ marginBottom: '0.75rem' }}>Public Waterway Access</h3>
              <p>We operate parks, boat launches, event venues, and recreational programming to ensure that every Lorain resident and visitor can enjoy the beauty and opportunity of our Lake Erie waterfront.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section className="section bg-light">
        <div className="container">
          <div style={{ maxWidth: '700px' }} data-animate="fade-right">
            <div className="section-label">Our History</div>
            <h2 style={{ marginBottom: '2rem' }}>A Legacy on the Water</h2>
            <div className="history-timeline">
              <div className="timeline-item">
                <div className="timeline-year">1964</div>
                <h4>Port Authority Founded</h4>
                <p>The Lorain Port Authority was founded on May 4, 1964 by an act of the Council of the City of Lorain. Its first major projects included a $22 million port renovation and the construction of a 305-meter dry dock facility in 1967.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">1974</div>
                <h4>First Industrial Revenue Bond</h4>
                <p>The Authority issued its first Industrial Revenue Bond, providing $3.5 million to assist Allied Oil in the construction of fuel storage tanks along the Black River.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">1970s–1980s</div>
                <h4>Port &amp; River Renovation</h4>
                <p>The Authority led major renovations including the installation of the floating tire breakwall, renovation of the historic lighthouse, and construction of the east pier breakwall.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">1995</div>
                <h4>Riverside Expansion</h4>
                <p>The Authority received a 10-hectare riverside plot from LTV Steel and led the creation of the $2.1 million Black River Wharf Boat Launch Ramp.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2000</div>
                <h4>First Concert at Riverside Park</h4>
                <p>The Authority hosted its first concert at Riverside Park, sparking the Black River Landing Concert Series that would transform Lorain&apos;s waterfront into a regional entertainment destination.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2010</div>
                <h4>Mile Long Pier Renovation</h4>
                <p>The Authority provided $3.37 million to renovate the Mile Long Pier, transforming it into a beloved public resource for the community.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2014–2015</div>
                <h4>Black River Landing &amp; Rockin&apos; on the River</h4>
                <p>The Authority moved into the Ferry Terminal Building at Black River Landing, and recruited Rockin&apos; on the River in 2015 — an event that now draws hundreds of thousands of visitors annually.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2025</div>
                <h4>Rockin&apos; on the River Acquisition</h4>
                <p>The Port Authority purchased the Rockin&apos; on the River concert series from its previous owners, taking full ownership and operational control of one of Northeast Ohio&apos;s largest outdoor entertainment events.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">Present</div>
                <h4>Lorain Port &amp; Finance Authority</h4>
                <p>For more than 60 years, the Authority has provided over $50 million in conduit financing and continues to be a key player in the redevelopment of the port and surrounding area.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Work With Us</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Ready to Build Lorain&apos;s Future?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Whether you&apos;re a developer, business, community partner, or resident — we want to hear from you.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Us</Link>
              <Link href="/development" className="btn btn-outline-white">View Opportunities</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
