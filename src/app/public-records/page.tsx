import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Public Records Request' };

export default function PublicRecordsPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/about">About</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Public Records Request</span>
          </nav>
          <div className="page-hero-label">Transparency</div>
          <h1>Public Records Request</h1>
          <p>The Lorain Port &amp; Finance Authority is committed to transparency and compliance with Ohio&apos;s public records laws.</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="section">
        <div className="container">
          <div className="public-records-content" data-animate="fade-up">
            <div className="public-records-info">
              <h2 className="section-title">How to Submit a Request</h2>
              <p>Under Ohio Revised Code Section 149.43, the Lorain Port &amp; Finance Authority maintains public records that are available for inspection and copying. To request public records, please download and complete the form below and submit it to our office.</p>
              <p>Completed forms can be submitted by:</p>
              <ul className="public-records-methods">
                <li><i className="fas fa-envelope"></i> <strong>Email:</strong> <a href="mailto:info@lorainport.com">info@lorainport.com</a></li>
                <li><i className="fas fa-paper-plane"></i> <strong>Mail:</strong> 319 Black River Lane, Lorain, OH 44052</li>
                <li><i className="fas fa-building"></i> <strong>In Person:</strong> Visit our office during business hours (Mon&ndash;Fri, 8:30 AM &ndash; 4:30 PM)</li>
              </ul>
            </div>

            <div className="public-records-download">
              <div className="public-records-card">
                <div className="public-records-card-icon">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <h3>Public Records Request Form</h3>
                <p>Fillable PDF form &mdash; download, complete, and submit to our office.</p>
                <a
                  href="https://www.lorainport.com/wp-content/uploads/2021/07/LPFA-Internal-Public-Records-Request-Form_Fillable.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
                  Download Form
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Questions?</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Need Help With Your Request?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>If you have questions about the public records process or need assistance, our staff is happy to help.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Us</Link>
              <Link href="/meeting-minutes" className="btn btn-outline-white">View Meeting Minutes</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
