'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

function getStatusClass(status: string) {
  switch (status) {
    case 'new': return 'lead-new';
    case 'read': return 'lead-read';
    case 'replied': return 'lead-replied';
    case 'archived': return 'lead-archived';
    default: return 'lead-new';
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AdminInboxPage() {
  const [messages, setInbox] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    loadInbox();
  }, []);

  async function loadInbox() {
    const supabase = createClient();
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setInbox(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setInbox(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    }
  }

  async function markAllRead() {
    const newMessages = messages.filter(l => l.status === 'new');
    if (newMessages.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status: 'read' })
      .eq('status', 'new');
    if (!error) {
      setInbox(prev => prev.map(l => l.status === 'new' ? { ...l, status: 'read' } : l));
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);
    if (!error) {
      setInbox(prev => prev.filter(l => l.id !== id));
    }
  }

  const filtered = filter === 'all' ? messages : messages.filter(l => l.status === filter);

  const counts = {
    all: messages.length,
    new: messages.filter(l => l.status === 'new').length,
    read: messages.filter(l => l.status === 'read').length,
    replied: messages.filter(l => l.status === 'replied').length,
    archived: messages.filter(l => l.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Inbox</h1>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Inbox</h1>
          <p>Contact form submissions from the public site.</p>
        </div>
        {counts.new > 0 && (
          <button onClick={markAllRead} className="admin-btn" style={{ whiteSpace: 'nowrap' }}>
            <i className="fas fa-check-double"></i> Mark All as Read ({counts.new})
          </button>
        )}
      </div>

      <div className="admin-filter-tabs">
        {(['all', 'new', 'read', 'replied', 'archived'] as FilterStatus[]).map(s => (
          <button
            key={s}
            className={`admin-filter-tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="admin-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }}></i>
          <p>No {filter === 'all' ? '' : filter + ' '}messages found.</p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className={lead.status === 'new' ? 'lead-row-new' : ''}>
                  <td>
                    <Link href={`/admin/leads/${lead.id}`} style={{ fontWeight: lead.status === 'new' ? 700 : 400 }}>
                      {lead.first_name} {lead.last_name}
                    </Link>
                    {lead.organization && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>{lead.organization}</span>
                    )}
                  </td>
                  <td><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                  <td>{SUBJECT_LABELS[lead.subject] || lead.subject}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(lead.created_at)}</td>
                  <td>
                    <select
                      className={`admin-status-select ${getStatusClass(lead.status)}`}
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/leads/${lead.id}`} className="admin-btn-icon" title="View">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button onClick={() => deleteLead(lead.id)} className="admin-btn-icon danger" title="Delete">
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
