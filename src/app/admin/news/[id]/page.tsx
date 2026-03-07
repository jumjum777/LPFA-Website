'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/admin/RichTextEditor';
import type { GalleryImage } from '@/lib/types';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function NewsEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [publishedDate, setPublishedDate] = useState(new Date().toISOString().split('T')[0]);
  const [body, setBody] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadArticle();
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  async function loadCategories() {
    const supabase = createClient();
    const { data } = await supabase
      .from('categories')
      .select('name')
      .order('sort_order');
    const names = (data || []).map(c => c.name);
    setCategories(names);
    if (!category && names.length > 0) setCategory(names[0]);
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('Category already exists.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('categories').insert({ name, sort_order: categories.length });
    if (error) {
      alert('Error creating category: ' + error.message);
      return;
    }
    setCategories(prev => [...prev, name]);
    setCategory(name);
    setNewCategoryName('');
  }

  async function deleteCategory(name: string) {
    if (!confirm(`Delete category "${name}"? Articles using it will keep their current category.`)) return;
    const supabase = createClient();
    await supabase.from('categories').delete().eq('name', name);
    setCategories(prev => prev.filter(c => c !== name));
    if (category === name && categories.length > 1) {
      setCategory(categories.find(c => c !== name) || '');
    }
  }

  async function loadArticle() {
    const supabase = createClient();
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setTitle(data.title);
      setSlug(data.slug);
      setCategory(data.category);
      setPublishedDate(data.published_date);
      setBody(data.body);
      setIsPublished(data.is_published);

      // Load gallery images, falling back to single image_url
      if (data.gallery_images && data.gallery_images.length > 0) {
        setGalleryImages(data.gallery_images);
      } else if (data.image_url) {
        setGalleryImages([{ url: data.image_url, alt: data.title, sort_order: 0 }]);
      }
    }
    setLoading(false);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newImages: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `news/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error } = await supabase.storage.from('new-images').upload(path, file);
      if (error) {
        alert('Error uploading ' + file.name + ': ' + error.message);
        continue;
      }

      const { data } = supabase.storage.from('new-images').getPublicUrl(path);
      newImages.push({
        url: data.publicUrl,
        alt: title || 'Article image',
        sort_order: galleryImages.length + newImages.length,
      });
    }

    setGalleryImages(prev => [...prev, ...newImages]);
    setUploading(false);
    e.target.value = '';
  }

  function removeGalleryImage(index: number) {
    setGalleryImages(prev =>
      prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i }))
    );
    if (activeGalleryIndex >= galleryImages.length - 1) {
      setActiveGalleryIndex(Math.max(0, galleryImages.length - 2));
    }
  }

  function moveGalleryImage(index: number, direction: 'up' | 'down') {
    setGalleryImages(prev => {
      const arr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return prev;
      [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
      return arr.map((img, i) => ({ ...img, sort_order: i }));
    });
  }

  function setCoverImage(index: number) {
    setGalleryImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr.map((img, i) => ({ ...img, sort_order: i }));
    });
  }

  async function handleSave() {
    if (!title || !body) {
      alert('Title and body are required.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const articleData = {
      title,
      slug: slug || slugify(title),
      category,
      published_date: publishedDate,
      body,
      image_url: galleryImages.length > 0 ? galleryImages[0].url : null,
      gallery_images: galleryImages,
      is_published: isPublished,
    };

    if (isNew) {
      const { error } = await supabase.from('news_articles').insert(articleData);
      if (error) {
        alert('Error saving: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('news_articles').update(articleData).eq('id', id);
      if (error) {
        alert('Error saving: ' + error.message);
        setSaving(false);
        return;
      }
    }

    // Revalidate the news page
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/news', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});

    router.push('/admin/news');
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{isNew ? 'New Article' : 'Edit Article'}</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/news')} className="admin-btn admin-btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving || uploading}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : uploading ? <><i className="fas fa-spinner fa-spin"></i> Uploading...</> : 'Save Article'}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          <i className="fas fa-pen" style={{ marginRight: '0.4rem' }}></i> Edit
        </button>
        <button
          className={`admin-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <i className="fas fa-eye" style={{ marginRight: '0.4rem' }}></i> Preview
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div className="admin-form-layout">
          <div className="admin-form-main">
            <div className="admin-card">
              <div className="admin-form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (isNew) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Article title"
                />
              </div>

              {slug && (
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.25rem 0 0.75rem' }}>
                  <i className="fas fa-link" style={{ marginRight: '0.4rem' }}></i>
                  Web address: /news/<strong>{slug}</strong>
                </p>
              )}

              <div className="admin-form-group">
                <label>Body</label>
                <RichTextEditor content={body} onChange={setBody} />
              </div>
            </div>
          </div>

          <div className="admin-form-sidebar">
            <div className="admin-card">
              <h3>Settings</h3>

              <div className="admin-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label htmlFor="category" style={{ marginBottom: 0 }}>Category</label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    style={{ background: 'none', border: 'none', color: '#1B8BEB', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <i className="fas fa-cog" style={{ marginRight: '0.25rem' }}></i>
                    {showCategoryManager ? 'Done' : 'Manage'}
                  </button>
                </div>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {showCategoryManager && (
                  <div className="category-manager">
                    <div className="category-manager-add">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      />
                      <button type="button" onClick={addCategory} className="admin-btn admin-btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                        Add
                      </button>
                    </div>
                    <div className="category-manager-list">
                      {categories.map(c => (
                        <div key={c} className="category-manager-item">
                          <span>{c}</span>
                          <button
                            type="button"
                            onClick={() => deleteCategory(c)}
                            className="admin-btn-icon danger"
                            title={`Delete "${c}"`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label htmlFor="date">Publish Date</label>
                <input
                  id="date"
                  type="date"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Images {galleryImages.length > 0 && `(${galleryImages.length})`}</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={uploading}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  JPG or PNG, under 2MB each. First image = cover.
                </p>
                {uploading && (
                  <p style={{ fontSize: '0.82rem', color: '#1B8BEB', marginTop: '0.4rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.3rem' }}></i>
                    Uploading...
                  </p>
                )}
              </div>

              {galleryImages.length > 0 && (
                <div className="gallery-manager">
                  {galleryImages.map((img, i) => (
                    <div key={img.url} className="gallery-manager-item">
                      <img src={img.url} alt={img.alt} className="gallery-manager-thumb" />
                      <div className="gallery-manager-actions">
                        {i === 0 ? (
                          <span className="gallery-manager-cover-badge">
                            <i className="fas fa-star"></i> Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCoverImage(i)}
                            className="admin-btn-icon"
                            title="Set as cover"
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(i, 'up')}
                          className="admin-btn-icon"
                          title="Move up"
                          disabled={i === 0}
                        >
                          <i className="fas fa-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(i, 'down')}
                          className="admin-btn-icon"
                          title="Move down"
                          disabled={i === galleryImages.length - 1}
                        >
                          <i className="fas fa-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="admin-btn-icon danger"
                          title="Remove"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={
                    !isPublished
                      ? 'draft'
                      : publishedDate > new Date().toISOString().split('T')[0]
                        ? 'scheduled'
                        : 'published'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'draft') {
                      setIsPublished(false);
                    } else if (val === 'published') {
                      setIsPublished(true);
                      setPublishedDate(new Date().toISOString().split('T')[0]);
                    } else if (val === 'scheduled') {
                      setIsPublished(true);
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      if (publishedDate <= new Date().toISOString().split('T')[0]) {
                        setPublishedDate(tomorrow.toISOString().split('T')[0]);
                      }
                    }
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                {isPublished && publishedDate > new Date().toISOString().split('T')[0] && (
                  <p style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.4rem' }}>
                    <i className="fas fa-clock" style={{ marginRight: '0.3rem' }}></i>
                    Will go live on {formatDate(publishedDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Preview */
        <div className="admin-card">
          <div className="article-preview">
            <div className="article-preview-header">
              <span className="article-preview-badge">{category}</span>
              {publishedDate && (
                <span className="article-preview-date">{formatDate(publishedDate)}</span>
              )}
            </div>

            <h1 className="article-preview-title">
              {title || 'Untitled Article'}
            </h1>

            {galleryImages.length > 0 && (
              <div className="article-gallery">
                <div className="article-gallery-main">
                  <img
                    src={galleryImages[activeGalleryIndex]?.url}
                    alt={galleryImages[activeGalleryIndex]?.alt}
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        className="article-gallery-arrow article-gallery-arrow--left"
                        onClick={() => setActiveGalleryIndex(
                          (activeGalleryIndex - 1 + galleryImages.length) % galleryImages.length
                        )}
                        aria-label="Previous image"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        className="article-gallery-arrow article-gallery-arrow--right"
                        onClick={() => setActiveGalleryIndex(
                          (activeGalleryIndex + 1) % galleryImages.length
                        )}
                        aria-label="Next image"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      <div className="article-gallery-counter">
                        {activeGalleryIndex + 1} / {galleryImages.length}
                      </div>
                    </>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div className="article-gallery-thumbs">
                    {galleryImages.map((img, i) => (
                      <button
                        key={img.url}
                        className={`article-gallery-thumb ${i === activeGalleryIndex ? 'active' : ''}`}
                        onClick={() => setActiveGalleryIndex(i)}
                      >
                        <img src={img.url} alt={img.alt} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              className="article-preview-body"
              dangerouslySetInnerHTML={{ __html: body || '<p style="color:#94a3b8;font-style:italic;">Start writing in the Edit tab to see your article here...</p>' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
