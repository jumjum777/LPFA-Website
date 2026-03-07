import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">

            <div className="footer-brand">
              <Link href="/" className="logo footer-logo" aria-label="Lorain Port & Finance Authority Home">
                <div className="logo-icon"><i className="fas fa-anchor"></i></div>
                <div className="logo-text">
                  <span className="logo-main">Lorain Port</span>
                  <span className="logo-sub">&amp; Finance Authority</span>
                </div>
              </Link>
              <p className="footer-tagline">Economic Development &middot; Waterborne Commerce &middot; Public Access to Waterways</p>
              <div className="footer-social" aria-label="Social Media Links">
                <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                <a href="https://www.instagram.com/lorainportfinance" target="_blank" rel="noopener" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="https://www.youtube.com/@LorainPortandFinanceAuthority" target="_blank" rel="noopener" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                <a href="https://www.linkedin.com/company/lorainport" target="_blank" rel="noopener" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/development">Development &amp; Finance</Link></li>
                <li><Link href="/events">Events &amp; Boat Tours</Link></li>
                <li><Link href="/facilities">Facilities</Link></li>
                <li><Link href="/news">News</Link></li>
                <li><Link href="/marine">Marine Forecast</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Development</h4>
              <ul>
                <li><Link href="/development#brownfields">Brownfields Program</Link></li>
                <li><Link href="/development#financing">Property Financing</Link></li>
                <li><Link href="/development#rfp">RFPs &amp; Bids</Link></li>
                <li><Link href="/development#commerce">Waterborne Commerce</Link></li>
              </ul>
              <h4 style={{ marginTop: '1.5rem' }}>Facilities</h4>
              <ul>
                <li><Link href="/facilities#black-river-landing">Black River Landing</Link></li>
                <li><Link href="/facilities#mile-long-pier">Mile-Long Pier</Link></li>
                <li><Link href="/facilities#lakeside-landing">Lakeside Landing</Link></li>
              </ul>
            </div>

            <div className="footer-contact-col">
              <h4>Contact Us</h4>
              <address>
                <div className="footer-contact-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <p>319 Black River Lane</p>
                    <p>Lorain, OH 44052</p>
                  </div>
                </div>
                <div className="footer-contact-item">
                  <i className="fas fa-phone-alt"></i>
                  <a href="tel:4402042269">440.204.2269</a>
                </div>
                <div className="footer-contact-item">
                  <i className="fas fa-envelope"></i>
                  <a href="mailto:info@lorainport.com">info@lorainport.com</a>
                </div>
              </address>
              <Link href="/contact" className="btn btn-gold btn-sm" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>Send a Message</Link>
            </div>

          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Lorain Port &amp; Finance Authority. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Use</Link>
            <Link href="#">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
