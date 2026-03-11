'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VesselRecord } from '@/lib/vessels';

function formatDate(ts: string | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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

export default function AdminVesselsPage() {
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    loadVessels();
  }, [filter]);

  async function loadVessels() {
    const supabase = createClient();
    let query = supabase
      .from('vessel_traffic')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (filter === 'active') {
      query = query.eq('is_active', true);
    }

    const { data } = await query;
    setVessels(data || []);
    setLoading(false);
  }

  async function toggleActive(vessel: VesselRecord) {
    const supabase = createClient();
    await supabase
      .from('vessel_traffic')
      .update({ is_active: !vessel.is_active })
      .eq('id', vessel.id);
    loadVessels();
  }

  async function updateStatus(vessel: VesselRecord, status: string) {
    const supabase = createClient();
    await supabase
      .from('vessel_traffic')
      .update({ status })
      .eq('id', vessel.id);
    loadVessels();
  }

  async function triggerSync() {
    try {
      const res = await fetch('/api/vessels/sync', {
        headers: { 'x-cron-secret': 'manual' },
      });
      const data = await res.json();
      alert(`Sync complete: ${data.vessels_found || 0} found, ${data.vessels_upserted || 0} updated`);
      loadVessels();
    } catch {
      alert('Sync failed — check console');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Vessel Traffic</h1>
          <p>Monitor vessels heading to Port Lorain via AIS data</p>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={triggerSync}
            className="admin-btn admin-btn-secondary"
          >
            <i className="fas fa-sync-alt"></i> Sync Now
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`admin-year-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`admin-year-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All History
        </button>
      </div>

      {loading ? (
        <div className="admin-empty"><i className="fas fa-spinner fa-spin"></i></div>
      ) : vessels.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-ship"></i>
          <p>No vessels detected{filter === 'active' ? ' currently' : ''}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
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
              {vessels.map(vessel => (
                <tr key={vessel.id} style={{ opacity: vessel.is_active ? 1 : 0.5 }}>
                  <td>
                    <strong>{vessel.vessel_name || 'Unknown'}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MMSI: {vessel.mmsi}</span>
                  </td>
                  <td>{vessel.destination || '—'}</td>
                  <td>
                    <span className={`admin-status-badge ${getStatusClass(vessel.status)}`}>
                      {getStatusLabel(vessel.status)}
                    </span>
                  </td>
                  <td>{vessel.eta ? formatDate(vessel.eta) : '—'}</td>
                  <td>{formatDate(vessel.first_detected_at)}</td>
                  <td>{formatDate(vessel.last_seen_at)}</td>
                  <td>
                    <div className="admin-actions">
                      <select
                        value={vessel.status}
                        onChange={(e) => updateStatus(vessel, e.target.value)}
                        className="admin-vessel-status-select"
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
