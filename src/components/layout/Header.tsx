import HeaderClient from './HeaderClient';
import ThemeToggle from '../ui/ThemeToggle';
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
              <li className="has-dropdown" role="none">
                <Link href="/development" role="menuitem" aria-haspopup="true" aria-expanded="false">Development &amp; Finance <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown" role="menu" aria-label="Development & Finance">
                  <li role="none"><Link href="/development#brownfields" role="menuitem">Brownfields Program</Link></li>
                  <li role="none"><Link href="/development#financing" role="menuitem">Property Financing</Link></li>
                  <li role="none"><Link href="/development#rfp" role="menuitem">RFPs &amp; Bids</Link></li>
                  <li role="none"><Link href="/development#commerce" role="menuitem">Waterborne Commerce</Link></li>
                </ul>
              </li>
              <li role="none"><Link href="/events" role="menuitem">Events</Link></li>
              <li className="has-dropdown" role="none">
                <Link href="/recreation" role="menuitem" aria-haspopup="true" aria-expanded="false">Recreation <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown" role="menu" aria-label="Recreation">
                  <li role="none"><Link href="/recreation#history-tours" role="menuitem">History &amp; Lighthouse Tours</Link></li>
                  <li role="none"><Link href="/recreation#nature-tours" role="menuitem">Nature &amp; Sunset Cruises</Link></li>
                  <li role="none"><Link href="/recreation#water-taxi" role="menuitem">Water Taxi</Link></li>
                  <li role="none"><Link href="/recreation#charters" role="menuitem">Private Charters</Link></li>
                </ul>
              </li>
              <li className="has-dropdown" role="none">
                <Link href="/facilities" role="menuitem" aria-haspopup="true" aria-expanded="false">Facilities <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown" role="menu" aria-label="Facilities">
                  <li role="none"><Link href="/facilities#black-river-landing" role="menuitem">Black River Landing</Link></li>
                  <li role="none"><Link href="/facilities#lakeside-landing" role="menuitem">Lakeside Landing</Link></li>
                  <li role="none"><Link href="/facilities#mile-long-pier" role="menuitem">Mile-Long Pier</Link></li>
                  <li role="none"><Link href="/facilities#boat-launch" role="menuitem">Boat Launch</Link></li>
                  <li role="none"><Link href="/facilities#riverside-park" role="menuitem">Riverside Park</Link></li>
                </ul>
              </li>
              <li role="none"><Link href="/news" role="menuitem">News</Link></li>
              <li className="has-dropdown"><Link href="/about">About <i className="fas fa-chevron-down"></i></Link>
                <ul className="dropdown">
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/staff">Staff</Link></li>
                  <li><Link href="/board">Board of Directors</Link></li>
                  <li><Link href="/didyouknow">Did You Know?</Link></li>
                </ul>
              </li>
              <li><Link href="/donate">Stage Project</Link></li>
              <li role="none"><Link href="/contact" className="nav-cta" role="menuitem">Contact Us</Link></li>
            </ul>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </HeaderClient>
  );
}
