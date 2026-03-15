'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BoardDocument } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'agenda', label: 'Agenda', color: '#1B8BEB', icon: 'fa-clipboard-list' },
  { value: 'minutes', label: 'Minutes', color: '#059669', icon: 'fa-file-alt' },
  { value: 'resolution', label: 'Resolution', color: '#D97706', icon: 'fa-gavel' },
  { value: 'board_packet', label: 'Board Packet', color: '#7C3AED', icon: 'fa-folder-open' },
] as const;

type DocFilter = 'all' | 'agenda' | 'minutes' | 'resolution' | 'board_packet';

function typeLabel(type: string) {
  return DOC_TYPES.find(t => t.value === type)?.label || type;
}

function typeColor(type: string) {
  return DOC_TYPES.find(t => t.value === type)?.color || '#64748B';
}

function typeIcon(type: string) {
  return DOC_TYPES.find(t => t.value === type)?.icon || 'fa-file';
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<BoardDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docType, setDocType] = useState<string>('minutes');
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<DocFilter>('all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    try {
      const res = await fetch('/api/admin/documents');
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (err) {
      console.error('Documents load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !title) {
      alert('Please enter a title and select a PDF file.');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const year = new Date(docDate).getFullYear();
    const path = `${year}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('board-documents').upload(path, file);
    if (uploadError) {
      alert('Upload error: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('board-documents').getPublicUrl(path);

    const { error: insertError } = await supabase.from('board_documents').insert({
      title,
      document_date: docDate,
      document_type: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      is_published: true,
    });

    if (insertError) {
      alert('Error saving: ' + insertError.message);
      setUploading(false);
      return;
    }

    setTitle('');
    setUploading(false);
    setShowUpload(false);
    e.target.value = '';
    loadDocs();
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    const supabase = createClient();
    await supabase.from('board_documents').delete().eq('id', id);
    setDocs(docs.filter(d => d.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('board_documents').update({ is_published: !current }).eq('id', id);
    setDocs(docs.map(d => d.id === id ? { ...d, is_published: !current } : d));
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const years = Array.from(new Set(docs.map(d => new Date(d.document_date + 'T12:00:00').getFullYear())))
    .sort((a, b) => b - a);

  const yearFiltered = docs.filter(d => new Date(d.document_date + 'T12:00:00').getFullYear() === selectedYear);

  const months = Array.from(new Set(yearFiltered.map(d => new Date(d.document_date + 'T12:00:00').getMonth())))
    .sort((a, b) => b - a);

  const monthFiltered = selectedMonth !== null
    ? yearFiltered.filter(d => new Date(d.document_date + 'T12:00:00').getMonth() === selectedMonth)
    : yearFiltered;

  const typeFiltered = typeFilter !== 'all'
    ? monthFiltered.filter(d => d.document_type === typeFilter)
    : monthFiltered;

  const filtered = search
    ? typeFiltered.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase()))
    : typeFiltered;

  // Type counts for filter tabs
  const typeCounts: Record<DocFilter, number> = {
    all: monthFiltered.length,
    agenda: monthFiltered.filter(d => d.document_type === 'agenda').length,
    minutes: monthFiltered.filter(d => d.document_type === 'minutes').length,
    resolution: monthFiltered.filter(d => d.document_type === 'resolution').length,
    board_packet: monthFiltered.filter(d => d.document_type === 'board_packet').length,
  };

  // Group by date
  const grouped: Record<string, BoardDocument[]> = {};
  for (const doc of filtered) {
    const key = doc.document_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Meeting dates count
  const meetingDates = new Set(yearFiltered.map(d => d.document_date)).size;

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Meeting Minutes</h1></div>
        <div className="analytics-loading-card">
          <div className="lighthouse-loading-scene">
            <div className="lighthouse-beam"></div>
            <div className="lighthouse-tower">
              <div className="lighthouse-lamp"></div>
              <div className="lighthouse-top"></div>
              <div className="lighthouse-body">
                <div className="lighthouse-stripe"></div>
                <div className="lighthouse-stripe"></div>
              </div>
              <div className="lighthouse-base"></div>
            </div>
            <div className="lighthouse-water">
              <div className="analytics-water-wave analytics-water-wave-1"></div>
              <div className="analytics-water-wave analytics-water-wave-2"></div>
            </div>
          </div>
          <h3 className="analytics-loading-title">Loading Documents...</h3>
          <p className="analytics-loading-step">Fetching meeting minutes...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
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
          <h1><i className="fas fa-gavel mr-2 text-blue"></i> Meeting Minutes</h1>
          <p>Upload and manage board meeting documents.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowUpload(!showUpload)}>
          <i className={`fas fa-${showUpload ? 'times' : 'plus'}`}></i> {showUpload ? 'Close' : 'Upload Document'}
        </button>
      </div>

      {/* Upload Form (collapsible) */}
      {showUpload && (
        <div className="admin-card mb-6" style={{ borderLeft: '3px solid #1B8BEB' }}>
          <h3 className="mb-4 text-base">
            <i className="fas fa-cloud-upload-alt mr-1.5 text-blue"></i> Upload Document
          </h3>
          <div className="admin-form-row" style={{ alignItems: 'flex-end' }}>
            <div className="admin-form-group" style={{ flex: 2 }}>
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Regular Meeting Minutes, Resolution 2026-01"
              />
            </div>
            <div className="admin-form-group">
              <label>Meeting Date</label>
              <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)}>
                {DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>PDF File</label>
              <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading || !title} />
            </div>
          </div>
          {uploading && (
            <p className="mt-3 text-sm text-blue">
              <i className="fas fa-spinner fa-spin mr-1"></i> Uploading...
            </p>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-file-pdf"></i></div>
          <div className="rotr-stat-value">{docs.length}</div>
          <div className="rotr-stat-label">Total Documents</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-calendar-check"></i></div>
          <div className="rotr-stat-value">{meetingDates}</div>
          <div className="rotr-stat-label">Meeting Dates ({selectedYear})</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-file-alt"></i></div>
          <div className="rotr-stat-value">{typeCounts.minutes}</div>
          <div className="rotr-stat-label">Minutes</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-gavel"></i></div>
          <div className="rotr-stat-value">{typeCounts.resolution}</div>
          <div className="rotr-stat-label">Resolutions</div>
        </div>
      </div>

      {/* Year Tabs */}
      {docs.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {years.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setSelectedMonth(null); setSearch(''); setTypeFilter('all'); }}
                className={`admin-year-tab${year === selectedYear ? ' active' : ''}`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Month Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
            <button
              onClick={() => { setSelectedMonth(null); setSearch(''); }}
              className={`admin-year-tab admin-month-tab${selectedMonth === null ? ' active' : ''}`}
            >
              All Months
            </button>
            {months.map(m => (
              <button
                key={m}
                onClick={() => { setSelectedMonth(m); setSearch(''); }}
                className={`admin-year-tab admin-month-tab${selectedMonth === m ? ' active' : ''}`}
              >
                {MONTH_NAMES[m]}
              </button>
            ))}
          </div>

          {/* Type Filter Tabs */}
          <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {(['all', 'agenda', 'minutes', 'resolution', 'board_packet'] as DocFilter[]).map(t => (
              <button key={t} className={`admin-filter-tab shrink-0${typeFilter === t ? ' active' : ''}`} onClick={() => setTypeFilter(t)}>
                {t === 'all' ? 'All Types' : typeLabel(t)}
                <span className="admin-filter-count">{typeCounts[t]}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="max-w-md relative" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
            <input type="text"
              className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
              placeholder={`Search ${selectedMonth !== null ? MONTH_NAMES[selectedMonth] + ' ' : ''}${selectedYear} documents...`}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </>
      )}

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-file-pdf"></i>
          <p>No documents uploaded yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-search"></i>
          <p>No documents match your filters.</p>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem',
              paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className="fas fa-calendar-day text-blue" style={{ fontSize: '0.85rem' }}></i>
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '0.25rem' }}>
                {grouped[date].length} doc{grouped[date].length !== 1 ? 's' : ''}
              </span>
            </h3>
            <div className="admin-table-wrap overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[date].map(doc => (
                    <tr key={doc.id} style={!doc.is_published ? { opacity: 0.55 } : undefined}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${typeColor(doc.document_type)}12`, color: typeColor(doc.document_type), fontSize: '0.95rem' }}>
                            <i className={`fas ${typeIcon(doc.document_type)}`}></i>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                              {doc.title}
                            </a>
                            <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                              <i className="fas fa-file-pdf" style={{ marginRight: '0.25rem', fontSize: '0.65rem', color: '#ef4444' }}></i>
                              {doc.file_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="admin-badge" style={{ background: `${typeColor(doc.document_type)}15`, color: typeColor(doc.document_type) }}>
                          {typeLabel(doc.document_type)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#64748B' }}>
                        {formatFileSize(doc.file_size ?? undefined)}
                      </td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <div
                            onClick={() => togglePublished(doc.id, doc.is_published)}
                            style={{
                              width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                              background: doc.is_published ? '#16a34a' : '#374151', transition: 'background 0.2s', cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: '0.175rem',
                              left: doc.is_published ? '1.3rem' : '0.2rem',
                              transition: 'left 0.2s',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: doc.is_published ? '#16a34a' : '#94a3b8' }}>
                            {doc.is_published ? 'Live' : 'Hidden'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View PDF">
                            <i className="fas fa-external-link-alt"></i>
                          </a>
                          <button onClick={() => deleteDoc(doc.id)} className="admin-btn-icon danger" title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
