'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Photo, PhotoCategory } from '@/lib/types';

// ─── Types & Helpers ──────────────────────────────────────────────────────────

interface StagedFile {
  file: File;
  preview: string;
  title: string;
  category: string;
}

const DEFAULT_CATEGORIES = [
  "2023 Summer Market", "2024 Cabella's", 'Black River Landing', 'Black River Wharf',
  'Boat Tours', 'Carmen Lee', 'Controlled Burn', 'Disposal Site',
  'Dredging Tanks', 'Freighters', 'Lighthouse', 'Outdoor Show',
  'Port Lorain', "Rockin' On The River", 'Stage Construction',
  'Sunsets & Weather', 'Terminals & Docks',
];

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function generateThumbnail(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const origW = img.width;
      const origH = img.height;
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      if (origW <= MAX_WIDTH) {
        canvas.width = origW;
        canvas.height = origH;
      } else {
        const scale = MAX_WIDTH / origW;
        canvas.width = MAX_WIDTH;
        canvas.height = Math.round(origH * scale);
      }
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, width: origW, height: origH });
          else reject(new Error('Failed to generate thumbnail'));
        },
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dbCategories, setDbCategories] = useState<PhotoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Upload staging
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [batchCategory, setBatchCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryNames = dbCategories.length > 0
    ? dbCategories.map(c => c.name).sort((a, b) => a.localeCompare(b))
    : DEFAULT_CATEGORIES;

  useEffect(() => {
    loadPhotos();
    loadCategories();
  }, []);

  async function loadPhotos() {
    const supabase = createClient();
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  }

  async function loadCategories() {
    const supabase = createClient();
    const { data } = await supabase
      .from('photo_categories')
      .select('*')
      .order('sort_order')
      .order('name');
    setDbCategories(data || []);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newStaged: StagedFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      category: batchCategory,
    }));
    setStaged(prev => [...prev, ...newStaged]);
    e.target.value = '';
  }

  function removeStagedFile(index: number) {
    setStaged(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  function updateStagedTitle(index: number, title: string) {
    setStaged(prev => prev.map((item, i) => i === index ? { ...item, title } : item));
  }

  function updateStagedCategory(index: number, category: string) {
    setStaged(prev => prev.map((item, i) => i === index ? { ...item, category } : item));
  }

  function applyBatchCategory(cat: string) {
    setBatchCategory(cat);
    if (cat) setStaged(prev => prev.map(item => ({ ...item, category: cat })));
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categoryNames.some(c => c.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('photo_categories').insert({ name, sort_order: categoryNames.length });
    if (!error) {
      setNewCategoryName('');
      loadCategories();
    } else {
      setDbCategories(prev => [...prev, { id: crypto.randomUUID(), name, sort_order: prev.length, created_at: new Date().toISOString() }]);
      setNewCategoryName('');
    }
  }

  async function handleUploadAll() {
    if (staged.length === 0) return;
    if (staged.some(s => !s.category)) {
      if (!confirm('Some photos have no category assigned. Upload anyway?')) return;
    }
    setUploading(true);
    const supabase = createClient();

    for (let i = 0; i < staged.length; i++) {
      const item = staged[i];
      setUploadProgress(`Uploading ${i + 1} of ${staged.length}: ${item.file.name}`);
      try {
        const { blob: thumbBlob, width, height } = await generateThumbnail(item.file);
        const ext = item.file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const rand = Math.random().toString(36).slice(2, 7);
        const originalPath = `photos/${timestamp}-${rand}.${ext}`;
        const { error: origErr } = await supabase.storage.from('new-images').upload(originalPath, item.file);
        if (origErr) { alert('Upload error: ' + origErr.message); continue; }
        const thumbPath = `photos/thumbs/${timestamp}-${rand}.jpg`;
        const { error: thumbErr } = await supabase.storage.from('new-images').upload(thumbPath, thumbBlob);
        if (thumbErr) { alert('Thumbnail error: ' + thumbErr.message); continue; }
        const { data: origUrl } = supabase.storage.from('new-images').getPublicUrl(originalPath);
        const { data: thumbUrl } = supabase.storage.from('new-images').getPublicUrl(thumbPath);
        await supabase.from('photos').insert({
          title: item.title, category: item.category || 'General',
          file_url: origUrl.publicUrl, thumbnail_url: thumbUrl.publicUrl,
          file_name: item.file.name, file_size: item.file.size, width, height,
        });
      } catch (err) {
        alert(`Error processing ${item.file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    staged.forEach(s => URL.revokeObjectURL(s.preview));
    setStaged([]);
    setBatchCategory('');
    setUploading(false);
    setUploadProgress('');
    loadPhotos();
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return;
    const supabase = createClient();
    await supabase.from('photos').delete().eq('id', id);
    setPhotos(photos.filter(p => p.id !== id));
    setSelectedPhoto(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  // Get categories that actually have photos
  const usedCategories = [...new Set(photos.map(p => p.category).filter(Boolean))].sort();

  const categoryFiltered = filterCategory === 'All' ? photos : photos.filter(p => p.category === filterCategory);

  const filtered = search
    ? categoryFiltered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
      )
    : categoryFiltered;

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Photo Library</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading photos...</p>
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
          <h1><i className="fas fa-images mr-2 text-blue"></i> Photo Library</h1>
          <p>Upload and manage photos for use across the website.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()}>
          <i className="fas fa-plus"></i> Select Photos
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-images"></i></div>
          <div className="rotr-stat-value">{photos.length}</div>
          <div className="rotr-stat-label">Total Photos</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-tags"></i></div>
          <div className="rotr-stat-value">{usedCategories.length}</div>
          <div className="rotr-stat-label">Categories</div>
        </div>
        {filterCategory !== 'All' && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-filter"></i></div>
            <div className="rotr-stat-value">{categoryFiltered.length}</div>
            <div className="rotr-stat-label">{filterCategory}</div>
          </div>
        )}
      </div>

      {/* Upload Staging Area */}
      {staged.length > 0 && (
        <div className="photo-staging" style={{ marginBottom: '2rem' }}>
          <div className="photo-staging-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{staged.length} photo{staged.length !== 1 ? 's' : ''} selected</h3>
              <button className="admin-btn admin-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <i className="fas fa-plus"></i> Add More
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="admin-btn admin-btn-secondary"
                onClick={() => { staged.forEach(s => URL.revokeObjectURL(s.preview)); setStaged([]); setBatchCategory(''); }}>
                Clear All
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleUploadAll} disabled={uploading}>
                {uploading ? <><i className="fas fa-spinner fa-spin"></i> {uploadProgress}</> : <><i className="fas fa-upload"></i> Upload All</>}
              </button>
            </div>
          </div>

          <div className="photo-staging-quickapply">
            <span className="photo-staging-quickapply-label">Apply category to all:</span>
            <select value={batchCategory} onChange={e => applyBatchCategory(e.target.value)} className="photo-cat-select">
              <option value="">-- Select --</option>
              {categoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="photo-add-cat">
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Add new category..." onKeyDown={e => { if (e.key === 'Enter') addCategory(); }} />
              <button className="admin-btn admin-btn-secondary" onClick={addCategory} disabled={!newCategoryName.trim()}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <div className="photo-staged-grid">
            {staged.map((item, i) => (
              <div key={i} className="photo-staged-card">
                <button className="photo-staged-remove" onClick={() => removeStagedFile(i)} title="Remove">
                  <i className="fas fa-times"></i>
                </button>
                <div className="photo-staged-img">
                  <img src={item.preview} alt={item.title} />
                </div>
                <div className="photo-staged-card-body">
                  <input type="text" value={item.title} onChange={e => updateStagedTitle(i, e.target.value)}
                    className="photo-staged-title-input" placeholder="Photo title" />
                  <div className="photo-staged-meta">
                    <span>{formatFileSize(item.file.size)}</span>
                  </div>
                  <select value={item.category} onChange={e => updateStagedCategory(i, e.target.value)} className="photo-cat-select">
                    <option value="">-- Select category --</option>
                    {categoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      {photos.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            <button onClick={() => { setFilterCategory('All'); setSearch(''); }}
              className={`admin-year-tab${filterCategory === 'All' ? ' active' : ''}`}>
              All
              <span className="admin-filter-count" style={{ marginLeft: '0.35rem' }}>{photos.length}</span>
            </button>
            {usedCategories.map(cat => {
              const count = photos.filter(p => p.category === cat).length;
              return (
                <button key={cat} onClick={() => { setFilterCategory(cat); setSearch(''); }}
                  className={`admin-year-tab${cat === filterCategory ? ' active' : ''}`}>
                  {cat}
                  <span className="admin-filter-count" style={{ marginLeft: '0.35rem' }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="max-w-md relative" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
            <input type="text"
              className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
              placeholder="Search photos by title or category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </>
      )}

      {/* Photo Grid */}
      {photos.length === 0 && staged.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-images"></i>
          <p>No photos uploaded yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload Your First Photos
          </button>
        </div>
      ) : filtered.length === 0 && staged.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-search"></i>
          <p>No photos match your search.</p>
        </div>
      ) : (
        <div className="photo-grid">
          {filtered.map(photo => (
            <div key={photo.id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
              <div className="photo-card-img">
                <img src={photo.thumbnail_url} alt={photo.title} loading="lazy" />
              </div>
              <div className="photo-card-info">
                <span className="photo-card-title">{photo.title}</span>
                <div className="photo-card-meta">
                  <span className="photo-card-cats">{photo.category || 'General'}</span>
                  <span>{formatFileSize(photo.file_size ?? undefined)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal" onClick={e => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setSelectedPhoto(null)}>
              <i className="fas fa-times"></i>
            </button>
            <img src={selectedPhoto.file_url} alt={selectedPhoto.title} className="photo-modal-image" />
            <div className="photo-modal-body">
              <h3 className="photo-modal-title">{selectedPhoto.title}</h3>
              {selectedPhoto.description && (
                <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '0.75rem' }}>
                  {selectedPhoto.description}
                </p>
              )}
              <div className="photo-modal-detail-row">
                {selectedPhoto.width && selectedPhoto.height && (
                  <span><i className="fas fa-expand" style={{ marginRight: '0.35rem' }}></i>{selectedPhoto.width} x {selectedPhoto.height}</span>
                )}
                <span><i className="fas fa-file" style={{ marginRight: '0.35rem' }}></i>{formatFileSize(selectedPhoto.file_size ?? undefined)}</span>
                <span><i className="fas fa-calendar" style={{ marginRight: '0.35rem' }}></i>{new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              {selectedPhoto.category && (
                <div className="photo-modal-tags">
                  <span className="photo-modal-tag">{selectedPhoto.category}</span>
                </div>
              )}
              <div className="photo-modal-actions">
                <button className="admin-btn admin-btn-primary" onClick={() => copyUrl(selectedPhoto!.file_url)}>
                  <i className="fas fa-copy"></i> {copyFeedback || 'Copy URL'}
                </button>
                <a href={selectedPhoto.file_url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
                  <i className="fas fa-external-link-alt"></i> Open Full Size
                </a>
                <button className="admin-btn admin-btn-secondary" style={{ marginLeft: 'auto', color: '#dc2626' }} onClick={() => deletePhoto(selectedPhoto!.id)}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
