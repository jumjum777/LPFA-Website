'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TourScheduleToggle from '@/components/recreation/TourScheduleToggle';

interface GalleryImage {
  url: string;
  alt: string;
  sort_order: number;
}

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
  gallery_images: GalleryImage[];
}

interface TourDetail {
  icon: string;
  text: string;
}

interface TourSchedule {
  id: string;
  tour_id: string;
  year: number;
  month: string;
  month_order: number;
  dates: string[];
  source: string;
}

interface TourItem {
  id: string;
  name: string;
  section: string;
  price: string;
  description: string;
  duration?: string;
  details?: TourDetail[];
  departure_location?: string;
  event_policy?: string;
  schedules?: TourSchedule[];
}

type ModalContent =
  | { type: 'event'; data: EventItem }
  | { type: 'tour'; data: TourItem; schedules: TourSchedule[] }
  | null;

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMonthLabel(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return MONTH_NAMES[d.getMonth()];
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const isROTR = (cat: string) => cat === "Rockin' On The River";

function getNextTourDate(schedules: TourSchedule[]): string | null {
  if (!schedules || schedules.length === 0) return null;
  for (const s of schedules) {
    if (s.dates && s.dates.length > 0) return s.dates[0];
  }
  return null;
}

export default function EventsToursGrid({
  events,
  tours,
  eventCategories,
  tourSections,
}: {
  events: EventItem[];
  tours: TourItem[];
  eventCategories: string[];
  tourSections: string[];
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeMonth, setActiveMonth] = useState('All');
  const [modal, setModal] = useState<ModalContent>(null);

  const closeModal = useCallback(() => setModal(null), []);

  // Close modal on Escape
  useEffect(() => {
    if (!modal) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [modal, closeModal]);

  const isEventFilter = activeFilter === 'All' || eventCategories.includes(activeFilter);
  const isTourFilter = activeFilter === 'All' || tourSections.includes(activeFilter);

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    events.forEach(e => {
      const m = getMonthLabel(e.event_date);
      if (m) monthSet.add(m);
    });
    tours.forEach(t => {
      t.schedules?.forEach(s => {
        if (s.month) monthSet.add(s.month);
      });
    });
    return MONTH_NAMES.filter(m => monthSet.has(m));
  }, [events, tours]);

  const filteredEvents = useMemo(() => {
    if (!isEventFilter) return [];
    return events
      .filter(e => !e.is_featured)
      .filter(e => activeFilter === 'All' || e.category === activeFilter)
      .filter(e => activeMonth === 'All' || getMonthLabel(e.event_date) === activeMonth);
  }, [events, activeFilter, activeMonth, isEventFilter]);

  const filteredTours = useMemo(() => {
    if (!isTourFilter) return [];
    let result = tours;
    if (activeFilter !== 'All') {
      result = result.filter(t => t.section === activeFilter);
    }
    if (activeMonth !== 'All') {
      result = result.filter(t =>
        t.schedules?.some(s => s.month === activeMonth)
      );
    }
    return result;
  }, [tours, activeFilter, activeMonth, isTourFilter]);

  const getFilteredSchedules = (schedules: TourSchedule[]) => {
    if (activeMonth === 'All') return schedules;
    return schedules.filter(s => s.month === activeMonth);
  };

  const showEvents = isEventFilter && filteredEvents.length > 0;
  const showTours = isTourFilter && filteredTours.length > 0;
  const noResults = !showEvents && !showTours;

  return (
    <>
      {/* Filters */}
      <div className="events-filter" data-animate="fade-up">
        <button className={`filter-btn ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => setActiveFilter('All')}>All</button>
        {eventCategories.map(c => (
          <button key={c} className={`filter-btn ${activeFilter === c ? 'active' : ''}`} onClick={() => setActiveFilter(c)}>{c}</button>
        ))}
        {tourSections.map(s => (
          <button key={s} className={`filter-btn ${activeFilter === s ? 'active' : ''}`} onClick={() => setActiveFilter(s)}>{s}</button>
        ))}
      </div>

      {months.length > 1 && (
        <div className="events-filter events-filter-months" data-animate="fade-up">
          <button className={`filter-btn filter-btn-month ${activeMonth === 'All' ? 'active' : ''}`} onClick={() => setActiveMonth('All')}>All Months</button>
          {months.map(m => (
            <button key={m} className={`filter-btn filter-btn-month ${activeMonth === m ? 'active' : ''}`} onClick={() => setActiveMonth(m)}>{m}</button>
          ))}
        </div>
      )}

      {noResults && (
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.05rem', padding: '2rem 0' }}>
          No events or tours match your filters.
        </p>
      )}

      {/* Events */}
      {showEvents && (
        <>
          {isTourFilter && filteredTours.length > 0 && (
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--navy)' }} data-animate="fade-up">
              <i className="fas fa-calendar-alt" style={{ marginRight: '0.5rem', color: 'var(--blue-accent)' }}></i> Events
            </h3>
          )}
          <div className="events-list events-list-compact">
            {filteredEvents.map((event) => {
              const imgSrc = event.image_url || event.gallery_images?.[0]?.url;
              const isLogo = imgSrc ? /\/logo(-stacked)?\.png$/.test(imgSrc) : false;
              const whiteSrc = isLogo ? imgSrc!.replace(/\/logo(-stacked)?\.png$/, (_, s) => `/logo${s || ''}-white.png`) : '';

              return (
                <div key={event.id} className="event-list-card event-card-compact animated" onClick={() => setModal({ type: 'event', data: event })} style={{ cursor: 'pointer' }}>
                  {imgSrc ? (
                    <div className={`elc-compact-img${isLogo ? ' elc-compact-img-logo' : ''}`}>
                      <img src={imgSrc} alt={event.title} loading="lazy" className={isLogo ? 'logo-light' : ''} />
                      {isLogo && <img src={whiteSrc} alt={event.title} loading="lazy" className="logo-dark" />}
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
                    {event.event_date && (
                      <div className="elc-event-date">{formatDateShort(event.event_date)}</div>
                    )}
                    {!isROTR(event.category) && event.title && <h3>{event.title}</h3>}
                    {isROTR(event.category) && (event.headliner || event.opening_band) && (
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
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Tours */}
      {showTours && (
        <>
          {isEventFilter && filteredEvents.length > 0 && (
            <h3 style={{ marginTop: '3rem', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--navy)' }} data-animate="fade-up">
              <i className="fas fa-ship" style={{ marginRight: '0.5rem', color: 'var(--blue-accent)' }}></i> Boat Tours
            </h3>
          )}
          <div className="events-list events-list-compact">
            {filteredTours.map((tour) => {
              const schedules = getFilteredSchedules(tour.schedules || []);
              const nextDate = getNextTourDate(schedules);

              return (
                <div key={tour.id} className="event-list-card event-card-compact animated" onClick={() => setModal({ type: 'tour', data: tour, schedules })} style={{ cursor: 'pointer' }}>
                  <div className="elc-compact-img elc-compact-img-tour">
                    <i className="fas fa-ship"></i>
                  </div>
                  <div className="elc-body">
                    <div className="elc-body-header">
                      <span className="elc-tag elc-tag-tour">{tour.section}</span>
                    </div>
                    <h3>{tour.name}</h3>
                    {nextDate && (
                      <div className="elc-compact-next-date">
                        <i className="fas fa-calendar-alt"></i> {nextDate}
                      </div>
                    )}
                    {tour.price && <div className="elc-compact-price">{tour.price}</div>}
                    <span className="elc-read-more">Details <i className="fas fa-chevron-right"></i></span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="etg-modal-overlay" onClick={closeModal}>
          <div className="etg-modal" onClick={e => e.stopPropagation()}>
            <button className="etg-modal-close" onClick={closeModal} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>

            {modal.type === 'event' && (() => {
              const event = modal.data;
              const imgSrc = event.image_url || event.gallery_images?.[0]?.url;
              const isLogo = imgSrc ? /\/logo(-stacked)?\.png$/.test(imgSrc) : false;
              const whiteSrc = isLogo ? imgSrc!.replace(/\/logo(-stacked)?\.png$/, (_, s) => `/logo${s || ''}-white.png`) : '';

              return (
                <>
                  {imgSrc && (
                    <div className={`etg-modal-img${isLogo ? ' etg-modal-img-logo' : ''}`}>
                      <img src={imgSrc} alt={event.title} className={isLogo ? 'logo-light' : ''} />
                      {isLogo && <img src={whiteSrc} alt={event.title} className="logo-dark" />}
                    </div>
                  )}
                  <div className="etg-modal-body">
                    <span className="elc-tag" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{event.category}</span>
                    {event.event_date && (
                      <div className="elc-event-date" style={{ fontSize: '1.25rem' }}>{formatDateLong(event.event_date)}</div>
                    )}
                    {!isROTR(event.category) && event.title && <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>{event.title}</h2>}

                    {isROTR(event.category) && (event.headliner || event.opening_band) && (
                      <div className="elc-details" style={{ marginBottom: '1rem' }}>
                        {event.headliner && (
                          <div className="elc-detail-row">
                            <span className="elc-detail-label">Headliner</span>
                            <span className="elc-detail-value" style={{ color: 'var(--gold)', fontWeight: 700 }}>{event.headliner}</span>
                          </div>
                        )}
                        {event.opening_band && (
                          <div className="elc-detail-row">
                            <span className="elc-detail-label">Opening Act</span>
                            <span className="elc-detail-value" style={{ color: 'var(--blue-accent)', fontWeight: 600 }}>{event.opening_band}</span>
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

                    <div className="elc-actions" style={{ marginTop: '1.25rem' }}>
                      <Link href={`/events/${event.id}`} className="btn btn-primary btn-sm" onClick={closeModal}>Learn More</Link>
                      {event.ticket_url && (
                        <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
                          Get Tickets <i className="fas fa-external-link-alt" style={{ marginLeft: '0.4rem', fontSize: '0.75em' }}></i>
                        </a>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {modal.type === 'tour' && (() => {
              const tour = modal.data;
              const schedules = modal.schedules;

              return (
                <>
                  <div className="etg-modal-img etg-modal-img-tour">
                    <i className="fas fa-ship"></i>
                  </div>
                  <div className="etg-modal-body">
                    <span className="elc-tag elc-tag-tour" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{tour.section}</span>
                    <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>{tour.name}</h2>
                    {tour.price && <div className="tour-price" style={{ marginBottom: '1rem' }}>{tour.price}</div>}

                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)', lineHeight: 1.7, marginBottom: '1.25rem' }} dangerouslySetInnerHTML={{ __html: tour.description }} />

                    {tour.details && tour.details.length > 0 && (
                      <div className="tour-details" style={{ marginBottom: '1.25rem' }}>
                        {tour.details.map((d, i) => (
                          <div key={i} className="tour-detail">
                            <i className={d.icon}></i> {d.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {schedules.length > 0 && (
                      <TourScheduleToggle label={`${schedules[0]?.year || new Date().getFullYear()} Schedule`}>
                        {schedules.map((s) => (
                          <div key={s.id} className="tour-schedule-month">
                            <div className="tour-schedule-month-name">{s.month}</div>
                            <div className="tour-schedule-dates">
                              {s.dates.map((date, i) => (
                                <span key={i} className="tour-schedule-date">{date}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </TourScheduleToggle>
                    )}

                    {tour.event_policy && (
                      <div className="policy-note" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
                        <i className="fas fa-info-circle"></i>
                        <div>{tour.event_policy}</div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
