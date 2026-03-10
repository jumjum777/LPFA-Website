'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Photo } from '@/lib/types';

const CATEGORIES = ['All', 'Events', 'Facilities', 'Staff', 'Press', 'Historical', 'Brownfields', 'Development', 'General'];

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
        // Image is already small — use as-is for thumbnail
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    loadPhotos();
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const fileArr = Array.from(files);

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setUploadProgress(`Uploading ${i + 1} of ${fileArr.length}: ${file.name}`);

      try {
        // Generate thumbnail and get dimensions
        const { blob: thumbBlob, width, height } = await generateThumbnail(file);

        // Upload original
        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const rand = Math.random().toString(36).slice(2, 7);
        const originalPath = `photos/${timestamp}-${rand}.${ext}`;
        const { error: origErr } = await supabase.storage.from('new-images').upload(originalPath, file);
        if (origErr) { alert('Upload error: ' + origErr.message); continue; }

        // Upload thumbnail
        const thumbPath = `photos/thumbs/${timestamp}-${rand}.jpg`;
        const { error: thumbErr } = await supabase.storage.from('new-images').upload(thumbPath, thumbBlob);
        if (thumbErr) { alert('Thumbnail error: ' + thumbErr.message); continue; }

        // Get public URLs
        const { data: origUrl } = supabase.storage.from('new-images').getPublicUrl(originalPath);
        const { data: thumbUrl } = supabase.storage.from('new-images').getPublicUrl(thumbPath);

        // Build title — use form title for single uploads, filename for batch
        const title = fileArr.length === 1 && uploadTitle
          ? uploadTitle
          : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        const tags = uploadTags ? uploadTags.split(',').map(t => t.trim()).filter(Boolean) : [];

        // Insert record
        await supabase.from('photos').insert({
          title,
          description: uploadDescription || null,
          category: uploadCategory,
          tags,
          file_url: origUrl.publicUrl,
          thumbnail_url: thumbUrl.publicUrl,
          file_name: file.name,
          file_size: file.size,
          width,
          height,
        });
      } catch (err) {
        alert(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Reset form
    setUploadTitle('');
    setUploadTags('');
    setUploadDescription('');
    setUploading(false);
    setUploadProgress('');
    e.target.value = '';
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
  const categoryFiltered = selectedCategory === 'All'
    ? photos
    : photos.filter(p => p.category === selectedCategory);

  const filtered = search
    ? categoryFiltered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : categoryFiltered;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Photo Library</h1>
          <p>Upload and manage photos for use across the website.</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <i className={`fas ${showUploadForm ? 'fa-times' : 'fa-plus'}`}></i>
          {showUploadForm ? 'Close' : 'Upload Photos'}
        </button>
      </div>

      {/* UPLOAD FORM */}
      {showUploadForm && (
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h3>Upload Photos</h3>
          <div className="admin-form-row" style={{ alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div className="admin-form-group" style={{ flex: 2 }}>
              <label>Title <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional for batch uploads)</span></label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="Auto-fills from filename if empty"
              />
            </div>
            <div className="admin-form-group">
              <label>Category</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group" style={{ flex: 2 }}>
              <label>Tags <span style={{ color: '#94A3B8', fontWeight: 400 }}>(comma-separated)</span></label>
              <input
                type="text"
                value={uploadTags}
                onChange={e => setUploadTags(e.target.value)}
                placeholder="e.g. waterfront, summer, concert"
              />
            </div>
          </div>
          <div className="admin-form-row" style={{ alignItems: 'flex-end' }}>
            <div className="admin-form-group" style={{ flex: 2 }}>
              <label>Description <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                placeholder="Brief description of the photo(s)"
              />
            </div>
            <div className="admin-form-group">
              <label>Select Image(s)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>
          </div>
          {uploading && (
            <p style={{ marginTop: '0.75rem' }}>
              <i className="fas fa-spinner fa-spin"></i> {uploadProgress}
            </p>
          )}
        </div>
      )}

      {/* CATEGORY FILTER TABS */}
      {!loading && photos.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSearch(''); }}
                className={`admin-year-tab${cat === selectedCategory ? ' active' : ''}`}
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
              placeholder="Search photos by title, description, or tags..."
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
      {loading ? <p>Loading...</p> : photos.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-images"></i>
          <p>No photos uploaded yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowUploadForm(true)}>
            Upload Your First Photo
          </button>
        </div>
      ) : filtered.length === 0 ? (
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
                  <span className="admin-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                    {photo.category}
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
                <span><i className="fas fa-folder" style={{ marginRight: '0.35rem' }}></i>{selectedPhoto.category}</span>
                {selectedPhoto.width && selectedPhoto.height && (
                  <span><i className="fas fa-expand" style={{ marginRight: '0.35rem' }}></i>{selectedPhoto.width} x {selectedPhoto.height}</span>
                )}
                <span><i className="fas fa-file" style={{ marginRight: '0.35rem' }}></i>{formatFileSize(selectedPhoto.file_size ?? undefined)}</span>
                <span><i className="fas fa-calendar" style={{ marginRight: '0.35rem' }}></i>{new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                <div className="photo-modal-tags">
                  {selectedPhoto.tags.map(tag => (
                    <span key={tag} className="photo-modal-tag">{tag}</span>
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
