'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdminUser } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [inviting, setInviting] = useState(false);
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase.from('admin_users').select('role').eq('user_id', user.id).single();
      setCurrentRole(me?.role || '');
    }
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    setUsers(data || []);
    setLoading(false);
  }

  async function handleInvite() {
    if (!inviteEmail || !inviteName) {
      alert('Email and display name are required.');
      return;
    }
    setInviting(true);

    // Use Supabase Admin API via our own API route to invite user
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, display_name: inviteName, role: inviteRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || 'Unknown error'));
      setInviting(false);
      return;
    }

    setInviteEmail('');
    setInviteName('');
    setInviting(false);
    loadUsers();
  }

  async function removeUser(id: string) {
    if (!confirm('Remove this admin user?')) return;
    const supabase = createClient();
    await supabase.from('admin_users').delete().eq('id', id);
    setUsers(users.filter(u => u.id !== id));
  }

  if (currentRole !== 'super_admin') {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>Access Denied</h1>
          <p>Only super admins can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Admin Users</h1>
        <p>Invite and manage admin accounts.</p>
      </div>

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3>Invite New Admin</h3>
        <div className="admin-form-row" style={{ alignItems: 'flex-end' }}>
          <div className="admin-form-group">
            <label>Display Name</label>
            <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="admin-form-group">
            <label>Email</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="jane@lorainport.com" />
          </div>
          <div className="admin-form-group">
            <label>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'super_admin')}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <button onClick={handleInvite} className="admin-btn admin-btn-primary" disabled={inviting} style={{ marginBottom: '0.5rem' }}>
            {inviting ? <><i className="fas fa-spinner fa-spin"></i> Inviting...</> : <><i className="fas fa-paper-plane"></i> Invite</>}
          </button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.display_name}</td>
                  <td>{user.email}</td>
                  <td><span className="admin-badge">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></td>
                  <td>
                    <button onClick={() => removeUser(user.id)} className="admin-btn-icon danger" title="Remove">
                      <i className="fas fa-trash"></i>
                    </button>
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
