'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SPECIES, BITE_RATINGS } from '@/lib/fishing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Catch {
  id: string;
  angler_name: string;
  display_name: string | null;
  species: string;
  weight_lbs: number | null;
  length_inches: number | null;
  catch_date: string;
  location_name: string;
  bait_used: string | null;
  fishing_method: string | null;
  depth_range: string | null;
  bite_rating: number | null;
  quantity_kept: number | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  user_id: string | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#D97706' },
  approved: { bg: '#d1fae5', color: '#059669' },
  rejected: { bg: '#fee2e2', color: '#DC2626' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function speciesName(id: string): string {
  return SPECIES.find(s => s.id === id)?.name || id;
}

function speciesColor(id: string): string {
  return SPECIES.find(s => s.id === id)?.color || '#64748b';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
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

function getBiteLabel(rating: number | null): string {
  if (!rating) return '—';
  return BITE_RATINGS.find(r => r.value === rating)?.label.split(' — ')[1] || `${rating}/5`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminFishingPage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadCatches(); }, []);

  async function loadCatches() {
    const supabase = createClient();
    const { data } = await supabase.from('fishing_catches').select('*').order('created_at', { ascending: false });
    setCatches(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('fishing_catches')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) setCatches(prev => prev.map(c => c.id === id ? { ...c, status, reviewed_at: new Date().toISOString() } : c));
  }

  async function deleteCatch(id: string) {
    if (!confirm('Are you sure you want to delete this catch submission?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('fishing_catches').delete().eq('id', id);
    if (!error) setCatches(prev => prev.filter(c => c.id !== id));
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts = {
    all: catches.length,
    pending: catches.filter(c => c.status === 'pending').length,
    approved: catches.filter(c => c.status === 'approved').length,
    rejected: catches.filter(c => c.status === 'rejected').length,
  };

  const filtered = catches.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.display_name || c.angler_name).toLowerCase().includes(q) ||
        speciesName(c.species).toLowerCase().includes(q) ||
        c.species.toLowerCase().includes(q) ||
        c.location_name.toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Fishing</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading catch data...</p>
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
          <h1><i className="fas fa-fish mr-2 text-blue"></i> Fishing</h1>
          <p>Community catch reports and fishing data. New submissions are auto-approved.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-fish"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Catches</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}><i className="fas fa-check-circle"></i></div>
          <div className="rotr-stat-value">{counts.approved}</div>
          <div className="rotr-stat-label">Approved</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}><i className="fas fa-ban"></i></div>
          <div className="rotr-stat-value">{counts.rejected}</div>
          <div className="rotr-stat-label">Rejected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(s => (
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
          placeholder="Search by angler name or species..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Catches Table */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-fish"></i>
          <p>{catches.length === 0 ? 'No catch submissions yet.' : `No ${filter === 'all' ? '' : filter + ' '}catches found.`}</p>
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Angler</th>
                <th>Weight</th>
                <th>Bait / Method</th>
                <th>Bite</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const sc = STATUS_COLORS[c.status] || STATUS_COLORS.pending;
                const isPending = c.status === 'pending';
                return (
                  <tr key={c.id} style={isPending ? { background: 'rgba(217, 119, 6, 0.04)' } : c.status === 'rejected' ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ whiteSpace: 'nowrap' }}>
                        <i className="fas fa-fish" style={{ color: speciesColor(c.species), fontSize: '0.75rem' }}></i>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {speciesName(c.species)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {c.display_name || c.angler_name}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {c.weight_lbs ? `${c.weight_lbs} lbs` : '—'}
                      {c.length_inches ? <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block' }}>{c.length_inches}&quot;</span> : null}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div>{c.bait_used || '—'}</div>
                      {c.fishing_method && <div className="text-xs text-slate-400 dark:text-slate-500">{c.fishing_method}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {c.bite_rating ? (
                        <span style={{ color: c.bite_rating >= 4 ? '#059669' : c.bite_rating >= 3 ? '#D97706' : '#94a3b8' }}>
                          {c.bite_rating}/5
                          <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block' }}>{getBiteLabel(c.bite_rating)}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="text-sm text-slate-600 dark:text-slate-300" style={{
                        display: 'block', maxWidth: '160px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.location_name}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#94a3b8' }}>
                      {c.catch_date ? formatDate(c.catch_date) : timeAgo(c.created_at)}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ gap: '0.3rem' }}>
                        {c.status !== 'approved' && (
                          <button onClick={() => updateStatus(c.id, 'approved')} className="admin-btn-icon" title="Approve" style={{ color: '#059669' }}>
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button onClick={() => updateStatus(c.id, 'rejected')} className="admin-btn-icon" title="Reject" style={{ color: '#DC2626' }}>
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                        <button onClick={() => deleteCatch(c.id)} className="admin-btn-icon danger" title="Delete">
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
