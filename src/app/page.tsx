import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import { createServerClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_date, location, category, image_url, gallery_images, headliner, opening_band')
    .eq('is_published', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(5);

  const { data: tours } = await supabase
    .from('tours')
    .select('id, name, section, price')
    .eq('is_published', true)
    .order('sort_order')
    .limit(5);

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
        </div>

        <div className="container">
          <div className="hero-content" data-animate="fade-up">
            <div className="hero-badge"><i className="fas fa-map-marker-alt"></i> Lorain, Ohio</div>
            <h1 className="hero-title">
              Driving Development<br />Through Our Waterways
            </h1>
            <div className="hero-actions">
              <Link href="/development" className="btn btn-gold">Learn More</Link>
            </div>
          </div>

        </div>

        <a href="#services" className="scroll-indicator" aria-label="Scroll down">
          <div className="scroll-icon">
            <i className="fas fa-chevron-down"></i>
          </div>
        </a>
      </section>

      {/* ===== DEVELOPMENT HIGHLIGHT ===== */}
      <section className="section dev-highlight-section bg-light" id="services">
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

      {/* ===== UPCOMING EVENTS & TOURS ===== */}
      <section className="section events-section bg-dark-navy" id="events-home">
        <div className="container">
          <div className="section-header light center" data-animate="fade-up">
            <div className="section-label">Events &amp; Boat Tours</div>
            <h2 className="section-title">Coming Up at the Waterfront</h2>
          </div>

          {(upcomingEvents && upcomingEvents.length > 0) || (tours && tours.length > 0) ? (
            <div className="events-list events-list-compact" data-animate="fade-up">
              {upcomingEvents?.map(event => {
                const imgSrc = event.image_url || event.gallery_images?.[0]?.url;
                const isROTR = event.category === "Rockin' On The River";
                const isLogo = imgSrc ? /\/logo(-stacked)?\.png$/.test(imgSrc) : false;

                const d = new Date(event.event_date + 'T00:00:00');
                const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                return (
                  <Link href="/events" key={event.id} className="event-list-card event-card-compact" style={{ textDecoration: 'none' }}>
                    {imgSrc ? (
                      <div className={`elc-compact-img${isLogo ? ' elc-compact-img-logo' : ''}`}>
                        <img src={imgSrc} alt={event.title} loading="lazy" />
                      </div>
                    ) : (
                      <div className="elc-compact-img elc-compact-img-placeholder">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                    )}
                    <div className="elc-body">
                      <div className="elc-body-header">
                        <span className="elc-tag">{event.category}</span>
                      </div>
                      <div className="elc-event-date">{dateStr}</div>
                      {!isROTR && event.title && <h3>{event.title}</h3>}
                      {isROTR && (event.headliner || event.opening_band) && (
                        <div className="elc-compact-lineup">
                          {event.headliner && (
                            <div className="elc-compact-artist">
                              <span className="elc-compact-label">Headliner</span>
                              <span className="elc-compact-name" style={{ color: 'var(--gold)' }}>{event.headliner}</span>
                            </div>
                          )}
                          {event.opening_band && (
                            <div className="elc-compact-artist">
                              <span className="elc-compact-label">Opener</span>
                              <span className="elc-compact-name" style={{ color: 'var(--blue-accent)' }}>{event.opening_band}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <span className="elc-read-more">Details <i className="fas fa-chevron-right"></i></span>
                    </div>
                  </Link>
                );
              })}
              {tours?.map(tour => (
                <Link href="/events" key={tour.id} className="event-list-card event-card-compact" style={{ textDecoration: 'none' }}>
                  <div className="elc-compact-img elc-compact-img-tour">
                    <i className="fas fa-ship"></i>
                  </div>
                  <div className="elc-body">
                    <div className="elc-body-header">
                      <span className="elc-tag elc-tag-tour">{tour.section}</span>
                    </div>
                    <h3>{tour.name}</h3>
                    {tour.price && <div className="elc-compact-price">{tour.price}</div>}
                    <span className="elc-read-more">Details <i className="fas fa-chevron-right"></i></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem 0' }}>No upcoming events scheduled. Check back soon!</p>
          )}

          <div className="section-cta" data-animate="fade-up">
            <Link href="/events" className="btn btn-gold">View All Events &amp; Tours</Link>
          </div>
        </div>
      </section>

      {/* ===== LIVE CAMS ===== */}
      <section className="section" id="live-cams-home">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Live Cams</div>
            <h2 className="section-title">Watch the Waterfront Live</h2>
          </div>
          <div className="home-cams-grid" data-animate="fade-up">
            <div className="home-cam-card">
              <div className="home-cam-frame">
                <iframe
                  src="https://www.youtube.com/embed/1MVB3fgg7kg?autoplay=0&mute=1&rel=0"
                  title="Lake Erie Live Cam"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="home-cam-bar">
                <span className="livecam-live-dot"></span>
                <span>Lake Erie View</span>
              </div>
            </div>
            <div className="home-cam-card">
              <div className="home-cam-frame">
                <iframe
                  src="https://www.youtube.com/embed/ZZevIUr2cTk?autoplay=0&mute=1&rel=0"
                  title="Black River Live Cam"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="home-cam-bar">
                <span className="livecam-live-dot"></span>
                <span>Black River View</span>
              </div>
            </div>
          </div>
          <div className="section-cta" data-animate="fade-up">
            <Link href="/live-cams" className="btn btn-gold">View Full Screen Cams</Link>
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
