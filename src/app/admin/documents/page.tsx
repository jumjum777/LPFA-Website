'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BoardDocument } from '@/lib/types';

const DOC_TYPES = [
  { value: 'agenda', label: 'Agenda', color: '#1B8BEB' },
  { value: 'minutes', label: 'Minutes', color: '#059669' },
  { value: 'resolution', label: 'Resolution', color: '#D97706' },
  { value: 'board_packet', label: 'Board Packet', color: '#7C3AED' },
] as const;

function typeLabel(type: string) {
  return DOC_TYPES.find(t => t.value === type)?.label || type;
}

function typeColor(type: string) {
  return DOC_TYPES.find(t => t.value === type)?.color || '#64748B';
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

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

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    const supabase = createClient();
    const allDocs: BoardDocument[] = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data } = await supabase
        .from('board_documents')
        .select('*')
        .order('document_date', { ascending: false })
        .order('document_type')
        .order('title')
        .range(from, from + batchSize - 1);
      if (!data || data.length === 0) break;
      allDocs.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }
    setDocs(allDocs);
    setLoading(false);
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
    e.target.value = '';
    loadDocs();
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    const supabase = createClient();
    await supabase.from('board_documents').delete().eq('id', id);
    setDocs(docs.filter(d => d.id !== id));
  }

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Compute available years
  const years = Array.from(new Set(docs.map(d => new Date(d.document_date + 'T12:00:00').getFullYear())))
    .sort((a, b) => b - a);

  // Filter by year
  const yearFiltered = docs.filter(d => new Date(d.document_date + 'T12:00:00').getFullYear() === selectedYear);

  // Compute available months within the selected year
  const months = Array.from(new Set(yearFiltered.map(d => new Date(d.document_date + 'T12:00:00').getMonth())))
    .sort((a, b) => b - a);

  // Filter by month (if selected), then by search
  const monthFiltered = selectedMonth !== null
    ? yearFiltered.filter(d => new Date(d.document_date + 'T12:00:00').getMonth() === selectedMonth)
    : yearFiltered;
  const filtered = search
    ? monthFiltered.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : monthFiltered;

  // Group by date
  const grouped: Record<string, BoardDocument[]> = {};
  for (const doc of filtered) {
    const key = doc.document_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Meeting Minutes</h1>
          <p>Upload and manage board meeting documents.</p>
        </div>
      </div>

      {/* UPLOAD FORM */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3>Upload Document</h3>
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
        {uploading && <p style={{ marginTop: '0.75rem' }}><i className="fas fa-spinner fa-spin"></i> Uploading...</p>}
      </div>

      {/* YEAR TABS + SEARCH */}
      {!loading && docs.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {years.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setSelectedMonth(null); setSearch(''); }}
                className={`admin-year-tab${year === selectedYear ? ' active' : ''}`}
              >
                {year}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
            <button
              onClick={() => { setSelectedMonth(null); setSearch(''); }}
              className={`admin-year-tab admin-month-tab${selectedMonth === null ? ' active' : ''}`}
            >
              All
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${selectedMonth !== null ? MONTH_NAMES[selectedMonth] + ' ' : ''}${selectedYear} documents...`}
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
              {filtered.length} document{filtered.length !== 1 ? 's' : ''} in {selectedMonth !== null ? MONTH_NAMES[selectedMonth] + ' ' : ''}{selectedYear}
            </span>
          </div>
        </div>
      )}

      {/* DOCUMENT LIST */}
      {loading ? <p>Loading...</p> : docs.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-file-pdf"></i>
          <p>No documents uploaded yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-search"></i>
          <p>No documents match your search.</p>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#0B1F3A',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #e2e8f0',
            }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>File</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[date].map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: `${typeColor(doc.document_type)}15`,
                            color: typeColor(doc.document_type),
                          }}
                        >
                          {typeLabel(doc.document_type)}
                        </span>
                      </td>
                      <td>{doc.title}</td>
                      <td>
                        <a href={doc.file_url} target="_blank" rel="noopener" style={{ fontSize: '0.82rem' }}>
                          {doc.file_name}
                        </a>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#64748B' }}>
                        {formatFileSize(doc.file_size ?? undefined)}
                      </td>
                      <td>
                        <button onClick={() => deleteDoc(doc.id)} className="admin-btn-icon danger" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
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
