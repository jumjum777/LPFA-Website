'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Photo, PhotoCategory } from '@/lib/types';

interface PhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function PhotoPicker({ isOpen, onClose, onSelect }: PhotoPickerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<PhotoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setFilterCategory('All');
    const supabase = createClient();
    Promise.all([
      supabase.from('photos').select('*').order('created_at', { ascending: false }),
      supabase.from('photo_categories').select('*').order('sort_order').order('name'),
    ]).then(([photosRes, catsRes]) => {
      setPhotos(photosRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryFiltered = filterCategory === 'All'
    ? photos
    : photos.filter(p => (p.categories || []).includes(filterCategory));

  const filtered = search
    ? categoryFiltered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()))
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
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
              <button
                onClick={() => { setFilterCategory('All'); setSearch(''); }}
                className={`admin-year-tab${filterCategory === 'All' ? ' active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setFilterCategory(cat.name); setSearch(''); }}
                  className={`admin-year-tab${cat.name === filterCategory ? ' active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {cat.name}
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
