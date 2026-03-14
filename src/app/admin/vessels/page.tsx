'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VesselRecord } from '@/lib/vessels';

// ─── Constants ────────────────────────────────────────────────────────────────

type VesselFilter = 'active' | 'all' | 'en_route' | 'in_port' | 'departed';

const FILTER_LABELS: Record<VesselFilter, string> = {
  active: 'Active',
  all: 'All History',
  en_route: 'En Route',
  in_port: 'In Port',
  departed: 'Departed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: string | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/New_York',
  });
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'en_route': return 'scheduled';
    case 'in_port': return 'published';
    case 'departed':
    case 'expired': return 'draft';
    default: return 'draft';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'en_route': return 'En Route';
    case 'in_port': return 'In Port';
    case 'departed': return 'Departed';
    case 'expired': return 'Expired';
    default: return status;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'en_route': return 'fa-route';
    case 'in_port': return 'fa-anchor';
    case 'departed': return 'fa-arrow-right-from-bracket';
    case 'expired': return 'fa-clock';
    default: return 'fa-question';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminVesselsPage() {
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [allVessels, setAllVessels] = useState<VesselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VesselFilter>('active');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadVessels(); }, []);

  async function loadVessels() {
    const supabase = createClient();
    const { data } = await supabase
      .from('vessel_traffic')
      .select('*')
      .order('last_seen_at', { ascending: false });
    setAllVessels(data || []);
    setVessels(data || []);
    setLoading(false);
  }

  async function toggleActive(vessel: VesselRecord) {
    const supabase = createClient();
    await supabase.from('vessel_traffic').update({ is_active: !vessel.is_active }).eq('id', vessel.id);
    setAllVessels(prev => prev.map(v => v.id === vessel.id ? { ...v, is_active: !v.is_active } : v));
  }

  async function updateStatus(vessel: VesselRecord, status: string) {
    const supabase = createClient();
    await supabase.from('vessel_traffic').update({ status }).eq('id', vessel.id);
    setAllVessels(prev => prev.map(v => v.id === vessel.id ? { ...v, status } : v));
  }

  async function triggerSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/vessels/sync', { headers: { 'x-cron-secret': 'manual' } });
      const data = await res.json();
      alert(`Sync complete: ${data.vessels_found || 0} found, ${data.vessels_upserted || 0} updated`);
      loadVessels();
    } catch {
      alert('Sync failed — check console');
    }
    setSyncing(false);
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts = {
    active: allVessels.filter(v => v.is_active).length,
    all: allVessels.length,
    en_route: allVessels.filter(v => v.status === 'en_route').length,
    in_port: allVessels.filter(v => v.status === 'in_port').length,
    departed: allVessels.filter(v => v.status === 'departed' || v.status === 'expired').length,
  };

  const filtered = allVessels.filter(v => {
    if (filter === 'active' && !v.is_active) return false;
    if (filter === 'en_route' && v.status !== 'en_route') return false;
    if (filter === 'in_port' && v.status !== 'in_port') return false;
    if (filter === 'departed' && v.status !== 'departed' && v.status !== 'expired') return false;
    if (search) {
      const q = search.toLowerCase();
      return (v.vessel_name || '').toLowerCase().includes(q) ||
        v.mmsi.toLowerCase().includes(q) ||
        (v.destination || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Vessel Traffic</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading vessel data...</p>
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
          <h1><i className="fas fa-ship mr-2 text-blue"></i> Vessel Traffic</h1>
          <p>Monitor vessels heading to Port Lorain via AIS data.</p>
        </div>
        <button onClick={triggerSync} disabled={syncing} className="admin-btn admin-btn-secondary">
          {syncing ? <><i className="fas fa-spinner fa-spin"></i> Syncing...</> : <><i className="fas fa-sync-alt"></i> Sync Now</>}
        </button>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-ship"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Vessels</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-anchor"></i></div>
          <div className="rotr-stat-value">{counts.in_port}</div>
          <div className="rotr-stat-label">In Port</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-route"></i></div>
          <div className="rotr-stat-value">{counts.en_route}</div>
          <div className="rotr-stat-label">En Route</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-arrow-right-from-bracket"></i></div>
          <div className="rotr-stat-value">{counts.departed}</div>
          <div className="rotr-stat-label">Departed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['active', 'all', 'en_route', 'in_port', 'departed'] as VesselFilter[]).map(s => (
          <button key={s} className={`admin-filter-tab shrink-0${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {FILTER_LABELS[s]}
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
          placeholder="Search by vessel name, MMSI, or destination..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Vessel Table */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-ship"></i>
          <p>{allVessels.length === 0 ? 'No vessels detected yet.' : `No ${filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase() + ' '}vessels found.`}</p>
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vessel</th>
                <th>Destination</th>
                <th>Status</th>
                <th>ETA</th>
                <th>First Detected</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(vessel => {
                const dimmed = !vessel.is_active;
                return (
                  <tr key={vessel.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: vessel.status === 'in_port' ? '#dcfce7' : vessel.status === 'en_route' ? '#dbeafe' : '#f1f5f9',
                          color: vessel.status === 'in_port' ? '#16a34a' : vessel.status === 'en_route' ? '#1B8BEB' : '#94a3b8',
                        }}>
                          <i className={`fas ${getStatusIcon(vessel.status)}`} style={{ fontSize: '1.1rem' }}></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span className="font-medium" style={{ display: 'block' }}>
                            {vessel.vessel_name || 'Unknown Vessel'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            MMSI: {vessel.mmsi}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{vessel.destination || '—'}</td>
                    <td>
                      <span className={`admin-status-badge ${getStatusClass(vessel.status)}`}>
                        {getStatusLabel(vessel.status)}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{vessel.eta ? formatDate(vessel.eta) : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{formatDate(vessel.first_detected_at)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{formatDate(vessel.last_seen_at)}</td>
                    <td>
                      <div className="admin-actions" style={{ gap: '0.4rem' }}>
                        <select
                          value={vessel.status}
                          onChange={(e) => updateStatus(vessel, e.target.value)}
                          className="admin-vessel-status-select"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}
                        >
                          <option value="en_route">En Route</option>
                          <option value="in_port">In Port</option>
                          <option value="departed">Departed</option>
                        </select>
                        <button
                          onClick={() => toggleActive(vessel)}
                          className="admin-btn-icon"
                          title={vessel.is_active ? 'Archive' : 'Restore'}
                        >
                          <i className={`fas fa-${vessel.is_active ? 'eye-slash' : 'eye'}`}></i>
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
