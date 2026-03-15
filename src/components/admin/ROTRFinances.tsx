'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateFinancePdf } from '@/lib/generateFinancePdf';
import type { ROTRExpense, ROTRAdditionalRevenue, ROTREventAssignment } from '@/lib/types';

// ─── Types (mirrored from ROTR page) ─────────────────────────────────────────

interface ROTREvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  dateAndTimeSettings: {
    startDate: string;
    formatted: { startDate: string; startTime: string };
  };
  location: { name: string };
  mainImage?: { url: string };
  registration: {
    type: string;
    status: string;
    tickets?: {
      lowestPrice?: { formattedValue: string };
      highestPrice?: { formattedValue: string };
      soldOut: boolean;
    };
  };
  eventPageUrl?: { base: string; path: string };
  ticketDefinitions: { id: string; name: string; eventId: string; free: boolean; price: { amount: string; currency: string }; saleStatus: string }[];
}

interface Order {
  orderNumber: string;
  eventId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  ticketsQuantity: number;
  totalPrice?: { amount: string; currency: string };
  created: string;
  paymentDetails?: { transaction?: { method: string } };
}

interface TransactionData {
  serviceFee: number;
  ticketTotal: number;
  totalCharged: number;
  paymentMethod: string;
  ticketItems: { name: string; quantity: number; price: number }[];
  hasRefunds: boolean;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ROTRFinancesProps {
  events: ROTREvent[];
  orders: Order[];
  ordersLoading: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const EXPENSE_CATEGORIES = [
  { value: 'staffing', label: 'Staffing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'catering', label: 'Catering' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'permits', label: 'Permits' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'other', label: 'Other' },
] as const;

const SOURCE_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'merch', label: 'Merch' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Other' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  staffing: '#7C3AED', equipment: '#1B8BEB', supplies: '#10B981', marketing: '#D97706',
  catering: '#EF4444', rentals: '#6366f1', insurance: '#14b8a6', permits: '#f97316',
  entertainment: '#ec4899', advertising: '#f59e0b', other: '#94a3b8',
};

const SOURCE_COLORS: Record<string, string> = {
  cash: '#10B981', sponsorship: '#7C3AED', merch: '#D97706', donation: '#ec4899', other: '#94a3b8',
};

// ─── Loading Animation ──────────────────────────────────────────────────────

function MusicLoader({ title, step }: { title: string; step: string }) {
  return (
    <div className="analytics-loading-card">
      <div className="music-loading-scene">
        <div className="music-loading-eq">
          <div className="music-eq-bar"></div><div className="music-eq-bar"></div>
          <div className="music-eq-bar"></div><div className="music-eq-bar"></div>
          <div className="music-eq-bar"></div><div className="music-eq-bar"></div>
          <div className="music-eq-bar"></div>
        </div>
        <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
        <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
        <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
      </div>
      <h3 className="analytics-loading-title">{title}</h3>
      <p className="analytics-loading-step">{step}</p>
      <div className="analytics-loading-progress">
        <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function ROTRFinances({ events, orders, ordersLoading }: ROTRFinancesProps) {
  // ─── Sub-tab state ────────────────────────────────────────────────────────
  const [financeSubTab, setFinanceSubTab] = useState<'summary' | 'revenue' | 'expenses'>('summary');

  // ─── Period filter (shared) ───────────────────────────────────────────────
  const [financePeriod, setFinancePeriod] = useState('ytd');

  // ─── Transaction data ─────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Record<string, TransactionData>>({});
  const [txnLoading, setTxnLoading] = useState(false);

  // ─── AI Summary state ─────────────────────────────────────────────────────
  const [financeSummary, setFinanceSummary] = useState<{ summary: string; highlights: string[]; trend: string; generatedAt: string } | null>(null);
  const [financeSummaryLoading, setFinanceSummaryLoading] = useState(false);
  const [financeSummaryError, setFinanceSummaryError] = useState<string | null>(null);
  const [financeSummaryCollapsed, setFinanceSummaryCollapsed] = useState(false);
  const [financePdfLoading, setFinancePdfLoading] = useState(false);

  // ─── Expenses state ───────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<ROTRExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expenseFilter, setExpenseFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseEventFilter, setExpenseEventFilter] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ROTRExpense | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({
    description: '', amount: '', category: 'other' as ROTRExpense['category'],
    vendor: '', expense_date: new Date().toISOString().split('T')[0],
    wix_event_id: '', po_id: '', notes: '',
    is_recurring: false, recurrence_type: '' as string,
    next_occurrence_date: '', recurring_until: '',
    payment_status: 'unpaid' as string, due_date: '',
    paid_date: '', paid_amount: '', payment_method: '', invoice_number: '',
  });
  const [expensePaymentFilter, setExpensePaymentFilter] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  // ─── Additional Revenue state ─────────────────────────────────────────────
  const [additionalRevenue, setAdditionalRevenue] = useState<ROTRAdditionalRevenue[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<ROTRAdditionalRevenue | null>(null);
  const [revenueFormData, setRevenueFormData] = useState({
    description: '', amount: '', source_type: 'other' as ROTRAdditionalRevenue['source_type'],
    wix_event_id: '', revenue_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [revenueSaving, setRevenueSaving] = useState(false);

  // ─── Staff assignments (for cost calc) ────────────────────────────────────
  const [assignments, setAssignments] = useState<ROTREventAssignment[]>([]);

  // ─── Purchase orders (for linking) ────────────────────────────────────────
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; po_number: string; title: string }[]>([]);

  // ─── Fetch data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    // Transactions
    if (Object.keys(transactions).length === 0 && !txnLoading) {
      setTxnLoading(true);
      fetch('/api/admin/rotr/transactions')
        .then(res => res.json())
        .then(data => setTransactions(data.transactions || {}))
        .catch(err => console.error('Failed to load transactions:', err))
        .finally(() => setTxnLoading(false));
    }
  }, []);

  useEffect(() => {
    // Expenses
    fetch('/api/admin/rotr/expenses')
      .then(res => res.json())
      .then(data => setExpenses(data.expenses || []))
      .catch(err => console.error('Failed to load expenses:', err))
      .finally(() => setExpensesLoading(false));
  }, []);

  useEffect(() => {
    // Additional Revenue
    fetch('/api/admin/rotr/additional-revenue')
      .then(res => res.json())
      .then(data => setAdditionalRevenue(data.revenue || []))
      .catch(err => console.error('Failed to load additional revenue:', err))
      .finally(() => setRevenueLoading(false));
  }, []);

  useEffect(() => {
    // Staff assignments (just for cost calc)
    fetch('/api/admin/rotr-staff')
      .then(res => res.json())
      .then(data => setAssignments(data.assignments || []))
      .catch(err => console.error('Failed to load staff assignments:', err));
  }, []);

  useEffect(() => {
    // Purchase orders for linking dropdown
    fetch('/api/admin/purchase-orders')
      .then(r => r.json())
      .then(d => {
        const rotrPOs = (d.orders || []).filter((po: { context: string }) => po.context === 'rotr');
        setPurchaseOrders(rotrPOs);
      })
      .catch(() => {});
  }, []);

  // Clear AI summary when period changes
  useEffect(() => {
    setFinanceSummary(null);
    setFinanceSummaryError(null);
  }, [financePeriod]);

  // ─── Shared financial calculations ────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const orderYears = [...new Set(orders.map(o => new Date(o.created).getFullYear()))].sort((a, b) => b - a);
  const hasTxnData = Object.keys(transactions).length > 0;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const periodOrders = orders.filter(o => {
    if (financePeriod === 'all') return true;
    const created = new Date(o.created);
    if (financePeriod === '7d') return created >= new Date(Date.now() - 7 * 86400000);
    if (financePeriod === '30d') return created >= new Date(Date.now() - 30 * 86400000);
    if (financePeriod === '90d') return created >= new Date(Date.now() - 90 * 86400000);
    if (financePeriod === 'ytd') return created.getFullYear() === currentYear;
    if (financePeriod === 'this-month') return created >= thisMonthStart;
    if (financePeriod === 'last-month') return created >= lastMonthStart && created < thisMonthStart;
    return created.getFullYear() === parseInt(financePeriod);
  });

  const calcProcessingFee = (ticketTotal: number) => ticketTotal > 0 ? ticketTotal * 0.029 + 0.30 : 0;

  const getServiceFee = (orderNumber: string, ticketTotal: number) => {
    const txn = transactions[orderNumber];
    if (txn) return txn.serviceFee;
    return ticketTotal > 0 ? Math.ceil(ticketTotal * 0.025 * 100) / 100 : 0;
  };

  const getMethod = (o: Order) => {
    const txn = transactions[o.orderNumber];
    if (txn) return txn.paymentMethod;
    return o.paymentDetails?.transaction?.method || (o.status === 'FREE' ? 'Free' : 'Unknown');
  };

  const fmtMethod = (method: string) => {
    const names: Record<string, string> = {
      creditCard: 'Credit Card', payPal: 'PayPal', applePay: 'Apple Pay',
      googlePay: 'Google Pay', inPerson: 'In Person', cash: 'Cash', Free: 'Free',
    };
    return names[method] || method;
  };

  const paidOrders = periodOrders.filter(o => o.status === 'PAID');
  const freeOrders = periodOrders.filter(o => o.status === 'FREE');
  const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'), 0);
  const totalTickets = periodOrders.reduce((sum, o) => sum + o.ticketsQuantity, 0);
  const avgOrderValue = paidOrders.length > 0
    ? paidOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'), 0) / paidOrders.length
    : 0;

  const totalProcessingFees = paidOrders.reduce((sum, o) => {
    const amt = parseFloat(o.totalPrice?.amount || '0');
    return sum + calcProcessingFee(amt);
  }, 0);
  const totalServiceFees = paidOrders.reduce((sum, o) => {
    const amt = parseFloat(o.totalPrice?.amount || '0');
    return sum + getServiceFee(o.orderNumber, amt);
  }, 0);
  const totalNetPayout = totalRevenue - totalProcessingFees;

  // Revenue by event
  const eventRevMap = new Map<string, { name: string; date: string; orders: number; paidOrders: number; tickets: number; revenue: number }>();
  periodOrders.forEach(o => {
    const existing = eventRevMap.get(o.eventId);
    const amount = parseFloat(o.totalPrice?.amount || '0');
    const isPaid = o.status === 'PAID';
    if (existing) {
      existing.orders++;
      if (isPaid) existing.paidOrders++;
      existing.tickets += o.ticketsQuantity;
      existing.revenue += amount;
    } else {
      const ev = events.find(e => e.id === o.eventId);
      eventRevMap.set(o.eventId, {
        name: ev?.title || 'Unknown Event',
        date: ev?.dateAndTimeSettings?.formatted?.startDate || '',
        orders: 1,
        paidOrders: isPaid ? 1 : 0,
        tickets: o.ticketsQuantity,
        revenue: amount,
      });
    }
  });
  const eventRevenue = Array.from(eventRevMap.entries()).map(([eventId, data]) => {
    const evOrders = periodOrders.filter(o => o.eventId === eventId && o.status === 'PAID');
    const fees = evOrders.reduce((sum, o) => sum + calcProcessingFee(parseFloat(o.totalPrice?.amount || '0')), 0);
    return { eventId, ...data, fees, net: data.revenue - fees };
  }).sort((a, b) => b.revenue - a.revenue);

  // Monthly breakdown
  const monthMap = new Map<string, { orders: number; paidOrders: number; tickets: number; revenue: number }>();
  periodOrders.forEach(o => {
    const d = new Date(o.created);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key);
    const amount = parseFloat(o.totalPrice?.amount || '0');
    const isPaid = o.status === 'PAID';
    if (existing) {
      existing.orders++;
      if (isPaid) existing.paidOrders++;
      existing.tickets += o.ticketsQuantity;
      existing.revenue += amount;
    } else {
      monthMap.set(key, { orders: 1, paidOrders: isPaid ? 1 : 0, tickets: o.ticketsQuantity, revenue: amount });
    }
  });
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [y, m] = key.split('-');
      const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthOrders = periodOrders.filter(o => {
        const od = new Date(o.created);
        return `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}` === key;
      });
      const fees = monthOrders.reduce((sum, o) => {
        const amt = parseFloat(o.totalPrice?.amount || '0');
        return sum + (o.status === 'PAID' ? calcProcessingFee(amt) : 0);
      }, 0);
      const svcFees = monthOrders.reduce((sum, o) => {
        const amt = parseFloat(o.totalPrice?.amount || '0');
        return sum + (o.status === 'PAID' ? getServiceFee(o.orderNumber, amt) : 0);
      }, 0);
      return { label, ...data, fees, svcFees, net: data.revenue - fees };
    });

  // Payment method breakdown
  const methodMap = new Map<string, { count: number; revenue: number }>();
  periodOrders.forEach(o => {
    const method = getMethod(o);
    const existing = methodMap.get(method);
    const amount = parseFloat(o.totalPrice?.amount || '0');
    if (existing) {
      existing.count++;
      existing.revenue += amount;
    } else {
      methodMap.set(method, { count: 1, revenue: amount });
    }
  });
  const paymentMethods = Array.from(methodMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([method, data]) => ({ method, ...data }));

  // Period label
  const thisMonthName = thisMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const lastMonthName = lastMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const periodLabel = financePeriod === 'all' ? 'All Time'
    : financePeriod === 'ytd' ? `${currentYear} Year-to-Date`
    : financePeriod === '7d' ? 'Past 7 Days'
    : financePeriod === '30d' ? 'Past 30 Days'
    : financePeriod === '90d' ? 'Past 90 Days'
    : financePeriod === 'this-month' ? thisMonthName
    : financePeriod === 'last-month' ? lastMonthName
    : financePeriod;

  // ─── Filter expenses/revenue by period ────────────────────────────────────

  const filterByPeriod = (dateStr: string) => {
    if (financePeriod === 'all') return true;
    const d = new Date(dateStr);
    if (financePeriod === '7d') return d >= new Date(Date.now() - 7 * 86400000);
    if (financePeriod === '30d') return d >= new Date(Date.now() - 30 * 86400000);
    if (financePeriod === '90d') return d >= new Date(Date.now() - 90 * 86400000);
    if (financePeriod === 'ytd') return d.getFullYear() === currentYear;
    if (financePeriod === 'this-month') return d >= thisMonthStart;
    if (financePeriod === 'last-month') return d >= lastMonthStart && d < thisMonthStart;
    return d.getFullYear() === parseInt(financePeriod);
  };

  const periodExpenses = expenses.filter(e => filterByPeriod(e.expense_date));
  const periodAdditionalRevenue = additionalRevenue.filter(r => filterByPeriod(r.revenue_date));
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAdditionalRev = periodAdditionalRevenue.reduce((sum, r) => sum + r.amount, 0);

  // Staff costs from assignments (only non-cancelled, in period)
  const periodAssignments = assignments.filter(a => a.status !== 'cancelled' && filterByPeriod(a.event_date));
  const calcStaffCost = (a: ROTREventAssignment) => {
    if (a.pay_type === 'flat') return a.pay_rate;
    const hours = a.actual_hours || a.scheduled_hours || 0;
    return hours * a.pay_rate;
  };
  const totalStaffCosts = periodAssignments.reduce((sum, a) => sum + calcStaffCost(a), 0);

  const combinedTotalRevenue = totalRevenue + totalAdditionalRev;
  const netProfit = combinedTotalRevenue - totalExpenses - totalStaffCosts - totalProcessingFees;

  // ─── CSV download ─────────────────────────────────────────────────────────

  const downloadCSV = () => {
    const csvHeaders = ['Order #', 'Date', 'Event', 'Ticket Details', 'Customer', 'Email', 'Tickets', 'Gross Amount', 'Processing Fee (2.9%+$0.30)', 'Wix Service Fee' + (hasTxnData ? '' : ' (est)'), 'Net Payout', 'Status', 'Payment Method'];
    const rows = periodOrders
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .map(o => {
        const ev = events.find(e => e.id === o.eventId);
        const method = getMethod(o);
        const amt = parseFloat(o.totalPrice?.amount || '0');
        const procFee = o.status === 'PAID' ? calcProcessingFee(amt) : 0;
        const svcFee = o.status === 'PAID' ? getServiceFee(o.orderNumber, amt) : 0;
        const net = amt - procFee;
        const txn = transactions[o.orderNumber];
        const ticketDetails = txn?.ticketItems?.map(i => `${i.name} x${i.quantity}`).join('; ') || '';
        return [
          o.orderNumber,
          new Date(o.created).toLocaleDateString('en-US'),
          ev?.title || 'Unknown',
          ticketDetails,
          o.fullName || `${o.firstName} ${o.lastName}`.trim(),
          o.email,
          String(o.ticketsQuantity),
          amt.toFixed(2),
          procFee.toFixed(2),
          svcFee.toFixed(2),
          net.toFixed(2),
          o.status === 'NA_ORDER_STATUS' ? 'N/A' : o.status,
          fmtMethod(method),
        ];
      });

    const csvContent = [csvHeaders, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const csvPeriodLabel = financePeriod === 'all' ? 'All-Time' : financePeriod;
    link.download = `ROTR-Financial-Report-${csvPeriodLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── AI Summary ───────────────────────────────────────────────────────────

  const generateFinanceSummary = async () => {
    setFinanceSummaryLoading(true);
    setFinanceSummaryError(null);
    try {
      const res = await fetch('/api/admin/finance-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: periodLabel,
          totals: {
            grossRevenue: totalRevenue,
            processingFees: totalProcessingFees,
            serviceFees: totalServiceFees,
            netPayout: totalNetPayout,
            totalOrders: periodOrders.length,
            paidOrders: paidOrders.length,
            freeOrders: freeOrders.length,
            totalTickets,
            avgOrderValue,
            expenses: totalExpenses,
            staffCosts: totalStaffCosts,
            additionalRevenue: totalAdditionalRev,
            netProfit,
          },
          monthly: monthlyData,
          events: eventRevenue,
          paymentMethods,
          hasTxnData,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFinanceSummary(data);
    } catch (err) {
      setFinanceSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setFinanceSummaryLoading(false);
    }
  };

  const exportFinancePdf = async () => {
    setFinancePdfLoading(true);
    try {
      await generateFinancePdf({
        periodLabel,
        summary: financeSummary,
        totals: {
          grossRevenue: totalRevenue,
          processingFees: totalProcessingFees,
          serviceFees: totalServiceFees,
          netPayout: totalNetPayout,
          totalOrders: periodOrders.length,
          paidOrders: paidOrders.length,
          freeOrders: freeOrders.length,
          totalTickets,
          avgOrderValue,
        },
        monthly: monthlyData,
        events: eventRevenue,
        paymentMethods,
        hasTxnData,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setFinancePdfLoading(false);
    }
  };

  // ─── Expense CRUD ─────────────────────────────────────────────────────────

  const openExpenseForm = (expense?: ROTRExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseFormData({
        description: expense.description,
        amount: String(expense.amount),
        category: expense.category,
        vendor: expense.vendor || '',
        expense_date: expense.expense_date.split('T')[0],
        wix_event_id: expense.wix_event_id || '',
        po_id: expense.po_id || '',
        notes: expense.notes || '',
        is_recurring: expense.is_recurring || false,
        recurrence_type: expense.recurrence_type || '',
        next_occurrence_date: expense.next_occurrence_date ? expense.next_occurrence_date.split('T')[0] : '',
        recurring_until: expense.recurring_until ? expense.recurring_until.split('T')[0] : '',
        payment_status: expense.payment_status || 'unpaid',
        due_date: expense.due_date ? expense.due_date.split('T')[0] : '',
        paid_date: expense.paid_date ? expense.paid_date.split('T')[0] : '',
        paid_amount: expense.paid_amount != null ? String(expense.paid_amount) : '',
        payment_method: expense.payment_method || '',
        invoice_number: expense.invoice_number || '',
      });
    } else {
      setEditingExpense(null);
      setExpenseFormData({
        description: '', amount: '', category: 'other',
        vendor: '', expense_date: new Date().toISOString().split('T')[0],
        wix_event_id: '', po_id: '', notes: '',
        is_recurring: false, recurrence_type: '',
        next_occurrence_date: '', recurring_until: '',
        payment_status: 'unpaid', due_date: '',
        paid_date: '', paid_amount: '', payment_method: '', invoice_number: '',
      });
    }
    setReceiptFile(null);
    setShowExpenseForm(true);
  };

  const saveExpense = async () => {
    if (!expenseFormData.description.trim() || !expenseFormData.amount || !expenseFormData.expense_date) return;
    setExpenseSaving(true);

    try {
      // Upload receipt if provided
      let receiptUrls = editingExpense?.receipt_urls || [];
      if (receiptFile) {
        setReceiptUploading(true);
        const supabase = createClient();
        const ext = receiptFile.name.split('.').pop();
        const path = `rotr-expenses/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('new-images').upload(path, receiptFile);
        if (uploadError) throw new Error('Receipt upload failed: ' + uploadError.message);
        const { data: urlData } = supabase.storage.from('new-images').getPublicUrl(path);
        receiptUrls = [...receiptUrls, urlData.publicUrl];
        setReceiptUploading(false);
      }

      const payload = {
        description: expenseFormData.description.trim(),
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        vendor: expenseFormData.vendor.trim() || null,
        expense_date: expenseFormData.expense_date,
        wix_event_id: expenseFormData.wix_event_id || null,
        po_id: expenseFormData.po_id || null,
        receipt_urls: receiptUrls,
        notes: expenseFormData.notes.trim() || null,
        created_by: 'admin',
        is_recurring: expenseFormData.is_recurring,
        recurrence_type: expenseFormData.is_recurring && expenseFormData.recurrence_type ? expenseFormData.recurrence_type : null,
        next_occurrence_date: expenseFormData.is_recurring && expenseFormData.next_occurrence_date ? expenseFormData.next_occurrence_date : null,
        recurring_until: expenseFormData.is_recurring && expenseFormData.recurring_until ? expenseFormData.recurring_until : null,
        payment_status: expenseFormData.payment_status || 'unpaid',
        due_date: expenseFormData.due_date || null,
        paid_date: (expenseFormData.payment_status === 'paid' || expenseFormData.payment_status === 'partially_paid') && expenseFormData.paid_date ? expenseFormData.paid_date : null,
        paid_amount: expenseFormData.payment_status === 'partially_paid' && expenseFormData.paid_amount ? parseFloat(expenseFormData.paid_amount) : null,
        payment_method: (expenseFormData.payment_status === 'paid' || expenseFormData.payment_status === 'partially_paid') && expenseFormData.payment_method ? expenseFormData.payment_method : null,
        invoice_number: expenseFormData.invoice_number.trim() || null,
      };

      if (editingExpense) {
        const res = await fetch('/api/admin/rotr/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingExpense.id, ...payload }),
        });
        if (!res.ok) throw new Error('Failed to update expense');
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...payload, updated_at: new Date().toISOString() } as ROTRExpense : e));
      } else {
        const res = await fetch('/api/admin/rotr/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create expense');
        const data = await res.json();
        setExpenses(prev => [data.expense, ...prev]);
      }
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('Save expense error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setExpenseSaving(false);
      setReceiptUploading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      const res = await fetch(`/api/admin/rotr/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  const markExpenseAsPaid = async (expense: ROTRExpense) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/admin/rotr/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expense.id, payment_status: 'paid', paid_date: today }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, payment_status: 'paid' as const, paid_date: today, updated_at: new Date().toISOString() } : e));
    } catch (err) {
      console.error('Mark as paid error:', err);
      alert('Failed to mark expense as paid');
    }
  };

  // ─── Additional Revenue CRUD ──────────────────────────────────────────────

  const openRevenueForm = (entry?: ROTRAdditionalRevenue) => {
    if (entry) {
      setEditingRevenue(entry);
      setRevenueFormData({
        description: entry.description,
        amount: String(entry.amount),
        source_type: entry.source_type,
        wix_event_id: entry.wix_event_id || '',
        revenue_date: entry.revenue_date.split('T')[0],
        notes: entry.notes || '',
      });
    } else {
      setEditingRevenue(null);
      setRevenueFormData({
        description: '', amount: '', source_type: 'other',
        wix_event_id: '', revenue_date: new Date().toISOString().split('T')[0], notes: '',
      });
    }
    setShowRevenueForm(true);
  };

  const saveRevenue = async () => {
    if (!revenueFormData.description.trim() || !revenueFormData.amount || !revenueFormData.revenue_date) return;
    setRevenueSaving(true);

    try {
      const payload = {
        description: revenueFormData.description.trim(),
        amount: parseFloat(revenueFormData.amount),
        source_type: revenueFormData.source_type,
        wix_event_id: revenueFormData.wix_event_id || null,
        revenue_date: revenueFormData.revenue_date,
        notes: revenueFormData.notes.trim() || null,
        created_by: 'admin',
      };

      if (editingRevenue) {
        const res = await fetch('/api/admin/rotr/additional-revenue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRevenue.id, ...payload }),
        });
        if (!res.ok) throw new Error('Failed to update');
        setAdditionalRevenue(prev => prev.map(r => r.id === editingRevenue.id ? { ...r, ...payload, updated_at: new Date().toISOString() } as ROTRAdditionalRevenue : r));
      } else {
        const res = await fetch('/api/admin/rotr/additional-revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create');
        const data = await res.json();
        setAdditionalRevenue(prev => [data.entry, ...prev]);
      }
      setShowRevenueForm(false);
      setEditingRevenue(null);
    } catch (err) {
      console.error('Save revenue error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setRevenueSaving(false);
    }
  };

  const deleteRevenue = async (id: string) => {
    if (!confirm('Delete this revenue entry?')) return;
    try {
      const res = await fetch(`/api/admin/rotr/additional-revenue?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setAdditionalRevenue(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete revenue error:', err);
    }
  };

  // ─── Staff costs per event (for P&L) ──────────────────────────────────────

  const staffCostByEvent = new Map<string, number>();
  let generalStaffCost = 0;
  periodAssignments.forEach(a => {
    const cost = calcStaffCost(a);
    if (a.wix_event_id) {
      staffCostByEvent.set(a.wix_event_id, (staffCostByEvent.get(a.wix_event_id) || 0) + cost);
    } else {
      generalStaffCost += cost;
    }
  });

  // Expenses per event (for P&L)
  const expensesByEvent = new Map<string, number>();
  let generalExpenses = 0;
  periodExpenses.forEach(e => {
    if (e.wix_event_id) {
      expensesByEvent.set(e.wix_event_id, (expensesByEvent.get(e.wix_event_id) || 0) + e.amount);
    } else {
      generalExpenses += e.amount;
    }
  });

  // Additional revenue per event (for P&L)
  const addRevByEvent = new Map<string, number>();
  let generalAddRev = 0;
  periodAdditionalRevenue.forEach(r => {
    if (r.wix_event_id) {
      addRevByEvent.set(r.wix_event_id, (addRevByEvent.get(r.wix_event_id) || 0) + r.amount);
    } else {
      generalAddRev += r.amount;
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════

  if (ordersLoading || txnLoading) {
    return <MusicLoader title="Loading Finances..." step="Crunching financial data..." />;
  }

  return (
    <div>
      {/* ─── Sub-Tab Navigation ─────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '0', marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
        {(['summary', 'revenue', 'expenses'] as const).map(st => (
          <button
            key={st}
            onClick={() => setFinanceSubTab(st)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: financeSubTab === st ? '3px solid #7C3AED' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: financeSubTab === st ? 700 : 500,
              fontSize: '0.9rem',
              color: financeSubTab === st ? '#7C3AED' : 'var(--navy)',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: financeSubTab === st ? 1 : 0.7,
            }}
          >
            <i className={`fas fa-${st === 'summary' ? 'chart-pie' : st === 'revenue' ? 'dollar-sign' : 'receipt'}`}></i>
            {st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Period Filter (shared) ─────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <i className="fas fa-calendar-alt" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
        <div className="rotr-finance-periods">
          {(['this-month', 'last-month', '90d', 'ytd'] as const).map(p => (
            <button
              key={p}
              className={`rotr-analytics-period-btn ${financePeriod === p ? 'active' : ''}`}
              onClick={() => setFinancePeriod(p)}
            >
              {p === 'ytd' ? 'YTD' : p === 'this-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : p}
            </button>
          ))}
          <select
            value={['this-month', 'last-month', '90d', 'ytd'].includes(financePeriod) ? '' : financePeriod}
            onChange={e => setFinancePeriod(e.target.value)}
            className="rotr-filter-select"
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="" disabled>More...</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
            <option value="all">All Time</option>
            {orderYears.map(y => (
              <option key={y} value={String(y)}>
                {y}{y === currentYear ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{periodLabel}</span>
          {financeSubTab === 'revenue' && (
            <button onClick={downloadCSV} className="admin-btn admin-btn-secondary">
              <i className="fas fa-download"></i> CSV
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SUMMARY SUB-TAB
         ═══════════════════════════════════════════════════════════════════ */}
      {financeSubTab === 'summary' && (
        <>
          {/* AI Financial Summary */}
          <div className="ua-ai-summary-card" style={{ marginBottom: '1.25rem' }}>
            <div className="ua-ai-summary-header">
              <div className="ua-ai-summary-title">
                <i className="fas fa-robot"></i> AI Financial Summary
                {financeSummary && !financeSummaryLoading && (
                  <button
                    onClick={() => setFinanceSummaryCollapsed(!financeSummaryCollapsed)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.5rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}
                    title={financeSummaryCollapsed ? 'Expand summary' : 'Collapse summary'}
                  >
                    <i className={`fas fa-chevron-${financeSummaryCollapsed ? 'down' : 'up'}`}></i>
                  </button>
                )}
              </div>
              <div className="ua-ai-header-actions">
                {financeSummary && !financeSummaryLoading && (
                  <button className="admin-btn admin-btn-secondary ua-ai-btn" onClick={exportFinancePdf} disabled={financePdfLoading}>
                    <i className={`fas fa-${financePdfLoading ? 'spinner fa-spin' : 'file-pdf'}`}></i>
                    {financePdfLoading ? 'Generating...' : 'Export PDF'}
                  </button>
                )}
                {!financeSummaryLoading && (
                  <button className="admin-btn admin-btn-secondary ua-ai-btn" onClick={generateFinanceSummary} disabled={ordersLoading || txnLoading}>
                    <i className={`fas fa-${financeSummary ? 'sync-alt' : 'magic'}`}></i>
                    {financeSummary ? 'Refresh' : 'Generate Summary'}
                  </button>
                )}
              </div>
            </div>

            {financeSummaryLoading && (
              <div className="ua-ai-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Analyzing financial data for {periodLabel}...</span>
              </div>
            )}

            {financeSummaryError && !financeSummaryLoading && (
              <div className="ua-ai-error">
                <i className="fas fa-exclamation-triangle"></i> {financeSummaryError}
              </div>
            )}

            {financeSummary && !financeSummaryLoading && !financeSummaryCollapsed && (
              <div className="ua-ai-content">
                {financeSummary.trend && (
                  <span className={`ua-ai-trend-badge ua-ai-trend-${financeSummary.trend}`}>
                    <i className={`fas fa-arrow-${financeSummary.trend === 'positive' ? 'up' : financeSummary.trend === 'declining' ? 'down' : 'right'}`}></i>
                    {financeSummary.trend.charAt(0).toUpperCase() + financeSummary.trend.slice(1)} Trend
                  </span>
                )}
                <div className="ua-ai-summary-text">
                  {financeSummary.summary.split(/\n\n|\n/).filter(p => p.trim()).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {financeSummary.highlights.length > 0 && (
                  <div className="ua-ai-highlights">
                    <div className="ua-ai-highlights-title">Key Highlights</div>
                    <ul>
                      {financeSummary.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="ua-ai-footer">
                  <i className="fas fa-info-circle"></i>
                  AI-generated summary for {periodLabel} &middot; {new Date(financeSummary.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            )}

            {financeSummary && !financeSummaryLoading && financeSummaryCollapsed && (
              <div style={{ padding: '0.5rem 0', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setFinanceSummaryCollapsed(false)}>
                {financeSummary.trend && (
                  <span className={`ua-ai-trend-badge ua-ai-trend-${financeSummary.trend}`} style={{ marginRight: '0.5rem' }}>
                    <i className={`fas fa-arrow-${financeSummary.trend === 'positive' ? 'up' : financeSummary.trend === 'declining' ? 'down' : 'right'}`}></i>
                    {financeSummary.trend.charAt(0).toUpperCase() + financeSummary.trend.slice(1)}
                  </span>
                )}
                Summary generated &middot; Click to expand
              </div>
            )}

            {!financeSummary && !financeSummaryLoading && !financeSummaryError && (
              <p className="ua-ai-placeholder">
                Click &ldquo;Generate Summary&rdquo; for an AI-powered analysis of your {periodLabel} data.
              </p>
            )}
          </div>

          {/* Summary Stat Cards */}
          <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
            {[
              { title: 'Total Revenue', value: formatCurrency(combinedTotalRevenue), icon: 'fas fa-dollar-sign', color: '#10B981', sub: `Tickets: ${formatCurrency(totalRevenue)} + Other: ${formatCurrency(totalAdditionalRev)}` },
              { title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: 'fas fa-receipt', color: '#EF4444', sub: `${periodExpenses.length} entries` },
              { title: 'Staff Costs', value: formatCurrency(totalStaffCosts), icon: 'fas fa-hard-hat', color: '#D97706', sub: `${periodAssignments.length} assignments` },
              { title: 'Net Profit', value: formatCurrency(netProfit), icon: 'fas fa-chart-line', color: netProfit >= 0 ? '#10B981' : '#EF4444', sub: `After fees: -${formatCurrency(totalProcessingFees)}` },
            ].map(card => (
              <div key={card.title} className="admin-stat-card dash-compact-card">
                <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                  <i className={card.icon}></i>
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-count" style={{ fontSize: '1.2rem' }}>{card.value}</span>
                  <span className="admin-stat-label">{card.title}</span>
                  {card.sub && <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>{card.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Per-Event P&L Table */}
          <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
              <i className="fas fa-table" style={{ color: '#7C3AED' }}></i> Profit &amp; Loss by Event
            </h3>
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th style={{ textAlign: 'right' }}>Ticket Rev.</th>
                    <th style={{ textAlign: 'right' }}>Other Rev.</th>
                    <th style={{ textAlign: 'right' }}>Expenses</th>
                    <th style={{ textAlign: 'right' }}>Staff</th>
                    <th style={{ textAlign: 'right' }}>Fees</th>
                    <th style={{ textAlign: 'right' }}>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRevenue.map(ev => {
                    const evExpenses = expensesByEvent.get(ev.eventId) || 0;
                    const evStaff = staffCostByEvent.get(ev.eventId) || 0;
                    const evAddRev = addRevByEvent.get(ev.eventId) || 0;
                    const evNet = ev.revenue + evAddRev - evExpenses - evStaff - ev.fees;
                    return (
                      <tr key={ev.eventId}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{ev.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ev.date}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(ev.revenue)}</td>
                        <td style={{ textAlign: 'right', color: evAddRev > 0 ? '#10B981' : undefined }}>{evAddRev > 0 ? formatCurrency(evAddRev) : '—'}</td>
                        <td style={{ textAlign: 'right', color: evExpenses > 0 ? '#EF4444' : undefined }}>{evExpenses > 0 ? `-${formatCurrency(evExpenses)}` : '—'}</td>
                        <td style={{ textAlign: 'right', color: evStaff > 0 ? '#D97706' : undefined }}>{evStaff > 0 ? `-${formatCurrency(evStaff)}` : '—'}</td>
                        <td style={{ textAlign: 'right', color: '#EF4444', fontSize: '0.82rem' }}>-{formatCurrency(ev.fees)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: evNet >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(evNet)}</td>
                      </tr>
                    );
                  })}
                  {/* General / Overhead row */}
                  {(generalExpenses > 0 || generalStaffCost > 0 || generalAddRev > 0) && (
                    <tr style={{ fontStyle: 'italic' }}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>General / Overhead</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Not tied to an event</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>—</td>
                      <td style={{ textAlign: 'right', color: generalAddRev > 0 ? '#10B981' : undefined }}>{generalAddRev > 0 ? formatCurrency(generalAddRev) : '—'}</td>
                      <td style={{ textAlign: 'right', color: generalExpenses > 0 ? '#EF4444' : undefined }}>{generalExpenses > 0 ? `-${formatCurrency(generalExpenses)}` : '—'}</td>
                      <td style={{ textAlign: 'right', color: generalStaffCost > 0 ? '#D97706' : undefined }}>{generalStaffCost > 0 ? `-${formatCurrency(generalStaffCost)}` : '—'}</td>
                      <td style={{ textAlign: 'right' }}>—</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: (generalAddRev - generalExpenses - generalStaffCost) >= 0 ? '#10B981' : '#EF4444' }}>
                        {formatCurrency(generalAddRev - generalExpenses - generalStaffCost)}
                      </td>
                    </tr>
                  )}
                  {/* Total row */}
                  <tr className="rotr-finance-total-row">
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalAdditionalRev)}</td>
                    <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalExpenses)}</td>
                    <td style={{ textAlign: 'right', color: '#D97706' }}>-{formatCurrency(totalStaffCosts)}</td>
                    <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Breakdown Note */}
          <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderLeft: '4px solid #1B8BEB', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <i className="fas fa-info-circle" style={{ color: '#1B8BEB', marginTop: '0.15rem' }}></i>
            <span>
              Processing fees: <strong>2.9% + $0.30</strong> per transaction.
              {hasTxnData
                ? <> Service fees from <strong>actual payment records</strong>.</>
                : <> Service fees estimated at <strong>2.5%</strong>.</>
              }
              {' '}{paidOrders.length} paid, {freeOrders.length} free orders.
              {' '}Staff costs calculated from {periodAssignments.length} assignment(s). Expenses from {periodExpenses.length} logged entries.
            </span>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          REVENUE SUB-TAB
         ═══════════════════════════════════════════════════════════════════ */}
      {financeSubTab === 'revenue' && (
        <>
          {/* Additional Revenue Section */}
          <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <i className="fas fa-hand-holding-usd" style={{ color: '#10B981' }}></i> Additional Revenue
              </h3>
              <button className="admin-btn admin-btn-primary" onClick={() => openRevenueForm()} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
                <i className="fas fa-plus"></i> Add Revenue
              </button>
            </div>

            {/* Additional Revenue Stats */}
            <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1rem' }}>
              {[
                { title: 'Total Additional Revenue', value: formatCurrency(totalAdditionalRev), icon: 'fas fa-coins', color: '#10B981' },
                { title: '# of Entries', value: String(periodAdditionalRevenue.length), icon: 'fas fa-list-ol', color: '#1B8BEB' },
              ].map(card => (
                <div key={card.title} className="admin-stat-card dash-compact-card">
                  <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                    <i className={card.icon}></i>
                  </div>
                  <div className="admin-stat-info">
                    <span className="admin-stat-count" style={{ fontSize: '1.2rem' }}>{card.value}</span>
                    <span className="admin-stat-label">{card.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit Revenue Form */}
            {showRevenueForm && (
              <div className="admin-card" style={{ marginBottom: '1rem', border: '2px solid #10B98130', background: 'var(--card-bg, #fff)' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
                  <i className="fas fa-edit" style={{ color: '#10B981', marginRight: '0.4rem' }}></i>
                  {editingRevenue ? 'Edit Revenue Entry' : 'New Revenue Entry'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Description *</label>
                    <input type="text" className="rotr-filter-select" style={{ width: '100%' }} placeholder="e.g. T-shirt sales" value={revenueFormData.description} onChange={e => setRevenueFormData({ ...revenueFormData, description: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Amount ($) *</label>
                    <input type="number" className="rotr-filter-select" style={{ width: '100%' }} placeholder="0.00" step="0.01" value={revenueFormData.amount} onChange={e => setRevenueFormData({ ...revenueFormData, amount: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Source Type *</label>
                    <select className="rotr-filter-select" style={{ width: '100%' }} value={revenueFormData.source_type} onChange={e => setRevenueFormData({ ...revenueFormData, source_type: e.target.value as ROTRAdditionalRevenue['source_type'] })}>
                      {SOURCE_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Event (optional)</label>
                    <select className="rotr-filter-select" style={{ width: '100%' }} value={revenueFormData.wix_event_id} onChange={e => setRevenueFormData({ ...revenueFormData, wix_event_id: e.target.value })}>
                      <option value="">No event</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.dateAndTimeSettings.formatted.startDate}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Date *</label>
                    <input type="date" className="rotr-filter-select" style={{ width: '100%' }} value={revenueFormData.revenue_date} onChange={e => setRevenueFormData({ ...revenueFormData, revenue_date: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Notes</label>
                    <textarea className="rotr-filter-select" style={{ width: '100%', minHeight: '60px', resize: 'vertical' }} placeholder="Optional notes..." value={revenueFormData.notes} onChange={e => setRevenueFormData({ ...revenueFormData, notes: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="admin-btn admin-btn-secondary" onClick={() => { setShowRevenueForm(false); setEditingRevenue(null); }}>Cancel</button>
                  <button className="admin-btn admin-btn-primary" onClick={saveRevenue} disabled={revenueSaving || !revenueFormData.description.trim() || !revenueFormData.amount}>
                    {revenueSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> {editingRevenue ? 'Update' : 'Add'}</>}
                  </button>
                </div>
              </div>
            )}

            {/* Additional Revenue List */}
            {revenueLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>
            ) : periodAdditionalRevenue.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <i className="fas fa-coins" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
                No additional revenue entries for this period
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {periodAdditionalRevenue.map((r, idx) => {
                  const evTitle = r.wix_event_id ? events.find(e => e.id === r.wix_event_id)?.title : null;
                  return (
                    <div key={r.id} className="rotr-event-row" style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 0',
                      borderBottom: idx < periodAdditionalRevenue.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>{r.description}</span>
                          <span style={{
                            fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600,
                            background: `${SOURCE_COLORS[r.source_type] || '#94a3b8'}18`,
                            color: SOURCE_COLORS[r.source_type] || '#94a3b8',
                          }}>
                            {SOURCE_TYPES.find(st => st.value === r.source_type)?.label || r.source_type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {formatDate(r.revenue_date)}
                          {evTitle && <> &middot; {evTitle}</>}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10B981', marginRight: '0.5rem' }}>{formatCurrency(r.amount)}</div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => openRevenueForm(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', padding: '0.25rem' }} title="Edit">
                          <i className="fas fa-pen"></i>
                        </button>
                        <button onClick={() => deleteRevenue(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.8rem', padding: '0.25rem' }} title="Delete">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Existing Ticket Revenue Cards */}
          <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
            {[
              { title: 'Gross Revenue', value: formatCurrency(totalRevenue), icon: 'fas fa-dollar-sign', color: '#10B981' },
              { title: 'Processing Fees', value: `-${formatCurrency(totalProcessingFees)}`, icon: 'fas fa-minus-circle', color: '#EF4444' },
              { title: 'Net Payout', value: formatCurrency(totalNetPayout), icon: 'fas fa-hand-holding-usd', color: '#1B8BEB' },
              { title: `Wix Service Fees${hasTxnData ? '' : ' (est)'}`, value: formatCurrency(totalServiceFees), icon: 'fas fa-hand-holding-heart', color: '#7C3AED' },
              { title: 'Avg. Order Value', value: formatCurrency(avgOrderValue), icon: 'fas fa-chart-line', color: '#D97706' },
            ].map(card => (
              <div key={card.title} className="admin-stat-card dash-compact-card">
                <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                  <i className={card.icon}></i>
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-count" style={{ fontSize: '1.2rem' }}>{card.value}</span>
                  <span className="admin-stat-label">{card.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Fee Breakdown Note */}
          <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderLeft: '4px solid #1B8BEB', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <i className="fas fa-info-circle" style={{ color: '#1B8BEB', marginTop: '0.15rem' }}></i>
            <span>
              Processing fees: <strong>2.9% + $0.30</strong> per transaction.
              {hasTxnData
                ? <> Service fees from <strong>actual payment records</strong>.</>
                : <> Service fees estimated at <strong>2.5%</strong>.</>
              }
              {' '}{paidOrders.length} paid, {freeOrders.length} free orders.
            </span>
          </div>

          {/* Print-only header */}
          <div className="rotr-print-header">
            <h2>Rockin&apos; on the River — Financial Report</h2>
            <p>{periodLabel} &bull; Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          {/* Two-column: Monthly + Payment Methods */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Monthly Revenue Breakdown */}
            {monthlyData.length > 0 && (
              <div className="admin-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <i className="fas fa-calendar-alt" style={{ color: '#1B8BEB' }}></i> Monthly Breakdown
                </h3>
                <div className="admin-table-wrap">
                  <table className="admin-table" style={{ marginTop: 0 }}>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th style={{ textAlign: 'right' }}>Orders</th>
                        <th style={{ textAlign: 'right' }}>Tickets</th>
                        <th style={{ textAlign: 'right' }}>Gross</th>
                        <th style={{ textAlign: 'right' }}>Fees</th>
                        <th style={{ textAlign: 'right' }}>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map(m => (
                        <tr key={m.label}>
                          <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.label}</td>
                          <td style={{ textAlign: 'right' }}>{m.orders}</td>
                          <td style={{ textAlign: 'right' }}>{m.tickets}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(m.revenue)}</td>
                          <td style={{ textAlign: 'right', color: '#EF4444', fontSize: '0.82rem' }}>-{formatCurrency(m.fees)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(m.net)}</td>
                        </tr>
                      ))}
                      <tr className="rotr-finance-total-row">
                        <td>Total</td>
                        <td style={{ textAlign: 'right' }}>{periodOrders.length}</td>
                        <td style={{ textAlign: 'right' }}>{totalTickets}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                        <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalNetPayout)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="admin-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <i className="fas fa-credit-card" style={{ color: '#7C3AED' }}></i> Payment Methods
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {paymentMethods.map((pm, idx) => {
                    const pct = totalRevenue > 0 ? (pm.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={pm.method} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 0',
                        borderBottom: idx < paymentMethods.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: '#7C3AED15', color: '#7C3AED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                        }}>
                          <i className={pm.method === 'creditCard' ? 'fas fa-credit-card' : pm.method === 'payPal' ? 'fab fa-paypal' : pm.method === 'Free' ? 'fas fa-gift' : 'fas fa-wallet'}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>{fmtMethod(pm.method)}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{pm.count} orders &middot; {pct.toFixed(1)}%</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>{formatCurrency(pm.revenue)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Revenue by Event */}
          {eventRevenue.length > 0 && (
            <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                <i className="fas fa-music" style={{ color: '#D97706' }}></i> Revenue by Event
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {eventRevenue.map((ev, idx) => (
                  <div key={ev.name} className="rotr-event-row" style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 0',
                    borderBottom: idx < eventRevenue.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>{ev.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ev.date} &middot; {ev.orders} orders &middot; {ev.tickets} tickets</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>{formatCurrency(ev.revenue)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span style={{ color: '#EF4444' }}>-{formatCurrency(ev.fees)}</span> &rarr; <span style={{ fontWeight: 600 }}>{formatCurrency(ev.net)}</span> net
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderTop: '2px solid var(--gray-200)', marginTop: '0.25rem' }}>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>Total ({periodOrders.length} orders)</div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>{formatCurrency(totalRevenue)}</div>
                    <div style={{ fontSize: '0.7rem' }}>
                      <span style={{ color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</span> &rarr; <span style={{ fontWeight: 700 }}>{formatCurrency(totalNetPayout)}</span> net
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Transactions Table */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
              <i className="fas fa-list" style={{ color: '#6B7280' }}></i> All Transactions
              <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8', marginLeft: 'auto' }}>{periodOrders.length} transactions</span>
            </h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order #</th>
                    <th>Event / Product</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Gross</th>
                    <th style={{ textAlign: 'right' }}>Svc Fee{hasTxnData ? '' : '*'}</th>
                    <th style={{ textAlign: 'right' }}>Proc. Fee</th>
                    <th style={{ textAlign: 'right' }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {periodOrders
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                    .map(o => {
                      const ev = events.find(e => e.id === o.eventId);
                      const method = getMethod(o);
                      const amt = parseFloat(o.totalPrice?.amount || '0');
                      const procFee = o.status === 'PAID' ? calcProcessingFee(amt) : 0;
                      const svcFee = o.status === 'PAID' ? getServiceFee(o.orderNumber, amt) : 0;
                      const net = amt - procFee;
                      const txn = transactions[o.orderNumber];
                      const ticketDetail = txn?.ticketItems?.map(i => `${i.name} x${i.quantity}`).join(', ');
                      return (
                        <tr key={o.orderNumber}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatDate(o.created)}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.orderNumber}</td>
                          <td style={{ fontWeight: 500 }}>
                            {ticketDetail || ev?.title || 'Unknown'}
                          </td>
                          <td>{o.fullName || `${o.firstName} ${o.lastName}`.trim()}</td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {fmtMethod(method)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {amt > 0 ? formatCurrency(amt) : 'Free'}
                          </td>
                          <td style={{ textAlign: 'right', color: svcFee > 0 ? '#7C3AED' : undefined, fontSize: '0.85rem' }}>
                            {svcFee > 0 ? formatCurrency(svcFee) : '\u2014'}
                          </td>
                          <td style={{ textAlign: 'right', color: procFee > 0 ? '#EF4444' : undefined, fontSize: '0.85rem' }}>
                            {procFee > 0 ? `-${formatCurrency(procFee)}` : '\u2014'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {amt > 0 ? formatCurrency(net) : 'Free'}
                          </td>
                        </tr>
                      );
                    })}
                  <tr className="rotr-finance-total-row">
                    <td colSpan={5}>Total ({periodOrders.length} transactions)</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                    <td style={{ textAlign: 'right', color: '#7C3AED' }}>{formatCurrency(totalServiceFees)}</td>
                    <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalNetPayout)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EXPENSES SUB-TAB
         ═══════════════════════════════════════════════════════════════════ */}
      {financeSubTab === 'expenses' && (
        <>
          {expensesLoading ? (
            <MusicLoader title="Loading Expenses..." step="Fetching expense records..." />
          ) : (
            <>
              {/* Expense Stat Cards */}
              {(() => {
                const topCategory = (() => {
                  const catMap = new Map<string, number>();
                  periodExpenses.forEach(e => catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount));
                  let best = { cat: '—', amt: 0 };
                  catMap.forEach((amt, cat) => { if (amt > best.amt) best = { cat, amt }; });
                  return best.cat !== '—' ? EXPENSE_CATEGORIES.find(c => c.value === best.cat)?.label || best.cat : '—';
                })();

                const todayStr = new Date().toISOString().split('T')[0];
                const unpaidExpenses = periodExpenses.filter(e => e.payment_status === 'unpaid' || e.payment_status === 'partially_paid');
                const unpaidAmount = unpaidExpenses.reduce((sum, e) => {
                  if (e.payment_status === 'partially_paid' && e.paid_amount != null) return sum + (e.amount - e.paid_amount);
                  return sum + e.amount;
                }, 0);
                const overdueExpenses = periodExpenses.filter(e => (e.payment_status === 'unpaid' || e.payment_status === 'partially_paid') && e.due_date && e.due_date.split('T')[0] < todayStr);

                return (
                  <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
                    {[
                      { title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: 'fas fa-receipt', color: '#EF4444' },
                      { title: '# of Entries', value: String(periodExpenses.length), icon: 'fas fa-list-ol', color: '#1B8BEB' },
                      { title: 'Unpaid Amount', value: formatCurrency(unpaidAmount), icon: 'fas fa-clock', color: '#D97706', sub: `${unpaidExpenses.length} unpaid` },
                      { title: 'Overdue', value: String(overdueExpenses.length), icon: 'fas fa-exclamation-triangle', color: overdueExpenses.length > 0 ? '#EF4444' : '#10B981', sub: overdueExpenses.length > 0 ? 'Needs attention' : 'All on track' },
                      { title: 'Top Category', value: topCategory, icon: 'fas fa-tag', color: '#7C3AED' },
                    ].map(card => (
                      <div key={card.title} className="admin-stat-card dash-compact-card">
                        <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                          <i className={card.icon}></i>
                        </div>
                        <div className="admin-stat-info">
                          <span className="admin-stat-count" style={{ fontSize: '1.2rem' }}>{card.value}</span>
                          <span className="admin-stat-label">{card.title}</span>
                          {(card as { sub?: string }).sub && <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>{(card as { sub?: string }).sub}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Filter Bar */}
              <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select className="rotr-filter-select" value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)}>
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select className="rotr-filter-select" value={expensePaymentFilter} onChange={e => setExpensePaymentFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select className="rotr-filter-select" value={expenseEventFilter} onChange={e => setExpenseEventFilter(e.target.value)}>
                  <option value="">All Events</option>
                  <option value="none">General / No Event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.dateAndTimeSettings.formatted.startDate}</option>)}
                </select>
                <input
                  type="text"
                  className="rotr-filter-select"
                  placeholder="Search expenses..."
                  value={expenseFilter}
                  onChange={e => setExpenseFilter(e.target.value)}
                  style={{ minWidth: '160px' }}
                />
                <button className="admin-btn admin-btn-primary" onClick={() => openExpenseForm()} style={{ marginLeft: 'auto', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
                  <i className="fas fa-plus"></i> Add Expense
                </button>
              </div>

              {/* Add/Edit Expense Form */}
              {showExpenseForm && (
                <div className="admin-card" style={{ marginBottom: '1rem', border: '2px solid #EF444430', background: 'var(--card-bg, #fff)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-edit" style={{ color: '#EF4444', marginRight: '0.4rem' }}></i>
                    {editingExpense ? 'Edit Expense' : 'New Expense'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Description *</label>
                      <input type="text" className="rotr-filter-select" style={{ width: '100%' }} placeholder="e.g. Sound equipment rental" value={expenseFormData.description} onChange={e => setExpenseFormData({ ...expenseFormData, description: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Amount ($) *</label>
                      <input type="number" className="rotr-filter-select" style={{ width: '100%' }} placeholder="0.00" step="0.01" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Category *</label>
                      <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.category} onChange={e => setExpenseFormData({ ...expenseFormData, category: e.target.value as ROTRExpense['category'] })}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Date *</label>
                      <input type="date" className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.expense_date} onChange={e => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Vendor</label>
                      <input type="text" className="rotr-filter-select" style={{ width: '100%' }} placeholder="e.g. Guitar Center" value={expenseFormData.vendor} onChange={e => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Event (optional)</label>
                      <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.wix_event_id} onChange={e => setExpenseFormData({ ...expenseFormData, wix_event_id: e.target.value })}>
                        <option value="">No event</option>
                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.dateAndTimeSettings.formatted.startDate}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Purchase Order (optional)</label>
                      <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.po_id} onChange={e => setExpenseFormData({ ...expenseFormData, po_id: e.target.value })}>
                        <option value="">None (optional)</option>
                        {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.po_number} - {po.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Receipt</label>
                      <input
                        id="expense-receipt-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '0.82rem' }}
                        onClick={() => document.getElementById('expense-receipt-input')?.click()}
                      >
                        <i className="fas fa-upload" style={{ marginRight: '0.35rem' }}></i>
                        {receiptFile ? receiptFile.name : 'Upload Receipt'}
                      </button>
                      {receiptUploading && <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}><i className="fas fa-spinner fa-spin"></i> Uploading...</span>}
                      {editingExpense && editingExpense.receipt_urls.length > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          {editingExpense.receipt_urls.length} existing receipt(s)
                        </div>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Notes</label>
                      <textarea className="rotr-filter-select" style={{ width: '100%', minHeight: '60px', resize: 'vertical' }} placeholder="Optional notes..." value={expenseFormData.notes} onChange={e => setExpenseFormData({ ...expenseFormData, notes: e.target.value })} />
                    </div>

                    {/* ── Invoice Details Section ── */}
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <h5 style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <i className="fas fa-file-invoice" style={{ color: '#1B8BEB' }}></i> Invoice Details
                      </h5>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Invoice Number</label>
                      <input type="text" className="rotr-filter-select" style={{ width: '100%' }} placeholder="e.g. INV-2026-001" value={expenseFormData.invoice_number} onChange={e => setExpenseFormData({ ...expenseFormData, invoice_number: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Due Date</label>
                      <input type="date" className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.due_date} onChange={e => setExpenseFormData({ ...expenseFormData, due_date: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Payment Status</label>
                      <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.payment_status} onChange={e => setExpenseFormData({ ...expenseFormData, payment_status: e.target.value })}>
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {(expenseFormData.payment_status === 'paid' || expenseFormData.payment_status === 'partially_paid') && (
                      <>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Payment Method</label>
                          <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.payment_method} onChange={e => setExpenseFormData({ ...expenseFormData, payment_method: e.target.value })}>
                            <option value="">Select...</option>
                            <option value="check">Check</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="ach">ACH / Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Paid Date</label>
                          <input type="date" className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.paid_date} onChange={e => setExpenseFormData({ ...expenseFormData, paid_date: e.target.value })} />
                        </div>
                        {expenseFormData.payment_status === 'partially_paid' && (
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Paid Amount ($)</label>
                            <input type="number" className="rotr-filter-select" style={{ width: '100%' }} placeholder="0.00" step="0.01" value={expenseFormData.paid_amount} onChange={e => setExpenseFormData({ ...expenseFormData, paid_amount: e.target.value })} />
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Recurring Section ── */}
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={expenseFormData.is_recurring}
                          onChange={e => setExpenseFormData({ ...expenseFormData, is_recurring: e.target.checked })}
                          style={{ accentColor: '#7C3AED' }}
                        />
                        <i className="fas fa-redo" style={{ color: '#7C3AED', fontSize: '0.78rem' }}></i>
                        Recurring expense
                      </label>
                    </div>
                    {expenseFormData.is_recurring && (
                      <>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Recurrence Type</label>
                          <select className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.recurrence_type} onChange={e => setExpenseFormData({ ...expenseFormData, recurrence_type: e.target.value })}>
                            <option value="">Select...</option>
                            <option value="monthly">Monthly</option>
                            <option value="per_event">Per Event</option>
                            <option value="annual">Annual</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Repeat Until (optional)</label>
                          <input type="date" className="rotr-filter-select" style={{ width: '100%' }} value={expenseFormData.recurring_until} onChange={e => setExpenseFormData({ ...expenseFormData, recurring_until: e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="admin-btn admin-btn-secondary" onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}>Cancel</button>
                    <button className="admin-btn admin-btn-primary" onClick={saveExpense} disabled={expenseSaving || !expenseFormData.description.trim() || !expenseFormData.amount}>
                      {expenseSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> {editingExpense ? 'Update' : 'Add'}</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Expense List */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const filtered = periodExpenses.filter(e => {
                  if (expenseCategoryFilter && e.category !== expenseCategoryFilter) return false;
                  if (expenseEventFilter === 'none' && e.wix_event_id) return false;
                  if (expenseEventFilter && expenseEventFilter !== 'none' && e.wix_event_id !== expenseEventFilter) return false;
                  if (expensePaymentFilter) {
                    if (expensePaymentFilter === 'overdue') {
                      if (!((e.payment_status === 'unpaid' || e.payment_status === 'partially_paid') && e.due_date && e.due_date.split('T')[0] < todayStr)) return false;
                    } else if (e.payment_status !== expensePaymentFilter) return false;
                  }
                  if (expenseFilter) {
                    const q = expenseFilter.toLowerCase();
                    if (!e.description.toLowerCase().includes(q) && !(e.vendor || '').toLowerCase().includes(q) && !(e.notes || '').toLowerCase().includes(q) && !(e.invoice_number || '').toLowerCase().includes(q)) return false;
                  }
                  return true;
                });

                const getPaymentBadge = (exp: ROTRExpense) => {
                  const isOverdue = (exp.payment_status === 'unpaid' || exp.payment_status === 'partially_paid') && exp.due_date && exp.due_date.split('T')[0] < todayStr;
                  if (isOverdue) return { label: 'Overdue', color: '#EF4444', bg: '#EF444418' };
                  if (exp.payment_status === 'paid') return { label: 'Paid', color: '#10B981', bg: '#10B98118' };
                  if (exp.payment_status === 'partially_paid') return { label: 'Partial', color: '#1B8BEB', bg: '#1B8BEB18' };
                  return { label: 'Unpaid', color: '#D97706', bg: '#D9770618' };
                };

                return filtered.length === 0 ? (
                  <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <i className="fas fa-receipt" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
                    {periodExpenses.length === 0 ? 'No expenses for this period' : 'No expenses match your filters'}
                  </div>
                ) : (
                  <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {filtered.map((exp, idx) => {
                        const evTitle = exp.wix_event_id ? events.find(e => e.id === exp.wix_event_id)?.title : null;
                        const catColor = CATEGORY_COLORS[exp.category] || '#94a3b8';
                        const po = exp.po_id ? purchaseOrders.find(p => p.id === exp.po_id) : null;
                        const badge = getPaymentBadge(exp);
                        return (
                          <div key={exp.id} className="rotr-event-row" style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderBottom: idx < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none',
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>{exp.description}</span>
                                <span style={{
                                  fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600,
                                  background: `${catColor}18`, color: catColor,
                                }}>
                                  {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                                </span>
                                <span style={{
                                  fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600,
                                  background: badge.bg, color: badge.color,
                                }}>
                                  {badge.label}
                                </span>
                                {exp.is_recurring && (
                                  <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600, background: '#7C3AED18', color: '#7C3AED' }} title={`Recurring: ${exp.recurrence_type || 'recurring'}`}>
                                    <i className="fas fa-redo" style={{ fontSize: '0.6rem', marginRight: '0.2rem' }}></i> Recurring
                                  </span>
                                )}
                                {po && (
                                  <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600, background: '#1B8BEB18', color: '#1B8BEB' }}>
                                    PO# {po.po_number}
                                  </span>
                                )}
                                {exp.receipt_urls.length > 0 && (
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }} title={`${exp.receipt_urls.length} receipt(s)`}>
                                    <i className="fas fa-paperclip"></i> {exp.receipt_urls.length}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {formatDate(exp.expense_date)}
                                {exp.vendor && <> &middot; {exp.vendor}</>}
                                {evTitle && <> &middot; {evTitle}</>}
                                {exp.invoice_number && <> &middot; <span style={{ color: '#94a3b8' }}>Inv# {exp.invoice_number}</span></>}
                                {exp.due_date && (exp.payment_status === 'unpaid' || exp.payment_status === 'partially_paid') && (
                                  <> &middot; Due {formatDate(exp.due_date)}</>
                                )}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#EF4444', marginRight: '0.5rem' }}>-{formatCurrency(exp.amount)}</div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {(exp.payment_status === 'unpaid' || exp.payment_status === 'partially_paid') && (
                                <button onClick={() => markExpenseAsPaid(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', fontSize: '0.8rem', padding: '0.25rem' }} title="Mark as Paid">
                                  <i className="fas fa-check-circle"></i>
                                </button>
                              )}
                              <button onClick={() => openExpenseForm(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', padding: '0.25rem' }} title="Edit">
                                <i className="fas fa-pen"></i>
                              </button>
                              <button onClick={() => deleteExpense(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.8rem', padding: '0.25rem' }} title="Delete">
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Category Breakdown */}
              {periodExpenses.length > 0 && (
                <div className="admin-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                    <i className="fas fa-tags" style={{ color: '#D97706' }}></i> Category Breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {(() => {
                      const catMap = new Map<string, { count: number; total: number }>();
                      periodExpenses.forEach(e => {
                        const existing = catMap.get(e.category);
                        if (existing) {
                          existing.count++;
                          existing.total += e.amount;
                        } else {
                          catMap.set(e.category, { count: 1, total: e.amount });
                        }
                      });
                      return Array.from(catMap.entries())
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([cat, data], idx, arr) => {
                          const catColor = CATEGORY_COLORS[cat] || '#94a3b8';
                          const pct = totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0;
                          return (
                            <div key={cat} style={{
                              display: 'flex', alignItems: 'center', gap: '0.75rem',
                              padding: '0.65rem 0',
                              borderBottom: idx < arr.length - 1 ? '1px solid var(--gray-100)' : 'none',
                            }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                background: `${catColor}15`, color: catColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                              }}>
                                <i className="fas fa-tag"></i>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>
                                  {EXPENSE_CATEGORIES.find(c => c.value === cat)?.label || cat}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {data.count} {data.count === 1 ? 'entry' : 'entries'} &middot; {pct.toFixed(1)}%
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>{formatCurrency(data.total)}</div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
