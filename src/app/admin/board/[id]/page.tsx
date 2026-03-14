'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function BoardEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    name: '',
    role: 'Board Member',
    bio: '',
    term_text: '',
    photo_url: '',
    sort_order: 0,
    is_officer: false,
    is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) loadMember();
  }, [id, isNew]);

  async function loadMember() {
    const supabase = createClient();
    const { data } = await supabase.from('board_members').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        role: data.role || 'Board Member',
        bio: data.bio || '',
        term_text: data.term_text || '',
        photo_url: data.photo_url || '',
        sort_order: data.sort_order || 0,
        is_officer: data.is_officer || false,
        is_published: data.is_published ?? true,
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
    const path = `board/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('new-images').upload(path, file);
    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('new-images').getPublicUrl(path);
    setForm(prev => ({ ...prev, photo_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('Name is required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      role: form.role,
      bio: form.bio || null,
      term_text: form.term_text.trim() || null,
      photo_url: form.photo_url || null,
      sort_order: form.sort_order,
      is_officer: form.is_officer,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error } = await supabase.from('board_members').insert(payload);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('board_members').update(payload).eq('id', id);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    }

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/board', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});

    router.push('/admin/board');
  }

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Edit Board Member</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading board member...</p>
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
          <Link href="/admin/board" className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to Board
          </Link>
          <h1><i className="fas fa-user-edit mr-2 text-blue"></i> {isNew ? 'New Board Member' : 'Edit Board Member'}</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/board')} className="admin-btn admin-btn-secondary">Cancel</button>
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
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="Chairman">Chairman</option>
                  <option value="Vice Chairman">Vice Chairman</option>
                  <option value="Board Member">Board Member</option>
                </select>
              </div>
            </div>
            <div className="admin-form-group">
              <label>Term</label>
              <input type="text" value={form.term_text} onChange={e => setForm(f => ({ ...f, term_text: e.target.value }))} placeholder="e.g. May 2025 – May 2029" />
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
            <label className="admin-checkbox" style={{ marginTop: '0.75rem' }}>
              <input type="checkbox" checked={form.is_officer} onChange={e => setForm(f => ({ ...f, is_officer: e.target.checked }))} />
              Officer (Chairman / Vice Chairman row)
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
