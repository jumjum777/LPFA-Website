import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import EventsToursGrid from '@/components/events/EventsToursGrid';
import { createServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Events & Boat Tours' };

export const revalidate = 60;

export default async function EventsPage() {
  const supabase = await createServerClient();

  const [{ data: events }, { data: tours }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: true }),
    supabase
      .from('tours')
      .select('*, schedules:tour_schedules(*)')
      .eq('is_published', true)
      .order('sort_order'),
  ]);

  const eventsList = events || [];
  const toursList = tours || [];
  const featured = eventsList.find(e => e.is_featured);

  const allEventCategories = ["Rockin' On The River", 'Community'];
  const usedEventCategories = [...new Set(eventsList.map(e => e.category))];
  const eventCategories = allEventCategories.filter(c => usedEventCategories.includes(c));

  const tourSections = [...new Set(toursList.map(t => t.section))].filter(Boolean);

  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Events &amp; Boat Tours</span>
          </nav>
          <div className="page-hero-label">Waterfront Activities</div>
          <h1>Events &amp; Boat Tours</h1>
          <p>From summer concerts to narrated history cruises and sunset sails — discover everything happening on Lorain&apos;s waterfront. Filter by category or tour type to find your next adventure.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {featured && (
            <div className="featured-event-banner" data-animate="fade-up">
              {featured.gallery_images?.[0]?.url && (
                <div className="feb-image">
                  <img src={featured.gallery_images[0].url} alt={featured.title} />
                </div>
              )}
              <div className="feb-content">
                <div style={{ display: 'inline-block', background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.3)', color: 'var(--gold-muted)', fontFamily: 'var(--font-heading)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '0.25rem 0.75rem', borderRadius: '100px', marginBottom: '0.75rem' }}>Featured Event</div>
                <h2>{featured.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: featured.description }} />
                <div className="feb-meta">
                  {featured.location && <span><i className="fas fa-map-marker-alt"></i> {featured.location}</span>}
                  {featured.event_date && <span><i className="fas fa-calendar"></i> {featured.event_date}</span>}
                  {featured.price && <span><i className="fas fa-ticket-alt"></i> {featured.price}</span>}
                </div>
              </div>
              <div className="feb-action">
                {featured.ticket_url ? (
                  <a href={featured.ticket_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Get Tickets <i className="fas fa-arrow-right"></i></a>
                ) : (
                  <Link href="/contact" className="btn btn-gold">Get Updates <i className="fas fa-arrow-right"></i></Link>
                )}
              </div>
            </div>
          )}

          {eventsList.length === 0 && toursList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.1rem', padding: '3rem 0' }}>
              No events or tours listed yet. Check back soon!
            </p>
          ) : (
            <EventsToursGrid
              events={eventsList}
              tours={toursList}
              eventCategories={eventCategories}
              tourSections={tourSections}
            />
          )}
        </div>
      </section>

      {/* ============================================================= */}
      {/* WATER TAXI */}
      {/* ============================================================= */}
      <section className="section bg-light" id="water-taxi">
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
      <section className="section" id="charters">
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
      <section className="section bg-light">
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

      {/* Newsletter CTA */}
      <section className="section">
        <div className="container">
          <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' as const }} data-animate="fade-up">
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Never Miss an Event</h3>
              <p style={{ fontSize: '0.9rem' }}>Subscribe to our newsletter for advance notice of events, concerts, tours, and waterfront activities.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, flexShrink: 0 }}>
              <Link href="/#newsletter" className="btn btn-primary">Subscribe</Link>
              <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener" className="btn btn-outline"><i className="fab fa-facebook-f"></i> Follow Us</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
