import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import EventsGrid from '@/components/events/EventsGrid';
import { createServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Events' };

export const revalidate = 60;

export default async function EventsPage() {
  const supabase = await createServerClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('event_date', { ascending: true });

  const eventsList = events || [];
  const featured = eventsList.find(e => e.is_featured);
  const allCategories = ["Rockin' On The River", 'Community'];
  const usedCategories = [...new Set(eventsList.map(e => e.category))];
  const categories = allCategories.filter(c => usedCategories.includes(c));

  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Events</span>
          </nav>
          <div className="page-hero-label">Community Programming</div>
          <h1>Events at the Waterfront</h1>
          <p>From summer concerts to holiday fireworks, Lorain&apos;s waterfront is alive with community events all year long. Check back regularly for the latest schedule.</p>
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

          {eventsList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.1rem', padding: '3rem 0' }}>
              No events listed yet. Check back soon!
            </p>
          ) : (
            <EventsGrid events={eventsList} categories={categories} />
          )}

          <div style={{ marginTop: '3.5rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' as const }} data-animate="fade-up">
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Never Miss an Event</h3>
              <p style={{ fontSize: '0.9rem' }}>Subscribe to our newsletter for advance notice of events, concerts, and waterfront activities.</p>
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
