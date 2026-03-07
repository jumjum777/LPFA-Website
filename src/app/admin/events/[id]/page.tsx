'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { GalleryImage } from '@/lib/types';
import RichTextEditor from '@/components/admin/RichTextEditor';

const eventCategories = ["Rockin' On The River", 'Community'];
const isROTR = (cat: string) => cat === "Rockin' On The River";
const DEFAULT_ROTR_POLICY = 'Tickets are non refundable. No outside food, beverage or coolers are allowed in order to support our vendors. No pets are allowed except for Service Animals. You can bring fold up lawn/camping chairs. Event goes on rain or shine, please plan accordingly. Umbrellas are allowed.';

export default function EventEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    category: eventCategories[0],
    event_date: '',
    description: '',
    location: 'Black River Landing, 421 Black River Landing, Lorain, OH 44052',
    time: '',
    price: '$10',
    cta_text: 'Learn More',
    cta_url: '/contact',
    is_featured: false,
    is_published: true,
    opening_band: '',
    headliner: '',
    gates_time: '5:30 PM',
    opener_time: '6:15 PM',
    headliner_time: '8:45 PM',
    event_policy: DEFAULT_ROTR_POLICY,
    ticket_url: '',
  });
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const supabase = createClient();
      supabase.from('events').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error) { console.error('Error loading event:', error); }
        if (data) {
          setForm(prev => ({ ...prev, ...data }));
          if (data.gallery_images && data.gallery_images.length > 0) {
            setGalleryImages(data.gallery_images);
          } else if (data.image_url) {
            setGalleryImages([{ url: data.image_url, alt: data.title, sort_order: 0 }]);
          }
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const update = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newImages: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `events/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error } = await supabase.storage.from('new-images').upload(path, file);
      if (error) {
        alert('Error uploading ' + file.name + ': ' + error.message);
        continue;
      }

      const { data } = supabase.storage.from('new-images').getPublicUrl(path);
      newImages.push({
        url: data.publicUrl,
        alt: form.title || 'Event image',
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
    if (!isROTR(form.category) && !form.title) {
      alert('Title is required.');
      return;
    }
    if (!form.description) {
      alert('Description is required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const saveData: Record<string, unknown> = {
      ...form,
      image_url: galleryImages.length > 0 ? galleryImages[0].url : null,
      gallery_images: galleryImages,
    };
    if (!isROTR(form.category)) {
      saveData.opening_band = '';
      saveData.headliner = '';
      saveData.gates_time = '';
      saveData.opener_time = '';
      saveData.headliner_time = '';
      saveData.event_policy = '';
      saveData.ticket_url = '';
    }

    const { error } = isNew
      ? await supabase.from('events').insert(saveData)
      : await supabase.from('events').update(saveData).eq('id', id);
    if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    await fetch('/api/revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/events', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});
    router.push('/admin/events');
  }

  function handleCategoryChange(cat: string) {
    update('category', cat);
    if (isROTR(cat)) {
      setForm(prev => ({
        ...prev,
        category: cat,
        price: prev.price || '$10',
        gates_time: prev.gates_time || '5:30 PM',
        opener_time: prev.opener_time || '6:15 PM',
        headliner_time: prev.headliner_time || '8:45 PM',
        location: prev.location || 'Black River Landing, 421 Black River Landing, Lorain, OH 44052',
        event_policy: prev.event_policy || DEFAULT_ROTR_POLICY,
      }));
    }
  }

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>{isNew ? 'New Event' : 'Edit Event'}</h1>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/events')} className="admin-btn admin-btn-secondary">Cancel</button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving || uploading}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : uploading ? <><i className="fas fa-spinner fa-spin"></i> Uploading...</> : 'Save Event'}
          </button>
        </div>
      </div>

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <div className="admin-card">
            {!isROTR(form.category) && (
              <div className="admin-form-group">
                <label>Title</label>
                <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Event title" />
              </div>
            )}

            {isROTR(form.category) && (
              <div className="admin-form-group">
                <label>Event Date</label>
                <input type="date" value={form.event_date || ''} onChange={e => update('event_date', e.target.value)} />
              </div>
            )}

            {isROTR(form.category) && (
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Headliner</label>
                  <input type="text" value={form.headliner || ''} onChange={e => update('headliner', e.target.value)} placeholder="e.g. Bret Michaels" />
                </div>
                <div className="admin-form-group">
                  <label>Opening Act</label>
                  <input type="text" value={form.opening_band || ''} onChange={e => update('opening_band', e.target.value)} placeholder="e.g. Local Band Name" />
                </div>
              </div>
            )}

            <div className="admin-form-group">
              <label>Description</label>
              <RichTextEditor content={form.description} onChange={(val) => update('description', val)} />
            </div>

            {isROTR(form.category) && (
              <div className="admin-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="admin-form-group">
                  <label>Gates Open</label>
                  <input type="text" value={form.gates_time || ''} onChange={e => update('gates_time', e.target.value)} placeholder="5:30 PM" />
                </div>
                <div className="admin-form-group">
                  <label>Opening Act Time</label>
                  <input type="text" value={form.opener_time || ''} onChange={e => update('opener_time', e.target.value)} placeholder="6:15 PM" />
                </div>
                <div className="admin-form-group">
                  <label>Headliner Time</label>
                  <input type="text" value={form.headliner_time || ''} onChange={e => update('headliner_time', e.target.value)} placeholder="8:45 PM" />
                </div>
              </div>
            )}

            {isROTR(form.category) && (
              <div className="admin-form-group">
                <label>Ticket / Event Link</label>
                <input type="url" value={form.ticket_url || ''} onChange={e => update('ticket_url', e.target.value)} placeholder="e.g. https://example.com/tickets" />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  Add a link and a &quot;Get Tickets&quot; button will appear on the listing.
                </p>
              </div>
            )}

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Location / Address</label>
                <input type="text" value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Black River Landing, 319 Black River Ln" />
              </div>
              {!isROTR(form.category) && (
                <div className="admin-form-group">
                  <label>Time</label>
                  <input type="text" value={form.time || ''} onChange={e => update('time', e.target.value)} placeholder="e.g. 6:00 PM - 9:00 PM" />
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label>Price / Admission</label>
              <input type="text" value={form.price || ''} onChange={e => update('price', e.target.value)} placeholder="e.g. Free, $25/person" />
            </div>

            {!isROTR(form.category) && (
              <div className="admin-form-group">
                <label>Event Date</label>
                <input type="date" value={form.event_date || ''} onChange={e => update('event_date', e.target.value)} />
              </div>
            )}

            {isROTR(form.category) && (
              <div className="admin-form-group">
                <label>Event Policy</label>
                <textarea value={form.event_policy || ''} onChange={e => update('event_policy', e.target.value)} rows={4} placeholder="Event policies and rules (optional)" />
              </div>
            )}
          </div>
        </div>

        <div className="admin-form-sidebar">
          <div className="admin-card">
            <h3>Settings</h3>
            <div className="admin-form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_featured} onChange={e => update('is_featured', e.target.checked)} />
                <span>Featured Event</span>
              </label>
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_published} onChange={e => update('is_published', e.target.checked)} />
                <span>Published</span>
              </label>
            </div>
          </div>

          <div className="admin-card">
            <h3>Images {galleryImages.length > 0 && `(${galleryImages.length})`}</h3>
            <div className="admin-form-group">
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
          </div>
        </div>
      </div>
    </div>
  );
}
