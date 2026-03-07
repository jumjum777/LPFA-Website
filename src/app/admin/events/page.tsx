'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/types';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const supabase = createClient();
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (error) console.error('Error loading events:', error);
    setEvents(data || []);
    setLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('events').update({ is_published: !current }).eq('id', id);
    setEvents(events.map(e => e.id === id ? { ...e, is_published: !current } : e));
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Events</h1>
          <p>Manage events and calendar listings.</p>
        </div>
        <Link href="/admin/events/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Event
        </Link>
      </div>

      {loading ? <p>Loading...</p> : events.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-calendar-alt"></i>
          <p>No events yet.</p>
          <Link href="/admin/events/new" className="admin-btn admin-btn-primary">Create First Event</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Featured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td><Link href={`/admin/events/${event.id}`}>{event.category === "Rockin' On The River" ? [event.headliner, event.opening_band].filter(Boolean).join(' / ') || 'Untitled ROTR' : event.title}</Link></td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="admin-badge">{event.category}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td>{event.is_featured ? <i className="fas fa-star" style={{ color: '#D97706' }}></i> : '—'}</td>
                  <td>
                    <button
                      className={`admin-status-badge ${event.is_published ? 'published' : 'draft'}`}
                      onClick={() => togglePublished(event.id, event.is_published)}
                    >
                      {event.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <a href="/events" target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View on site">
                        <i className="fas fa-external-link-alt"></i>
                      </a>
                      <Link href={`/admin/events/${event.id}`} className="admin-btn-icon" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => deleteEvent(event.id)} className="admin-btn-icon danger" title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
