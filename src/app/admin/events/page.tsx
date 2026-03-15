'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

type EventFilter = 'all' | 'published' | 'hidden' | 'featured' | 'wix' | 'manual';

const FILTER_LABELS: Record<EventFilter, string> = {
  all: 'All',
  published: 'Published',
  hidden: 'Hidden',
  featured: 'Featured',
  wix: 'Wix',
  manual: 'Manual',
};

function formatEventDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function getEventTitle(event: Event): string {
  if (event.category === "Rockin' On The River") {
    return [event.headliner, event.opening_band].filter(Boolean).join(' / ') || event.title || 'Untitled ROTR';
  }
  return event.title;
}

// ─── Year Grouping ────────────────────────────────────────────────────────────

function groupEventsByYear(events: Event[]): { year: number; events: Event[] }[] {
  const map = new Map<number, Event[]>();
  for (const e of events) {
    const year = e.event_date ? new Date(e.event_date + 'T00:00:00').getFullYear() : 0;
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return b - a;
    })
    .map(([year, events]) => ({ year, events }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; new: number; updated: number; errors?: string[]; message?: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<EventFilter>('all');
  const [search, setSearch] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Events load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  async function syncFromWix() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch('/api/admin/events/sync-wix', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        setSyncError(result.message || `Sync failed (${res.status}). ${result.errors?.join('. ') || ''}`);
      } else {
        setSyncResult(result);
      }
      await loadEvents();
    } catch (err) {
      console.error('Wix sync failed:', err);
      setSyncError('Could not reach the sync endpoint. Check the server console.');
    }
    setSyncing(false);
  }

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Auto-sync from Wix on page load
  useEffect(() => {
    syncFromWix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteEvent(id: string, isWix: boolean) {
    const msg = isWix
      ? 'This event is synced from Wix. Delete will remove the local copy — it may re-sync next time. Continue?'
      : 'Delete this event?';
    if (!confirm(msg)) return;
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('events').update({ is_published: !current }).eq('id', id);
    setEvents(events.map(e => e.id === id ? { ...e, is_published: !current } : e));
  }

  function toggleYear(year: number) {
    setCollapsedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  // Auto-collapse past years once events load
  useEffect(() => {
    if (events.length > 0) {
      const years = groupEventsByYear(events);
      const pastYears = years.filter(g => g.year !== currentYear && g.year !== 0).map(g => g.year);
      setCollapsedYears(new Set(pastYears));
    }
  }, [events.length]);

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<EventFilter, number> = {
    all: events.length,
    published: events.filter(e => e.is_published).length,
    hidden: events.filter(e => !e.is_published).length,
    featured: events.filter(e => e.is_featured).length,
    wix: events.filter(e => !!e.wix_event_id).length,
    manual: events.filter(e => !e.wix_event_id).length,
  };

  // Apply filter & search to get the events we'll display
  const filteredEvents = events.filter(e => {
    // Filter
    if (filter === 'published' && !e.is_published) return false;
    if (filter === 'hidden' && e.is_published) return false;
    if (filter === 'featured' && !e.is_featured) return false;
    if (filter === 'wix' && !e.wix_event_id) return false;
    if (filter === 'manual' && !!e.wix_event_id) return false;
    // Search
    if (search) {
      const q = search.toLowerCase();
      const title = getEventTitle(e).toLowerCase();
      return title.includes(q) || e.category.toLowerCase().includes(q) || (e.location || '').toLowerCase().includes(q);
    }
    return true;
  });

  const yearGroups = groupEventsByYear(filteredEvents);

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Events</h1></div>
        <div className="analytics-loading-card">
          <div className="lighthouse-loading-scene">
            <div className="lighthouse-beam"></div>
            <div className="lighthouse-tower">
              <div className="lighthouse-lamp"></div>
              <div className="lighthouse-top"></div>
              <div className="lighthouse-body">
                <div className="lighthouse-stripe"></div>
                <div className="lighthouse-stripe"></div>
              </div>
              <div className="lighthouse-base"></div>
            </div>
            <div className="lighthouse-water">
              <div className="analytics-water-wave analytics-water-wave-1"></div>
              <div className="analytics-water-wave analytics-water-wave-2"></div>
            </div>
          </div>
          <h3 className="analytics-loading-title">Loading Events...</h3>
          <p className="analytics-loading-step">Fetching event calendar...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1><i className="fas fa-calendar-alt mr-2 text-blue"></i> Events</h1>
          <p>Manage events and calendar listings.</p>
        </div>
        <div className="admin-header-actions">
          <button onClick={syncFromWix} className="admin-btn admin-btn-secondary" disabled={syncing}>
            {syncing ? (
              <><i className="fas fa-spinner fa-spin"></i> Syncing...</>
            ) : (
              <><i className="fas fa-sync-alt"></i> Sync from Wix</>
            )}
          </button>
          <Link href="/admin/events/new" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> New Event
          </Link>
        </div>
      </div>

      {/* Sync error banner */}
      {syncError && (
        <div style={{ marginBottom: '1rem', background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{syncError}</span>
          <button onClick={() => setSyncError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Sync results banner */}
      {syncResult && (
        <div className="admin-alert admin-alert-info" style={{ marginBottom: '1rem' }}>
          <i className={`fas ${syncResult.new > 0 || syncResult.updated > 0 ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
          <span>
            {syncResult.new > 0 || syncResult.updated > 0 ? (
              <>
                Wix sync complete: {syncResult.new > 0 && `${syncResult.new} new event${syncResult.new !== 1 ? 's' : ''} imported`}
                {syncResult.new > 0 && syncResult.updated > 0 && ', '}
                {syncResult.updated > 0 && `${syncResult.updated} updated`}.
                {syncResult.new > 0 && ' New events are hidden by default — toggle them to Published to show on the website.'}
              </>
            ) : syncResult.synced > 0 ? (
              <>Wix sync complete — {syncResult.synced} event{syncResult.synced !== 1 ? 's' : ''} checked, all up to date.</>
            ) : (
              <>{syncResult.message || 'No events found from Wix.'}</>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <> ({syncResult.errors.length} error{syncResult.errors.length !== 1 ? 's' : ''}: {syncResult.errors[0]})</>
            )}
          </span>
          <button onClick={() => setSyncResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="rotr-stats-row mb-5">
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-calendar-alt"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Events</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-check-circle"></i></div>
          <div className="rotr-stat-value">{counts.published}</div>
          <div className="rotr-stat-label">Published</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-eye-slash"></i></div>
          <div className="rotr-stat-value">{counts.hidden}</div>
          <div className="rotr-stat-label">Hidden</div>
        </div>
        {counts.featured > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-star"></i></div>
            <div className="rotr-stat-value">{counts.featured}</div>
            <div className="rotr-stat-label">Featured</div>
          </div>
        )}
        {counts.wix > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-purple-50/10 text-purple-800"><i className="fas fa-link"></i></div>
            <div className="rotr-stat-value">{counts.wix}</div>
            <div className="rotr-stat-label">From Wix</div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'published', 'hidden', 'featured', 'wix', 'manual'] as EventFilter[]).map(s => (
          <button key={s} className={`admin-filter-tab shrink-0${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {FILTER_LABELS[s]}
            <span className="admin-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="my-4 max-w-md relative">
        <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
        <input type="text"
          className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
          placeholder="Search by title, category, or location..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-calendar-alt"></i>
          <p>{events.length === 0 ? 'No events yet. Create your first one!' : `No ${filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase() + ' '}events found.`}</p>
          {events.length === 0 && (
            <Link href="/admin/events/new" className="admin-btn admin-btn-primary">Create First Event</Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {yearGroups.map(({ year, events: yearEvents }) => {
            const isCollapsed = collapsedYears.has(year);
            const label = year === 0 ? 'No Date' : String(year);
            const publishedCount = yearEvents.filter(e => e.is_published).length;
            return (
              <div key={year} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleYear(year)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'inherit', fontSize: '1rem', fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'}`} style={{ fontSize: '0.75rem', width: '0.75rem' }}></i>
                  <span>{label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>
                    {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''} &middot; {publishedCount} live
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="admin-table-wrap" style={{ borderTop: 'none', borderRadius: 0 }}>
                    <table className="admin-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Source</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Featured</th>
                          <th>Live on Site</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...yearEvents].sort((a, b) => {
                          if (a.is_published !== b.is_published) return a.is_published ? -1 : 1;
                          return 0;
                        }).map(event => {
                          const isWix = !!event.wix_event_id;
                          const dimmed = !event.is_published;
                          const title = getEventTitle(event);
                          return (
                            <tr key={event.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                              <td>
                                <div className="flex items-center gap-3">
                                  {event.image_url ? (
                                    <img
                                      src={event.image_url}
                                      alt=""
                                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                    />
                                  ) : (
                                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', fontSize: '0.9rem' }}>
                                      <i className="fas fa-calendar-day"></i>
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    <Link href={`/admin/events/${event.id}`} className="font-medium" style={dimmed ? { color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' } : { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                                      {title}
                                    </Link>
                                    {event.location && (
                                      <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                                        <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}></i>
                                        {event.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                {isWix ? (
                                  <span className="admin-badge" style={{ background: '#5B21B6', color: '#fff', fontSize: '0.65rem' }}>
                                    <i className="fas fa-link" style={{ marginRight: '0.25rem' }}></i>Wix
                                  </span>
                                ) : (
                                  <span className="admin-badge" style={{ background: '#1B8BEB', color: '#fff', fontSize: '0.65rem' }}>Manual</span>
                                )}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}><span className="admin-badge">{event.category}</span></td>
                              <td style={{ whiteSpace: 'nowrap' }}>{event.event_date ? formatEventDate(event.event_date) : '—'}</td>
                              <td>{event.is_featured ? <i className="fas fa-star" style={{ color: '#D97706' }}></i> : '—'}</td>
                              <td>
                                <label className="admin-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <div
                                    onClick={() => togglePublished(event.id, event.is_published)}
                                    style={{
                                      width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                                      background: event.is_published ? '#16a34a' : '#374151', transition: 'background 0.2s', cursor: 'pointer',
                                    }}
                                  >
                                    <div style={{
                                      width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                                      position: 'absolute', top: '0.175rem',
                                      left: event.is_published ? '1.3rem' : '0.2rem',
                                      transition: 'left 0.2s',
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: event.is_published ? '#16a34a' : '#94a3b8' }}>
                                    {event.is_published ? 'Live' : 'Hidden'}
                                  </span>
                                </label>
                              </td>
                              <td>
                                <div className="admin-actions">
                                  <a href="/events" target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View on site">
                                    <i className="fas fa-external-link-alt"></i>
                                  </a>
                                  <Link href={`/admin/events/${event.id}`} className="admin-btn-icon" title="Edit">
                                    <i className="fas fa-edit"></i>
                                  </Link>
                                  <button onClick={() => deleteEvent(event.id, isWix)} className="admin-btn-icon danger" title="Delete">
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
