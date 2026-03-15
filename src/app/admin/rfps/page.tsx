'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RFP {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'new' | 'open' | 'closed' | 'archived';
  posted_date: string;
  deadline_date: string | null;
  location: string;
  document_url: string | null;
  created_at: string;
}

type FilterStatus = 'all' | 'new' | 'open' | 'closed' | 'archived';

function statusBadgeClass(status: string) {
  switch (status) {
    case 'new': return 'rfp-admin-new';
    case 'open': return 'rfp-admin-open';
    case 'closed': return 'rfp-admin-closed';
    case 'archived': return 'rfp-admin-archived';
    default: return '';
  }
}

export default function AdminRFPsPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    loadRFPs();
  }, []);

  async function loadRFPs() {
    try {
      const res = await fetch('/api/admin/rfps');
      const data = await res.json();
      setRfps(data.rfps || []);
    } catch (err) {
      console.error('RFPs load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRFP(id: string) {
    if (!confirm('Are you sure you want to delete this RFP?')) return;
    const supabase = createClient();
    await supabase.from('rfps').delete().eq('id', id);
    setRfps(rfps.filter(r => r.id !== id));
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase.from('rfps').update({ status }).eq('id', id);
    if (!error) {
      setRfps(rfps.map(r => r.id === id ? { ...r, status: status as RFP['status'] } : r));
    }
  }

  const filtered = filter === 'all' ? rfps : rfps.filter(r => r.status === filter);
  const counts = {
    all: rfps.length,
    new: rfps.filter(r => r.status === 'new').length,
    open: rfps.filter(r => r.status === 'open').length,
    closed: rfps.filter(r => r.status === 'closed').length,
    archived: rfps.filter(r => r.status === 'archived').length,
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>RFPs &amp; Bids</h1>
          <p>Manage requests for proposals and bid listings.</p>
        </div>
        <Link href="/admin/rfps/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New RFP
        </Link>
      </div>

      <div className="admin-filter-tabs">
        {(['all', 'new', 'open', 'closed', 'archived'] as FilterStatus[]).map(s => (
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

      {loading ? (
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
          <h3 className="analytics-loading-title">Loading RFPs...</h3>
          <p className="analytics-loading-step">Fetching proposals and bids...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-file-contract" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }}></i>
          <p>No {filter === 'all' ? '' : filter + ' '}RFPs found.</p>
          <Link href="/admin/rfps/new" className="admin-btn admin-btn-primary">Create First RFP</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Deadline</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rfp => (
                <tr key={rfp.id} style={rfp.status === 'archived' ? { opacity: 0.5 } : undefined}>
                  <td>
                    <Link href={`/admin/rfps/${rfp.id}`} style={{ fontWeight: 600 }}>
                      <i className={`fas ${rfp.icon}`} style={{ marginRight: '0.5rem', color: 'var(--gray-400)' }}></i>
                      {rfp.title}
                    </Link>
                  </td>
                  <td>
                    <select
                      className={`admin-status-select ${statusBadgeClass(rfp.status)}`}
                      value={rfp.status}
                      onChange={(e) => updateStatus(rfp.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(rfp.posted_date + 'T00:00:00').toLocaleDateString()}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {rfp.deadline_date
                      ? new Date(rfp.deadline_date + 'T00:00:00').toLocaleDateString()
                      : <span style={{ color: 'var(--gray-400)' }}>—</span>
                    }
                  </td>
                  <td>
                    {rfp.document_url ? (
                      <a href={rfp.document_url} target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View Document">
                        <i className="fas fa-file-pdf"></i>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/rfps/${rfp.id}`} className="admin-btn-icon" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => deleteRFP(rfp.id)} className="admin-btn-icon danger" title="Delete">
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
