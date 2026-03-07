'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { TourSchedule } from '@/lib/types';
import RichTextEditor from '@/components/admin/RichTextEditor';

const tourCategories = ['History Excursion', 'Lighthouse Tour', 'Lighthouse Dinner', 'River Nature', 'Sunset Cruise', "Sip N' Sway", 'Water Taxi'];

const DEFAULT_POLICY = 'ALL SALES ARE FINAL. No refunds. The Lorain Port and Finance Authority reserves the right to cancel boat trips due to inclement weather and will exchange for future trips to the registrant. Customers will be notified of cancellations via phone and email.';
const SIP_N_SWAY_POLICY = DEFAULT_POLICY + '\n\nEach passenger is permitted to bring 36 oz. of beer or 18 oz. of wine. (Three 12 oz. cans OR a 32 oz. growler per person). You could also bring a 6-pack of beer or a full bottle of wine for two people to share. Absolutely NO liquor is allowed on board.';

const TOUR_DEFAULTS: Record<string, { name: string; description: string; departure_location: string; duration: string; price: string; age_restriction: string; booking_info: string }> = {
  'History Excursion': {
    name: 'History Excursion',
    description: `<p>Brush up on Lorain's past and learn the importance the waterways played in the development of the International City. This two-hour history tour is narrated by a Lorain Historical Society member and cruises past the Lorain Lighthouse and other historic landmarks along the Black River. Imagine what life was like in the early days of Lorain while passing the sites of industrial giants, American Shipbuilding and United States Steel, and witness the rebirth of wildlife preserves on the Black River.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '2 hours',
    price: '$25',
    age_restriction: '',
    booking_info: '',
  },
  'Lighthouse Tour': {
    name: 'Lighthouse Tour',
    description: `<p>Offered in conjunction with the Lorain Lighthouse Foundation, this cruise involves a shuttle ride to and from the historic Lorain Lighthouse, as well as a tour of the structure's interior. Learn about the history of the lighthouse as volunteers stand by to answer any questions you may have.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: 'Shuttles run every 45 minutes',
    price: '$25',
    age_restriction: '',
    booking_info: '',
  },
  'Lighthouse Dinner': {
    name: 'Lighthouse Dinner',
    description: `<p>Organized by the Lorain Lighthouse Foundation and offered every Tuesday from June 17 through September 16, 2025, this specialty cruise features a fantastic dining experience at the Lighthouse and a tour of the structure's interior. The dinner and wine pairings are provided by Lorain Brewing Company. To make a reservation, call 440-752-8955.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '',
    price: '',
    age_restriction: '',
    booking_info: '440-752-8955',
  },
  'River Nature': {
    name: 'River Nature',
    description: `<p>Cruise the shores of the beautiful Black River on an all-inclusive tour of Lorain's waterfront areas. This two-hour trip includes a tour of the river, the harbor, and a pass by the historic Lorain Lighthouse with narration provided by our captain.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '2 hours',
    price: '$20',
    age_restriction: '',
    booking_info: '',
  },
  'Sunset Cruise': {
    name: 'Sunset Cruise',
    description: `<p>Capture a breathtaking Lorain sunset while on the water. This 1.5-hour evening tour includes the harbor and a short distance up the Black River with narration provided by the captain. Cameras are recommended to snap a shot of the sun as it sets behind the historic Lorain Lighthouse.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '1.5 hours',
    price: '$20',
    age_restriction: '',
    booking_info: '',
  },
  "Sip N' Sway": {
    name: "Sip N' Sway",
    description: `<p>A River Nature Tour with a twist. Adults can bring a limited amount of beer or wine to enjoy during the captain-narrated Black River boat ride. Passengers must be aged 21 or older. You may bring a Bluetooth speaker to play music ONLY if you have booked the entire boat for your group.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '2 hours',
    price: '$25',
    age_restriction: '21+',
    booking_info: '',
  },
  'Water Taxi': {
    name: 'Water Taxi',
    description: `<p>Our FREE water taxi service is available during Rockin' on the River and other festivals/events. This service provides a convenient way to travel between Black River Landing, Alliance Marine at Port Lorain and The Shipyards (Lorain Brewing Company). The taxi follows a strict route from the three locations that repeats from 6pm-11:30pm on concert nights. The rounds start at Alliance Marine Dock A.</p>`,
    departure_location: 'Alliance Marine at Port Lorain Dock A',
    duration: '',
    price: 'Free',
    age_restriction: '',
    booking_info: '',
  },
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
}

export default function TourEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    name: '', slug: '', section: tourCategories[0], price: '', price_note: '/ person',
    description: '', duration: '', departure_location: 'Alliance Marine at Port Lorain Dock A',
    age_restriction: '', booking_info: '', sort_order: 0, is_published: true,
    peekpro_product_id: '', event_policy: DEFAULT_POLICY,
  });
  const [schedules, setSchedules] = useState<Partial<TourSchedule>[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const supabase = createClient();
      Promise.all([
        supabase.from('tours').select('*').eq('id', id).single(),
        supabase.from('tour_schedules').select('*').eq('tour_id', id).order('month_order'),
      ]).then(([tourRes, schedRes]) => {
        if (tourRes.data) setForm(prev => ({ ...prev, ...tourRes.data }));
        if (schedRes.data) setSchedules(schedRes.data);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const update = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  function handleCategoryChange(cat: string) {
    update('section', cat);
    const defaults = TOUR_DEFAULTS[cat];
    if (defaults) {
      setForm(prev => ({
        ...prev,
        section: cat,
        name: defaults.name || prev.name,
        description: defaults.description || prev.description,
        departure_location: defaults.departure_location || prev.departure_location,
        duration: defaults.duration || prev.duration,
        price: defaults.price || prev.price,
        age_restriction: defaults.age_restriction || prev.age_restriction,
        booking_info: defaults.booking_info || prev.booking_info,
        event_policy: cat === "Sip N' Sway" ? SIP_N_SWAY_POLICY : DEFAULT_POLICY,
      }));
      if (isNew) {
        update('slug', slugify(defaults.name));
      }
    }
  }

  function addScheduleMonth() {
    setSchedules([...schedules, {
      year: new Date().getFullYear(),
      month: '',
      month_order: schedules.length + 1,
      dates: [],
      source: 'manual',
    }]);
  }

  function updateSchedule(index: number, field: string, value: unknown) {
    setSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function removeSchedule(index: number) {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!form.name || !form.description) {
      alert('Name and description are required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const tourData = { ...form, slug: form.slug || slugify(form.name), peekpro_product_id: form.peekpro_product_id || null };

    let tourId = id;
    if (isNew) {
      const { data, error } = await supabase.from('tours').insert(tourData).select('id').single();
      if (error || !data) { alert('Error: ' + (error?.message || 'Unknown')); setSaving(false); return; }
      tourId = data.id;
    } else {
      const { error } = await supabase.from('tours').update(tourData).eq('id', id);
      if (error) { alert('Error: ' + error.message); setSaving(false); return; }
      // Delete existing manual schedules to re-insert
      await supabase.from('tour_schedules').delete().eq('tour_id', id).eq('source', 'manual');
    }

    // Insert schedules
    const manualSchedules = schedules.filter(s => s.source === 'manual' && s.month);
    if (manualSchedules.length > 0) {
      await supabase.from('tour_schedules').insert(
        manualSchedules.map(s => ({ ...s, tour_id: tourId }))
      );
    }

    await fetch('/api/revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/recreation', secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET }),
    }).catch(() => {});

    router.push('/admin/tours');
  }

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>{isNew ? 'New Tour' : 'Edit Tour'}</h1>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/tours')} className="admin-btn admin-btn-secondary">Cancel</button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Tour'}
          </button>
        </div>
      </div>

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <div className="admin-card">
            <div className="admin-form-group">
              <label>Tour Name</label>
              <input type="text" value={form.name} onChange={e => { update('name', e.target.value); if (isNew) update('slug', slugify(e.target.value)); }} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <RichTextEditor content={form.description} onChange={(val) => update('description', val)} />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Price</label>
                <input type="text" value={form.price} onChange={e => update('price', e.target.value)} placeholder="$25" />
              </div>
              <div className="admin-form-group">
                <label>Price Note</label>
                <input type="text" value={form.price_note || ''} onChange={e => update('price_note', e.target.value)} placeholder="/ person" />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Duration</label>
                <input type="text" value={form.duration || ''} onChange={e => update('duration', e.target.value)} placeholder="2 hours" />
              </div>
              <div className="admin-form-group">
                <label>Departure Location</label>
                <input type="text" value={form.departure_location || ''} onChange={e => update('departure_location', e.target.value)} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Age Restriction</label>
                <input type="text" value={form.age_restriction || ''} onChange={e => update('age_restriction', e.target.value)} placeholder="All ages" />
              </div>
              <div className="admin-form-group">
                <label>Booking Info</label>
                <input type="text" value={form.booking_info || ''} onChange={e => update('booking_info', e.target.value)} placeholder="Phone or URL" />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Tour Policy</label>
              <textarea value={form.event_policy || ''} onChange={e => update('event_policy', e.target.value)} rows={4} placeholder="Refund and cancellation policy" />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Schedule</h3>
              <button onClick={addScheduleMonth} className="admin-btn admin-btn-secondary" type="button">
                <i className="fas fa-plus"></i> Add Month
              </button>
            </div>

            {schedules.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>No schedule entries yet. Click &ldquo;Add Month&rdquo; to add dates.</p>
            ) : (
              schedules.map((sched, i) => (
                <div key={i} className="admin-schedule-row">
                  {sched.source === 'peekpro' && (
                    <div className="admin-badge" style={{ marginBottom: '0.5rem', background: '#05966915', color: '#059669' }}>
                      <i className="fas fa-sync"></i> Synced from PeekPro
                    </div>
                  )}
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Month</label>
                      <input type="text" value={sched.month || ''} onChange={e => updateSchedule(i, 'month', e.target.value)} placeholder="June" disabled={sched.source === 'peekpro'} />
                    </div>
                    <div className="admin-form-group">
                      <label>Year</label>
                      <input type="number" value={sched.year || new Date().getFullYear()} onChange={e => updateSchedule(i, 'year', parseInt(e.target.value))} disabled={sched.source === 'peekpro'} />
                    </div>
                    <div className="admin-form-group">
                      <label>Order</label>
                      <input type="number" value={sched.month_order || 0} onChange={e => updateSchedule(i, 'month_order', parseInt(e.target.value))} />
                    </div>
                    {sched.source !== 'peekpro' && (
                      <button onClick={() => removeSchedule(i)} className="admin-btn-icon danger" style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="admin-form-group">
                    <label>Dates (comma separated)</label>
                    <input
                      type="text"
                      value={(sched.dates || []).join(', ')}
                      onChange={e => updateSchedule(i, 'dates', e.target.value.split(',').map(d => d.trim()).filter(Boolean))}
                      placeholder="Sun, Jun 8 — 2pm, Fri, Jun 13 — 2pm"
                      disabled={sched.source === 'peekpro'}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-form-sidebar">
          <div className="admin-card">
            <h3>Settings</h3>
            <div className="admin-form-group">
              <label>Category</label>
              <select value={form.section} onChange={e => handleCategoryChange(e.target.value)}>
                {tourCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>URL Slug</label>
              <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => update('sort_order', parseInt(e.target.value) || 0)} />
            </div>
            <div className="admin-form-group">
              <label>PeekPro Product ID</label>
              <input type="text" value={form.peekpro_product_id || ''} onChange={e => update('peekpro_product_id', e.target.value)} placeholder="Optional — for auto-sync" />
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_published} onChange={e => update('is_published', e.target.checked)} />
                <span>Published</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
