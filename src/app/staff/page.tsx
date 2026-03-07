import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export const metadata = { title: 'Our Staff' };

export default function StaffPage() {
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
            <span className="current">Staff</span>
          </nav>
          <div className="page-hero-label">Our People</div>
          <h1>Meet the Team</h1>
          <p>Dedicated professionals committed to Lorain&apos;s waterfront future.</p>
        </div>
      </section>

      {/* STAFF */}
      <section className="section">
        <div className="container">
          <div className="team-grid">
            <div className="team-card" data-animate="fade-up" data-delay="0">
              <img src="/images/Tiffany.jpg" alt="Tiffany McClelland" className="team-photo" />
              <div className="team-card-body">
                <h4>Tiffany McClelland</h4>
                <span className="team-title">Executive Director</span>
                <div className="team-contact">
                  <a href="tel:4402041194"><i className="fas fa-phone-alt"></i> 440-204-1194, Ext. 104</a>
                  <a href="mailto:tmcclelland@lorainportauthority.com"><i className="fas fa-envelope"></i> tmcclelland@lorainportauthority.com</a>
                </div>
              </div>
            </div>
            <div className="team-card" data-animate="fade-up" data-delay="100">
              <img src="/images/Brown-1-450x537.jpg" alt="Tom Brown" className="team-photo" />
              <div className="team-card-body">
                <h4>Tom Brown</h4>
                <span className="team-title">Operations Director</span>
                <div className="team-contact">
                  <a href="tel:4402042265"><i className="fas fa-phone-alt"></i> 440-204-2265, Ext. 103</a>
                  <a href="mailto:tbrown@lorainportauthority.com"><i className="fas fa-envelope"></i> tbrown@lorainportauthority.com</a>
                </div>
              </div>
            </div>
            <div className="team-card" data-animate="fade-up" data-delay="200">
              <img src="/images/SGool-2-450x563.jpg" alt="Sarah Gool" className="team-photo" />
              <div className="team-card-body">
                <h4>Sarah Gool</h4>
                <span className="team-title">Project &amp; Site Strategy Manager</span>
                <div className="team-contact">
                  <a href="tel:4402967363"><i className="fas fa-phone-alt"></i> 440-296-7363, Ext. 108</a>
                  <a href="mailto:sgool@lorainportauthority.com"><i className="fas fa-envelope"></i> sgool@lorainportauthority.com</a>
                </div>
              </div>
            </div>
            <div className="team-card" data-animate="fade-up" data-delay="0">
              <img src="/images/YSmith-2-450x563.jpg" alt="Yvonne Smith" className="team-photo" />
              <div className="team-card-body">
                <h4>Yvonne Smith</h4>
                <span className="team-title">Accountant</span>
                <div className="team-contact">
                  <a href="tel:4402042268"><i className="fas fa-phone-alt"></i> 440-204-2268, Ext. 102</a>
                  <a href="mailto:ysmith@lorainportauthority.com"><i className="fas fa-envelope"></i> ysmith@lorainportauthority.com</a>
                </div>
              </div>
            </div>
            <div className="team-card" data-animate="fade-up" data-delay="100">
              <img src="/images/KSmith-2-450x563.jpg" alt="Kelsey Smith" className="team-photo" />
              <div className="team-card-body">
                <h4>Kelsey Smith</h4>
                <span className="team-title">Office Manager</span>
                <div className="team-contact">
                  <a href="tel:4402042267"><i className="fas fa-phone-alt"></i> 440-204-2267, Ext. 101</a>
                  <a href="mailto:ksmith@lorainportauthority.com"><i className="fas fa-envelope"></i> ksmith@lorainportauthority.com</a>
                </div>
              </div>
            </div>
            <div className="team-card team-card-special" data-animate="fade-up" data-delay="200">
              <img src="/images/Lil-2-450x562.jpg" alt="Lil the Goose Dog" className="team-photo" />
              <div className="team-card-body">
                <h4>Lil</h4>
                <span className="team-title">Goose Dog</span>
                <p className="team-bio">A female Border Collie born December 18, 2015 in Scotland. Lil specializes in humanely dispersing wild geese from our waterfront facilities.</p>
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
