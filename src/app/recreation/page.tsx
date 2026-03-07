import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import TourScheduleToggle from '@/components/recreation/TourScheduleToggle';

export const metadata = { title: 'Boat Tours & Recreation' };

export default function RecreationPage() {
  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Boat Tours &amp; Recreation</span>
          </nav>
          <div className="page-hero-label">Lake Erie Adventures</div>
          <h1>Boat Tours &amp; Recreation</h1>
          <p>Explore Lorain&apos;s waterfront with narrated history cruises, lighthouse tours, sunset sails, a free water taxi, and private charter experiences on Lake Erie and the Black River.</p>
        </div>
      </section>

      {/* ============================================================= */}
      {/* HISTORY & LIGHTHOUSE TOURS */}
      {/* ============================================================= */}
      <section className="section" id="history-tours">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">History &amp; Heritage</div>
            <h2 className="section-title">History Excursions &amp; Lighthouse Tours</h2>
            <p className="section-desc">Brush up on Lorain&apos;s past and learn the importance the waterways played in the development of the International City. Cruise past the Lorain Lighthouse and historic landmarks along the Black River.</p>
          </div>

          <div className="tours-grid">
            {/* History Excursion */}
            <div className="tour-card" data-animate="fade-up" data-delay="0">
              <div className="tour-body">
                <h3>History Excursion</h3>
                <div className="tour-price">$25 <span className="per">/ person</span></div>
                <p>A two-hour narrated tour by a Lorain Historical Society member cruising past the Lorain Lighthouse and historic landmarks along the Black River, including sites of American Shipbuilding and United States Steel.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> 2 hours</div>
                  <div className="tour-detail"><i className="fas fa-users"></i> All ages welcome</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                  <div className="tour-detail"><i className="fas fa-calendar"></i> Sundays &amp; Fridays, June through August</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sun, Jun 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jun 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jun 22 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Jul 11 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jul 25 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 27 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Aug 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 10 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Aug 22 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 24 &mdash; 2pm</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>

            {/* Lighthouse Tour */}
            <div className="tour-card" data-animate="fade-up" data-delay="100">
              <div className="tour-body">
                <h3>Lighthouse Tour</h3>
                <div className="tour-price">$25 <span className="per">/ person</span></div>
                <p>A shuttle ride to and from the historic Lorain Lighthouse, plus a guided tour of the structure&apos;s interior. Knowledgeable volunteers answer questions about the lighthouse&apos;s rich history.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> Shuttles every 45 minutes</div>
                  <div className="tour-detail"><i className="fas fa-users"></i> All ages welcome</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                  <div className="tour-detail"><i className="fas fa-calendar"></i> Saturdays, June through September</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sat, Jun 7 &mdash; 11am</span>
                      <span className="tour-schedule-date">Sat, Jun 14 &mdash; 11am</span>
                      <span className="tour-schedule-date">Sun, Jun 22 &mdash; 11am</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sun, Jul 6 &mdash; 11am</span>
                      <span className="tour-schedule-date">Sun, Jul 13 &mdash; 11am</span>
                      <span className="tour-schedule-date">Wed, Jul 16 &mdash; 5pm</span>
                      <span className="tour-schedule-date">Sat, Jul 26 &mdash; 11am</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sat, Aug 9 &mdash; 11am</span>
                      <span className="tour-schedule-date">Wed, Aug 13 &mdash; 5pm</span>
                      <span className="tour-schedule-date">Sun, Aug 17 &mdash; 11am</span>
                      <span className="tour-schedule-date">Sat, Aug 30 &mdash; 11am</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">September</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sat, Sep 6 &mdash; 11am</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>

            {/* Lighthouse Dinner */}
            <div className="tour-card" data-animate="fade-up" data-delay="200">
              <div className="tour-body">
                <h3>Lighthouse Dinner</h3>
                <div className="tour-price">$165 <span className="per">/ person (includes tip)</span></div>
                <p>A specialty dining experience at the Lorain Lighthouse featuring wine pairings provided by Lorain Brewing Company, plus a guided interior tour of the lighthouse.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> 3 hours</div>
                  <div className="tour-detail"><i className="fas fa-wine-glass-alt"></i> Wine pairings included</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                  <div className="tour-detail"><i className="fas fa-calendar"></i> Tuesdays, June 17 &ndash; September 16</div>
                  <div className="tour-detail"><i className="fas fa-phone-alt"></i> Reserve at 440-752-8955</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Tue, Jun 17 &mdash; 6:30pm</span>
                      <span className="tour-schedule-date">Tue, Jun 24 &mdash; 6:30pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Tue, Jul 8 &mdash; 6:30pm</span>
                      <span className="tour-schedule-date">Tue, Jul 15 &mdash; 6:30pm</span>
                      <span className="tour-schedule-date">Tue, Jul 22 &mdash; 6:00pm</span>
                      <span className="tour-schedule-date">Tue, Jul 29 &mdash; 6:00pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Tue, Aug 5 &mdash; 6:00pm</span>
                      <span className="tour-schedule-date">Tue, Aug 12 &mdash; 6:00pm</span>
                      <span className="tour-schedule-date">Tue, Aug 19 &mdash; 5:30pm</span>
                      <span className="tour-schedule-date">Tue, Aug 26 &mdash; 5:30pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">September</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Tue, Sep 2 &mdash; 5:30pm</span>
                      <span className="tour-schedule-date">Tue, Sep 9 &mdash; 5:30pm</span>
                      <span className="tour-schedule-date">Tue, Sep 16 &mdash; 5pm</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>
          </div>

          <div className="policy-note" data-animate="fade-up">
            <i className="fas fa-info-circle"></i>
            <div><strong>Cancellation Policy:</strong> All sales are final. No refunds. The Authority reserves the right to cancel for inclement weather, in which case exchanges for future trips will be offered. Lighthouse tour tickets available through the Lorain Lighthouse Foundation.</div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* NATURE, SUNSET & SIP N' SWAY */}
      {/* ============================================================= */}
      <section className="section bg-light" id="nature-tours">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Scenic Cruises</div>
            <h2 className="section-title">Nature Tours, Sunsets &amp; Sip n&apos; Sway</h2>
            <p className="section-desc">Cruise the shores of the beautiful Black River on an all-inclusive tour of Lorain&apos;s waterfront areas. From relaxing nature cruises to breathtaking sunsets and adult BYOB sails.</p>
          </div>

          <div className="tours-grid">
            {/* River Nature Tour */}
            <div className="tour-card" data-animate="fade-up" data-delay="0">
              <div className="tour-body">
                <h3>River Nature Tour</h3>
                <div className="tour-price">$20 <span className="per">/ person</span></div>
                <p>Cruise the shores of the beautiful Black River on an all-inclusive narrated tour of Lorain&apos;s waterfront areas. Includes a pass by the river, harbor, and the historic Lorain Lighthouse.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> 2 hours</div>
                  <div className="tour-detail"><i className="fas fa-users"></i> All ages welcome</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                  <div className="tour-detail"><i className="fas fa-calendar"></i> Seasonal &mdash; Spring through Fall</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sun, Jun 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jun 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jun 22 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Jul 11 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jul 25 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 27 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Aug 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 10 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Aug 22 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 24 &mdash; 2pm</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>

            {/* Sunset Cruise */}
            <div className="tour-card" data-animate="fade-up" data-delay="100">
              <div className="tour-body">
                <h3>Sunset Cruise</h3>
                <div className="tour-price">$20 <span className="per">/ person</span></div>
                <p>Capture a breathtaking Lorain sunset while on the water. Features a harbor tour and Black River passage with captain narration as the sky lights up over Lake Erie.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> 1.5 hours</div>
                  <div className="tour-detail"><i className="fas fa-users"></i> All ages welcome</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                  <div className="tour-detail"><i className="fas fa-calendar"></i> Seasonal &mdash; Spring through Fall</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sun, Jun 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jun 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jun 22 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Jul 11 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jul 25 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 27 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Aug 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 10 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Aug 22 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 24 &mdash; 2pm</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>

            {/* Sip n' Sway */}
            <div className="tour-card" data-animate="fade-up" data-delay="200">
              <div className="tour-body">
                <h3>Sip n&apos; Sway</h3>
                <div className="tour-price">$25 <span className="per">/ person</span></div>
                <p>A River Nature Tour variant for adults 21 and over. Bring your own beverages and enjoy a relaxing two-hour cruise along the Black River and Lake Erie shoreline.</p>
                <div className="tour-details">
                  <div className="tour-detail"><i className="fas fa-clock"></i> 2 hours</div>
                  <div className="tour-detail"><i className="fas fa-id-card"></i> Ages 21+ only</div>
                  <div className="tour-detail"><i className="fas fa-beer-mug-empty"></i> BYOB &mdash; 36 oz beer or 18 oz wine per person</div>
                  <div className="tour-detail"><i className="fas fa-ban"></i> Beer &amp; wine only &mdash; no liquor</div>
                  <div className="tour-detail"><i className="fas fa-map-marker-alt"></i> Alliance Marine at Port Lorain Dock A</div>
                </div>
                <TourScheduleToggle label="2025 Schedule">
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">June</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Sun, Jun 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jun 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jun 22 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">July</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Jul 11 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 13 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Jul 25 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Jul 27 &mdash; 2pm</span>
                    </div>
                  </div>
                  <div className="tour-schedule-month">
                    <div className="tour-schedule-month-name">August</div>
                    <div className="tour-schedule-dates">
                      <span className="tour-schedule-date">Fri, Aug 8 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 10 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Fri, Aug 22 &mdash; 2pm</span>
                      <span className="tour-schedule-date">Sun, Aug 24 &mdash; 2pm</span>
                    </div>
                  </div>
                </TourScheduleToggle>
              </div>
            </div>
          </div>

          <div className="policy-note" data-animate="fade-up">
            <i className="fas fa-info-circle"></i>
            <div><strong>Cancellation Policy:</strong> All sales are final. No refunds. Weather cancellations result in exchanges for future trips. Customers will be notified via phone and email.</div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* WATER TAXI */}
      {/* ============================================================= */}
      <section className="section" id="water-taxi">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Free Transportation</div>
            <h2 className="section-title">Water Taxi Service</h2>
            <p className="section-desc">A free water taxi service available during Rockin&apos; on the River concerts and other festivals and events. A convenient way to travel between waterfront destinations.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start', marginBottom: '3rem' }} data-animate="fade-up">
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Route &amp; Stops</h3>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.92rem' }}>The water taxi follows a fixed route connecting three main waterfront locations, running continuously throughout the evening on event nights.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(27,139,235,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-accent)', flexShrink: 0 }}><i className="fas fa-anchor"></i></div>
                  <div><strong style={{ fontSize: '0.88rem' }}>Black River Landing</strong><br /><a href="https://maps.google.com/?q=421+Black+River+Ln+Lorain+OH+44052" target="_blank" rel="noopener" style={{ fontSize: '0.78rem', color: 'var(--blue-accent)', textDecoration: 'none' }}>421 Black River Ln, Lorain, OH 44052</a></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(217,119,6,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}><i className="fas fa-ship"></i></div>
                  <div><strong style={{ fontSize: '0.88rem' }}>Alliance Marina</strong><br /><a href="https://maps.google.com/?q=301+Lakeside+Ave+%231+Lorain+OH+44052" target="_blank" rel="noopener" style={{ fontSize: '0.78rem', color: 'var(--blue-accent)', textDecoration: 'none' }}>301 Lakeside Ave #1, Lorain, OH 44052</a></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(13,148,136,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488', flexShrink: 0 }}><i className="fas fa-beer-mug-empty"></i></div>
                  <div><strong style={{ fontSize: '0.88rem' }}>The Shipyards (Lorain Brewing Co.)</strong><br /><a href="https://maps.google.com/?q=500+Shipyard+Wy+Lorain+OH+44052" target="_blank" rel="noopener" style={{ fontSize: '0.78rem', color: 'var(--blue-accent)', textDecoration: 'none' }}>500 Shipyard Wy, Lorain, OH 44052</a></div>
                </div>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Service Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '1.2rem', flexShrink: 0 }}><i className="fas fa-dollar-sign"></i></div>
                  <div><strong style={{ fontSize: '0.9rem' }}>Free of Charge</strong><br /><span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Complimentary service &mdash; no tickets needed</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(27,139,235,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-accent)', fontSize: '1.2rem', flexShrink: 0 }}><i className="fas fa-clock"></i></div>
                  <div><strong style={{ fontSize: '0.9rem' }}>6:00 PM &ndash; 11:30 PM</strong><br /><span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Continuous rounds on concert nights</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(217,119,6,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: '1.2rem', flexShrink: 0 }}><i className="fas fa-music"></i></div>
                  <div><strong style={{ fontSize: '0.9rem' }}>Event Nights Only</strong><br /><span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Runs during Rockin&apos; on the River &amp; select festivals</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', fontSize: '1.2rem', flexShrink: 0 }}><i className="fas fa-users"></i></div>
                  <div><strong style={{ fontSize: '0.9rem' }}>All Ages Welcome</strong><br /><span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Families, visitors, and residents</span></div>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }} data-animate="fade-up">2025 Water Taxi Schedule</h3>
          <div className="wt-schedule-grid" data-animate="fade-up">
            <div className="wt-month">
              <h4><i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> May</h4>
              <ul>
                <li>May 23</li>
                <li>May 30</li>
              </ul>
            </div>
            <div className="wt-month">
              <h4><i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> June</h4>
              <ul>
                <li>June 6 &amp; 7</li>
                <li>June 13 &amp; 14</li>
                <li>June 20 &amp; 21</li>
                <li>June 27</li>
              </ul>
            </div>
            <div className="wt-month">
              <h4><i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> July</h4>
              <ul>
                <li>July 11 &amp; 12</li>
                <li>July 19 &amp; 20</li>
                <li>July 25</li>
              </ul>
            </div>
            <div className="wt-month">
              <h4><i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> August</h4>
              <ul>
                <li>August 1</li>
                <li>August 8</li>
                <li>August 15 &amp; 16</li>
                <li>August 22</li>
                <li>August 29</li>
              </ul>
            </div>
            <div className="wt-month">
              <h4><i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> September</h4>
              <ul>
                <li>September 5</li>
                <li>September 12</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* PRIVATE CHARTERS */}
      {/* ============================================================= */}
      <section className="section bg-light" id="charters">
        <div className="container">
          <div className="section-header center" data-animate="fade-up">
            <div className="section-label">Private Experiences</div>
            <h2 className="section-title">Private Charters</h2>
            <p className="section-desc">Book a boat for your next get together! With a capacity of up to 18 passengers, you set the time, date, and guest list and make the experience unique to your group.</p>
          </div>

          <div className="charter-features" data-animate="fade-up">
            <div className="charter-feature-card">
              <div className="charter-feature-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-briefcase"></i></div>
              <h3 style={{ marginBottom: '0.6rem', fontSize: '1.05rem' }}>Corporate Events</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-500)' }}>Team-building outings, client entertainment, and corporate celebrations. A unique alternative to traditional venues.</p>
            </div>
            <div className="charter-feature-card">
              <div className="charter-feature-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-birthday-cake"></i></div>
              <h3 style={{ marginBottom: '0.6rem', fontSize: '1.05rem' }}>Private Celebrations</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-500)' }}>Birthdays, anniversaries, graduations, and family gatherings &mdash; make your occasion extraordinary on Lake Erie.</p>
            </div>
            <div className="charter-feature-card">
              <div className="charter-feature-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}><i className="fas fa-school"></i></div>
              <h3 style={{ marginBottom: '0.6rem', fontSize: '1.05rem' }}>Educational Groups</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-500)' }}>School field trips, scout outings, and educational tours. Hands-on learning about Great Lakes ecology and maritime history.</p>
            </div>
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto' }} data-animate="fade-up">
            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg,var(--navy),var(--blue-accent))', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', flexShrink: 0 }}><i className="fas fa-ship"></i></div>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Charter Pricing &amp; Details</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0 }}>Everything you need to know about booking</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--navy)' }}>$300</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>for 2 hours</div>
                </div>
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--navy)' }}>+$100</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>each additional hour</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}><i className="fas fa-users" style={{ color: 'var(--blue-accent)', width: '16px', fontSize: '0.78rem' }}></i> Up to 18 passengers</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}><i className="fas fa-music" style={{ color: 'var(--blue-accent)', width: '16px', fontSize: '0.78rem' }}></i> Decorations, music, food &amp; drinks welcome</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}><i className="fas fa-file-alt" style={{ color: 'var(--blue-accent)', width: '16px', fontSize: '0.78rem' }}></i> Application required</div>
              </div>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>Pickup / Drop-off Locations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}><i className="fas fa-map-pin" style={{ color: 'var(--gold)', width: '14px', fontSize: '0.75rem' }}></i> Black River Landing (BRL)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}><i className="fas fa-map-pin" style={{ color: 'var(--gold)', width: '14px', fontSize: '0.75rem' }}></i> Alliance Marine at Port Lorain Dock A</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}><i className="fas fa-map-pin" style={{ color: 'var(--gold)', width: '14px', fontSize: '0.75rem' }}></i> The Shipyards (Lorain Brewing Co.)</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="tel:4402042269" className="btn btn-outline btn-sm"><i className="fas fa-phone-alt"></i> 440-204-2269</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* DEPARTURE INFO */}
      {/* ============================================================= */}
      <section className="section">
        <div className="container">
          <div className="departure-banner" data-animate="fade-up">
            <div className="departure-banner-icon"><i className="fas fa-compass"></i></div>
            <div>
              <h3>All Tours Depart from Port Lorain</h3>
              <p>Most tours depart from <strong style={{ color: '#fff' }}>Alliance Marine at Port Lorain Dock A</strong>, located at <a href="https://maps.google.com/?q=319+Black+River+Lane+Lorain+OH+44052" target="_blank" rel="noopener">319 Black River Lane, Lorain, OH 44052</a>. Arrive at least 15 minutes before your scheduled departure.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
