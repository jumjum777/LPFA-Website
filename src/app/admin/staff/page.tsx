'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { StaffMember } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type StaffFilter = 'all' | 'published' | 'hidden';

const FILTER_LABELS: Record<StaffFilter, string> = {
  all: 'All',
  published: 'Published',
  hidden: 'Hidden',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StaffFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Staff load failed:', err);
    } finally {
      setLoading(false);
    }
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

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<StaffFilter, number> = {
    all: staff.length,
    published: staff.filter(s => s.is_published).length,
    hidden: staff.filter(s => !s.is_published).length,
  };

  const titles = [...new Set(staff.map(s => s.title).filter(Boolean))];

  const filtered = staff.filter(s => {
    if (filter === 'published' && !s.is_published) return false;
    if (filter === 'hidden' && s.is_published) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Staff</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading staff...</p>
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
          <h1><i className="fas fa-users mr-2 text-blue"></i> Staff</h1>
          <p>Manage team members displayed on the staff page.</p>
        </div>
        <Link href="/admin/staff/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Staff Member
        </Link>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-users"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Staff</div>
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
        {titles.length > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-id-badge"></i></div>
            <div className="rotr-stat-value">{titles.length}</div>
            <div className="rotr-stat-label">Roles</div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'published', 'hidden'] as StaffFilter[]).map(s => (
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
          placeholder="Search by name, title, or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Staff List */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-users"></i>
          <p>{staff.length === 0 ? 'No staff members yet.' : `No ${filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase() + ' '}staff found.`}</p>
          {staff.length === 0 && (
            <Link href="/admin/staff/new" className="admin-btn admin-btn-primary">Add First Staff Member</Link>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Title</th>
                <th>Contact</th>
                <th>Live on Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const dimmed = !member.is_published;
                return (
                  <tr key={member.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.name}
                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/staff/${member.id}`} className="font-medium" style={{ display: 'block' }}>
                            {member.name}
                          </Link>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Order: {member.sort_order}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-badge">{member.title}</span></td>
                    <td>
                      <div style={{ minWidth: 0 }}>
                        {member.phone && (
                          <span className="text-sm" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                            <i className="fas fa-phone" style={{ marginRight: '0.35rem', fontSize: '0.7rem', color: '#94a3b8' }}></i>
                            {member.phone}
                          </span>
                        )}
                        {member.email && (
                          <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                            <i className="fas fa-envelope" style={{ marginRight: '0.35rem', fontSize: '0.65rem' }}></i>
                            {member.email}
                          </span>
                        )}
                        {!member.phone && !member.email && '—'}
                      </div>
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <div
                          onClick={() => togglePublished(member.id, member.is_published)}
                          style={{
                            width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                            background: member.is_published ? '#16a34a' : '#374151', transition: 'background 0.2s', cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '0.175rem',
                            left: member.is_published ? '1.3rem' : '0.2rem',
                            transition: 'left 0.2s',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: member.is_published ? '#16a34a' : '#94a3b8' }}>
                          {member.is_published ? 'Live' : 'Hidden'}
                        </span>
                      </label>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
