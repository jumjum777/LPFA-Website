'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Photo, PhotoCategory } from '@/lib/types';

interface StagedFile {
  file: File;
  preview: string;
  title: string;
  categories: string[];
}

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

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<PhotoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Upload staging
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [batchCategories, setBatchCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setCategories(data || []);
  }

  // Stage files for review before uploading
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      categories: [...batchCategories],
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
    setStaged(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], title };
      return updated;
    });
  }

  function toggleStagedCategory(index: number, cat: string) {
    setStaged(prev => {
      const updated = [...prev];
      const item = updated[index];
      const cats = item.categories.includes(cat)
        ? item.categories.filter(c => c !== cat)
        : [...item.categories, cat];
      updated[index] = { ...item, categories: cats };
      return updated;
    });
  }

  // Apply batch categories to all staged files
  function toggleBatchCategory(cat: string) {
    const isAdding = !batchCategories.includes(cat);
    const updated = isAdding
      ? [...batchCategories, cat]
      : batchCategories.filter(c => c !== cat);
    setBatchCategories(updated);

    // Apply to all staged files
    setStaged(prev => prev.map(item => {
      if (isAdding && !item.categories.includes(cat)) {
        return { ...item, categories: [...item.categories, cat] };
      }
      if (!isAdding) {
        return { ...item, categories: item.categories.filter(c => c !== cat) };
      }
      return item;
    }));
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('photo_categories').insert({
      name,
      sort_order: categories.length,
    });
    if (error) { alert('Error adding category: ' + error.message); return; }
    setNewCategoryName('');
    loadCategories();
  }

  async function handleUploadAll() {
    if (staged.length === 0) return;
    if (staged.some(s => s.categories.length === 0)) {
      if (!confirm('Some photos have no categories assigned. Upload anyway?')) return;
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
          title: item.title,
          categories: item.categories,
          file_url: origUrl.publicUrl,
          thumbnail_url: thumbUrl.publicUrl,
          file_name: item.file.name,
          file_size: item.file.size,
          width,
          height,
        });
      } catch (err) {
        alert(`Error processing ${item.file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Cleanup previews
    staged.forEach(s => URL.revokeObjectURL(s.preview));
    setStaged([]);
    setBatchCategories([]);
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

  // Filtering
  const categoryFiltered = filterCategory === 'All'
    ? photos
    : photos.filter(p => (p.categories || []).includes(filterCategory));

  const filtered = search
    ? categoryFiltered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()))
      )
    : categoryFiltered;

  const categoryNames = categories.map(c => c.name);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Photo Library</h1>
          <p>Upload and manage photos for use across the website.</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-plus"></i> Select Photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* UPLOAD STAGING AREA */}
      {staged.length > 0 && (
        <div className="photo-staging" style={{ marginBottom: '2rem' }}>
          {/* Top bar */}
          <div className="photo-staging-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{staged.length} photo{staged.length !== 1 ? 's' : ''} selected</h3>
              <button className="admin-btn admin-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <i className="fas fa-plus"></i> Add More
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => { staged.forEach(s => URL.revokeObjectURL(s.preview)); setStaged([]); setBatchCategories([]); }}
              >
                Clear All
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleUploadAll}
                disabled={uploading}
              >
                {uploading ? <><i className="fas fa-spinner fa-spin"></i> {uploadProgress}</> : <><i className="fas fa-upload"></i> Upload All</>}
              </button>
            </div>
          </div>

          {/* Quick apply bar */}
          <div className="photo-staging-quickapply">
            <span className="photo-staging-quickapply-label">Quick apply to all:</span>
            <div className="photo-cat-checks">
              {categoryNames.map(cat => (
                <label key={cat} className="photo-cat-check">
                  <input
                    type="checkbox"
                    checked={batchCategories.includes(cat)}
                    onChange={() => toggleBatchCategory(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
            <div className="photo-add-cat">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Add new category..."
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
              />
              <button className="admin-btn admin-btn-secondary" onClick={addCategory} disabled={!newCategoryName.trim()}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          {/* Photo cards — each photo with its own category checkboxes */}
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
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => updateStagedTitle(i, e.target.value)}
                    className="photo-staged-title-input"
                    placeholder="Photo title"
                  />
                  <div className="photo-staged-meta">
                    <span>{formatFileSize(item.file.size)}</span>
                  </div>
                  <div className="photo-staged-cats-label">Categories:</div>
                  <div className="photo-cat-checks photo-cat-checks-card">
                    {categoryNames.map(cat => (
                      <label key={cat} className="photo-cat-check">
                        <input
                          type="checkbox"
                          checked={item.categories.includes(cat)}
                          onChange={() => toggleStagedCategory(i, cat)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY FILTER TABS */}
      {!loading && photos.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            <button
              onClick={() => { setFilterCategory('All'); setSearch(''); }}
              className={`admin-year-tab${filterCategory === 'All' ? ' active' : ''}`}
            >
              All
            </button>
            {categoryNames.map(cat => (
              <button
                key={cat}
                onClick={() => { setFilterCategory(cat); setSearch(''); }}
                className={`admin-year-tab${cat === filterCategory ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search photos by title or category..."
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.6rem 0.85rem',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary, #1e293b)',
              }}
            />
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* PHOTO GRID */}
      {loading ? <p>Loading...</p> : photos.length === 0 && staged.length === 0 ? (
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
            <div
              key={photo.id}
              className="photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="photo-card-img">
                <img src={photo.thumbnail_url} alt={photo.title} loading="lazy" />
              </div>
              <div className="photo-card-info">
                <span className="photo-card-title">{photo.title}</span>
                <div className="photo-card-meta">
                  <span className="photo-card-cats">
                    {(photo.categories || []).slice(0, 2).join(', ')}
                    {(photo.categories || []).length > 2 && ` +${(photo.categories || []).length - 2}`}
                  </span>
                  <span>{formatFileSize(photo.file_size ?? undefined)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal" onClick={e => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setSelectedPhoto(null)}>
              <i className="fas fa-times"></i>
            </button>
            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.title}
              className="photo-modal-image"
            />
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
              {selectedPhoto.categories && selectedPhoto.categories.length > 0 && (
                <div className="photo-modal-tags">
                  {selectedPhoto.categories.map(cat => (
                    <span key={cat} className="photo-modal-tag">{cat}</span>
                  ))}
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
