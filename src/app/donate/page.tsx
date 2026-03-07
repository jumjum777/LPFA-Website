import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import ProgressBar from './ProgressBar';

export const metadata = { title: 'Stage Project' };

export default function DonatePage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Donate</span>
          </nav>
          <div className="page-hero-label">Support Our Mission</div>
          <h1>Help Us Build the Future of Black River Landing</h1>
          <p>Your contribution directly supports the expansion of Lorain&apos;s premier waterfront venue — bringing bigger acts, better facilities, and more opportunities to our community.</p>
        </div>
      </section>

      {/* HERO FEATURE IMAGE */}
      <div className="hero-feature">
        <img src="/images/Stage Project 1.jpg" alt="Black River Landing Stage Project — aerial rendering of the new facility" />
      </div>

      {/* DONATE CTA */}
      <section className="section bg-light">
        <div className="container">
          <div className="donate-cta-banner" data-animate="fade-up">
            <div className="section-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Make a Difference</div>
            <h2>Ready to Support Lorain&apos;s Waterfront?</h2>
            <p>Every contribution — no matter the size — brings us closer to completing this transformative project for our community.</p>
            <a href="https://www.paypal.com/donate/?hosted_button_id=MF4TABMWYKT3Q" target="_blank" rel="noopener" className="btn-donate">
              <i className="fab fa-paypal"></i> Donate via PayPal
            </a>
            <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              For naming opportunities or major gifts, please <Link href="/contact" style={{ color: 'var(--gold)' }}>contact our office</Link> directly.
            </p>
          </div>
        </div>
      </section>

      {/* PROJECT OVERVIEW */}
      <section className="section">
        <div className="container">
          <div className="project-grid">
            <div data-animate="fade-right">
              <div className="section-label">The Project</div>
              <h2 style={{ marginBottom: '1.25rem' }}>Green Room &amp; Storage Facility</h2>
              <p style={{ marginBottom: '1rem' }}>We&apos;re raising additional funds to construct a <strong>Green Room and Storage Facility</strong> at Black River Landing. These critical additions will enable us to attract larger, higher-profile entertainment acts and provide professional-grade backstage amenities for performers.</p>
              <p style={{ marginBottom: '1rem' }}>Black River Landing draws over <strong>150,000 visitors annually</strong> for concerts, festivals, and community events. This expansion will elevate the venue to a regional destination, driving economic activity and community pride for years to come.</p>
              <p style={{ marginBottom: '1.5rem' }}>Construction began <strong>September 15, 2025</strong>. With your help, we can close the funding gap and deliver a world-class facility for Lorain.</p>
              <a href="https://www.paypal.com/donate/?hosted_button_id=MF4TABMWYKT3Q" target="_blank" rel="noopener" className="btn btn-gold"><i className="fas fa-heart"></i> &nbsp;Donate Now</a>
            </div>
            <div className="project-visual" data-animate="fade-left">
              <div className="project-visual-badge">
                <div className="project-stats">
                  <div className="project-stat">
                    <div className="project-stat-number">150K+</div>
                    <div className="project-stat-label">Annual Visitors</div>
                  </div>
                  <div className="project-stat">
                    <div className="project-stat-number">$11.9M</div>
                    <div className="project-stat-label">Total Project</div>
                  </div>
                  <div className="project-stat">
                    <div className="project-stat-number">2025</div>
                    <div className="project-stat-label">Construction Start</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNDING PROGRESS */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Campaign Progress</div>
            <h2 className="section-title">Funding Status</h2>
            <p className="section-desc">Thanks to our partners and donors, we&apos;ve raised the majority of the funds needed. Help us close the gap.</p>
          </div>

          <div className="funding-progress" data-animate="fade-up">
            <div className="progress-numbers">
              <div className="progress-raised">$9,140,000 <span>raised so far</span></div>
              <div className="progress-goal">Goal: <strong>$11,900,000</strong></div>
            </div>
            <ProgressBar />
            <div className="progress-remaining">
              <i className="fas fa-bullseye"></i> $2,760,000 remaining to reach our goal
            </div>
          </div>

          {/* Funding Sources */}
          <div className="section-header center" data-animate="fade-up" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Funding Partners</h3>
          </div>
          <div className="funding-sources" data-animate="fade-up">
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-anchor" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> Lorain Port &amp; Finance Authority</span>
              <span className="funding-source-amount">$5,250,000</span>
            </div>
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-landmark" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> City of Lorain</span>
              <span className="funding-source-amount">$995,000</span>
            </div>
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-building-columns" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> Lorain County</span>
              <span className="funding-source-amount">$995,000</span>
            </div>
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-flag-usa" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> State of Ohio</span>
              <span className="funding-source-amount">$500,000</span>
            </div>
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-map-signs" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> Lorain County Visitors Bureau</span>
              <span className="funding-source-amount">$750,000</span>
            </div>
            <div className="funding-source">
              <span className="funding-source-name"><i className="fas fa-hand-holding-heart" style={{ color: 'var(--blue-accent)', marginRight: '0.5rem' }}></i> Philanthropic Commitments</span>
              <span className="funding-source-amount">$650,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* NAMING / SPONSORSHIP OPPORTUNITIES */}
      <section className="section">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Recognition</div>
            <h2 className="section-title">Naming &amp; Sponsorship Opportunities</h2>
            <p className="section-desc">Leave a lasting mark on Lorain&apos;s waterfront. Naming rights are available at a variety of levels for individuals, families, and organizations.</p>
          </div>

          <div className="naming-grid">
            <div className="naming-card featured" data-animate="fade-up" data-delay="0">
              <h4>Amphitheater</h4>
              <div className="naming-price">$1,000,000</div>
              <p>Premier naming rights for the main amphitheater — the centerpiece of Black River Landing.</p>
            </div>
            <div className="naming-card claimed" data-animate="fade-up" data-delay="50">
              <h4>Main Stage</h4>
              <div className="naming-price">$750,000</div>
              <p>Name the main performance stage where headlining acts perform for thousands.</p>
              <div className="claimed-badge"><i className="fas fa-check" style={{ marginRight: '0.3rem' }}></i> Claimed</div>
            </div>
            <div className="naming-card claimed" data-animate="fade-up" data-delay="75">
              <h4>Amphitheater Lawn Seating</h4>
              <div className="naming-price">$400,000</div>
              <p>Naming rights for the amphitheater lawn seating area overlooking the main stage.</p>
              <div className="claimed-badge"><i className="fas fa-check" style={{ marginRight: '0.3rem' }}></i> Claimed</div>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="100">
              <h4>Peel Building</h4>
              <div className="naming-price">$500,000</div>
              <p>Naming rights for the historic Peel Building at the heart of the venue campus.</p>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="150">
              <h4>Green Room</h4>
              <div className="naming-price">$250,000</div>
              <p>Name the new backstage green room used by performers and VIP guests.</p>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="200">
              <h4>Storage Facility</h4>
              <div className="naming-price">$150,000</div>
              <p>Name the new storage facility supporting year-round venue operations.</p>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="250">
              <h4>Concession Area</h4>
              <div className="naming-price">$100,000</div>
              <p>Naming rights for the concession and food service area at events.</p>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="300">
              <h4>Box Office</h4>
              <div className="naming-price">$50,000</div>
              <p>Name the venue&apos;s box office and ticketing area.</p>
            </div>
            <div className="naming-card" data-animate="fade-up" data-delay="350">
              <h4>Benches</h4>
              <div className="naming-price">$25,000 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--gray-500)' }}>each</span></div>
              <p>Dedicate a bench in honor of a loved one or your organization.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }} data-animate="fade-up">
          <div className="section-label">Questions?</div>
          <h2 style={{ marginBottom: '1rem' }}>Get in Touch About Donating</h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 2rem', color: 'var(--gray-500)' }}>
            For questions about sponsorship, naming rights, or making a donation, please contact us at our office.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:4402042269" className="btn btn-primary"><i className="fas fa-phone-alt"></i> &nbsp;440.204.2269</a>
            <a href="mailto:info@lorainport.com" className="btn btn-outline"><i className="fas fa-envelope"></i> &nbsp;info@lorainport.com</a>
            <Link href="/contact" className="btn btn-outline"><i className="fas fa-paper-plane"></i> &nbsp;Contact Form</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
