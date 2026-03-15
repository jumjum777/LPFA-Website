'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { BoardMember } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type BoardFilter = 'all' | 'published' | 'hidden' | 'officers';

const FILTER_LABELS: Record<BoardFilter, string> = {
  all: 'All',
  published: 'Published',
  hidden: 'Hidden',
  officers: 'Officers',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminBoardPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    try {
      const res = await fetch('/api/admin/board');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Board members load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('Delete this board member?')) return;
    const supabase = createClient();
    await supabase.from('board_members').delete().eq('id', id);
    setMembers(members.filter(m => m.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('board_members').update({ is_published: !current }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, is_published: !current } : m));
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<BoardFilter, number> = {
    all: members.length,
    published: members.filter(m => m.is_published).length,
    hidden: members.filter(m => !m.is_published).length,
    officers: members.filter(m => m.is_officer).length,
  };

  const filtered = members.filter(m => {
    if (filter === 'published' && !m.is_published) return false;
    if (filter === 'hidden' && m.is_published) return false;
    if (filter === 'officers' && !m.is_officer) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.term_text || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Board of Directors</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading board members...</p>
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
          <h1><i className="fas fa-user-tie mr-2 text-blue"></i> Board of Directors</h1>
          <p>Manage board members displayed on the board page.</p>
        </div>
        <Link href="/admin/board/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Board Member
        </Link>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-user-tie"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Members</div>
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
        {counts.officers > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-star"></i></div>
            <div className="rotr-stat-value">{counts.officers}</div>
            <div className="rotr-stat-label">Officers</div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'published', 'hidden', 'officers'] as BoardFilter[]).map(s => (
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
          placeholder="Search by name, role, or term..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Board List */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-user-tie"></i>
          <p>{members.length === 0 ? 'No board members yet.' : `No ${filter === 'all' ? '' : FILTER_LABELS[filter].toLowerCase() + ' '}members found.`}</p>
          {members.length === 0 && (
            <Link href="/admin/board/new" className="admin-btn admin-btn-primary">Add First Board Member</Link>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Term</th>
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
                          <Link href={`/admin/board/${member.id}`} className="font-medium" style={{ display: 'block' }}>
                            {member.name}
                          </Link>
                          {member.is_officer && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              <i className="fas fa-star" style={{ marginRight: '0.25rem', fontSize: '0.6rem' }}></i>Officer
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-badge">{member.role}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{member.term_text || '—'}</td>
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
                        <Link href={`/admin/board/${member.id}`} className="admin-btn-icon" title="Edit">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button onClick={() => deleteMember(member.id)} className="admin-btn-icon danger" title="Delete">
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
