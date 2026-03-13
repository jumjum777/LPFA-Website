'use client';

import { useEffect, useState, useRef, Fragment } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ROTRContractor, ROTREventAssignment } from '@/lib/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ROTREvent {
  id: string;
  title: string;
  status: string;
  dateAndTimeSettings: {
    startDate: string;
    formatted: { startDate: string; startTime: string };
  };
}

interface Props {
  events: ROTREvent[];
}

type StaffView = 'roster' | 'event-staffing' | 'export' | 'payroll' | 'calendar';

const ROLES = [
  { value: 'gate', label: 'Gate' },
  { value: 'security', label: 'Security' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'stage_hand', label: 'Stage Hand' },
  { value: 'sound', label: 'Sound' },
  { value: 'parking', label: 'Parking' },
  { value: 'vip', label: 'VIP' },
  { value: 'merch', label: 'Merch' },
  { value: 'bar', label: 'Bar' },
  { value: 'other', label: 'Other' },
];

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  completed: 'Completed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
};

function roleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label || role;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function calcPay(a: ROTREventAssignment) {
  if (a.pay_type === 'flat') return a.pay_rate;
  return (a.actual_hours || 0) * a.pay_rate;
}

// ─── Default form state ─────────────────────────────────────────────────────

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  primary_role: '',
  default_pay_rate: '',
  pay_type: 'hourly' as 'hourly' | 'flat',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  shirt_size: '',
  preferred_start: '',
  preferred_end: '',
  availability_notes: '',
  blackout_dates: [] as string[],
  notes: '',
  status: 'active' as 'active' | 'inactive',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ROTRStaffManager({ events }: Props) {
  const [view, setView] = useState<StaffView>('roster');
  const [contractors, setContractors] = useState<ROTRContractor[]>([]);
  const [assignments, setAssignments] = useState<ROTREventAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Roster filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Contractor detail
  const [detailId, setDetailId] = useState<string | null>(null);

  // Event staffing
  const [selectedEventId, setSelectedEventId] = useState('');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [editingHoursVal, setEditingHoursVal] = useState('');
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [editingSchedStart, setEditingSchedStart] = useState('');
  const [editingSchedEnd, setEditingSchedEnd] = useState('');

  // Actual time editing
  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [editingActualIn, setEditingActualIn] = useState('');
  const [editingActualOut, setEditingActualOut] = useState('');

  // File upload
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const contractInputRef = useRef<HTMLInputElement>(null);
  const w9InputRef = useRef<HTMLInputElement>(null);

  // Assignment notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteVal, setEditingNoteVal] = useState('');

  // Payroll
  const [payrollStart, setPayrollStart] = useState('');
  const [payrollEnd, setPayrollEnd] = useState('');

  // Event budget
  const [eventBudgets, setEventBudgets] = useState<Record<string, number>>({});
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Export
  const [exportType, setExportType] = useState<'event' | 'contractor' | 'range'>('event');
  const [exportEventId, setExportEventId] = useState('');
  const [exportContractorId, setExportContractorId] = useState('');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  // ─── Data Loading ───────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('rotr_contractors').select('*').order('last_name'),
      supabase.from('rotr_event_assignments').select('*').order('event_date', { ascending: false }),
    ]);
    setContractors(c || []);
    setAssignments(a || []);
    setLoading(false);
  }

  // ─── Contractor CRUD ───────────────────────────────────────────────────

  function openAddModal() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(c: ROTRContractor) {
    setForm({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email || '',
      phone: c.phone || '',
      primary_role: c.primary_role,
      default_pay_rate: String(c.default_pay_rate),
      pay_type: c.pay_type,
      emergency_contact_name: c.emergency_contact_name || '',
      emergency_contact_phone: c.emergency_contact_phone || '',
      shirt_size: c.shirt_size || '',
      preferred_start: c.preferred_start || '',
      preferred_end: c.preferred_end || '',
      availability_notes: c.availability_notes || '',
      blackout_dates: c.blackout_dates ? JSON.parse(c.blackout_dates) : [],
      notes: c.notes || '',
      status: c.status === 'archived' ? 'inactive' : c.status as 'active' | 'inactive',
    });
    setEditingId(c.id);
    setShowModal(true);
  }

  async function saveContractor() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.primary_role) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      primary_role: form.primary_role,
      default_pay_rate: parseFloat(form.default_pay_rate) || 0,
      pay_type: form.pay_type,
      emergency_contact_name: form.emergency_contact_name.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      shirt_size: form.shirt_size || null,
      preferred_start: form.preferred_start || null,
      preferred_end: form.preferred_end || null,
      availability_notes: form.availability_notes.trim() || null,
      blackout_dates: form.blackout_dates.length > 0 ? JSON.stringify(form.blackout_dates) : null,
      notes: form.notes.trim() || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('rotr_contractors').update(payload).eq('id', editingId);
      if (error) { alert('Failed to update: ' + error.message); setSaving(false); return; }
      setContractors(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } as ROTRContractor : c));
    } else {
      const { data, error } = await supabase.from('rotr_contractors').insert(payload).select().single();
      if (error) { alert('Failed to add: ' + error.message); setSaving(false); return; }
      setContractors(prev => [...prev, data as ROTRContractor].sort((a, b) => a.last_name.localeCompare(b.last_name)));
    }
    setSaving(false);
    setShowModal(false);
  }

  async function deleteContractor(id: string) {
    if (!confirm('Delete this contractor and all their event assignments?')) return;
    const supabase = createClient();
    await supabase.from('rotr_contractors').delete().eq('id', id);
    setContractors(prev => prev.filter(c => c.id !== id));
    setAssignments(prev => prev.filter(a => a.contractor_id !== id));
    if (detailId === id) setDetailId(null);
  }

  async function toggleStatus(c: ROTRContractor) {
    const newStatus = c.status === 'active' ? 'inactive' : 'active';
    const supabase = createClient();
    await supabase.from('rotr_contractors').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', c.id);
    setContractors(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } as ROTRContractor : x));
  }

  // ─── File Upload (contract / W-9) ──────────────────────────────────────

  async function uploadFile(file: File, contractorId: string, type: 'contract' | 'w9') {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `rotr-staff/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage.from('new-images').upload(path, file);
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('new-images').getPublicUrl(path);
    const now = new Date().toISOString();

    if (type === 'contract') {
      await supabase.from('rotr_contractors').update({ contract_url: urlData.publicUrl, contract_uploaded_at: now, updated_at: now }).eq('id', contractorId);
      setContractors(prev => prev.map(c => c.id === contractorId ? { ...c, contract_url: urlData.publicUrl, contract_uploaded_at: now } : c));
    } else {
      await supabase.from('rotr_contractors').update({ w9_url: urlData.publicUrl, w9_status: 'received', w9_received_date: now.split('T')[0], updated_at: now }).eq('id', contractorId);
      setContractors(prev => prev.map(c => c.id === contractorId ? { ...c, w9_url: urlData.publicUrl, w9_status: 'received' as const, w9_received_date: now.split('T')[0] } : c));
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent, contractorId: string, type: 'contract' | 'w9') {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, contractorId, type);
  }

  // ─── Event Assignments ─────────────────────────────────────────────────

  async function assignContractors(eventId: string) {
    if (bulkSelected.size === 0) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const supabase = createClient();
    const newAssignments: Partial<ROTREventAssignment>[] = [];

    for (const cId of bulkSelected) {
      const c = contractors.find(x => x.id === cId);
      if (!c) continue;
      // Skip if already assigned
      if (assignments.some(a => a.contractor_id === cId && a.wix_event_id === eventId)) continue;

      newAssignments.push({
        contractor_id: cId,
        wix_event_id: eventId,
        event_title: event.title,
        event_date: event.dateAndTimeSettings.startDate.split('T')[0],
        role: c.primary_role.split(',')[0],
        pay_rate: c.default_pay_rate,
        pay_type: c.pay_type,
        status: 'scheduled',
      });
    }

    if (newAssignments.length > 0) {
      const { data, error } = await supabase.from('rotr_event_assignments').insert(newAssignments).select();
      if (error) { alert('Failed to assign: ' + error.message); return; }
      setAssignments(prev => [...(data as ROTREventAssignment[]), ...prev]);
    }
    setBulkSelected(new Set());
  }

  async function removeAssignment(id: string) {
    const supabase = createClient();
    await supabase.from('rotr_event_assignments').delete().eq('id', id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  }

  async function updateAssignment(id: string, updates: Partial<ROTREventAssignment>) {
    const supabase = createClient();
    await supabase.from('rotr_event_assignments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } as ROTREventAssignment : a));
  }

  async function copyFromEvent(sourceEventId: string, targetEventId: string) {
    const event = events.find(e => e.id === targetEventId);
    if (!event) return;
    const sourceAssignments = assignments.filter(a => a.wix_event_id === sourceEventId);
    const existing = new Set(assignments.filter(a => a.wix_event_id === targetEventId).map(a => a.contractor_id));

    const newAssignments = sourceAssignments
      .filter(a => !existing.has(a.contractor_id))
      .map(a => ({
        contractor_id: a.contractor_id,
        wix_event_id: targetEventId,
        event_title: event.title,
        event_date: event.dateAndTimeSettings.startDate.split('T')[0],
        role: a.role,
        pay_rate: a.pay_rate,
        pay_type: a.pay_type,
        scheduled_hours: a.scheduled_hours,
        status: 'scheduled' as const,
      }));

    if (newAssignments.length === 0) { alert('No new staff to copy (all already assigned).'); return; }

    const supabase = createClient();
    const { data, error } = await supabase.from('rotr_event_assignments').insert(newAssignments).select();
    if (error) { alert('Failed to copy: ' + error.message); return; }
    setAssignments(prev => [...(data as ROTREventAssignment[]), ...prev]);
  }

  // ─── Check-in / Check-out ────────────────────────────────────────────

  async function checkIn(assignmentId: string) {
    const now = new Date().toISOString();
    await updateAssignment(assignmentId, { check_in: now, status: 'checked_in' });
  }

  async function checkOut(assignmentId: string) {
    const a = assignments.find(x => x.id === assignmentId);
    if (!a?.check_in) return;
    const now = new Date();
    const checkInTime = new Date(a.check_in);
    const hours = Math.round(((now.getTime() - checkInTime.getTime()) / 3600000) * 4) / 4; // round to nearest 0.25
    await updateAssignment(assignmentId, { check_out: now.toISOString(), actual_hours: hours, status: 'completed' });
  }

  function saveActualTimes(assignmentId: string) {
    const a = assignments.find(x => x.id === assignmentId);
    if (!a) return;
    const eventDate = a.event_date; // YYYY-MM-DD
    const updates: Partial<ROTREventAssignment> = {};

    if (editingActualIn) {
      updates.check_in = `${eventDate}T${editingActualIn}:00`;
    } else {
      updates.check_in = null;
    }

    if (editingActualOut) {
      updates.check_out = `${eventDate}T${editingActualOut}:00`;
    } else {
      updates.check_out = null;
    }

    // Auto-calculate hours if both are set
    if (editingActualIn && editingActualOut) {
      const [ih, im] = editingActualIn.split(':').map(Number);
      const [oh, om] = editingActualOut.split(':').map(Number);
      let diff = (oh * 60 + om) - (ih * 60 + im);
      if (diff < 0) diff += 24 * 60;
      updates.actual_hours = Math.round((diff / 60) * 4) / 4;
      updates.status = 'completed';
    }

    updateAssignment(assignmentId, updates);
    setEditingActualId(null);
  }

  // ─── Payroll Export ────────────────────────────────────────────────────

  function exportPayroll(start: string, end: string) {
    const filtered = assignments
      .filter(a => a.event_date >= start && a.event_date <= end && (a.status === 'completed' || a.actual_hours))
      .sort((a, b) => a.contractor_id.localeCompare(b.contractor_id) || a.event_date.localeCompare(b.event_date));

    const headers = ['Contractor', 'Email', 'Phone', 'W-9 Status', 'Event', 'Date', 'Hours', 'Rate', 'Pay Type', 'Amount Due'];
    const rows = filtered.map(a => {
      const c = contractors.find(x => x.id === a.contractor_id);
      return [
        c ? `${c.last_name}, ${c.first_name}` : 'Unknown',
        c?.email || '', c?.phone || '',
        c?.w9_status === 'received' ? 'Yes' : c?.w9_status === 'expired' ? 'Expired' : 'Missing',
        a.event_title, a.event_date,
        String(a.actual_hours ?? 0), a.pay_rate.toFixed(2), a.pay_type, calcPay(a).toFixed(2),
      ];
    });

    // Add summary rows grouped by contractor
    const byContractor = new Map<string, number>();
    filtered.forEach(a => {
      const key = a.contractor_id;
      byContractor.set(key, (byContractor.get(key) || 0) + calcPay(a));
    });
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '']);
    byContractor.forEach((total, cId) => {
      const c = contractors.find(x => x.id === cId);
      rows.push([c ? `${c.last_name}, ${c.first_name}` : 'Unknown', '', '', '', '', '', '', '', 'TOTAL', total.toFixed(2)]);
    });
    const grandTotal = Array.from(byContractor.values()).reduce((s, v) => s + v, 0);
    rows.push(['GRAND TOTAL', '', '', '', '', '', '', '', '', grandTotal.toFixed(2)]);

    downloadCSV(headers, rows, `ROTR-Payroll-${start}-to-${end}.csv`);
  }

  // ─── Printable Day Sheet ───────────────────────────────────────────────

  function printDaySheet(eventId: string) {
    const event = events.find(e => e.id === eventId);
    const ea = assignments.filter(a => a.wix_event_id === eventId).sort((a, b) => a.role.localeCompare(b.role));
    if (!event || ea.length === 0) return;

    const rows = ea.map(a => {
      const c = contractors.find(x => x.id === a.contractor_id);
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:500">${c ? `${c.first_name} ${c.last_name}` : '?'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${roleLabel(a.role)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${c?.phone || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${a.scheduled_hours ? a.scheduled_hours + ' hrs' : '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;width:120px"></td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;width:120px"></td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;width:140px"></td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><title>Staff Sheet — ${event.title}</title>
      <style>body{font-family:Arial,sans-serif;margin:2rem;color:#1e293b}h1{font-size:1.4rem;margin-bottom:0.25rem}h2{font-size:1rem;color:#64748b;margin-bottom:1.5rem;font-weight:400}
      table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-size:0.8rem;text-transform:uppercase;color:#475569}
      @media print{body{margin:1rem}}</style></head>
      <body><h1>${event.title}</h1><h2>${event.dateAndTimeSettings.formatted.startDate} · ${event.dateAndTimeSettings.formatted.startTime} · ${ea.length} Staff</h2>
      <table><thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Sched. Hours</th><th>Check In</th><th>Check Out</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:2rem;font-size:0.8rem;color:#94a3b8">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  // ─── CSV Export ─────────────────────────────────────────────────────────

  function downloadCSV(headers: string[], rows: string[][], filename: string) {
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportByEvent(eventId: string) {
    const rows = assignments
      .filter(a => a.wix_event_id === eventId)
      .sort((a, b) => a.role.localeCompare(b.role))
      .map(a => {
        const c = contractors.find(x => x.id === a.contractor_id);
        return [
          c ? `${c.last_name}, ${c.first_name}` : 'Unknown',
          roleLabel(a.role), a.event_title, a.event_date,
          String(a.scheduled_hours ?? ''), String(a.actual_hours ?? ''),
          a.pay_rate.toFixed(2), a.pay_type, calcPay(a).toFixed(2), STATUS_LABELS[a.status] || a.status,
        ];
      });
    const eventTitle = rows[0]?.[2] || eventId;
    downloadCSV(['Name', 'Role', 'Event', 'Date', 'Scheduled Hrs', 'Actual Hrs', 'Rate', 'Pay Type', 'Total Pay', 'Status'], rows, `ROTR-Staff-${eventTitle.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
  }

  function exportByContractor(contractorId: string) {
    const c = contractors.find(x => x.id === contractorId);
    const rows = assignments
      .filter(a => a.contractor_id === contractorId)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .map(a => [
        a.event_title, a.event_date, roleLabel(a.role),
        String(a.scheduled_hours ?? ''), String(a.actual_hours ?? ''),
        a.pay_rate.toFixed(2), a.pay_type, calcPay(a).toFixed(2), STATUS_LABELS[a.status] || a.status,
      ]);
    const name = c ? `${c.last_name}-${c.first_name}` : contractorId;
    downloadCSV(['Event', 'Date', 'Role', 'Scheduled Hrs', 'Actual Hrs', 'Rate', 'Pay Type', 'Total Pay', 'Status'], rows, `ROTR-Staff-${name}.csv`);
  }

  function exportByRange(start: string, end: string) {
    const rows = assignments
      .filter(a => a.event_date >= start && a.event_date <= end)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .map(a => {
        const c = contractors.find(x => x.id === a.contractor_id);
        return [
          c ? `${c.last_name}, ${c.first_name}` : 'Unknown',
          c?.email || '', c?.phone || '',
          roleLabel(a.role), a.event_title, a.event_date,
          String(a.scheduled_hours ?? ''), String(a.actual_hours ?? ''),
          a.pay_rate.toFixed(2), a.pay_type, calcPay(a).toFixed(2), STATUS_LABELS[a.status] || a.status,
        ];
      });
    downloadCSV(['Name', 'Email', 'Phone', 'Role', 'Event', 'Date', 'Scheduled Hrs', 'Actual Hrs', 'Rate', 'Pay Type', 'Total Pay', 'Status'], rows, `ROTR-Staff-${start}-to-${end}.csv`);
  }

  // ─── Computed ───────────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const seasonAssignments = assignments.filter(a => a.event_date && new Date(a.event_date).getFullYear() === currentYear);
  const totalHours = seasonAssignments.reduce((s, a) => s + (a.actual_hours || 0), 0);
  const totalPaid = seasonAssignments.filter(a => a.status === 'completed').reduce((s, a) => s + calcPay(a), 0);
  const activeContractors = contractors.filter(c => c.status === 'active');

  const filteredContractors = contractors.filter(c => {
    if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (roleFilter && !c.primary_role.split(',').includes(roleFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      return name.includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
    }
    return true;
  });

  // Sort events: upcoming first, then past
  const sortedEvents = [...events].sort((a, b) => new Date(b.dateAndTimeSettings.startDate).getTime() - new Date(a.dateAndTimeSettings.startDate).getTime());

  // Event staffing data
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventAssignments = assignments.filter(a => a.wix_event_id === selectedEventId);
  const assignedIds = new Set(eventAssignments.map(a => a.contractor_id));
  const eventDate = selectedEvent ? selectedEvent.dateAndTimeSettings.startDate.split('T')[0] : '';
  const unassignedContractors = activeContractors.filter(c => !assignedIds.has(c.id));

  // Split into available vs unavailable based on blackout dates
  const availableContractors: ROTRContractor[] = [];
  const unavailableContractors: { contractor: ROTRContractor; reason: string }[] = [];

  unassignedContractors.forEach(c => {
    if (eventDate && c.blackout_dates) {
      try {
        const blackouts: string[] = JSON.parse(c.blackout_dates);
        if (blackouts.includes(eventDate)) {
          unavailableContractors.push({ contractor: c, reason: 'Blackout date' });
          return;
        }
      } catch { /* ignore parse errors */ }
    }
    availableContractors.push(c);
  });

  // Detail contractor
  const detailContractor = detailId ? contractors.find(c => c.id === detailId) : null;
  const detailAssignments = detailId ? assignments.filter(a => a.contractor_id === detailId).sort((a, b) => b.event_date.localeCompare(a.event_date)) : [];

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
        <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading staff data...</p>
      </div>
    );
  }

  // ─── Contractor Detail Panel ────────────────────────────────────────────

  if (detailContractor) {
    const completedAssignments = detailAssignments.filter(a => a.status === 'completed');
    const noShows = detailAssignments.filter(a => a.status === 'no_show').length;
    const totalEvents = detailAssignments.filter(a => a.status !== 'cancelled').length;
    const detailTotalHours = detailAssignments.reduce((s, a) => s + (a.actual_hours || 0), 0);
    const detailTotalEarned = completedAssignments.reduce((s, a) => s + calcPay(a), 0);

    return (
      <>
        <button className="admin-btn admin-btn-secondary" onClick={() => setDetailId(null)} style={{ marginBottom: '1rem' }}>
          <i className="fas fa-arrow-left"></i> Back to Roster
        </button>

        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{detailContractor.first_name} {detailContractor.last_name}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                {detailContractor.primary_role.split(',').map(r => (
                  <span key={r} className={`rotr-role-chip ${r}`}>{roleLabel(r)}</span>
                ))}
              </div>
              <span className={`admin-status-badge ${detailContractor.status === 'active' ? 'published' : 'draft'}`} style={{ marginLeft: '0.5rem' }}>
                {detailContractor.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => openEditModal(detailContractor)}>
                <i className="fas fa-edit"></i> Edit
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={() => toggleStatus(detailContractor)}>
                <i className={`fas fa-${detailContractor.status === 'active' ? 'ban' : 'check'}`}></i> {detailContractor.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="admin-btn admin-btn-secondary" style={{ color: '#EF4444' }} onClick={() => deleteContractor(detailContractor.id)}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <div><strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Pay Rate</strong><br />{formatCurrency(detailContractor.default_pay_rate)}/{detailContractor.pay_type === 'hourly' ? 'hr' : 'flat'}</div>
            {detailContractor.email && <div><strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Email</strong><br /><a href={`mailto:${detailContractor.email}`}>{detailContractor.email}</a></div>}
            {detailContractor.phone && <div><strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Phone</strong><br /><a href={`tel:${detailContractor.phone}`}>{detailContractor.phone}</a></div>}
            {detailContractor.emergency_contact_name && <div><strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Emergency Contact</strong><br />{detailContractor.emergency_contact_name}{detailContractor.emergency_contact_phone ? ` · ${detailContractor.emergency_contact_phone}` : ''}</div>}
            {detailContractor.shirt_size && <div><strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Shirt Size</strong><br />{detailContractor.shirt_size}</div>}
          </div>

          {/* Availability */}
          {(detailContractor.preferred_start || detailContractor.availability_notes || detailContractor.blackout_dates) && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '6px', fontSize: '0.88rem' }}>
              <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)' }}>
                <i className="fas fa-calendar-check" style={{ marginRight: '0.3rem' }}></i>Availability
              </strong>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--gray-600)' }}>
                {detailContractor.preferred_start && detailContractor.preferred_end && (
                  <span><i className="fas fa-clock" style={{ marginRight: '0.25rem', color: 'var(--blue-accent)' }}></i>{formatTime(detailContractor.preferred_start)} – {formatTime(detailContractor.preferred_end)}</span>
                )}
                {detailContractor.availability_notes && (
                  <span><i className="fas fa-info-circle" style={{ marginRight: '0.25rem', color: 'var(--blue-accent)' }}></i>{detailContractor.availability_notes}</span>
                )}
              </div>
              {detailContractor.blackout_dates && (() => {
                try {
                  const dates: string[] = JSON.parse(detailContractor.blackout_dates);
                  if (dates.length === 0) return null;
                  return (
                    <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginRight: '0.2rem' }}>Blackout:</span>
                      {dates.map(d => (
                        <span key={d} style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.78rem' }}>
                          {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>
          )}

          {detailContractor.notes && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '6px', fontSize: '0.88rem', color: 'var(--gray-600)' }}>
              <strong>Notes:</strong> {detailContractor.notes}
            </div>
          )}
        </div>

        {/* Documents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="admin-card">
            <h4 style={{ marginBottom: '0.75rem' }}><i className="fas fa-file-contract" style={{ marginRight: '0.4rem' }}></i> Contract</h4>
            {detailContractor.contract_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a href={detailContractor.contract_url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem' }}>
                  <i className="fas fa-external-link-alt"></i> View Contract
                </a>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  Uploaded {detailContractor.contract_uploaded_at ? new Date(detailContractor.contract_uploaded_at).toLocaleDateString() : ''}
                </span>
              </div>
            ) : <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No contract uploaded</p>}
            <div
              className={`rotr-staff-dropzone ${dragOver ? 'active' : ''}`}
              style={{ marginTop: '0.75rem' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => handleDrop(e, detailContractor.id, 'contract')}
              onClick={() => contractInputRef.current?.click()}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <p style={{ margin: 0 }}>{uploading ? 'Uploading...' : 'Drop contract file here or click to browse'}</p>
              <input type="file" hidden ref={contractInputRef} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], detailContractor.id, 'contract'); e.target.value = ''; }} />
            </div>
          </div>

          <div className="admin-card">
            <h4 style={{ marginBottom: '0.75rem' }}>
              <i className="fas fa-file-alt" style={{ marginRight: '0.4rem' }}></i> W-9
              <span className={`rotr-w9-${detailContractor.w9_status === 'received' ? 'received' : detailContractor.w9_status === 'expired' ? 'expired' : 'missing'}`} style={{ marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                <i className={`fas fa-${detailContractor.w9_status === 'received' ? 'check-circle' : detailContractor.w9_status === 'expired' ? 'exclamation-triangle' : 'times-circle'}`}></i>
                {' '}{detailContractor.w9_status === 'received' ? 'Received' : detailContractor.w9_status === 'expired' ? 'Expired' : 'Not Submitted'}
              </span>
            </h4>
            {detailContractor.w9_url && (
              <a href={detailContractor.w9_url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem', marginBottom: '0.5rem', display: 'inline-flex' }}>
                <i className="fas fa-external-link-alt"></i> View W-9
              </a>
            )}
            <div
              className={`rotr-staff-dropzone ${dragOver ? 'active' : ''}`}
              style={{ marginTop: '0.5rem' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => handleDrop(e, detailContractor.id, 'w9')}
              onClick={() => w9InputRef.current?.click()}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <p style={{ margin: 0 }}>{uploading ? 'Uploading...' : 'Drop W-9 file here or click to browse'}</p>
              <input type="file" hidden ref={w9InputRef} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], detailContractor.id, 'w9'); e.target.value = ''; }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rotr-stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon" style={{ background: '#1B8BEB15', color: '#1B8BEB' }}><i className="fas fa-calendar-check"></i></div>
            <div className="rotr-stat-value">{totalEvents}</div>
            <div className="rotr-stat-label">Events</div>
          </div>
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><i className="fas fa-clock"></i></div>
            <div className="rotr-stat-value">{detailTotalHours.toFixed(1)}</div>
            <div className="rotr-stat-label">Hours Worked</div>
          </div>
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon" style={{ background: '#D9770615', color: '#D97706' }}><i className="fas fa-dollar-sign"></i></div>
            <div className="rotr-stat-value">{formatCurrency(detailTotalEarned)}</div>
            <div className="rotr-stat-label">Total Earned</div>
          </div>
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon" style={{ background: noShows > 0 ? '#EF444415' : '#10B98115', color: noShows > 0 ? '#EF4444' : '#10B981' }}><i className={`fas fa-${noShows > 0 ? 'exclamation-triangle' : 'thumbs-up'}`}></i></div>
            <div className="rotr-stat-value">{totalEvents > 0 ? Math.round(((totalEvents - noShows) / totalEvents) * 100) : 100}%</div>
            <div className="rotr-stat-label">Reliability</div>
          </div>
        </div>

        {/* Assignment History */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}><i className="fas fa-history" style={{ marginRight: '0.4rem' }}></i> Assignment History</h4>
            {detailAssignments.length > 0 && (
              <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => exportByContractor(detailContractor.id)}>
                <i className="fas fa-download"></i> Export CSV
              </button>
            )}
          </div>
          {detailAssignments.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '1.5rem' }}>No assignments yet</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Hours</th>
                    <th style={{ textAlign: 'right' }}>Pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailAssignments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.event_title}</td>
                      <td>{new Date(a.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><span className={`rotr-role-chip ${a.role}`}>{roleLabel(a.role)}</span></td>
                      <td style={{ textAlign: 'right' }}>{a.actual_hours ?? a.scheduled_hours ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>{a.status === 'completed' || a.actual_hours ? formatCurrency(calcPay(a)) : '—'}</td>
                      <td><span className={`admin-status-badge ${a.status === 'completed' ? 'published' : a.status === 'no_show' ? '' : 'draft'}`} style={a.status === 'no_show' ? { background: '#FEE2E2', color: '#DC2626' } : undefined}>{STATUS_LABELS[a.status]}</span></td>
                    </tr>
                  ))}
                  <tr className="rotr-finance-total-row">
                    <td colSpan={3}><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{detailTotalHours.toFixed(1)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{formatCurrency(detailTotalEarned)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && renderModal()}
      </>
    );
  }

  // ─── Modal Form ─────────────────────────────────────────────────────────

  function renderModal() {
    return (
      <div className="rotr-staff-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="rotr-staff-modal" onClick={e => e.stopPropagation()}>
          <h3>{editingId ? 'Edit Contractor' : 'Add Contractor'}</h3>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>First Name *</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Last Name *</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Roles * <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 400 }}>(select all that apply)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {ROLES.map(r => {
                const selected = form.primary_role.split(',').filter(Boolean).includes(r.value);
                return (
                  <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={e => {
                        const current = form.primary_role.split(',').filter(Boolean);
                        const next = e.target.checked ? [...current, r.value] : current.filter(v => v !== r.value);
                        setForm(f => ({ ...f, primary_role: next.join(',') }));
                      }}
                      style={{ margin: 0 }}
                    />
                    <span className={`rotr-role-chip ${r.value}`}>{r.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Pay Rate ($)</label>
              <input type="number" step="0.01" min="0" value={form.default_pay_rate} onChange={e => setForm(f => ({ ...f, default_pay_rate: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Pay Type</label>
              <select value={form.pay_type} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value as 'hourly' | 'flat' }))}>
                <option value="hourly">Hourly</option>
                <option value="flat">Flat Rate</option>
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Emergency Contact Name</label>
              <input type="text" value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label>Emergency Contact Phone</label>
              <input type="tel" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Shirt Size</label>
              <select value={form.shirt_size} onChange={e => setForm(f => ({ ...f, shirt_size: e.target.value }))}>
                <option value="">—</option>
                {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Availability */}
          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--gray-600)' }}>
              <i className="fas fa-calendar-check" style={{ marginRight: '0.4rem' }}></i> Availability
            </h4>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Preferred Start Time</label>
                <input type="time" value={form.preferred_start} onChange={e => setForm(f => ({ ...f, preferred_start: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label>Preferred End Time</label>
                <input type="time" value={form.preferred_end} onChange={e => setForm(f => ({ ...f, preferred_end: e.target.value }))} />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Availability Notes</label>
              <input type="text" value={form.availability_notes} onChange={e => setForm(f => ({ ...f, availability_notes: e.target.value }))} placeholder="e.g. Weekends only, Flexible, No Fridays..." />
            </div>

            <div className="admin-form-group">
              <label>Blackout Dates <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 400 }}>(dates they cannot work)</span></label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  id="blackout-date-input"
                  style={{ flex: '1 1 140px', maxWidth: '180px', minWidth: 0 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.82rem' }}
                  onClick={() => {
                    const input = document.getElementById('blackout-date-input') as HTMLInputElement;
                    if (input?.value && !form.blackout_dates.includes(input.value)) {
                      setForm(f => ({ ...f, blackout_dates: [...f.blackout_dates, input.value].sort() }));
                      input.value = '';
                    }
                  }}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              {form.blackout_dates.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {form.blackout_dates.map(d => (
                    <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                      {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <button type="button" onClick={() => setForm(f => ({ ...f, blackout_dates: f.blackout_dates.filter(x => x !== d) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', padding: 0, fontSize: '0.78rem' }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="General notes..." />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={saveContractor} disabled={saving || !form.first_name.trim() || !form.last_name.trim() || !form.primary_role}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : editingId ? 'Save Changes' : 'Add Contractor'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Sub-view navigation */}
      <div className="rotr-staff-nav">
        {([['roster', 'fas fa-users', 'Roster'], ['event-staffing', 'fas fa-calendar-check', 'Event Staffing'], ['payroll', 'fas fa-file-invoice-dollar', 'Payroll'], ['calendar', 'fas fa-calendar-alt', 'Calendar'], ['export', 'fas fa-file-export', 'Export']] as const).map(([v, icon, label]) => (
          <button key={v} className={`rotr-staff-nav-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v as StaffView)}>
            <i className={icon} style={{ marginRight: '0.4rem' }}></i>{label}
          </button>
        ))}
      </div>

      {/* ═══ ROSTER VIEW ═══ */}
      {view === 'roster' && (
        <>
          {/* Stats */}
          <div className="rotr-stats-row">
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: '#7C3AED15', color: '#7C3AED' }}><i className="fas fa-hard-hat"></i></div>
              <div className="rotr-stat-value">{activeContractors.length}</div>
              <div className="rotr-stat-label">Active Staff</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: '#1B8BEB15', color: '#1B8BEB' }}><i className="fas fa-calendar-check"></i></div>
              <div className="rotr-stat-value">{seasonAssignments.length}</div>
              <div className="rotr-stat-label">{currentYear} Assignments</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><i className="fas fa-clock"></i></div>
              <div className="rotr-stat-value">{totalHours.toFixed(1)}</div>
              <div className="rotr-stat-label">Hours This Season</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: '#D9770615', color: '#D97706' }}><i className="fas fa-dollar-sign"></i></div>
              <div className="rotr-stat-value">{formatCurrency(totalPaid)}</div>
              <div className="rotr-stat-label">Total Paid Out</div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', margin: '1.25rem 0' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '0.85rem' }}></i>
              <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', width: '100%' }} />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rotr-filter-select">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rotr-filter-select">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
            <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Add Contractor
            </button>
          </div>

          {/* Table */}
          {filteredContractors.length === 0 ? (
            <div className="admin-empty">
              <i className="fas fa-hard-hat" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}></i>
              <p>{contractors.length === 0 ? 'No contractors yet. Add your first one!' : 'No contractors match your filters.'}</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Rate</th>
                    <th>W-9</th>
                    <th style={{ textAlign: 'center' }}>Events</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContractors.map(c => {
                    const cEvents = assignments.filter(a => a.contractor_id === c.id && a.status !== 'cancelled').length;
                    return (
                      <tr key={c.id}>
                        <td>
                          <button className="rotr-staff-name-link" onClick={() => setDetailId(c.id)}>
                            {c.last_name}, {c.first_name}
                          </button>
                          {c.email && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{c.email}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {c.primary_role.split(',').map(r => (
                              <span key={r} className={`rotr-role-chip ${r}`}>{roleLabel(r)}</span>
                            ))}
                          </div>
                        </td>
                        <td>{formatCurrency(c.default_pay_rate)}/{c.pay_type === 'hourly' ? 'hr' : 'flat'}</td>
                        <td>
                          <i className={`fas fa-${c.w9_status === 'received' ? 'check-circle rotr-w9-received' : c.w9_status === 'expired' ? 'exclamation-triangle rotr-w9-expired' : 'times-circle rotr-w9-missing'}`}></i>
                        </td>
                        <td style={{ textAlign: 'center' }}>{cEvents}</td>
                        <td>
                          <button className={`admin-status-badge ${c.status === 'active' ? 'published' : 'draft'}`} onClick={() => toggleStatus(c)} style={{ cursor: 'pointer', border: 'none' }}>
                            {c.status}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={() => setDetailId(c.id)}>
                            <i className="fas fa-arrow-right"></i> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ═══ EVENT STAFFING VIEW ═══ */}
      {view === 'event-staffing' && (
        <>
          {/* Event selector + copy */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); setBulkSelected(new Set()); }} className="rotr-filter-select" style={{ flex: '1 1 300px', maxWidth: '500px' }}>
              <option value="">Select an event...</option>
              {sortedEvents.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} — {e.dateAndTimeSettings.formatted.startDate}
                </option>
              ))}
            </select>
            {selectedEventId && eventAssignments.length === 0 && (
              <CopyFromEventButton events={sortedEvents} targetEventId={selectedEventId} onCopy={copyFromEvent} currentAssignments={assignments} />
            )}
          </div>

          {!selectedEventId ? (
            <div className="admin-empty">
              <i className="fas fa-calendar-alt" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}></i>
              <p>Select an event above to manage staffing</p>
            </div>
          ) : (
            <>
              {/* Event summary */}
              <div className="rotr-stats-row" style={{ marginBottom: '1.25rem' }}>
                <div className="rotr-stat-card">
                  <div className="rotr-stat-icon" style={{ background: '#7C3AED15', color: '#7C3AED' }}><i className="fas fa-users"></i></div>
                  <div className="rotr-stat-value">{eventAssignments.length}</div>
                  <div className="rotr-stat-label">Staff Assigned</div>
                </div>
                <div className="rotr-stat-card">
                  <div className="rotr-stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><i className="fas fa-clock"></i></div>
                  <div className="rotr-stat-value">{eventAssignments.reduce((s, a) => s + (a.scheduled_hours || 0), 0).toFixed(1)}</div>
                  <div className="rotr-stat-label">Scheduled Hours</div>
                </div>
                <div className="rotr-stat-card">
                  <div className="rotr-stat-icon" style={{ background: '#D9770615', color: '#D97706' }}><i className="fas fa-dollar-sign"></i></div>
                  <div className="rotr-stat-value">{formatCurrency(eventAssignments.reduce((s, a) => s + (a.pay_type === 'flat' ? a.pay_rate : (a.scheduled_hours || 0) * a.pay_rate), 0))}</div>
                  <div className="rotr-stat-label">Est. Labor Cost</div>
                </div>
                <div className="rotr-stat-card">
                  <div className="rotr-stat-icon" style={{ background: '#1B8BEB15', color: '#1B8BEB' }}><i className="fas fa-piggy-bank"></i></div>
                  {editingBudget ? (
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>$</span>
                      <input
                        type="number" step="100" min="0"
                        value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                        onBlur={() => { setEventBudgets(prev => ({ ...prev, [selectedEventId]: parseFloat(budgetInput) || 0 })); setEditingBudget(false); }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        autoFocus
                        style={{ width: '80px', fontSize: '0.85rem', padding: '0.2rem 0.3rem' }}
                      />
                    </div>
                  ) : (
                    <div className="rotr-stat-value" style={{ cursor: 'pointer' }} onClick={() => { setEditingBudget(true); setBudgetInput(String(eventBudgets[selectedEventId] || '')); }} title="Click to set budget">
                      {eventBudgets[selectedEventId] ? formatCurrency(eventBudgets[selectedEventId]) : 'Set'}
                    </div>
                  )}
                  <div className="rotr-stat-label">Labor Budget</div>
                  {eventBudgets[selectedEventId] && eventBudgets[selectedEventId] > 0 && (() => {
                    const budget = eventBudgets[selectedEventId];
                    const estCost = eventAssignments.reduce((s, a) => s + (a.pay_type === 'flat' ? a.pay_rate : (a.scheduled_hours || 0) * a.pay_rate), 0);
                    const pct = Math.min(Math.round((estCost / budget) * 100), 100);
                    const overBudget = estCost > budget;
                    return (
                      <div style={{ width: '100%', marginTop: '0.3rem' }}>
                        <div style={{ height: '4px', background: 'var(--gray-200)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : '#10B981', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: overBudget ? '#EF4444' : 'var(--gray-500)', marginTop: '0.15rem' }}>{pct}% of budget</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="rotr-staffing-grid">
                {/* Assigned staff */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Assigned Staff</h4>
                    {eventAssignments.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => printDaySheet(selectedEventId)}>
                          <i className="fas fa-print"></i> Day Sheet
                        </button>
                        <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => exportByEvent(selectedEventId)}>
                          <i className="fas fa-download"></i> CSV
                        </button>
                      </div>
                    )}
                  </div>
                  {eventAssignments.length === 0 ? (
                    <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '1rem', fontSize: '0.88rem' }}>No staff assigned yet. Select from available staff.</p>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Name / Role</th>
                            <th>Expected Time</th>
                            <th>Actual Time</th>
                            <th style={{ textAlign: 'right' }}>Total Hours</th>
                            <th style={{ textAlign: 'right' }}>Pay</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventAssignments.map(a => {
                            const c = contractors.find(x => x.id === a.contractor_id);
                            return (
                              <Fragment key={a.id}>
                              <tr>
                                {/* Name + Role */}
                                <td>
                                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{c ? `${c.first_name} ${c.last_name}` : '?'}</div>
                                  <span className={`rotr-role-chip ${a.role}`} style={{ marginTop: '0.2rem' }}>{roleLabel(a.role)}</span>
                                </td>

                                {/* Expected Start – End */}
                                <td>
                                  {editingSchedId === a.id ? (
                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <input type="time" value={editingSchedStart} onChange={e => setEditingSchedStart(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.2rem 0.3rem', width: '105px' }} />
                                      <span style={{ color: 'var(--gray-400)' }}>–</span>
                                      <input type="time" value={editingSchedEnd} onChange={e => setEditingSchedEnd(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.2rem 0.3rem', width: '105px' }} />
                                      <button className="admin-btn admin-btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }} onClick={() => {
                                        const updates: Partial<ROTREventAssignment> = { scheduled_start: editingSchedStart || null, scheduled_end: editingSchedEnd || null };
                                        if (editingSchedStart && editingSchedEnd) {
                                          const [sh, sm] = editingSchedStart.split(':').map(Number);
                                          const [eh, em] = editingSchedEnd.split(':').map(Number);
                                          let diff = (eh * 60 + em) - (sh * 60 + sm);
                                          if (diff < 0) diff += 24 * 60;
                                          updates.scheduled_hours = Math.round((diff / 60) * 4) / 4;
                                        }
                                        updateAssignment(a.id, updates);
                                        setEditingSchedId(null);
                                      }}><i className="fas fa-check"></i></button>
                                    </div>
                                  ) : (
                                    <span className="rotr-inline-edit" onClick={() => { setEditingSchedId(a.id); setEditingSchedStart(a.scheduled_start || ''); setEditingSchedEnd(a.scheduled_end || ''); }} style={{ whiteSpace: 'nowrap' }}>
                                      {a.scheduled_start && a.scheduled_end ? `${formatTime(a.scheduled_start)} – ${formatTime(a.scheduled_end)}` : 'Set times'}
                                    </span>
                                  )}
                                </td>

                                {/* Actual Time (editable or Clock In/Out) */}
                                <td>
                                  {editingActualId === a.id ? (
                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <input type="time" value={editingActualIn} onChange={e => setEditingActualIn(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.2rem 0.3rem', width: '105px' }} />
                                      <span style={{ color: 'var(--gray-400)' }}>–</span>
                                      <input type="time" value={editingActualOut} onChange={e => setEditingActualOut(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.2rem 0.3rem', width: '105px' }} />
                                      <button className="admin-btn admin-btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }} onClick={() => saveActualTimes(a.id)}>
                                        <i className="fas fa-check"></i>
                                      </button>
                                    </div>
                                  ) : a.check_in ? (
                                    <span className="rotr-inline-edit" onClick={() => {
                                      setEditingActualId(a.id);
                                      const inDate = new Date(a.check_in!);
                                      setEditingActualIn(`${String(inDate.getHours()).padStart(2, '0')}:${String(inDate.getMinutes()).padStart(2, '0')}`);
                                      if (a.check_out) {
                                        const outDate = new Date(a.check_out);
                                        setEditingActualOut(`${String(outDate.getHours()).padStart(2, '0')}:${String(outDate.getMinutes()).padStart(2, '0')}`);
                                      } else {
                                        setEditingActualOut('');
                                      }
                                    }} style={{ whiteSpace: 'nowrap' }}>
                                      {new Date(a.check_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                      {a.check_out ? ` – ${new Date(a.check_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ' (working)'}
                                    </span>
                                  ) : (
                                    <span className="rotr-inline-edit" onClick={() => { setEditingActualId(a.id); setEditingActualIn(''); setEditingActualOut(''); }} style={{ color: 'var(--gray-400)' }}>
                                      Set times
                                    </span>
                                  )}
                                </td>

                                {/* Total Hours (auto-filled from clock, but editable) */}
                                <td style={{ textAlign: 'right' }}>
                                  {editingHoursId === a.id ? (
                                    <input type="number" step="0.25" min="0" className="rotr-inline-edit-input" value={editingHoursVal}
                                      onChange={e => setEditingHoursVal(e.target.value)}
                                      onBlur={() => { updateAssignment(a.id, { actual_hours: parseFloat(editingHoursVal) || null }); setEditingHoursId(null); }}
                                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="rotr-inline-edit" onClick={() => { setEditingHoursId(a.id); setEditingHoursVal(String(a.actual_hours ?? '')); }} title="Click to edit hours">
                                      {a.actual_hours ? `${a.actual_hours} hrs` : '—'}
                                    </span>
                                  )}
                                </td>

                                {/* Pay */}
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <div>{formatCurrency(a.pay_rate)}/{a.pay_type === 'hourly' ? 'hr' : 'flat'}</div>
                                  {(a.actual_hours || a.pay_type === 'flat') && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>{formatCurrency(calcPay(a))}</div>
                                  )}
                                </td>

                                {/* Status */}
                                <td>
                                  <select value={a.status} onChange={e => updateAssignment(a.id, { status: e.target.value as ROTREventAssignment['status'] })}
                                    className="rotr-filter-select" style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem', minWidth: '90px' }}>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                  </select>
                                </td>

                                {/* Actions */}
                                <td>
                                  <div className="admin-actions">
                                    <button className="admin-btn-icon" title={a.notes ? 'Edit note' : 'Add note'} onClick={() => { setEditingNoteId(editingNoteId === a.id ? null : a.id); setEditingNoteVal(a.notes || ''); }} style={{ fontSize: '0.8rem', color: a.notes ? '#D97706' : undefined }}>
                                      <i className="fas fa-sticky-note"></i>
                                    </button>
                                    <button className="admin-btn-icon danger" title="Remove" onClick={() => removeAssignment(a.id)} style={{ fontSize: '0.8rem' }}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {editingNoteId === a.id && (
                                <tr>
                                  <td colSpan={7} style={{ padding: '0.4rem 0.6rem', background: 'var(--gray-50)' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <input type="text" value={editingNoteVal} onChange={e => setEditingNoteVal(e.target.value)}
                                        placeholder="Add a note (e.g. arrived late, covered VIP)..."
                                        style={{ flex: 1, fontSize: '0.82rem' }}
                                        onKeyDown={e => { if (e.key === 'Enter') { updateAssignment(a.id, { notes: editingNoteVal.trim() || null }); setEditingNoteId(null); } }}
                                        autoFocus
                                      />
                                      <button className="admin-btn admin-btn-primary" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={() => { updateAssignment(a.id, { notes: editingNoteVal.trim() || null }); setEditingNoteId(null); }}>Save</button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Available staff */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Available Staff ({availableContractors.length})</h4>
                    {bulkSelected.size > 0 && (
                      <button className="admin-btn admin-btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => assignContractors(selectedEventId)}>
                        <i className="fas fa-plus"></i> Assign {bulkSelected.size}
                      </button>
                    )}
                  </div>
                  {availableContractors.length === 0 && unavailableContractors.length === 0 ? (
                    <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '1rem', fontSize: '0.88rem' }}>
                      {activeContractors.length === 0 ? 'No active contractors. Add some in the Roster tab.' : 'All active staff are assigned to this event.'}
                    </p>
                  ) : (
                    <>
                      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {availableContractors.map(c => (
                          <label key={c.id} className="rotr-staff-available-row">
                            <input
                              type="checkbox"
                              checked={bulkSelected.has(c.id)}
                              onChange={e => {
                                const next = new Set(bulkSelected);
                                e.target.checked ? next.add(c.id) : next.delete(c.id);
                                setBulkSelected(next);
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</span>
                                {c.primary_role.split(',').map(r => <span key={r} className={`rotr-role-chip ${r}`}>{roleLabel(r)}</span>)}
                              </div>
                              {(c.preferred_start || c.availability_notes) && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>
                                  {c.preferred_start && c.preferred_end && <span><i className="fas fa-clock" style={{ marginRight: '0.2rem' }}></i>{formatTime(c.preferred_start)} – {formatTime(c.preferred_end)}</span>}
                                  {c.preferred_start && c.availability_notes && <span> · </span>}
                                  {c.availability_notes && <span>{c.availability_notes}</span>}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{formatCurrency(c.default_pay_rate)}/{c.pay_type === 'hourly' ? 'hr' : 'flat'}</span>
                          </label>
                        ))}
                      </div>

                      {/* Unavailable staff */}
                      {unavailableContractors.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                            Unavailable ({unavailableContractors.length})
                          </div>
                          {unavailableContractors.map(({ contractor: c, reason }) => (
                            <div key={c.id} className="rotr-staff-available-row" style={{ opacity: 0.5, cursor: 'default' }}>
                              <span style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</span>
                              {c.primary_role.split(',').map(r => <span key={r} className={`rotr-role-chip ${r}`}>{roleLabel(r)}</span>)}
                              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#EF4444', whiteSpace: 'nowrap' }}>
                                <i className="fas fa-ban" style={{ marginRight: '0.2rem' }}></i>{reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {selectedEventId && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                      <CopyFromEventButton events={sortedEvents} targetEventId={selectedEventId} onCopy={copyFromEvent} currentAssignments={assignments} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ PAYROLL VIEW ═══ */}
      {view === 'payroll' && (
        <>
          <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}><i className="fas fa-file-invoice-dollar" style={{ marginRight: '0.4rem' }}></i> Payroll Summary</h4>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={payrollStart} onChange={e => setPayrollStart(e.target.value)} />
              <span style={{ color: 'var(--gray-500)' }}>to</span>
              <input type="date" value={payrollEnd} onChange={e => setPayrollEnd(e.target.value)} />
              {payrollStart && payrollEnd && (
                <button className="admin-btn admin-btn-primary" onClick={() => exportPayroll(payrollStart, payrollEnd)}>
                  <i className="fas fa-download"></i> Export Payroll CSV
                </button>
              )}
            </div>
          </div>

          {payrollStart && payrollEnd ? (() => {
            const payrollAssignments = assignments
              .filter(a => a.event_date >= payrollStart && a.event_date <= payrollEnd && (a.status === 'completed' || a.actual_hours))
              .sort((a, b) => a.contractor_id.localeCompare(b.contractor_id));

            // Group by contractor
            const grouped = new Map<string, { contractor: ROTRContractor | undefined; assignments: ROTREventAssignment[]; totalHours: number; totalPay: number }>();
            payrollAssignments.forEach(a => {
              const entry = grouped.get(a.contractor_id) || { contractor: contractors.find(c => c.id === a.contractor_id), assignments: [], totalHours: 0, totalPay: 0 };
              entry.assignments.push(a);
              entry.totalHours += a.actual_hours || 0;
              entry.totalPay += calcPay(a);
              grouped.set(a.contractor_id, entry);
            });

            const grandTotalHours = payrollAssignments.reduce((s, a) => s + (a.actual_hours || 0), 0);
            const grandTotalPay = payrollAssignments.reduce((s, a) => s + calcPay(a), 0);
            const missingW9 = Array.from(grouped.values()).filter(g => g.contractor && g.contractor.w9_status !== 'received');

            return (
              <>
                {/* Payroll stats */}
                <div className="rotr-stats-row" style={{ marginBottom: '1.25rem' }}>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: '#7C3AED15', color: '#7C3AED' }}><i className="fas fa-users"></i></div>
                    <div className="rotr-stat-value">{grouped.size}</div>
                    <div className="rotr-stat-label">Contractors</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><i className="fas fa-clock"></i></div>
                    <div className="rotr-stat-value">{grandTotalHours.toFixed(1)}</div>
                    <div className="rotr-stat-label">Total Hours</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: '#D9770615', color: '#D97706' }}><i className="fas fa-dollar-sign"></i></div>
                    <div className="rotr-stat-value">{formatCurrency(grandTotalPay)}</div>
                    <div className="rotr-stat-label">Total Payout</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: missingW9.length > 0 ? '#EF444415' : '#10B98115', color: missingW9.length > 0 ? '#EF4444' : '#10B981' }}><i className={`fas fa-${missingW9.length > 0 ? 'exclamation-triangle' : 'check-circle'}`}></i></div>
                    <div className="rotr-stat-value">{missingW9.length}</div>
                    <div className="rotr-stat-label">Missing W-9</div>
                  </div>
                </div>

                {grouped.size === 0 ? (
                  <div className="admin-empty">
                    <i className="fas fa-file-invoice" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}></i>
                    <p>No completed assignments in this date range.</p>
                  </div>
                ) : (
                  <div className="admin-card">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Contractor</th>
                            <th>W-9</th>
                            <th style={{ textAlign: 'center' }}>Events</th>
                            <th style={{ textAlign: 'right' }}>Hours</th>
                            <th style={{ textAlign: 'right' }}>Amount Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(grouped.entries()).map(([cId, g]) => (
                            <tr key={cId}>
                              <td>
                                <div style={{ fontWeight: 500 }}>{g.contractor ? `${g.contractor.last_name}, ${g.contractor.first_name}` : 'Unknown'}</div>
                                {g.contractor?.email && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{g.contractor.email}</div>}
                              </td>
                              <td>
                                <i className={`fas fa-${g.contractor?.w9_status === 'received' ? 'check-circle rotr-w9-received' : g.contractor?.w9_status === 'expired' ? 'exclamation-triangle rotr-w9-expired' : 'times-circle rotr-w9-missing'}`}></i>
                              </td>
                              <td style={{ textAlign: 'center' }}>{g.assignments.length}</td>
                              <td style={{ textAlign: 'right' }}>{g.totalHours.toFixed(1)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(g.totalPay)}</td>
                            </tr>
                          ))}
                          <tr className="rotr-finance-total-row">
                            <td colSpan={2}><strong>Grand Total</strong></td>
                            <td style={{ textAlign: 'center' }}><strong>{payrollAssignments.length}</strong></td>
                            <td style={{ textAlign: 'right' }}><strong>{grandTotalHours.toFixed(1)}</strong></td>
                            <td style={{ textAlign: 'right' }}><strong>{formatCurrency(grandTotalPay)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            );
          })() : (
            <div className="admin-empty">
              <i className="fas fa-calendar-day" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}></i>
              <p>Select a date range above to generate a payroll summary.</p>
            </div>
          )}
        </>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === 'calendar' && (() => {
        const eventsWithStaffing = sortedEvents.map(e => {
          const ea = assignments.filter(a => a.wix_event_id === e.id);
          const scheduledHours = ea.reduce((s, a) => s + (a.scheduled_hours || 0), 0);
          const estCost = ea.reduce((s, a) => s + (a.pay_type === 'flat' ? a.pay_rate : (a.scheduled_hours || 0) * a.pay_rate), 0);
          const completedCount = ea.filter(a => a.status === 'completed').length;
          return { ...e, staffCount: ea.length, scheduledHours, estCost, completedCount, assignments: ea };
        });
        const upcoming = eventsWithStaffing.filter(e => new Date(e.dateAndTimeSettings.startDate) >= new Date());
        const past = eventsWithStaffing.filter(e => new Date(e.dateAndTimeSettings.startDate) < new Date());
        const understaffed = upcoming.filter(e => e.staffCount === 0);

        return (
          <>
            {/* Calendar stats */}
            <div className="rotr-stats-row" style={{ marginBottom: '1.25rem' }}>
              <div className="rotr-stat-card">
                <div className="rotr-stat-icon" style={{ background: '#1B8BEB15', color: '#1B8BEB' }}><i className="fas fa-calendar"></i></div>
                <div className="rotr-stat-value">{upcoming.length}</div>
                <div className="rotr-stat-label">Upcoming Events</div>
              </div>
              <div className="rotr-stat-card">
                <div className="rotr-stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><i className="fas fa-check-circle"></i></div>
                <div className="rotr-stat-value">{upcoming.filter(e => e.staffCount > 0).length}</div>
                <div className="rotr-stat-label">Staffed</div>
              </div>
              <div className="rotr-stat-card">
                <div className="rotr-stat-icon" style={{ background: understaffed.length > 0 ? '#EF444415' : '#10B98115', color: understaffed.length > 0 ? '#EF4444' : '#10B981' }}><i className={`fas fa-${understaffed.length > 0 ? 'exclamation-triangle' : 'thumbs-up'}`}></i></div>
                <div className="rotr-stat-value">{understaffed.length}</div>
                <div className="rotr-stat-label">Need Staff</div>
              </div>
              <div className="rotr-stat-card">
                <div className="rotr-stat-icon" style={{ background: '#7C3AED15', color: '#7C3AED' }}><i className="fas fa-history"></i></div>
                <div className="rotr-stat-value">{past.length}</div>
                <div className="rotr-stat-label">Past Events</div>
              </div>
            </div>

            {/* Upcoming events */}
            {upcoming.length > 0 && (
              <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}><i className="fas fa-calendar-day" style={{ marginRight: '0.4rem' }}></i> Upcoming Events</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Staff</th>
                        <th style={{ textAlign: 'right' }}>Hours</th>
                        <th style={{ textAlign: 'right' }}>Est. Cost</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.reverse().map(e => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 500 }}>{e.title}</td>
                          <td>{e.dateAndTimeSettings.formatted.startDate}</td>
                          <td style={{ textAlign: 'center' }}>{e.staffCount}</td>
                          <td style={{ textAlign: 'right' }}>{e.scheduledHours > 0 ? e.scheduledHours.toFixed(1) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{e.estCost > 0 ? formatCurrency(e.estCost) : '—'}</td>
                          <td>
                            <span className={`admin-status-badge ${e.staffCount === 0 ? '' : 'published'}`} style={e.staffCount === 0 ? { background: '#FEE2E2', color: '#DC2626' } : undefined}>
                              {e.staffCount === 0 ? 'Needs Staff' : 'Staffed'}
                            </span>
                          </td>
                          <td>
                            <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }} onClick={() => { setSelectedEventId(e.id); setView('event-staffing'); }}>
                              <i className="fas fa-arrow-right"></i> Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Past events */}
            {past.length > 0 && (
              <div className="admin-card">
                <h4 style={{ marginBottom: '0.75rem' }}><i className="fas fa-history" style={{ marginRight: '0.4rem' }}></i> Past Events</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Staff</th>
                        <th style={{ textAlign: 'right' }}>Actual Hours</th>
                        <th style={{ textAlign: 'right' }}>Total Cost</th>
                        <th style={{ textAlign: 'center' }}>Completed</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map(e => {
                        const actualHrs = e.assignments.reduce((s, a) => s + (a.actual_hours || 0), 0);
                        const actualCost = e.assignments.filter(a => a.status === 'completed' || a.actual_hours).reduce((s, a) => s + calcPay(a), 0);
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 500 }}>{e.title}</td>
                            <td>{e.dateAndTimeSettings.formatted.startDate}</td>
                            <td style={{ textAlign: 'center' }}>{e.staffCount}</td>
                            <td style={{ textAlign: 'right' }}>{actualHrs > 0 ? actualHrs.toFixed(1) : '—'}</td>
                            <td style={{ textAlign: 'right' }}>{actualCost > 0 ? formatCurrency(actualCost) : '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {e.staffCount > 0 ? `${e.completedCount}/${e.staffCount}` : '—'}
                            </td>
                            <td>
                              <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }} onClick={() => { setSelectedEventId(e.id); setView('event-staffing'); }}>
                                <i className="fas fa-eye"></i> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {eventsWithStaffing.length === 0 && (
              <div className="admin-empty">
                <i className="fas fa-calendar-times" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}></i>
                <p>No events found. Events are loaded from Wix.</p>
              </div>
            )}
          </>
        );
      })()}

      {/* ═══ EXPORT VIEW ═══ */}
      {view === 'export' && (
        <>
          <div className="rotr-export-options">
            {([
              ['event', 'fas fa-calendar-alt', 'By Event', 'Export all staff, hours, and pay for a single event'] as const,
              ['contractor', 'fas fa-user', 'By Contractor', 'Export all events and hours for a single contractor'] as const,
              ['range', 'fas fa-calendar-week', 'By Date Range', 'Export all staff across events in a date range'] as const,
            ]).map(([type, icon, title, desc]) => (
              <div key={type} className={`admin-card rotr-export-card ${exportType === type ? 'active' : ''}`} onClick={() => setExportType(type)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <i className={icon} style={{ fontSize: '1.2rem', color: 'var(--blue-accent)' }}></i>
                  <h4 style={{ margin: 0 }}>{title}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="admin-card" style={{ marginTop: '1.25rem' }}>
            {exportType === 'event' && (
              <>
                <h4 style={{ marginBottom: '0.75rem' }}>Select Event</h4>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select value={exportEventId} onChange={e => setExportEventId(e.target.value)} className="rotr-filter-select" style={{ flex: 1, maxWidth: '500px' }}>
                    <option value="">Choose event...</option>
                    {sortedEvents.map(e => <option key={e.id} value={e.id}>{e.title} — {e.dateAndTimeSettings.formatted.startDate}</option>)}
                  </select>
                  <button
                    className="admin-btn admin-btn-primary"
                    disabled={!exportEventId || assignments.filter(a => a.wix_event_id === exportEventId).length === 0}
                    onClick={() => exportByEvent(exportEventId)}
                  >
                    <i className="fas fa-download"></i> Download CSV
                  </button>
                </div>
                {exportEventId && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {assignments.filter(a => a.wix_event_id === exportEventId).length} staff assignments found
                  </p>
                )}
              </>
            )}

            {exportType === 'contractor' && (
              <>
                <h4 style={{ marginBottom: '0.75rem' }}>Select Contractor</h4>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select value={exportContractorId} onChange={e => setExportContractorId(e.target.value)} className="rotr-filter-select" style={{ flex: 1, maxWidth: '500px' }}>
                    <option value="">Choose contractor...</option>
                    {contractors.sort((a, b) => a.last_name.localeCompare(b.last_name)).map(c => (
                      <option key={c.id} value={c.id}>{c.last_name}, {c.first_name} — {roleLabel(c.primary_role)}</option>
                    ))}
                  </select>
                  <button
                    className="admin-btn admin-btn-primary"
                    disabled={!exportContractorId || assignments.filter(a => a.contractor_id === exportContractorId).length === 0}
                    onClick={() => exportByContractor(exportContractorId)}
                  >
                    <i className="fas fa-download"></i> Download CSV
                  </button>
                </div>
                {exportContractorId && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {assignments.filter(a => a.contractor_id === exportContractorId).length} event assignments found
                  </p>
                )}
              </>
            )}

            {exportType === 'range' && (
              <>
                <h4 style={{ marginBottom: '0.75rem' }}>Select Date Range</h4>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
                  <span style={{ color: 'var(--gray-500)' }}>to</span>
                  <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
                  <button
                    className="admin-btn admin-btn-primary"
                    disabled={!exportStart || !exportEnd || assignments.filter(a => a.event_date >= exportStart && a.event_date <= exportEnd).length === 0}
                    onClick={() => exportByRange(exportStart, exportEnd)}
                  >
                    <i className="fas fa-download"></i> Download CSV
                  </button>
                </div>
                {exportStart && exportEnd && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {assignments.filter(a => a.event_date >= exportStart && a.event_date <= exportEnd).length} assignments in range
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {showModal && renderModal()}
    </>
  );
}

// ─── Copy From Event Button ──────────────────────────────────────────────

function CopyFromEventButton({ events, targetEventId, onCopy, currentAssignments }: {
  events: { id: string; title: string; dateAndTimeSettings: { formatted: { startDate: string } } }[];
  targetEventId: string;
  onCopy: (sourceId: string, targetId: string) => void;
  currentAssignments: ROTREventAssignment[];
}) {
  const [showSelect, setShowSelect] = useState(false);
  const eventsWithStaff = events.filter(e => e.id !== targetEventId && currentAssignments.some(a => a.wix_event_id === e.id));

  if (eventsWithStaff.length === 0) return null;

  return showSelect ? (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <select className="rotr-filter-select" onChange={e => { if (e.target.value) { onCopy(e.target.value, targetEventId); setShowSelect(false); } }}>
        <option value="">Copy staff from...</option>
        {eventsWithStaff.map(e => (
          <option key={e.id} value={e.id}>
            {e.title} ({currentAssignments.filter(a => a.wix_event_id === e.id).length} staff)
          </option>
        ))}
      </select>
      <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setShowSelect(false)}>Cancel</button>
    </div>
  ) : (
    <button className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setShowSelect(true)}>
      <i className="fas fa-copy"></i> Copy from Event
    </button>
  );
}
