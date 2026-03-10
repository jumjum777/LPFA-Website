import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import Timeline from '@/components/about/Timeline';

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

      {/* HISTORY TIMELINE */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Our History</div>
            <h2 className="section-title">A Legacy on the Water</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--gray-600)' }}>From our founding in 1964 to today, the Lorain Port &amp; Finance Authority has provided over $60 million in conduit financing and continues to drive the redevelopment of Lorain&apos;s waterfront. Click any milestone to learn more.</p>
          </div>
          <Timeline />
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
