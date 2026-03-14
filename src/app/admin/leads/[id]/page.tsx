'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string;
  organization: string | null;
  message: string;
  newsletter: boolean;
  status: string;
  notes: string | null;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  development: 'Economic Development & Financing',
  brownfields: 'Brownfields Program',
  rfp: 'RFPs & Bids',
  events: 'Events & Programming',
  'boat-tours': 'Boat Tours & Recreation',
  'facility-rental': 'Facility Rental Inquiry',
  media: 'Media & Press',
  general: 'General Inquiry',
};

const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
  development: { icon: 'fa-building', color: '#1B8BEB' },
  brownfields: { icon: 'fa-leaf', color: '#059669' },
  rfp: { icon: 'fa-file-contract', color: '#7C3AED' },
  events: { icon: 'fa-calendar-alt', color: '#D97706' },
  'boat-tours': { icon: 'fa-ship', color: '#0EA5E9' },
  'facility-rental': { icon: 'fa-warehouse', color: '#6366F1' },
  media: { icon: 'fa-newspaper', color: '#EF4444' },
  general: { icon: 'fa-envelope', color: '#64748B' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadLead() {
      const supabase = createClient();
      const { data } = await supabase.from('contact_submissions').select('*').eq('id', id).single();
      if (data) {
        setLead(data);
        setStatus(data.status);
        setNotes(data.notes || '');
        if (data.status === 'new') {
          await supabase.from('contact_submissions').update({ status: 'read' }).eq('id', id);
          setLead({ ...data, status: 'read' });
          setStatus('read');
        }
      }
      setLoading(false);
    }
    loadLead();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('contact_submissions').update({ status, notes: notes || null }).eq('id', id);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
    if (!error) router.push('/admin/leads');
  }

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Message</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading message...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="admin-page">
        <div className="admin-card p-8 text-center">
          <i className="fas fa-exclamation-triangle text-2xl text-amber-500"></i>
          <p className="mt-2">Message not found.</p>
          <Link href="/admin/leads" className="admin-btn admin-btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            <i className="fas fa-arrow-left"></i> Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  const subj = SUBJECT_ICONS[lead.subject] || SUBJECT_ICONS.general;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <Link href="/admin/leads" className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to Inbox
          </Link>
          <h1><i className="fas fa-envelope-open-text mr-2 text-blue"></i> {lead.first_name} {lead.last_name}</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            <i className="fas fa-clock mr-1"></i> {formatDate(lead.created_at)}
          </p>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => router.push('/admin/leads')} className="admin-btn admin-btn-secondary">Cancel</button>
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving}>
            {saved ? <><i className="fas fa-check"></i> Saved!</> : saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}
          </button>
          <button onClick={handleDelete} className="admin-btn admin-btn-secondary text-red-600" title="Delete">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <div className="admin-form-layout">
        {/* Main - Message */}
        <div className="admin-form-main">
          <div className="admin-card">
            <h3 className="mb-4 text-base">
              <i className={`fas ${subj.icon} mr-1.5`} style={{ color: subj.color }}></i>
              {SUBJECT_LABELS[lead.subject] || lead.subject}
            </h3>
            <div style={{
              padding: '1.25rem', borderRadius: '8px',
              background: 'var(--hover-bg, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              lineHeight: 1.7, fontSize: '0.95rem',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {lead.message}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="admin-form-sidebar">
          {/* Contact Info */}
          <div className="admin-card">
            <h3 className="mb-4 text-base">
              <i className="fas fa-user mr-1.5 text-blue"></i> Contact Info
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>Name</div>
                <div style={{ fontWeight: 500 }}>{lead.first_name} {lead.last_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>Email</div>
                <a href={`mailto:${lead.email}`} style={{ color: 'var(--blue-accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  <i className="fas fa-envelope" style={{ fontSize: '0.75rem', marginRight: '0.35rem' }}></i>{lead.email}
                </a>
              </div>
              {lead.phone && (
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>Phone</div>
                  <a href={`tel:${lead.phone}`} style={{ color: 'var(--blue-accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <i className="fas fa-phone" style={{ fontSize: '0.75rem', marginRight: '0.35rem' }}></i>{lead.phone}
                  </a>
                </div>
              )}
              {lead.organization && (
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>Organization</div>
                  <div style={{ fontSize: '0.9rem' }}><i className="fas fa-building" style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '0.35rem' }}></i>{lead.organization}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>Newsletter</div>
                <div style={{ fontSize: '0.9rem' }}>
                  {lead.newsletter
                    ? <span style={{ color: '#16a34a' }}><i className="fas fa-check-circle" style={{ marginRight: '0.35rem' }}></i>Subscribed</span>
                    : <span style={{ color: '#94a3b8' }}><i className="fas fa-times-circle" style={{ marginRight: '0.35rem' }}></i>No</span>
                  }
                </div>
              </div>
            </div>

          </div>

          {/* Status & Notes */}
          <div className="admin-card" style={{ marginTop: '1rem' }}>
            <h3 className="mb-4 text-base">
              <i className="fas fa-cog mr-1.5 text-slate-400"></i> Status & Notes
            </h3>
            <div className="admin-form-group">
              <label htmlFor="lead-status">Status</label>
              <select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label htmlFor="lead-notes">Internal Notes</label>
              <textarea id="lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this lead..." rows={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
