'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/admin/RichTextEditor';

const ICON_OPTIONS = [
  { value: 'fa-file-contract', label: 'Contract' },
  { value: 'fa-anchor', label: 'Anchor / Marina' },
  { value: 'fa-building', label: 'Building' },
  { value: 'fa-ship', label: 'Ship' },
  { value: 'fa-hard-hat', label: 'Construction' },
  { value: 'fa-road', label: 'Road / Infrastructure' },
  { value: 'fa-leaf', label: 'Environmental' },
  { value: 'fa-bolt', label: 'Energy' },
  { value: 'fa-water', label: 'Water' },
];

export default function RFPEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    description: '',
    icon: 'fa-file-contract',
    status: 'new' as string,
    posted_date: new Date().toISOString().split('T')[0],
    deadline_date: '',
    location: 'Lorain, OH',
    document_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) loadRFP();
  }, [id, isNew]);

  async function loadRFP() {
    const supabase = createClient();
    const { data } = await supabase.from('rfps').select('*').eq('id', id).single();
    if (data) {
      setForm({
        title: data.title || '',
        description: data.description || '',
        icon: data.icon || 'fa-file-contract',
        status: data.status || 'new',
        posted_date: data.posted_date || new Date().toISOString().split('T')[0],
        deadline_date: data.deadline_date || '',
        location: data.location || 'Lorain, OH',
        document_url: data.document_url || '',
      });
    }
    setLoading(false);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `rfps/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from('new-images').upload(path, file);
    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('new-images').getPublicUrl(path);
    setForm(prev => ({ ...prev, document_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      alert('Title and description are required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      status: form.status,
      posted_date: form.posted_date,
      deadline_date: form.deadline_date || null,
      location: form.location.trim() || 'Lorain, OH',
      document_url: form.document_url || null,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error } = await supabase.from('rfps').insert(payload);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('rfps').update(payload).eq('id', id);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    }

    // Revalidate development page
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/development', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});

    router.push('/admin/rfps');
  }

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{isNew ? 'New RFP' : 'Edit RFP'}</h1>
          <p><Link href="/admin/rfps" style={{ color: 'var(--blue-accent)' }}>&larr; Back to RFPs</Link></p>
        </div>
        <div className="admin-header-actions">
          <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <div className="admin-card">
            <h3>RFP Details</h3>
            <div className="admin-form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Marina Conditions Assessment"
              />
            </div>
            <div className="admin-form-group">
              <label>Description *</label>
              <RichTextEditor
                content={form.description}
                onChange={(html: string) => setForm(f => ({ ...f, description: html }))}
              />
            </div>
          </div>
        </div>

        <div className="admin-form-sidebar">
          <div className="admin-card">
            <h3>Settings</h3>
            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Posted Date</label>
              <input type="date" value={form.posted_date} onChange={e => setForm(f => ({ ...f, posted_date: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Deadline Date</label>
              <input type="date" value={form.deadline_date} onChange={e => setForm(f => ({ ...f, deadline_date: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Icon</label>
              <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
                <i className={`fas ${form.icon}`}></i>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '1rem' }}>
            <h3>Document</h3>
            {form.document_url && (
              <div style={{ marginBottom: '0.75rem' }}>
                <a href={form.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--blue-accent)' }}>
                  <i className="fas fa-file-pdf" style={{ marginRight: '0.3rem' }}></i> View Current Document
                </a>
                <button
                  onClick={() => setForm(f => ({ ...f, document_url: '' }))}
                  style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Remove
                </button>
              </div>
            )}
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleDocUpload} disabled={uploading} />
            {uploading && <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>Uploading...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
