'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdminUser } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setCurrentRole(data.currentRole || '');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Users load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !inviteName) { alert('Email and display name are required.'); return; }
    setInviting(true);
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, display_name: inviteName, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) { alert('Error: ' + (data.error || 'Unknown error')); setInviting(false); return; }
    setInviteEmail('');
    setInviteName('');
    setShowInvite(false);
    setInviting(false);
    loadUsers();
  }

  async function removeUser(id: string) {
    if (!confirm('Remove this admin user?')) return;
    const supabase = createClient();
    await supabase.from('admin_users').delete().eq('id', id);
    setUsers(users.filter(u => u.id !== id));
  }

  // ─── Access Denied ────────────────────────────────────────────────────

  if (!loading && currentRole !== 'super_admin') {
    return (
      <div className="admin-page">
        <div className="admin-card p-12 text-center">
          <i className="fas fa-lock text-2xl" style={{ color: '#EF4444' }}></i>
          <h2 style={{ marginTop: '0.75rem' }}>Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400">Only super admins can manage users.</p>
        </div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Admin Users</h1></div>
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
          <h3 className="analytics-loading-title">Loading Users...</h3>
          <p className="analytics-loading-step">Fetching admin accounts...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const superAdmins = users.filter(u => u.role === 'super_admin').length;
  const admins = users.filter(u => u.role === 'admin').length;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1><i className="fas fa-users-cog" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Admin Users</h1>
          <p>Invite and manage admin accounts.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowInvite(!showInvite)}>
          <i className={`fas fa-${showInvite ? 'times' : 'user-plus'}`}></i> {showInvite ? 'Cancel' : 'Invite User'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-users"></i></div>
          <div className="rotr-stat-value">{users.length}</div>
          <div className="rotr-stat-label">Total Users</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-crown"></i></div>
          <div className="rotr-stat-value">{superAdmins}</div>
          <div className="rotr-stat-label">Super Admins</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-user-shield"></i></div>
          <div className="rotr-stat-value">{admins}</div>
          <div className="rotr-stat-label">Admins</div>
        </div>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            <i className="fas fa-user-plus" style={{ marginRight: '0.4rem', color: '#1B8BEB' }}></i> Invite New Admin
          </h3>
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
              {inviting ? <><i className="fas fa-spinner fa-spin"></i> Inviting...</> : <><i className="fas fa-paper-plane"></i> Send Invite</>}
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-users"></i>
          <p>No admin users found.</p>
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isSuperAdmin = user.role === 'super_admin';
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`admin-user-avatar ${isSuperAdmin ? 'super-admin' : 'admin'}`}>
                          {getInitials(user.display_name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span className="font-medium" style={{ display: 'block' }}>{user.display_name}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-role-badge ${isSuperAdmin ? 'super-admin' : 'admin'}`}>
                        <i className={`fas fa-${isSuperAdmin ? 'crown' : 'user-shield'}`} style={{ fontSize: '0.65rem' }}></i>
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#94a3b8' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td>
                      <button onClick={() => removeUser(user.id)} className="admin-btn-icon danger" title="Remove">
                        <i className="fas fa-trash"></i>
                      </button>
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
