import HeaderClient from './HeaderClient';
import ThemeToggle from '../ui/ThemeToggle';
import MarineAlertBanner from './MarineAlertBanner';
import VesselBanner from './VesselBanner';
import Link from 'next/link';

export default function Header() {
  return (
    <HeaderClient>
      <div className="header-top">
        <div className="container">
          <div className="header-top-inner">
            <div className="header-contact">
              <a href="tel:4402042269"><i className="fas fa-phone-alt"></i> 440.204.2269</a>
              <a href="mailto:info@lorainport.com"><i className="fas fa-envelope"></i> info@lorainport.com</a>
              <span className="header-address"><i className="fas fa-map-marker-alt"></i> 319 Black River Lane, Lorain, OH 44052</span>
            </div>
            <div className="header-social">
              <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="https://www.instagram.com/lorainportfinance" target="_blank" rel="noopener" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="https://www.youtube.com/@LorainPortandFinanceAuthority" target="_blank" rel="noopener" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="https://www.linkedin.com/company/lorainport" target="_blank" rel="noopener" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>

      <nav className="main-nav" id="main-nav" role="navigation" aria-label="Main Navigation">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="logo" aria-label="Lorain Port & Finance Authority Home">
              <img src="/images/logo.png" alt="Lorain Port & Finance Authority" className="logo-img" />
            </Link>

            <button className="nav-toggle" id="nav-toggle" aria-label="Toggle Navigation" aria-expanded="false" aria-controls="nav-menu">
              <span></span><span></span><span></span>
            </button>

            <ul className="nav-menu" id="nav-menu" role="menubar">
              <li role="none"><Link href="/" role="menuitem">Home</Link></li>
              <li role="none"><Link href="/news" role="menuitem">News</Link></li>
              <li role="none"><Link href="/marine" role="menuitem">Marine &amp; Alerts</Link></li>
              <li role="none"><Link href="/live-cams" role="menuitem">Live Cams</Link></li>
              <li role="none"><Link href="/donate" role="menuitem">Stage Project</Link></li>
              <li className="has-dropdown" role="none">
                <Link href="/development" role="menuitem" aria-haspopup="true" aria-expanded="false">Development &amp; Finance <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown" role="menu" aria-label="Development & Finance">
                  <li role="none"><Link href="/brownfields" role="menuitem">Brownfields Program</Link></li>
                  <li role="none"><Link href="/financing" role="menuitem">Financing &amp; Projects</Link></li>
                  <li role="none"><Link href="/development#rfp" role="menuitem">RFPs &amp; Bids</Link></li>
                  <li role="none"><Link href="/commerce" role="menuitem">Waterborne Commerce</Link></li>
                </ul>
              </li>
              <li role="none"><Link href="/events" role="menuitem">Events &amp; Boat Tours</Link></li>
              <li className="has-dropdown" role="none">
                <Link href="/about" role="menuitem" aria-haspopup="true" aria-expanded="false">About <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown" role="menu" aria-label="About">
                  <li role="none"><Link href="/about" role="menuitem">About Us</Link></li>
                  <li role="none"><Link href="/staff" role="menuitem">Staff</Link></li>
                  <li role="none"><Link href="/board" role="menuitem">Board of Directors</Link></li>
                  <li role="none"><Link href="/meeting-minutes" role="menuitem">Meeting Minutes</Link></li>
                  <li role="none"><Link href="/public-records" role="menuitem">Public Records Request</Link></li>
                  <li role="none"><Link href="/didyouknow" role="menuitem">Did You Know?</Link></li>
                  <li role="none"><Link href="/facilities" role="menuitem">Facilities</Link></li>
                </ul>
              </li>
              <li role="none"><Link href="/contact" className="nav-cta" role="menuitem">Contact Us</Link></li>
            </ul>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <MarineAlertBanner />
      <VesselBanner />
    </HeaderClient>
  );
}
