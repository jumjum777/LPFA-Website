'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/types';

const currentYear = new Date().getFullYear();

function groupEventsByYear(events: Event[]): { year: number; events: Event[] }[] {
  const map = new Map<number, Event[]>();
  for (const e of events) {
    const year = e.event_date ? new Date(e.event_date + 'T00:00:00').getFullYear() : 0;
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(e);
  }
  // Sort years descending (current year first), undated (0) at the bottom
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return b - a;
    })
    .map(([year, events]) => ({ year, events }));
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; new: number; updated: number; errors?: string[]; message?: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  const loadEvents = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (error) console.error('Error loading events:', error);
    setEvents(data || []);
    setLoading(false);
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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
  }, [events.length]); // Only run when count changes (initial load / after sync)

  const yearGroups = groupEventsByYear(events);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Events</h1>
          <p>Manage events and calendar listings.</p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={syncFromWix}
            className="admin-btn admin-btn-secondary"
            disabled={syncing}
          >
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
        <div className="admin-alert" style={{ marginBottom: '1rem', background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

      {loading ? <p>Loading...</p> : events.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-calendar-alt"></i>
          <p>No events yet.</p>
          <Link href="/admin/events/new" className="admin-btn admin-btn-primary">Create First Event</Link>
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
                  <div className="admin-table-wrap">
                    <table className="admin-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr>
                          <th>Title</th>
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
                          return 0; // preserve date order within each group
                        }).map(event => {
                          const isWix = !!event.wix_event_id;
                          const dimmed = !event.is_published;
                          return (
                            <tr key={event.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                              <td>
                                <Link href={`/admin/events/${event.id}`} style={dimmed ? { color: '#94a3b8' } : undefined}>
                                  {event.category === "Rockin' On The River"
                                    ? [event.headliner, event.opening_band].filter(Boolean).join(' / ') || event.title || 'Untitled ROTR'
                                    : event.title}
                                </Link>
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
                              <td style={{ whiteSpace: 'nowrap' }}>{event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—'}</td>
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
