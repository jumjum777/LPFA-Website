import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';

export default function HomePage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* ===== HERO ===== */}
      <section className="hero" id="hero" aria-label="Hero">
        <div className="hero-bg">
          <video className="hero-bg-video" autoPlay muted loop playsInline>
            <source src="/images/Website Main Header 2.mp4" type="video/mp4" />
          </video>
          <div className="hero-gradient"></div>
          <svg className="hero-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path className="wave wave-1" fill="rgba(255,255,255,0.04)" d="M0,160L48,165.3C96,171,192,181,288,181.3C384,181,480,171,576,160C672,149,768,139,864,144C960,149,1056,171,1152,176C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path className="wave wave-2" fill="rgba(255,255,255,0.06)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path className="wave wave-3" fill="rgba(255,255,255,0.03)" d="M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,245.3C672,256,768,256,864,240C960,224,1056,192,1152,186.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="container">
          <div className="hero-content" data-animate="fade-up">
            <div className="hero-badge"><i className="fas fa-map-marker-alt"></i> Lorain, Ohio</div>
            <h1 className="hero-title">
              Driving Development<br /><span className="hero-highlight">Through Our Waterways</span>
            </h1>
            <p className="hero-tagline">Economic Development &nbsp;&middot;&nbsp; Waterborne Commerce &nbsp;&middot;&nbsp; Public Access to Waterways</p>
            <div className="hero-actions">
              <Link href="/development" className="btn btn-gold">Explore Opportunities</Link>
              <Link href="/events" className="btn btn-outline-white">Upcoming Events</Link>
            </div>
          </div>

          <div className="hero-stats" data-animate="fade-up" data-delay="200">
            <div className="hero-stat">
              <span className="hero-stat-number">5+</span>
              <span className="hero-stat-label">Public Facilities</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-number">$50M+</span>
              <span className="hero-stat-label">in Development</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-number">1800s</span>
              <span className="hero-stat-label">Est. Port of Lorain</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-number">Lake Erie</span>
              <span className="hero-stat-label">World-Class Waterway</span>
            </div>
          </div>
        </div>

        <a href="#services" className="scroll-indicator" aria-label="Scroll down">
          <div className="scroll-icon">
            <i className="fas fa-chevron-down"></i>
          </div>
        </a>
      </section>

      {/* ===== SERVICES / PILLARS ===== */}
      <section className="section services-section" id="services">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Our Mission</div>
            <h2 className="section-title">Driving Lorain&apos;s Waterfront Economy</h2>
            <p className="section-desc">The Lorain Port &amp; Finance Authority manages the economic vitality, maritime commerce, and public enjoyment of Lorain&apos;s irreplaceable Lake Erie waterfront.</p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card" data-animate="fade-up" data-delay="0">
              <div className="pillar-icon-wrap">
                <div className="pillar-icon"><i className="fas fa-city"></i></div>
              </div>
              <h3>Economic Development</h3>
              <p>Financing waterfront property development, brownfields remediation, and attracting private investment to revitalize Lorain&apos;s economic landscape.</p>
              <Link href="/development" className="pillar-link">Explore Development <i className="fas fa-arrow-right"></i></Link>
            </div>

            <div className="pillar-card pillar-featured" data-animate="fade-up" data-delay="100">
              <div className="pillar-icon-wrap">
                <div className="pillar-icon"><i className="fas fa-ship"></i></div>
              </div>
              <h3>Waterborne Commerce</h3>
              <p>Supporting commercial shipping, maritime operations, and trade along the Black River and Lake Erie — connecting Lorain to regional and global markets.</p>
              <Link href="/development#commerce" className="pillar-link">Learn More <i className="fas fa-arrow-right"></i></Link>
            </div>

            <div className="pillar-card" data-animate="fade-up" data-delay="200">
              <div className="pillar-icon-wrap">
                <div className="pillar-icon"><i className="fas fa-water"></i></div>
              </div>
              <h3>Public Waterway Access</h3>
              <p>Providing parks, boat launches, tours, and world-class events that connect the Lorain community to the beauty and recreation of Lake Erie.</p>
              <Link href="/recreation" className="pillar-link">Explore Recreation <i className="fas fa-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EVENTS ===== */}
      <section className="section events-section bg-dark-navy" id="events-home">
        <div className="container">
          <div className="section-header light center" data-animate="fade-up">
            <div className="section-label">Community Programming</div>
            <h2 className="section-title">Events at the Waterfront</h2>
            <p className="section-desc">From summer concerts to holiday fireworks, the waterfront is alive all year long.</p>
          </div>

          <div className="events-grid">
            <div className="event-card event-featured" data-animate="fade-up" data-delay="0">
              <div className="event-visual ev-fireworks">
                <div className="event-date-badge">
                  <span className="ev-month">JUL</span>
                  <span className="ev-day">4</span>
                </div>
                <div className="event-tag-pill">Annual</div>
              </div>
              <div className="event-body">
                <h3>Independence Day Fireworks</h3>
                <p>Join thousands at Black River Landing for Lorain&apos;s spectacular Fourth of July fireworks display over Lake Erie — one of the region&apos;s best celebrations.</p>
                <div className="event-meta-row">
                  <span><i className="fas fa-map-marker-alt"></i> Black River Landing</span>
                  <span><i className="fas fa-clock"></i> Dusk</span>
                </div>
                <Link href="/events" className="btn btn-gold btn-sm">Event Details</Link>
              </div>
            </div>

            <div className="event-card" data-animate="fade-up" data-delay="100">
              <div className="event-visual ev-concert">
                <div className="event-date-badge ev-summer">
                  <i className="fas fa-music"></i>
                </div>
                <div className="event-tag-pill">Summer Series</div>
              </div>
              <div className="event-body">
                <h3>Rockin&apos; on the River</h3>
                <p>Live music all summer long at the Black River Landing waterfront. Bring the family and enjoy great bands, food, and the lakeside atmosphere.</p>
                <div className="event-meta-row">
                  <span><i className="fas fa-map-marker-alt"></i> Black River Landing</span>
                </div>
                <Link href="/events" className="btn btn-outline-gold btn-sm">Learn More</Link>
              </div>
            </div>

            <div className="event-card" data-animate="fade-up" data-delay="200">
              <div className="event-visual ev-boattour">
                <div className="event-date-badge ev-summer">
                  <i className="fas fa-sailboat"></i>
                </div>
                <div className="event-tag-pill">Year-Round</div>
              </div>
              <div className="event-body">
                <h3>Boat Tours &amp; Cruises</h3>
                <p>History excursions, nature cruises, and private charters on Lake Erie and the Black River. An unforgettable experience for all ages.</p>
                <div className="event-meta-row">
                  <span><i className="fas fa-map-marker-alt"></i> Black River Wharf</span>
                </div>
                <Link href="/recreation" className="btn btn-outline-gold btn-sm">Book a Tour</Link>
              </div>
            </div>
          </div>

          <div className="section-cta" data-animate="fade-up">
            <Link href="/events" className="btn btn-gold">View All Events</Link>
          </div>
        </div>
      </section>

      {/* ===== FACILITIES ===== */}
      <section className="section facilities-section" id="facilities-home">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Our Properties</div>
            <h2 className="section-title">Waterfront Facilities</h2>
            <p className="section-desc">We manage and maintain Lorain&apos;s most treasured waterfront destinations — from premier event venues to public parks and boat launches.</p>
          </div>

          <div className="facilities-grid">
            <div className="facility-card facility-large" data-animate="fade-up" data-delay="0">
              <div className="facility-img fac-brl">
                <div className="facility-overlay">
                  <div className="facility-overlay-content">
                    <h3>Black River Landing</h3>
                    <p>Lorain&apos;s premier waterfront event venue and public gathering space on the Black River.</p>
                    <Link href="/facilities#black-river-landing" className="btn btn-white btn-sm">Explore <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="facility-card" data-animate="fade-up" data-delay="100">
              <div className="facility-img fac-pier">
                <div className="facility-overlay">
                  <div className="facility-overlay-content">
                    <h3>Mile-Long Pier</h3>
                    <p>Lorain&apos;s iconic landmark stretching into Lake Erie.</p>
                    <Link href="/facilities#mile-long-pier" className="btn btn-white btn-sm">Explore <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="facility-card" data-animate="fade-up" data-delay="150">
              <div className="facility-img fac-lakeside">
                <div className="facility-overlay">
                  <div className="facility-overlay-content">
                    <h3>Lakeside Landing</h3>
                    <p>Beautiful waterfront venue for private events and gatherings.</p>
                    <Link href="/facilities#lakeside-landing" className="btn btn-white btn-sm">Explore <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="facility-card" data-animate="fade-up" data-delay="200">
              <div className="facility-img fac-launch">
                <div className="facility-overlay">
                  <div className="facility-overlay-content">
                    <h3>Black River Wharf Boat Launch</h3>
                    <p>Public access boat launch on the Black River.</p>
                    <Link href="/facilities#boat-launch" className="btn btn-white btn-sm">Explore <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="facility-card" data-animate="fade-up" data-delay="250">
              <div className="facility-img fac-river">
                <div className="facility-overlay">
                  <div className="facility-overlay-content">
                    <h3>Riverside Park</h3>
                    <p>Scenic public green space along the Black River.</p>
                    <Link href="/facilities#riverside-park" className="btn btn-white btn-sm">Explore <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-cta" data-animate="fade-up">
            <Link href="/facilities" className="btn btn-primary">View All Facilities</Link>
          </div>
        </div>
      </section>

      {/* ===== DEVELOPMENT HIGHLIGHT ===== */}
      <section className="section dev-highlight-section bg-light" id="dev-highlight">
        <div className="container">
          <div className="dev-highlight-inner">
            <div className="dev-highlight-content" data-animate="fade-right">
              <div className="section-label">Development &amp; Finance</div>
              <h2>Investing in Lorain&apos;s Future</h2>
              <p>The Lorain Port &amp; Finance Authority is actively driving economic growth through targeted brownfields remediation, innovative financing tools, and strategic partnerships with developers and community stakeholders.</p>
              <ul className="check-list">
                <li><i className="fas fa-check-circle"></i> Brownfields grants and environmental remediation programs</li>
                <li><i className="fas fa-check-circle"></i> Property financing and development programs</li>
                <li><i className="fas fa-check-circle"></i> Active RFPs for key waterfront parcels</li>
                <li><i className="fas fa-check-circle"></i> Waterborne commerce infrastructure investment</li>
                <li><i className="fas fa-check-circle"></i> City, county, and state agency collaboration</li>
              </ul>
              <div className="dev-highlight-actions">
                <Link href="/development" className="btn btn-primary">View Opportunities</Link>
                <Link href="/development#rfp" className="btn btn-outline">Current RFPs</Link>
              </div>
            </div>

            <div className="dev-highlight-stats" data-animate="fade-left">
              <div className="dev-stat-card">
                <div className="dev-stat-icon"><i className="fas fa-industry"></i></div>
                <h4>Brownfields</h4>
                <p>Environmental cleanup and redevelopment grants for underutilized industrial sites</p>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-icon"><i className="fas fa-hand-holding-dollar"></i></div>
                <h4>Financing</h4>
                <p>Flexible property financing programs to catalyze waterfront development</p>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-icon"><i className="fas fa-file-contract"></i></div>
                <h4>Active RFPs</h4>
                <p>Open requests for proposals on key waterfront development sites</p>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-icon"><i className="fas fa-handshake"></i></div>
                <h4>Partnerships</h4>
                <p>Collaborating with city, county, and state agencies to maximize impact</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="section newsletter-section" id="newsletter">
        <div className="container">
          <div className="newsletter-inner" data-animate="fade-up">
            <div className="newsletter-content">
              <div className="newsletter-icon"><i className="fas fa-paper-plane"></i></div>
              <h2>Stay Connected to the Waterfront</h2>
              <p>Receive updates on events, development opportunities, RFPs, and news from Lorain&apos;s waterfront authority.</p>
            </div>
            <form className="newsletter-form" id="newsletter-form" noValidate>
              <div className="newsletter-fields">
                <input type="text" name="name" placeholder="Your Name" autoComplete="name" required aria-label="Your Name" />
                <input type="email" name="email" placeholder="Your Email Address" autoComplete="email" required aria-label="Your Email Address" />
                <button type="submit" className="btn btn-gold">Subscribe <i className="fas fa-arrow-right"></i></button>
              </div>
              <p className="newsletter-note">We respect your privacy. Unsubscribe at any time.</p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
