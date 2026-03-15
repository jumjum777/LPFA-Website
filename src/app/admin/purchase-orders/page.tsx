'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PurchaseOrder, POLineItem } from '@/lib/types';

// ─── Constants ──────────────────────────────────────────────────────────────

type POStatus = 'all' | 'draft' | 'pending_approval' | 'approved' | 'denied' | 'completed' | 'archived';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  denied: 'Denied',
  completed: 'Completed',
  archived: 'Archived',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  pending_approval: { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#dcfce7', color: '#166534' },
  denied: { bg: '#fee2e2', color: '#DC2626' },
  completed: { bg: '#dbeafe', color: '#1e40af' },
  archived: { bg: '#f1f5f9', color: '#94a3b8' },
};

const CATEGORIES = [
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'services', label: 'Services' },
  { value: 'catering', label: 'Catering' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  normal: 'Normal',
  urgent: 'Urgent',
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  low: { bg: '#f1f5f9', color: '#64748b' },
  normal: { bg: '#e2e8f0', color: '#0B1F3A' },
  urgent: { bg: '#fee2e2', color: '#DC2626' },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Shared input class ─────────────────────────────────────────────────────

const inputClass = 'w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors';

// ─── Empty Form State ───────────────────────────────────────────────────────

const emptyLineItem: POLineItem = { description: '', qty: 1, unit_price: 0 };

const emptyForm = {
  context: 'lpfa' as 'lpfa' | 'rotr',
  title: '',
  vendor_name: '',
  vendor_contact: '',
  category: 'supplies',
  line_items: [{ ...emptyLineItem }] as POLineItem[],
  tax: '',
  priority: 'normal' as 'low' | 'normal' | 'urgent',
  needed_by: '',
  notes: '',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<POStatus>('all');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Detail view
  const [detailId, setDetailId] = useState<string | null>(null);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User info
  const [userName, setUserName] = useState('');

  // ─── Data Loading ───────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => { if (d.user?.display_name) setUserName(d.user.display_name); })
      .catch(() => {});
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/purchase-orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Purchase orders load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── PO Number Generation ──────────────────────────────────────────────

  function generatePONumber() {
    const year = new Date().getFullYear();
    const yearOrders = orders.filter(o => o.po_number.startsWith(`PO-${year}-`));
    const maxNum = yearOrders.reduce((max, o) => {
      const num = parseInt(o.po_number.split('-')[2], 10);
      return num > max ? num : max;
    }, 0);
    return `PO-${year}-${String(maxNum + 1).padStart(4, '0')}`;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────

  function openCreateModal() {
    setForm({ ...emptyForm, line_items: [{ ...emptyLineItem }] });
    setEditingId(null);
    setUploadedReceipts([]);
    setShowModal(true);
  }

  function openEditModal(po: PurchaseOrder) {
    setForm({
      context: po.context,
      title: po.title,
      vendor_name: po.vendor_name,
      vendor_contact: po.vendor_contact || '',
      category: po.category,
      line_items: po.line_items.length > 0 ? po.line_items : [{ ...emptyLineItem }],
      tax: po.tax > 0 ? String(po.tax) : '',
      priority: po.priority,
      needed_by: po.needed_by || '',
      notes: po.notes || '',
    });
    setEditingId(po.id);
    setUploadedReceipts(po.receipt_urls || []);
    setShowModal(true);
  }

  function calcSubtotal(items: POLineItem[]) {
    return items.reduce((s, i) => s + (i.qty * i.unit_price), 0);
  }

  async function savePO(status: 'draft' | 'pending_approval') {
    if (!form.title.trim() || !form.vendor_name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    const subtotal = calcSubtotal(form.line_items);
    const tax = parseFloat(form.tax) || 0;
    const total = subtotal + tax;

    const payload = {
      context: form.context,
      title: form.title.trim(),
      vendor_name: form.vendor_name.trim(),
      vendor_contact: form.vendor_contact.trim() || null,
      category: form.category,
      line_items: form.line_items.filter(i => i.description.trim()),
      subtotal,
      tax,
      total_amount: total,
      requested_by: userName || 'Admin',
      needed_by: form.needed_by || null,
      priority: form.priority,
      status,
      receipt_urls: uploadedReceipts,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('purchase_orders').update(payload).eq('id', editingId);
      if (error) { alert('Failed to update: ' + error.message); setSaving(false); return; }
      setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...payload } as PurchaseOrder : o));
    } else {
      const po_number = generatePONumber();
      const { data, error } = await supabase.from('purchase_orders').insert({ ...payload, po_number }).select().single();
      if (error) { alert('Failed to create: ' + error.message); setSaving(false); return; }
      setOrders(prev => [data as PurchaseOrder, ...prev]);
    }

    setSaving(false);
    setShowModal(false);
  }

  async function deletePO(id: string) {
    if (!confirm('Delete this purchase order permanently?')) return;
    const supabase = createClient();
    await supabase.from('purchase_orders').delete().eq('id', id);
    setOrders(prev => prev.filter(o => o.id !== id));
    if (detailId === id) setDetailId(null);
  }

  async function updateStatus(id: string, status: string, extra?: Partial<PurchaseOrder>) {
    const supabase = createClient();
    const updates = { status, updated_at: new Date().toISOString(), ...extra };
    const { error } = await supabase.from('purchase_orders').update(updates).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } as PurchaseOrder : o));
    }
  }

  async function approvePO(id: string) {
    await updateStatus(id, 'approved', {
      approved_by: userName || 'Admin',
      approved_at: new Date().toISOString(),
    });
  }

  async function denyPO(id: string) {
    const reason = prompt('Reason for denial:');
    if (reason === null) return;
    await updateStatus(id, 'denied', {
      denial_reason: reason || null,
      approved_by: userName || 'Admin',
      approved_at: new Date().toISOString(),
    });
  }

  // ─── File Upload ──────────────────────────────────────────────────────

  async function uploadReceipt(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `purchase-orders/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage.from('new-images').upload(path, file);
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('new-images').getPublicUrl(path);
    setUploadedReceipts(prev => [...prev, urlData.publicUrl]);
    setUploading(false);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadReceipt(file);
  }

  // ─── PDF Export ───────────────────────────────────────────────────────

  async function exportPDF(po: PurchaseOrder) {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentW = pageW - margin * 2;
    let y = margin;

    doc.setFillColor(11, 31, 58);
    doc.rect(0, 0, pageW, 80, 'F');
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 80, pageW, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PURCHASE ORDER', margin, 35);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(po.context === 'rotr' ? "Rockin' On The River" : 'Lorain Port & Finance Authority', margin, 55);
    doc.setFontSize(10);
    doc.text(po.po_number, margin, 70);

    const statusText = STATUS_LABELS[po.status] || po.status;
    const statusW = doc.getTextWidth(statusText.toUpperCase()) + 16;
    if (po.status === 'approved') doc.setFillColor(22, 101, 52);
    else if (po.status === 'denied') doc.setFillColor(220, 38, 38);
    else if (po.status === 'pending_approval') doc.setFillColor(146, 64, 14);
    else doc.setFillColor(100, 116, 139);
    doc.roundedRect(pageW - margin - statusW, 25, statusW, 22, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(statusText.toUpperCase(), pageW - margin - statusW / 2, 40, { align: 'center' });

    y = 105;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('DATE', margin, y);
    doc.text('VENDOR', margin + 160, y);
    doc.text('CATEGORY', margin + 350, y);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    y += 14;
    doc.text(formatDate(po.created_at), margin, y);
    doc.text(po.vendor_name, margin + 160, y);
    doc.text(CATEGORIES.find(c => c.value === po.category)?.label || po.category, margin + 350, y);

    y += 10;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('REQUESTED BY', margin, y + 10);
    doc.text('PRIORITY', margin + 160, y + 10);
    if (po.needed_by) doc.text('NEEDED BY', margin + 350, y + 10);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    y += 24;
    doc.text(po.requested_by, margin, y);
    doc.text(PRIORITY_LABELS[po.priority] || po.priority, margin + 160, y);
    if (po.needed_by) doc.text(formatDate(po.needed_by), margin + 350, y);

    if (po.vendor_contact) {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('VENDOR CONTACT', margin, y + 16);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text(po.vendor_contact, margin, y + 28);
      y += 28;
    }

    y += 25;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentW, 30, 4, 4, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(po.title, margin + 12, y + 19);
    y += 42;

    const cols = [
      { label: 'Description', x: margin, w: 280 },
      { label: 'Qty', x: margin + 280, w: 60 },
      { label: 'Unit Price', x: margin + 340, w: 90 },
      { label: 'Total', x: margin + 430, w: 102 },
    ];

    doc.setFillColor(11, 31, 58);
    doc.rect(margin, y, contentW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    cols.forEach(col => doc.text(col.label.toUpperCase(), col.x + 6, y + 15));
    y += 22;

    po.line_items.forEach((item, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 100) { doc.addPage(); y = margin; }
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, contentW, 22, 'F'); }
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 22, margin + contentW, y + 22);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(item.description, cols[0].x + 6, y + 14);
      doc.text(String(item.qty), cols[1].x + 6, y + 14);
      doc.text(formatCurrency(item.unit_price), cols[2].x + 6, y + 14);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(item.qty * item.unit_price), cols[3].x + 6, y + 14);
      y += 22;
    });

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin + 340, y, margin + contentW, y);
    y += 16;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal', margin + 350, y);
    doc.setTextColor(30, 41, 59);
    doc.text(formatCurrency(po.subtotal), margin + 436, y);
    y += 16;
    doc.setTextColor(100, 116, 139);
    doc.text('Tax', margin + 350, y);
    doc.setTextColor(30, 41, 59);
    doc.text(formatCurrency(po.tax), margin + 436, y);
    y += 4;
    doc.setDrawColor(11, 31, 58);
    doc.setLineWidth(1.5);
    doc.line(margin + 340, y + 4, margin + contentW, y + 4);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 31, 58);
    doc.text('TOTAL', margin + 350, y);
    doc.text(formatCurrency(po.total_amount), margin + 436, y);

    if (po.notes) {
      y += 30;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('NOTES', margin, y);
      y += 14;
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(po.notes, contentW - 12);
      doc.text(noteLines, margin, y);
    }

    y += 30;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SUBMITTED BY', margin, y);
    if (po.approved_by) doc.text(po.status === 'denied' ? 'DENIED BY' : 'APPROVED BY', margin + 250, y);
    y += 14;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(po.requested_by, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(formatDateTime(po.created_at), margin, y + 12);

    if (po.approved_by) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(po.approved_by, margin + 250, y);
      if (po.approved_at) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(formatDateTime(po.approved_at), margin + 250, y + 12);
      }
    }
    y += 12;

    if (po.denial_reason) {
      y += 16;
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Reason: ${po.denial_reason}`, margin + 250, y);
    }

    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.line(margin, footerY - 8, margin + contentW, footerY - 8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Lorain Port & Finance Authority  ·  319 Black River Lane, Lorain, OH 44052', margin, footerY);
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + contentW, footerY, { align: 'right' });

    doc.save(`${po.po_number}.pdf`);
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<POStatus, number> = {
    all: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    pending_approval: orders.filter(o => o.status === 'pending_approval').length,
    approved: orders.filter(o => o.status === 'approved').length,
    denied: orders.filter(o => o.status === 'denied').length,
    completed: orders.filter(o => o.status === 'completed').length,
    archived: orders.filter(o => o.status === 'archived').length,
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.po_number.toLowerCase().includes(q) || o.title.toLowerCase().includes(q) || o.vendor_name.toLowerCase().includes(q) || o.requested_by.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPending = orders.filter(o => o.status === 'pending_approval').reduce((s, o) => s + o.total_amount, 0);
  const totalApproved = orders.filter(o => o.status === 'approved' || o.status === 'completed').reduce((s, o) => s + o.total_amount, 0);

  // ─── Detail View ──────────────────────────────────────────────────────

  const detailPO = detailId ? orders.find(o => o.id === detailId) : null;

  if (detailPO) {
    const sc = STATUS_COLORS[detailPO.status] || STATUS_COLORS.draft;
    return (
      <div className="admin-page">
        <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue bg-transparent border-none cursor-pointer p-0" onClick={() => setDetailId(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
          <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }}></i> Back to Orders
        </button>

        {/* Header card */}
        <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="!m-0"><i className="fas fa-file-invoice mr-2 text-blue"></i>{detailPO.po_number}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>
                  {STATUS_LABELS[detailPO.status]}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white uppercase ${detailPO.context === 'rotr' ? 'bg-navy' : 'bg-blue'}`}>
                  {detailPO.context}
                </span>
              </div>
              <h3 className="mt-1 font-normal text-slate-500 dark:text-slate-400">{detailPO.title}</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(detailPO.status === 'pending_approval') && (
                <>
                  <button className="admin-btn bg-green-800 text-white border-none hover:bg-green-900" onClick={() => approvePO(detailPO.id)}>
                    <i className="fas fa-check"></i> Approve
                  </button>
                  <button className="admin-btn bg-red-600 text-white border-none hover:bg-red-700" onClick={() => denyPO(detailPO.id)}>
                    <i className="fas fa-times"></i> Deny
                  </button>
                </>
              )}
              {(detailPO.status === 'draft' || detailPO.status === 'denied') && (
                <button className="admin-btn admin-btn-secondary" onClick={() => openEditModal(detailPO)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
              )}
              {detailPO.status === 'approved' && (
                <button className="admin-btn admin-btn-secondary" onClick={() => updateStatus(detailPO.id, 'completed')}>
                  <i className="fas fa-check-double"></i> Mark Complete
                </button>
              )}
              <button className="admin-btn admin-btn-secondary" onClick={() => exportPDF(detailPO)}>
                <i className="fas fa-file-pdf"></i> Export PDF
              </button>
              {detailPO.status !== 'archived' && (
                <button className="admin-btn admin-btn-secondary" onClick={() => updateStatus(detailPO.id, 'archived')}>
                  <i className="fas fa-archive"></i> Archive
                </button>
              )}
              <button className="admin-btn admin-btn-secondary text-red-600" onClick={() => deletePO(detailPO.id)}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mt-5">
            <div>
              <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Vendor</strong>
              <div className="text-slate-800 dark:text-slate-200">{detailPO.vendor_name}</div>
              {detailPO.vendor_contact && <div className="text-sm text-slate-500">{detailPO.vendor_contact}</div>}
            </div>
            <div>
              <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Category</strong>
              <div className="text-slate-800 dark:text-slate-200">{CATEGORIES.find(c => c.value === detailPO.category)?.label || detailPO.category}</div>
            </div>
            <div>
              <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Priority</strong>
              <div><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ ...PRIORITY_COLORS[detailPO.priority] }}>{PRIORITY_LABELS[detailPO.priority]}</span></div>
            </div>
            <div>
              <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Requested By</strong>
              <div className="text-slate-800 dark:text-slate-200">{detailPO.requested_by}</div>
            </div>
            <div>
              <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Created</strong>
              <div className="text-slate-800 dark:text-slate-200">{formatDateTime(detailPO.created_at)}</div>
            </div>
            {detailPO.needed_by && (
              <div>
                <strong className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Needed By</strong>
                <div className="text-slate-800 dark:text-slate-200">{formatDate(detailPO.needed_by)}</div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
            <h4 className="mb-2 text-xs uppercase text-slate-500 dark:text-slate-400">
              <i className="fas fa-history mr-1"></i> Activity
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                <i className="fas fa-paper-plane text-blue w-4 text-center"></i>
                <span><strong>{detailPO.requested_by}</strong> submitted this purchase order</span>
                <span className="text-slate-400 ml-auto whitespace-nowrap text-xs">{formatDateTime(detailPO.created_at)}</span>
              </div>
              {detailPO.approved_by && (
                <div className={`p-2.5 rounded-md text-sm ${detailPO.status === 'denied' ? 'bg-red-50 dark:bg-red-950/20' : detailPO.status === 'approved' || detailPO.status === 'completed' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                  <div className="flex items-center gap-2 dark:text-slate-300">
                    <i className={`fas fa-${detailPO.status === 'denied' ? 'times-circle' : 'check-circle'} w-4 text-center ${detailPO.status === 'denied' ? 'text-red-600' : 'text-green-800'}`}></i>
                    <span>
                      <strong>{detailPO.approved_by}</strong> {detailPO.status === 'denied' ? 'denied' : 'approved'} this purchase order
                    </span>
                    {detailPO.approved_at && (
                      <span className="text-slate-400 ml-auto whitespace-nowrap text-xs">{formatDateTime(detailPO.approved_at)}</span>
                    )}
                  </div>
                  {detailPO.denial_reason && (
                    <div className="text-red-600 mt-1 pl-6 text-sm">
                      <i className="fas fa-quote-left mr-1 text-xs opacity-50"></i>
                      {detailPO.denial_reason}
                    </div>
                  )}
                </div>
              )}
              {detailPO.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                  <i className="fas fa-flag-checkered text-blue-800 w-4 text-center"></i>
                  <span>Purchase order marked as <strong>completed</strong></span>
                </div>
              )}
              {detailPO.status === 'archived' && (
                <div className="flex items-center gap-2 text-sm opacity-70 dark:text-slate-300">
                  <i className="fas fa-archive w-4 text-center"></i>
                  <span>Purchase order has been <strong>archived</strong></span>
                </div>
              )}
            </div>
          </div>

          {detailPO.notes && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-sm text-slate-600 dark:text-slate-300">
              <strong>Notes:</strong> {detailPO.notes}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
          <h4 className="mb-3"><i className="fas fa-list mr-1.5"></i> Line Items</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-center w-20">Qty</th>
                  <th className="text-right w-30">Unit Price</th>
                  <th className="text-right w-30">Total</th>
                </tr>
              </thead>
              <tbody>
                {detailPO.line_items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right font-medium">{formatCurrency(item.qty * item.unit_price)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="text-right text-slate-500">Subtotal</td>
                  <td className="text-right">{formatCurrency(detailPO.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right text-slate-500">Tax</td>
                  <td className="text-right">{formatCurrency(detailPO.tax)}</td>
                </tr>
                <tr className="font-bold text-base">
                  <td colSpan={3} className="text-right">Total</td>
                  <td className="text-right">{formatCurrency(detailPO.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipts */}
        {detailPO.receipt_urls && detailPO.receipt_urls.length > 0 && (
          <div className="admin-card">
            <h4 className="mb-3"><i className="fas fa-receipt mr-1.5"></i> Receipts ({detailPO.receipt_urls.length})</h4>
            <div className="flex flex-wrap gap-3">
              {detailPO.receipt_urls.map((url, i) => {
                const isPdf = url.toLowerCase().endsWith('.pdf');
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 p-3 border border-slate-200 dark:border-slate-700 rounded-lg no-underline text-slate-600 dark:text-slate-400 text-sm min-w-24 hover:border-blue transition-colors">
                    {isPdf ? (
                      <i className="fas fa-file-pdf text-2xl text-red-600"></i>
                    ) : (
                      <img src={url} alt={`Receipt ${i + 1}`} className="w-20 h-20 object-cover rounded" />
                    )}
                    Receipt {i + 1}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {showModal && renderModal()}
      </div>
    );
  }

  // ─── Modal ────────────────────────────────────────────────────────────

  function renderModal() {
    const subtotal = calcSubtotal(form.line_items);
    const tax = parseFloat(form.tax) || 0;
    const total = subtotal + tax;

    return (
      <div className="rotr-staff-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="rotr-staff-modal max-w-3xl!" onClick={e => e.stopPropagation()}>
          <h3>{editingId ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>

          <div className="admin-form-row">
            <div className="admin-form-group" style={{ flex: 2 }}>
              <label>Title / Description *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Stage lighting rental for Show #3" />
            </div>
            <div className="admin-form-group">
              <label>Context</label>
              <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as 'lpfa' | 'rotr' }))}>
                <option value="lpfa">LPFA</option>
                <option value="rotr">ROTR</option>
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Vendor Name *</label>
              <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Home Depot, Amazon" />
            </div>
            <div className="admin-form-group">
              <label>Vendor Contact</label>
              <input type="text" value={form.vendor_contact} onChange={e => setForm(f => ({ ...f, vendor_contact: e.target.value }))} placeholder="Phone or email" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'low' | 'normal' | 'urgent' }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Needed By</label>
              <input type="date" value={form.needed_by} onChange={e => setForm(f => ({ ...f, needed_by: e.target.value }))} />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
            <h4 className="mb-3 text-base text-slate-600 dark:text-slate-400">
              <i className="fas fa-list mr-1.5"></i> Line Items
            </h4>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 90px 28px', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>Description</span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>Qty</span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>Unit Price</span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Total</span>
              <span></span>
            </div>

            {form.line_items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 90px 28px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input type="text" className={inputClass} placeholder="Item description" value={item.description}
                  onChange={e => {
                    const items = [...form.line_items];
                    items[idx] = { ...items[idx], description: e.target.value };
                    setForm(f => ({ ...f, line_items: items }));
                  }} />
                <input type="number" className={inputClass} style={{ textAlign: 'center' }} placeholder="1" min="1" value={item.qty}
                  onChange={e => {
                    const items = [...form.line_items];
                    items[idx] = { ...items[idx], qty: parseInt(e.target.value) || 0 };
                    setForm(f => ({ ...f, line_items: items }));
                  }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem', pointerEvents: 'none' }}>$</span>
                  <input type="number" className={inputClass} style={{ paddingLeft: '1.4rem' }} step="0.01" min="0" placeholder="0.00" value={item.unit_price || ''}
                    onChange={e => {
                      const items = [...form.line_items];
                      items[idx] = { ...items[idx], unit_price: parseFloat(e.target.value) || 0 };
                      setForm(f => ({ ...f, line_items: items }));
                    }} />
                </div>
                <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.88rem', color: '#475569' }}>
                  {formatCurrency(item.qty * item.unit_price)}
                </span>
                {form.line_items.length > 1 ? (
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '0.2rem', fontSize: '0.85rem' }}
                    onClick={() => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }))}>
                    <i className="fas fa-times"></i>
                  </button>
                ) : <span></span>}
              </div>
            ))}
            <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}
              onClick={() => setForm(f => ({ ...f, line_items: [...f.line_items, { ...emptyLineItem }] }))}>
              <i className="fas fa-plus"></i> Add Line Item
            </button>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Subtotal:</span>
                <span style={{ fontWeight: 500, minWidth: '6rem', textAlign: 'right' }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Tax:</span>
                <div style={{ position: 'relative', width: '6rem' }}>
                  <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem', pointerEvents: 'none' }}>$</span>
                  <input type="number" className={inputClass} style={{ paddingLeft: '1.4rem', textAlign: 'right', width: '100%' }} step="0.01" min="0" placeholder="0.00" value={form.tax}
                    onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontWeight: 700, fontSize: '1.1rem', paddingTop: '0.5rem', borderTop: '2px solid #cbd5e1' }}>
                <span>Total:</span>
                <span style={{ minWidth: '6rem', textAlign: 'right' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="mb-3 text-base text-slate-600 dark:text-slate-400">
              <i className="fas fa-receipt mr-1.5"></i> Receipts
            </h4>
            {uploadedReceipts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedReceipts.map((url, i) => {
                  const isPdf = url.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-sm">
                      <i className={`fas fa-${isPdf ? 'file-pdf' : 'image'} ${isPdf ? 'text-red-600' : 'text-blue'}`}></i>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-300 no-underline">Receipt {i + 1}</a>
                      <button type="button" className="border-none bg-transparent cursor-pointer text-red-600 px-0.5 text-xs"
                        onClick={() => setUploadedReceipts(prev => prev.filter((_, j) => j !== i))}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div
              className={`rotr-staff-dropzone ${dragOver ? 'active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <p className="m-0">{uploading ? 'Uploading...' : 'Drop receipt file here or click to browse (images, PDFs)'}</p>
              <input type="file" hidden ref={fileInputRef} accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) uploadReceipt(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>

          <div className="admin-form-group mt-4">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes for the accountant..." />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="admin-btn admin-btn-secondary" onClick={() => savePO('draft')} disabled={saving || !form.title.trim() || !form.vendor_name.trim()}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Draft</>}
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => savePO('pending_approval')} disabled={saving || !form.title.trim() || !form.vendor_name.trim()}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit for Approval</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Purchase Orders</h1></div>
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
          <h3 className="analytics-loading-title">Loading Purchase Orders...</h3>
          <p className="analytics-loading-step">Fetching PO requests and approvals...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1><i className="fas fa-file-invoice mr-2 text-blue"></i> Purchase Orders</h1>
          <p>Create, track, and approve purchase order requests.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreateModal}>
          <i className="fas fa-plus"></i> New Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-clock"></i></div>
          <div className="rotr-stat-value">{counts.pending_approval}</div>
          <div className="rotr-stat-label">Pending Approval</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-check-circle"></i></div>
          <div className="rotr-stat-value">{counts.approved}</div>
          <div className="rotr-stat-label">Approved</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-dollar-sign"></i></div>
          <div className="rotr-stat-value">{formatCurrency(totalPending)}</div>
          <div className="rotr-stat-label">Pending Total</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-dollar-sign"></i></div>
          <div className="rotr-stat-value">{formatCurrency(totalApproved)}</div>
          <div className="rotr-stat-label">Approved Total</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'pending_approval', 'approved', 'draft', 'denied', 'completed', 'archived'] as POStatus[]).map(s => (
          <button key={s} className={`admin-filter-tab shrink-0${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
            <span className="admin-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md relative" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
        <input type="text"
          className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
          placeholder="Search by PO#, title, vendor, or requester..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-file-invoice text-2xl opacity-30 mb-2"></i>
          <p>{orders.length === 0 ? 'No purchase orders yet. Create your first one!' : `No ${filter === 'all' ? '' : STATUS_LABELS[filter]?.toLowerCase() + ' '}orders found.`}</p>
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Title</th>
                <th>Vendor</th>
                <th className="text-right">Total</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => {
                const sc = STATUS_COLORS[po.status] || STATUS_COLORS.draft;
                const pc = PRIORITY_COLORS[po.priority] || PRIORITY_COLORS.normal;
                return (
                  <tr key={po.id} className={po.status === 'pending_approval' ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                    <td>
                      <button onClick={() => setDetailId(po.id)} className="bg-transparent border-none cursor-pointer text-blue font-semibold p-0 text-sm">
                        {po.po_number}
                      </button>
                      <span className={`block text-[0.7rem] font-semibold uppercase ${po.context === 'rotr' ? 'text-navy dark:text-slate-400' : 'text-blue'}`}>{po.context}</span>
                    </td>
                    <td className="font-medium max-w-52 overflow-hidden text-ellipsis whitespace-nowrap">{po.title}</td>
                    <td>{po.vendor_name}</td>
                    <td className="text-right font-semibold">{formatCurrency(po.total_amount)}</td>
                    <td>{po.requested_by}</td>
                    <td className="whitespace-nowrap text-sm">{formatDate(po.created_at)}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ ...pc }}>
                        {PRIORITY_LABELS[po.priority]}
                      </span>
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>
                        {STATUS_LABELS[po.status]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn-icon" title="View" onClick={() => setDetailId(po.id)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        {po.status === 'pending_approval' && (
                          <>
                            <button className="admin-btn-icon text-green-800" title="Approve" onClick={() => approvePO(po.id)}>
                              <i className="fas fa-check"></i>
                            </button>
                            <button className="admin-btn-icon text-red-600" title="Deny" onClick={() => denyPO(po.id)}>
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        <button className="admin-btn-icon" title="Export PDF" onClick={() => exportPDF(po)}>
                          <i className="fas fa-file-pdf"></i>
                        </button>
                        <button className="admin-btn-icon danger" title="Delete" onClick={() => deletePO(po.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && renderModal()}
    </div>
  );
}
