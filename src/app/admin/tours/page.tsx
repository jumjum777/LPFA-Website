'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tour } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type TourFilter = 'all' | 'published' | 'hidden' | 'peekpro' | 'manual';

const FILTER_LABELS: Record<TourFilter, string> = {
  all: 'All',
  published: 'Published',
  hidden: 'Hidden',
  peekpro: 'PeekPro',
  manual: 'Manual',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [filter, setFilter] = useState<TourFilter>('all');
  const [search, setSearch] = useState('');

  async function loadTours() {
    try {
      const res = await fetch('/api/admin/tours');
      const data = await res.json();
      setTours(data.tours || []);
    } catch (err) {
      console.error('Tours load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTours(); }, []);

  async function syncFromPeekPro() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/peekpro/sync');
      const data = await res.json();
      if (data.success) {
        const parts: string[] = [];
        if (data.products?.created) parts.push(`${data.products.created} new tour(s) imported`);
        if (data.products?.updated) parts.push(`${data.products.updated} tour(s) updated`);
        if (data.schedules?.synced) parts.push(`${data.schedules.synced} schedule(s) synced`);
        setSyncMessage(parts.length ? parts.join(', ') : 'Everything is up to date');
        loadTours();
      } else {
        setSyncMessage(data.error || data.message || 'Sync completed');
      }
    } catch {
      setSyncMessage('Sync failed — check console for details');
    } finally {
      setSyncing(false);
    }
  }

  async function deleteTour(id: string) {
    if (!confirm('Delete this tour?')) return;
    const supabase = createClient();
    await supabase.from('tours').delete().eq('id', id);
    setTours(tours.filter(t => t.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('tours').update({ is_published: !current }).eq('id', id);
    setTours(tours.map(t => t.id === id ? { ...t, is_published: !current } : t));
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<TourFilter, number> = {
    all: tours.length,
    published: tours.filter(t => t.is_published).length,
    hidden: tours.filter(t => !t.is_published).length,
    peekpro: tours.filter(t => !!t.peekpro_product_id).length,
    manual: tours.filter(t => !t.peekpro_product_id).length,
  };

  const categories = [...new Set(tours.map(t => t.section).filter(Boolean))];

  const filtered = tours.filter(t => {
    if (filter === 'published' && !t.is_published) return false;
    if (filter === 'hidden' && t.is_published) return false;
    if (filter === 'peekpro' && !t.peekpro_product_id) return false;
    if (filter === 'manual' && !!t.peekpro_product_id) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.section.toLowerCase().includes(q) || (t.price || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Boat Tours</h1></div>
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
          <h3 className="analytics-loading-title">Loading Tours...</h3>
          <p className="analytics-loading-step">Fetching boat tour listings...</p>
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
          <h1><i className="fas fa-ship mr-2 text-blue"></i> Boat Tours</h1>
          <p>Manage tour listings and schedules.</p>
        </div>
        <div className="admin-header-actions">
          <button onClick={syncFromPeekPro} disabled={syncing} className="admin-btn admin-btn-secondary" title="Pull tours & schedules from PeekPro">
            <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
            {syncing ? ' Syncing...' : ' Sync PeekPro'}
          </button>
          <Link href="/admin/tours/new" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> New Tour
          </Link>
        </div>
      </div>

      {/* Sync message */}
      {syncMessage && (
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '1rem',
          background: syncMessage.includes('failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${syncMessage.includes('failed') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          borderRadius: '0.5rem', fontSize: '0.88rem',
          color: syncMessage.includes('failed') ? '#dc2626' : '#059669',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <i className={`fas ${syncMessage.includes('failed') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="rotr-stats-row mb-5">
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-ship"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Tours</div>
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
        {categories.length > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-tags"></i></div>
            <div className="rotr-stat-value">{categories.length}</div>
            <div className="rotr-stat-label">Categories</div>
          </div>
        )}
        {counts.peekpro > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-link"></i></div>
            <div className="rotr-stat-value">{counts.peekpro}</div>
            <div className="rotr-stat-label">PeekPro Linked</div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'published', 'hidden', 'peekpro', 'manual'] as TourFilter[]).map(s => (
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
          placeholder="Search by name, category, or price..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tours List */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-ship"></i>
          <p>{tours.length === 0 ? 'No tours yet. Create your first one!' : `No ${filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase() + ' '}tours found.`}</p>
          {tours.length === 0 && (
            <Link href="/admin/tours/new" className="admin-btn admin-btn-primary">Create First Tour</Link>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tour</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Source</th>
                <th>Live on Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tour => {
                const dimmed = !tour.is_published;
                return (
                  <tr key={tour.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="admin-tour-icon">
                          <i className="fas fa-anchor"></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/tours/${tour.id}`} className="font-medium" style={dimmed ? { color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' } : { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                            {tour.name}
                          </Link>
                          {tour.departure_location && (
                            <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                              <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}></i>
                              {tour.departure_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}><span className="admin-badge">{tour.section}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{tour.price || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{tour.duration || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {tour.peekpro_product_id ? (
                        <span className="admin-badge" style={{ background: '#059669', color: '#fff', fontSize: '0.65rem' }}>
                          <i className="fas fa-link" style={{ marginRight: '0.25rem' }}></i>PeekPro
                        </span>
                      ) : (
                        <span className="admin-badge" style={{ background: '#1B8BEB', color: '#fff', fontSize: '0.65rem' }}>Manual</span>
                      )}
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <div
                          onClick={() => togglePublished(tour.id, tour.is_published)}
                          style={{
                            width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                            background: tour.is_published ? '#16a34a' : '#374151', transition: 'background 0.2s', cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '0.175rem',
                            left: tour.is_published ? '1.3rem' : '0.2rem',
                            transition: 'left 0.2s',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: tour.is_published ? '#16a34a' : '#94a3b8' }}>
                          {tour.is_published ? 'Live' : 'Hidden'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link href={`/admin/tours/${tour.id}`} className="admin-btn-icon" title="Edit">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button onClick={() => deleteTour(tour.id)} className="admin-btn-icon danger" title="Delete">
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
