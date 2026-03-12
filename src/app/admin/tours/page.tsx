'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tour } from '@/lib/types';

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  function loadTours() {
    const supabase = createClient();
    supabase.from('tours').select('*').order('sort_order').then(({ data }) => {
      setTours(data || []);
      setLoading(false);
    });
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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Boat Tours</h1>
          <p>Manage tour listings and schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={syncFromPeekPro}
            disabled={syncing}
            className="admin-btn admin-btn-outline"
            title="Pull tours & schedules from PeekPro"
          >
            <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
            {syncing ? ' Syncing...' : ' Sync PeekPro'}
          </button>
          <Link href="/admin/tours/new" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> New Tour
          </Link>
        </div>
      </div>

      {syncMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: syncMessage.includes('failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${syncMessage.includes('failed') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          borderRadius: 'var(--radius)',
          fontSize: '0.88rem',
          color: syncMessage.includes('failed') ? '#dc2626' : '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <i className={`fas ${syncMessage.includes('failed') ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
          {syncMessage}
        </div>
      )}

      {loading ? <p>Loading...</p> : tours.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-ship"></i>
          <p>No tours yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Price</th><th>PeekPro</th><th>Published</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour.id}>
                  <td><Link href={`/admin/tours/${tour.id}`}>{tour.name}</Link></td>
                  <td><span className="admin-badge">{tour.section}</span></td>
                  <td>{tour.price}</td>
                  <td>{tour.peekpro_product_id ? <i className="fas fa-link" style={{ color: '#059669' }}></i> : '—'}</td>
                  <td>{tour.is_published ? <i className="fas fa-check" style={{ color: '#059669' }}></i> : <i className="fas fa-eye-slash" style={{ color: '#9ca3af' }}></i>}</td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/tours/${tour.id}`} className="admin-btn-icon" title="Edit"><i className="fas fa-edit"></i></Link>
                      <button onClick={() => deleteTour(tour.id)} className="admin-btn-icon danger" title="Delete"><i className="fas fa-trash"></i></button>
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
