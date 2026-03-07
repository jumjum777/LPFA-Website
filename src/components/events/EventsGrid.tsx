'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface EventItem {
  id: string;
  title: string;
  category: string;
  description: string;
  event_date: string;
  location: string;
  time: string;
  price: string;
  ticket_url: string;
  opening_band: string;
  headliner: string;
  gates_time: string;
  opener_time: string;
  headliner_time: string;
  is_featured: boolean;
  image_url: string;
  gallery_images: { url: string; alt: string; sort_order: number }[];
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMonthLabel(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return MONTH_NAMES[d.getMonth()];
}

export default function EventsGrid({ events, categories }: { events: EventItem[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMonth, setActiveMonth] = useState('All');

  const isROTR = (cat: string) => cat === "Rockin' On The River";

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  // Get unique months from events that have dates
  const months = useMemo(() => {
    const monthSet = new Set<string>();
    events.forEach(e => {
      const m = getMonthLabel(e.event_date);
      if (m) monthSet.add(m);
    });
    // Sort by calendar order
    return MONTH_NAMES.filter(m => monthSet.has(m));
  }, [events]);

  const filtered = events
    .filter(e => !e.is_featured)
    .filter(e => activeCategory === 'All' || e.category === activeCategory)
    .filter(e => activeMonth === 'All' || getMonthLabel(e.event_date) === activeMonth);

  return (
    <>
      {/* Category filter */}
      <div className="events-filter" data-animate="fade-up">
        <button
          className={`filter-btn ${activeCategory === 'All' ? 'active' : ''}`}
          onClick={() => setActiveCategory('All')}
        >
          All Events
        </button>
        {categories.map(c => (
          <button
            key={c}
            className={`filter-btn ${activeCategory === c ? 'active' : ''}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Month filter */}
      {months.length > 1 && (
        <div className="events-filter events-filter-months" data-animate="fade-up">
          <button
            className={`filter-btn filter-btn-month ${activeMonth === 'All' ? 'active' : ''}`}
            onClick={() => setActiveMonth('All')}
          >
            All Months
          </button>
          {months.map(m => (
            <button
              key={m}
              className={`filter-btn filter-btn-month ${activeMonth === m ? 'active' : ''}`}
              onClick={() => setActiveMonth(m)}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.05rem', padding: '2rem 0' }}>
          No events match your filters.
        </p>
      ) : (
        <div className="events-list">
          {filtered.map((event) => (
            <div key={event.id} className="event-list-card animated">
              {(event.image_url || event.gallery_images?.[0]?.url) && (() => {
                const imgSrc = event.image_url || event.gallery_images[0].url;
                const isLogo = /\/logo(-stacked)?\.png$/.test(imgSrc);
                const whiteSrc = isLogo ? imgSrc.replace(/\/logo(-stacked)?\.png$/, (_, s) => `/logo${s || ''}-white.png`) : '';
                return (
                  <div className={`elc-image${isLogo ? ' elc-image-logo' : ''}`}>
                    <img src={imgSrc} alt={event.title} loading="lazy" className={isLogo ? 'logo-light' : ''} />
                    {isLogo && <img src={whiteSrc} alt={event.title} loading="lazy" className="logo-dark" />}
                  </div>
                );
              })()}
              <div className="elc-body">
                <div className="elc-body-header">
                  <span className="elc-tag">{event.category}</span>
                </div>
                {event.event_date && (
                  <div className="elc-event-date">{formatDate(event.event_date)}</div>
                )}
                {!isROTR(event.category) && event.title && (
                  <h3>{event.title}</h3>
                )}

                {isROTR(event.category) && (event.headliner || event.opening_band) && (
                  <div className="elc-details">
                    {event.headliner && (
                      <div className="elc-detail-row">
                        <span className="elc-detail-label">Headliner</span>
                        <span className="elc-detail-value" style={{ color: 'var(--gold)' }}>{event.headliner}</span>
                      </div>
                    )}
                    {event.opening_band && (
                      <div className="elc-detail-row">
                        <span className="elc-detail-label">Opening Act</span>
                        <span className="elc-detail-value" style={{ color: 'var(--blue-accent)' }}>{event.opening_band}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="elc-details">
                  {event.location && (
                    <div className="elc-detail-row">
                      <span className="elc-detail-label">Address</span>
                      <span className="elc-detail-value">{event.location}</span>
                    </div>
                  )}
                  {isROTR(event.category) ? (
                    <>
                      {event.gates_time && (
                        <div className="elc-detail-row">
                          <span className="elc-detail-label">Gates Open</span>
                          <span className="elc-detail-value">{event.gates_time}</span>
                        </div>
                      )}
                      {event.opener_time && (
                        <div className="elc-detail-row">
                          <span className="elc-detail-label">Opening Act</span>
                          <span className="elc-detail-value">{event.opener_time}</span>
                        </div>
                      )}
                      {event.headliner_time && (
                        <div className="elc-detail-row">
                          <span className="elc-detail-label">Headliner</span>
                          <span className="elc-detail-value">{event.headliner_time}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    event.time && (
                      <div className="elc-detail-row">
                        <span className="elc-detail-label">Time</span>
                        <span className="elc-detail-value">{event.time}</span>
                      </div>
                    )
                  )}
                  {event.price && (
                    <div className="elc-detail-row">
                      <span className="elc-detail-label">Admission</span>
                      <span className="elc-detail-value">{event.price}</span>
                    </div>
                  )}
                </div>

                <div className="elc-actions">
                  <Link href={`/events/${event.id}`} className="btn btn-primary btn-sm">Learn More</Link>
                  {event.ticket_url && (
                    <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
                      Get Tickets <i className="fas fa-external-link-alt" style={{ marginLeft: '0.4rem', fontSize: '0.75em' }}></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
