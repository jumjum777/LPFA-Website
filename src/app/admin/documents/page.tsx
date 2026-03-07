'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BoardDocument } from '@/lib/types';

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<BoardDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    const supabase = createClient();
    const { data } = await supabase.from('board_documents').select('*').order('document_date', { ascending: false });
    setDocs(data || []);
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
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
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

  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Board Documents</h1>
          <p>Upload and manage board meeting documents.</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3>Upload New Document</h3>
        <div className="admin-form-row" style={{ alignItems: 'flex-end' }}>
          <div className="admin-form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. March 2026 Board Meeting Minutes" />
          </div>
          <div className="admin-form-group">
            <label>Meeting Date</label>
            <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label>PDF File</label>
            <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading || !title} />
          </div>
        </div>
        {uploading && <p><i className="fas fa-spinner fa-spin"></i> Uploading...</p>}
      </div>

      {loading ? <p>Loading...</p> : docs.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-file-pdf"></i>
          <p>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Date</th><th>File</th><th>Size</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td>{new Date(doc.document_date).toLocaleDateString()}</td>
                  <td><a href={doc.file_url} target="_blank" rel="noopener">{doc.file_name}</a></td>
                  <td>{formatFileSize(doc.file_size ?? undefined)}</td>
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
      )}
    </div>
  );
}
