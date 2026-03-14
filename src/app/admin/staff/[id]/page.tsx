'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function StaffEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    name: '', title: '', phone: '', email: '',
    bio: '', photo_url: '', sort_order: 0, is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) loadStaff();
  }, [id, isNew]);

  async function loadStaff() {
    const supabase = createClient();
    const { data } = await supabase.from('staff_members').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '', title: data.title || '',
        phone: data.phone || '', email: data.email || '',
        bio: data.bio || '', photo_url: data.photo_url || '',
        sort_order: data.sort_order || 0, is_published: data.is_published ?? true,
      });
    }
    setLoading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `staff/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('new-images').upload(path, file);
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('new-images').getPublicUrl(path);
    setForm(prev => ({ ...prev, photo_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim()) {
      alert('Name and title are required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(), title: form.title.trim(),
      phone: form.phone.trim() || null, email: form.email.trim() || null,
      bio: form.bio.trim() || null, photo_url: form.photo_url || null,
      sort_order: form.sort_order, is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error } = await supabase.from('staff_members').insert(payload);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('staff_members').update(payload).eq('id', id);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    }

    await fetch('/api/revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/staff', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});

    router.push('/admin/staff');
  }

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Edit Staff Member</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading staff member...</p>
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
          <Link href="/admin/staff" className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to Staff
          </Link>
          <h1><i className="fas fa-user-edit mr-2 text-blue"></i> {isNew ? 'New Staff Member' : 'Edit Staff Member'}</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/staff')} className="admin-btn admin-btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}
          </button>
        </div>
      </div>

      <div className="admin-form-layout">
        {/* Main Form */}
        <div className="admin-form-main">
          <div className="admin-card">
            <h3 className="mb-4 text-base">
              <i className="fas fa-info-circle mr-1.5 text-blue"></i> Details
            </h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="admin-form-group">
                <label>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Job title" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="440-204-2269, Ext. 101" />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@lorainportauthority.com" />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Bio</label>
              <RichTextEditor content={form.bio} onChange={(html: string) => setForm(f => ({ ...f, bio: html }))} />
            </div>
            <div className="admin-form-group">
              <label>Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} style={{ width: '100px' }} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="admin-form-sidebar">
          <div className="admin-card">
            <h3 className="mb-4 text-base">
              <i className="fas fa-cog mr-1.5 text-slate-400"></i> Settings
            </h3>
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Published
            </label>
          </div>

          <div className="admin-card" style={{ marginTop: '1rem' }}>
            <h3 className="mb-4 text-base">
              <i className="fas fa-camera mr-1.5 text-blue"></i> Photo
            </h3>
            {form.photo_url && (
              <img src={form.photo_url} alt="Preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '0.75rem', aspectRatio: '4/5', objectFit: 'cover' }} />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            {uploading && (
              <p className="mt-2 text-sm text-blue">
                <i className="fas fa-spinner fa-spin mr-1"></i> Uploading...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
