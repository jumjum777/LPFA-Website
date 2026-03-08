'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { BoardMember } from '@/lib/types';

export default function AdminBoardPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .order('sort_order');
    if (error) console.error('Error loading board members:', error);
    setMembers(data || []);
    setLoading(false);
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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Board of Directors</h1>
          <p>Manage board members displayed on the board page.</p>
        </div>
        <Link href="/admin/board/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Board Member
        </Link>
      </div>

      {loading ? <p>Loading...</p> : members.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-users"></i>
          <p>No board members yet.</p>
          <Link href="/admin/board/new" className="admin-btn admin-btn-primary">Add First Board Member</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>Term</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
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
                  <td><Link href={`/admin/board/${member.id}`}>{member.name}</Link></td>
                  <td><span className="admin-badge">{member.role}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{member.term_text || '—'}</td>
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
                      <Link href={`/admin/board/${member.id}`} className="admin-btn-icon" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => deleteMember(member.id)} className="admin-btn-icon danger" title="Delete">
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
