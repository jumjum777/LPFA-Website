import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import ArticleGallery from '@/components/news/ArticleGallery';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase.from('events').select('title, description').eq('id', id).single();
  if (!data) return { title: 'Event Not Found' };
  return {
    title: data.title,
    description: data.description?.replace(/<[^>]*>/g, '').slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single();

  if (!event || !event.is_published) notFound();

  const isROTR = event.category === "Rockin' On The River";
  const galleryImages = event.gallery_images?.length > 0
    ? event.gallery_images
    : event.image_url
      ? [{ url: event.image_url, alt: event.title, sort_order: 0 }]
      : [];

  const isLogoOnly = galleryImages.length === 1 && /\/logo(-stacked)?(-white)?\.png$/.test(galleryImages[0].url);

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/events">Events</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">{event.title}</span>
          </nav>
          <div className="page-hero-label">{event.category}</div>
          <h1>{event.title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '900px' }}>

          {galleryImages.length > 0 && (
            isLogoOnly ? (
              <div className="event-detail-logo" style={{ marginBottom: '2rem' }}>
                <img src="/images/logo.png" alt="Lorain Port Authority" className="logo-light" />
                <img src="/images/logo-white.png" alt="Lorain Port Authority" className="logo-dark" />
              </div>
            ) : (
              <div className="event-gallery-wrap" style={{ marginBottom: '2rem' }}>
                <ArticleGallery images={galleryImages} />
              </div>
            )
          )}

          {isROTR && (event.headliner || event.opening_band) && (
            <div className="event-detail-lineup" data-animate="fade-up">
              {event.headliner && (
                <div className="event-detail-lineup-item">
                  <span className="event-detail-label">Headliner</span>
                  <span className="event-detail-value" style={{ color: 'var(--gold)' }}>{event.headliner}</span>
                </div>
              )}
              {event.opening_band && (
                <div className="event-detail-lineup-item">
                  <span className="event-detail-label">Opening Act</span>
                  <span className="event-detail-value" style={{ color: 'var(--blue-accent)' }}>{event.opening_band}</span>
                </div>
              )}
            </div>
          )}

          <div className="event-detail-info" data-animate="fade-up">
            {event.event_date && (
              <div className="event-detail-row">
                <span className="event-detail-label">Date</span>
                <span className="event-detail-value">{formatDate(event.event_date)}</span>
              </div>
            )}
            {event.location && (
              <div className="event-detail-row">
                <span className="event-detail-label">Location</span>
                <span className="event-detail-value">{event.location}</span>
              </div>
            )}
            {isROTR ? (
              <>
                {event.gates_time && (
                  <div className="event-detail-row">
                    <span className="event-detail-label">Gates Open</span>
                    <span className="event-detail-value">{event.gates_time}</span>
                  </div>
                )}
                {event.opener_time && (
                  <div className="event-detail-row">
                    <span className="event-detail-label">Opening Act</span>
                    <span className="event-detail-value">{event.opener_time}</span>
                  </div>
                )}
                {event.headliner_time && (
                  <div className="event-detail-row">
                    <span className="event-detail-label">Headliner</span>
                    <span className="event-detail-value">{event.headliner_time}</span>
                  </div>
                )}
              </>
            ) : (
              event.time && (
                <div className="event-detail-row">
                  <span className="event-detail-label">Time</span>
                  <span className="event-detail-value">{event.time}</span>
                </div>
              )
            )}
            {event.price && (
              <div className="event-detail-row">
                <span className="event-detail-label">Admission</span>
                <span className="event-detail-value">{event.price}</span>
              </div>
            )}
          </div>

          {event.ticket_url && (
            <div style={{ margin: '1.5rem 0' }} data-animate="fade-up">
              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                Get Tickets <i className="fas fa-external-link-alt" style={{ marginLeft: '0.4rem', fontSize: '0.8em' }}></i>
              </a>
            </div>
          )}

          <div className="article-body" data-animate="fade-up" dangerouslySetInnerHTML={{ __html: event.description }} />

          {event.event_policy && (
            <div className="event-detail-policy" data-animate="fade-up">
              <h3>Event Policy</h3>
              <p>{event.event_policy}</p>
            </div>
          )}

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
            <Link href="/events" className="btn btn-outline">
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to Events
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
