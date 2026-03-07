import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import ContactForm from './ContactForm';
import FaqAccordion from './FaqAccordion';

export const metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Contact</span>
          </nav>
          <div className="page-hero-label">Get in Touch</div>
          <h1>Contact Us</h1>
          <p>Whether you have a question about development, events, boat tours, or facility rentals — we&apos;d love to hear from you.</p>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="section">
        <div className="container">
          <div className="contact-grid">

            {/* INFO COLUMN */}
            <div>
              <div className="contact-info-card" data-animate="fade-right">
                <h3>Get in Touch</h3>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><i className="fas fa-map-marker-alt"></i></div>
                  <div>
                    <h5>Address</h5>
                    <p>319 Black River Lane<br />Lorain, OH 44052</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><i className="fas fa-phone-alt"></i></div>
                  <div>
                    <h5>Phone</h5>
                    <a href="tel:4402042269">440.204.2269</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><i className="fas fa-envelope"></i></div>
                  <div>
                    <h5>Email</h5>
                    <a href="mailto:info@lorainport.com">info@lorainport.com</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><i className="fab fa-facebook-f"></i></div>
                  <div>
                    <h5>Social Media</h5>
                    <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener">Facebook</a> &nbsp;&middot;&nbsp;
                    <a href="https://www.instagram.com/lorainportfinance" target="_blank" rel="noopener">Instagram</a> &nbsp;&middot;&nbsp;
                    <a href="https://www.youtube.com/@LorainPortandFinanceAuthority" target="_blank" rel="noopener">YouTube</a>
                  </div>
                </div>

                <div className="contact-hours">
                  <h5>Office Hours</h5>
                  <div className="hours-row"><span className="day">Monday – Friday</span><span className="time">8:30 AM – 4:30 PM</span></div>
                  <div className="hours-row"><span className="day">Saturday</span><span className="time">Closed</span></div>
                  <div className="hours-row"><span className="day">Sunday</span><span className="time">Closed</span></div>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.75rem' }}>Hours may vary on holidays. Contact us to confirm.</p>
                </div>
              </div>

              {/* MAP PLACEHOLDER */}
              <div className="map-embed" data-animate="fade-up">
                <div className="map-embed-placeholder">
                  <span className="fas fa-map-marker-alt"></span>
                  <p>319 Black River Lane, Lorain, OH 44052</p>
                  <p style={{ marginTop: '0.5rem' }}><a href="https://maps.google.com/?q=319+Black+River+Lane+Lorain+OH+44052" target="_blank" rel="noopener">Open in Google Maps <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }}></i></a></p>
                </div>
              </div>
            </div>

            {/* FORM COLUMN */}
            <ContactForm />

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-light">
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header center" data-animate="fade-up">
              <div className="section-label">Help &amp; Support</div>
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>
            <FaqAccordion />
          </div>
        </div>
      </section>
    </main>
  );
}
