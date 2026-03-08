'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { StaffMember } from '@/lib/types';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('sort_order');
    if (error) console.error('Error loading staff:', error);
    setStaff(data || []);
    setLoading(false);
  }

  async function deleteStaff(id: string) {
    if (!confirm('Delete this staff member?')) return;
    const supabase = createClient();
    await supabase.from('staff_members').delete().eq('id', id);
    setStaff(staff.filter(s => s.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('staff_members').update({ is_published: !current }).eq('id', id);
    setStaff(staff.map(s => s.id === id ? { ...s, is_published: !current } : s));
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Staff</h1>
          <p>Manage team members displayed on the staff page.</p>
        </div>
        <Link href="/admin/staff/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Staff Member
        </Link>
      </div>

      {loading ? <p>Loading...</p> : staff.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-id-badge"></i>
          <p>No staff members yet.</p>
          <Link href="/admin/staff/new" className="admin-btn admin-btn-primary">Add First Staff Member</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Photo</th>
                <th>Name</th>
                <th>Title</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id}>
                  <td>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user" style={{ color: '#94A3B8' }}></i>
                      </div>
                    )}
                  </td>
                  <td><Link href={`/admin/staff/${member.id}`}>{member.name}</Link></td>
                  <td>{member.title}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{member.phone || '—'}</td>
                  <td>
                    <button
                      className={`admin-status-badge ${member.is_published ? 'published' : 'draft'}`}
                      onClick={() => togglePublished(member.id, member.is_published)}
                    >
                      {member.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/staff/${member.id}`} className="admin-btn-icon" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => deleteStaff(member.id)} className="admin-btn-icon danger" title="Delete">
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
