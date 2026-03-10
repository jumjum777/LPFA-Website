'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Photo } from '@/lib/types';

const CATEGORIES = ['All', 'Events', 'Facilities', 'Staff', 'Press', 'Historical', 'Brownfields', 'Development', 'General'];

interface PhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function PhotoPicker({ isOpen, onClose, onSelect }: PhotoPickerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSelectedCategory('All');
    loadPhotos();
  }, [isOpen]);

  async function loadPhotos() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  }

  if (!isOpen) return null;

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
    <div className="photo-picker-overlay" onClick={onClose}>
      <div className="photo-picker" onClick={e => e.stopPropagation()}>
        <div className="photo-picker-header">
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Choose from Photo Library</h3>
          <button
            onClick={onClose}
            className="admin-btn-icon"
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="photo-picker-body">
          {/* Filters */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSearch(''); }}
                  className={`admin-year-tab${cat === selectedCategory ? ' active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search photos..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--text-primary, #1e293b)',
              }}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: '#64748B' }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: '#64748B' }}>No photos found.</p>
          ) : (
            <div className="photo-picker-grid">
              {filtered.map(photo => (
                <button
                  key={photo.id}
                  className="photo-picker-item"
                  onClick={() => onSelect(photo.file_url)}
                  title={photo.title}
                >
                  <img src={photo.thumbnail_url} alt={photo.title} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
