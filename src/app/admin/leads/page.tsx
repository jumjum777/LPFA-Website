'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string;
  organization: string | null;
  message: string;
  newsletter: boolean;
  status: string;
  notes: string | null;
  created_at: string;
}

type FilterStatus = 'all' | 'new' | 'read' | 'replied' | 'archived';

const SUBJECT_LABELS: Record<string, string> = {
  development: 'Economic Development & Financing',
  brownfields: 'Brownfields Program',
  rfp: 'RFPs & Bids',
  events: 'Events & Programming',
  'boat-tours': 'Boat Tours & Recreation',
  'facility-rental': 'Facility Rental Inquiry',
  media: 'Media & Press',
  general: 'General Inquiry',
};

const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
  development: { icon: 'fa-building', color: '#1B8BEB' },
  brownfields: { icon: 'fa-leaf', color: '#059669' },
  rfp: { icon: 'fa-file-contract', color: '#7C3AED' },
  events: { icon: 'fa-calendar-alt', color: '#D97706' },
  'boat-tours': { icon: 'fa-ship', color: '#0EA5E9' },
  'facility-rental': { icon: 'fa-warehouse', color: '#6366F1' },
  media: { icon: 'fa-newspaper', color: '#EF4444' },
  general: { icon: 'fa-envelope', color: '#64748B' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminInboxPage() {
  const [messages, setInbox] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadInbox(); }, []);

  async function loadInbox() {
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      setInbox(data.messages || []);
    } catch (err) {
      console.error('Inbox load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
    if (!error) setInbox(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function markAllRead() {
    const newMessages = messages.filter(l => l.status === 'new');
    if (newMessages.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase.from('contact_submissions').update({ status: 'read' }).eq('status', 'new');
    if (!error) setInbox(prev => prev.map(l => l.status === 'new' ? { ...l, status: 'read' } : l));
  }

  async function deleteLead(id: string) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
    if (!error) setInbox(prev => prev.filter(l => l.id !== id));
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts = {
    all: messages.length,
    new: messages.filter(l => l.status === 'new').length,
    read: messages.filter(l => l.status === 'read').length,
    replied: messages.filter(l => l.status === 'replied').length,
    archived: messages.filter(l => l.status === 'archived').length,
  };

  const filtered = messages.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.organization || '').toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        (SUBJECT_LABELS[l.subject] || l.subject).toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Inbox</h1></div>
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
          <h3 className="analytics-loading-title">Loading Inbox...</h3>
          <p className="analytics-loading-step">Fetching contact submissions...</p>
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
          <h1><i className="fas fa-inbox mr-2 text-blue"></i> Inbox</h1>
          <p>Contact form submissions from the public site.</p>
        </div>
        {counts.new > 0 && (
          <button onClick={markAllRead} className="admin-btn admin-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <i className="fas fa-check-double"></i> Mark All Read ({counts.new})
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-envelope"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Messages</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue-800"><i className="fas fa-circle-exclamation"></i></div>
          <div className="rotr-stat-value">{counts.new}</div>
          <div className="rotr-stat-label">Unread</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-reply"></i></div>
          <div className="rotr-stat-value">{counts.replied}</div>
          <div className="rotr-stat-label">Replied</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-archive"></i></div>
          <div className="rotr-stat-value">{counts.archived}</div>
          <div className="rotr-stat-label">Archived</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'new', 'read', 'replied', 'archived'] as FilterStatus[]).map(s => (
          <button key={s} className={`admin-filter-tab shrink-0${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="admin-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md relative" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
        <input type="text"
          className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
          placeholder="Search by name, email, subject, or message..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Messages Table */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-inbox"></i>
          <p>{messages.length === 0 ? 'No messages yet.' : `No ${filter === 'all' ? '' : filter + ' '}messages found.`}</p>
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Preview</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const subj = SUBJECT_ICONS[lead.subject] || SUBJECT_ICONS.general;
                const isNew = lead.status === 'new';
                return (
                  <tr key={lead.id} style={isNew ? { background: 'rgba(27, 139, 235, 0.04)' } : lead.status === 'archived' ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`admin-lead-avatar ${isNew ? 'is-new' : 'is-read'}`}>
                          {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/leads/${lead.id}`} style={{ fontWeight: isNew ? 700 : 500, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            {lead.first_name} {lead.last_name}
                          </Link>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {lead.email}
                            {lead.organization && <> &middot; {lead.organization}</>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ whiteSpace: 'nowrap' }}>
                        <i className={`fas ${subj.icon}`} style={{ color: subj.color, fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.85rem', fontWeight: isNew ? 600 : 400 }}>
                          {SUBJECT_LABELS[lead.subject] || lead.subject}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500 dark:text-slate-400" style={{
                        display: 'block', maxWidth: '220px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontWeight: isNew ? 500 : 400,
                      }}>
                        {lead.message}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#94a3b8' }}>
                      {timeAgo(lead.created_at)}
                    </td>
                    <td>
                      <span className={`admin-status-pill status-${lead.status}`}>
                        {isNew && <i className="fas fa-circle mr-1" style={{ fontSize: '0.45rem', verticalAlign: 'middle' }}></i>}
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ gap: '0.3rem' }}>
                        <Link href={`/admin/leads/${lead.id}`} className="admin-btn-icon" title="View">
                          <i className="fas fa-eye"></i>
                        </Link>
                        {isNew && (
                          <button onClick={() => updateStatus(lead.id, 'read')} className="admin-btn-icon" title="Mark Read">
                            <i className="fas fa-envelope-open"></i>
                          </button>
                        )}
                        {lead.status !== 'archived' && (
                          <button onClick={() => updateStatus(lead.id, 'archived')} className="admin-btn-icon" title="Archive">
                            <i className="fas fa-archive"></i>
                          </button>
                        )}
                        <button onClick={() => deleteLead(lead.id)} className="admin-btn-icon danger" title="Delete">
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
}
