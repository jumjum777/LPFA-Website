import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import DevTabs from '@/components/development/DevTabs';

export const metadata = { title: 'Development & Finance' };

export default function DevelopmentPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Development &amp; Finance</span>
          </nav>
          <div className="page-hero-label">Economic Growth</div>
          <h1>Development &amp; Finance</h1>
          <p>Catalyzing investment and opportunity along Lorain&apos;s Lake Erie waterfront through brownfields remediation, property financing, and strategic development partnerships.</p>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="container">
          <div className="stats-band-grid">
            <div className="stats-band-item" data-animate="fade-up" data-delay="0"><span className="num">$50M+</span><span className="lbl">Development Investment</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="100"><span className="num">Multiple</span><span className="lbl">Active Brownfield Sites</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="200"><span className="num">State &amp; Federal</span><span className="lbl">Grant Programs</span></div>
            <div className="stats-band-item" data-animate="fade-up" data-delay="300"><span className="num">Active</span><span className="lbl">RFPs Available</span></div>
          </div>
        </div>
      </div>

      {/* TABBED CONTENT */}
      <DevTabs />

      {/* CTA */}
      <section className="section bg-light">
        <div className="container" style={{ textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get Started</div>
            <h2 style={{ marginBottom: '1rem' }}>Ready to Invest in Lorain?</h2>
            <p style={{ maxWidth: '560px', margin: '0 auto 2rem' }}>Whether you&apos;re interested in a brownfields site, development financing, or a partnership opportunity — our team is here to help.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-primary">Contact Our Team</Link>
              <Link href="/about" className="btn btn-outline">Learn About the LPFA</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
