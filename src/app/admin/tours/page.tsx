'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tour } from '@/lib/types';

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('tours').select('*').order('sort_order').then(({ data }) => {
      setTours(data || []);
      setLoading(false);
    });
  }, []);

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
        <Link href="/admin/tours/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Tour
        </Link>
      </div>

      {loading ? <p>Loading...</p> : tours.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-ship"></i>
          <p>No tours yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Price</th><th>PeekPro</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour.id}>
                  <td><Link href={`/admin/tours/${tour.id}`}>{tour.name}</Link></td>
                  <td><span className="admin-badge">{tour.section}</span></td>
                  <td>{tour.price}</td>
                  <td>{tour.peekpro_product_id ? <i className="fas fa-link" style={{ color: '#059669' }}></i> : '—'}</td>
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
