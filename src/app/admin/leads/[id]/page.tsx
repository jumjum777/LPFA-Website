'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

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
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setLead(data);
        setStatus(data.status);
        setNotes(data.notes || '');
        // Auto-mark as read if new
        if (data.status === 'new') {
          await supabase
            .from('contact_submissions')
            .update({ status: 'read' })
            .eq('id', id);
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
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status, notes: notes || null })
      .eq('id', id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);
    if (!error) router.push('/admin/leads');
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="admin-page">
        <p>Lead not found.</p>
        <Link href="/admin/leads" className="admin-btn admin-btn-secondary">
          <i className="fas fa-arrow-left"></i> Back to Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link href="/admin/leads" className="admin-back-link">
            <i className="fas fa-arrow-left"></i> Back to Inbox
          </Link>
          <h1>{lead.first_name} {lead.last_name}</h1>
          <p>Submitted {formatDate(lead.created_at)}</p>
        </div>
        <div className="admin-header-actions">
          <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleDelete} className="admin-btn admin-btn-danger">
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>

      <div className="lead-detail-grid">
        <div className="admin-card lead-detail-main">
          <h3>Message</h3>
          <div className="lead-detail-field">
            <span className="lead-detail-label">Subject</span>
            <span className="lead-detail-value">{SUBJECT_LABELS[lead.subject] || lead.subject}</span>
          </div>
          <div className="lead-detail-field">
            <span className="lead-detail-label">Message</span>
            <div className="lead-detail-message">{lead.message}</div>
          </div>
        </div>

        <div className="lead-detail-sidebar">
          <div className="admin-card">
            <h3>Contact Info</h3>
            <div className="lead-detail-field">
              <span className="lead-detail-label">Name</span>
              <span className="lead-detail-value">{lead.first_name} {lead.last_name}</span>
            </div>
            <div className="lead-detail-field">
              <span className="lead-detail-label">Email</span>
              <a href={`mailto:${lead.email}`} className="lead-detail-value">{lead.email}</a>
            </div>
            {lead.phone && (
              <div className="lead-detail-field">
                <span className="lead-detail-label">Phone</span>
                <a href={`tel:${lead.phone}`} className="lead-detail-value">{lead.phone}</a>
              </div>
            )}
            {lead.organization && (
              <div className="lead-detail-field">
                <span className="lead-detail-label">Organization</span>
                <span className="lead-detail-value">{lead.organization}</span>
              </div>
            )}
            <div className="lead-detail-field">
              <span className="lead-detail-label">Newsletter</span>
              <span className="lead-detail-value">{lead.newsletter ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="admin-card">
            <h3>Status & Notes</h3>
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
              <textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this lead..."
                rows={4}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
