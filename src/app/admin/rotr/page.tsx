'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EmailMarketingDashboard from '@/components/admin/EmailMarketingDashboard';
import dynamic from 'next/dynamic';
const FileRepository = dynamic(() => import('@/app/admin/files/page'), { ssr: false });

type Tab = 'overview' | 'events' | 'orders' | 'customers' | 'inbox' | 'finances' | 'analytics' | 'files' | 'email';

interface TicketDef {
  id: string;
  name: string;
  eventId: string;
  free: boolean;
  price: { amount: string; currency: string };
  saleStatus: string;
}

interface ROTREvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  dateAndTimeSettings: {
    startDate: string;
    formatted: {
      startDate: string;
      startTime: string;
    };
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
  ticketDefinitions: TicketDef[];
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

interface AnalyticsMetric {
  type: string;
  values: { date: string; value: number }[];
  total: number;
}

interface Summary {
  totalEvents: number;
  upcomingEvents: number;
  totalOrders: number;
  totalRevenue: number;
  totalTickets: number;
}

interface Customer {
  email: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  ticketCount: number;
  lastOrder: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function AdminROTRPage() {
  return (
    <Suspense fallback={
      <div className="admin-page">
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)' }}></i>
        </div>
      </div>
    }>
      <ROTRContent />
    </Suspense>
  );
}

function ROTRContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';
  const [events, setEvents] = useState<ROTREvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [financePeriod, setFinancePeriod] = useState('all');
  const [transactions, setTransactions] = useState<Record<string, TransactionData>>({});
  const [txnLoading, setTxnLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{ metrics: AnalyticsMetric[]; previousMetrics: AnalyticsMetric[] | null; period: { start: string; end: string; days: number } } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [publishMap, setPublishMap] = useState<Map<string, { id: string; is_published: boolean }>>(new Map());
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());
  const [inboxThreads, setInboxThreads] = useState<Array<{
    conversationId: string;
    contactName: string;
    contactEmail?: string;
    lastMessageDate: string;
    lastMessagePreview: string;
    lastDirection: string;
    messages: Array<{
      id: string;
      direction: string;
      content: { previewText?: string; basic?: { items: { text?: string }[] }; form?: { title: string; fields: { name: string; value: string }[] }; contentType?: string };
      createdDate: string;
    }>;
  }>>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [fullMessages, setFullMessages] = useState<Array<{
    id: string;
    direction: string;
    content: { previewText?: string; basic?: { items: { text?: string }[] }; form?: { title: string; fields: { name: string; value: string }[] }; contentType?: string };
    createdDate: string;
  }>>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [readConvoIds, setReadConvoIds] = useState<Set<string>>(new Set());
  const messagesEndRef = { current: null as HTMLDivElement | null };

  // Load read conversation IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rotr-read-convos');
      if (stored) setReadConvoIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  // Mark a conversation as read when selected
  useEffect(() => {
    if (selectedConvo && !readConvoIds.has(selectedConvo)) {
      const updated = new Set(readConvoIds);
      updated.add(selectedConvo);
      setReadConvoIds(updated);
      localStorage.setItem('rotr-read-convos', JSON.stringify([...updated]));
    }
  }, [selectedConvo]);

  function markAllInboxRead() {
    const ids = inboxThreads
      .filter(t => t.lastDirection === 'PARTICIPANT_TO_BUSINESS')
      .map(t => t.conversationId);
    const updated = new Set([...readConvoIds, ...ids]);
    setReadConvoIds(updated);
    localStorage.setItem('rotr-read-convos', JSON.stringify([...updated]));
  }

  async function handleSendReply() {
    if (!selectedConvo || !replyText.trim() || replySending) return;
    setReplySending(true);
    setReplyError(null);
    try {
      const res = await fetch('/api/admin/rotr/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConvo, text: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      // Append sent message to chat
      setFullMessages(prev => [...prev, {
        id: data.message?.id || Date.now().toString(),
        direction: 'BUSINESS_TO_PARTICIPANT',
        content: { previewText: replyText.trim(), basic: { items: [{ text: replyText.trim() }] } },
        createdDate: new Date().toISOString(),
      }]);
      setReplyText('');
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setReplySending(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/rotr');
        const data = await res.json();
        setEvents(data.events || []);
        setSummary(data.summary || null);
      } catch (err) {
        console.error('Failed to load ROTR data:', err);
      }
      setLoading(false);
    }
    load();
  }, []);


  // Load publish status from Supabase for Wix events
  useEffect(() => {
    if (events.length > 0) {
      const supabase = createClient();
      supabase
        .from('events')
        .select('id, wix_event_id, is_published')
        .not('wix_event_id', 'is', null)
        .then(({ data }) => {
          if (data) {
            setPublishMap(new Map(data.map(e => [e.wix_event_id!, { id: e.id, is_published: e.is_published }])));
          }
        });
    }
  }, [events]);

  // Auto-collapse past years once events are loaded
  useEffect(() => {
    if (events.length > 0) {
      const thisYear = new Date().getFullYear();
      const years = new Set<number>();
      events.forEach(e => {
        const y = new Date(e.dateAndTimeSettings.startDate).getFullYear();
        if (y !== thisYear) years.add(y);
      });
      setCollapsedYears(years);
    }
  }, [events.length]);

  async function toggleEventPublished(wixId: string) {
    const entry = publishMap.get(wixId);
    if (!entry) return;
    const supabase = createClient();
    const newVal = !entry.is_published;
    await supabase.from('events').update({ is_published: newVal }).eq('id', entry.id);
    setPublishMap(prev => {
      const next = new Map(prev);
      next.set(wixId, { ...entry, is_published: newVal });
      return next;
    });
  }

  function toggleEventsYear(year: number) {
    setCollapsedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  // Load orders when tab switches to orders, customers, or finances
  useEffect(() => {
    if ((tab === 'orders' || tab === 'customers' || tab === 'finances') && orders.length === 0 && !ordersLoading) {
      setOrdersLoading(true);
      fetch('/api/admin/rotr/orders')
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error('Failed to load orders:', err))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab, orders.length, ordersLoading]);

  // Load transaction data when finances tab opens
  useEffect(() => {
    if (tab === 'finances' && Object.keys(transactions).length === 0 && !txnLoading) {
      setTxnLoading(true);
      fetch('/api/admin/rotr/transactions')
        .then(res => res.json())
        .then(data => setTransactions(data.transactions || {}))
        .catch(err => console.error('Failed to load transactions:', err))
        .finally(() => setTxnLoading(false));
    }
  }, [tab, transactions, txnLoading]);

  // Load analytics when analytics tab opens (or days changes)
  useEffect(() => {
    if (tab === 'analytics') {
      setAnalyticsLoading(true);
      fetch(`/api/admin/rotr/analytics?days=${analyticsDays}`)
        .then(res => res.json())
        .then(data => setAnalyticsData(data))
        .catch(err => console.error('Failed to load analytics:', err))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [tab, analyticsDays]);

  // Load inbox threads when inbox tab opens
  useEffect(() => {
    if (tab === 'inbox' && !inboxLoaded && !inboxLoading) {
      setInboxLoading(true);
      setInboxError(null);
      fetch('/api/admin/rotr/inbox')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setInboxError(data.error);
          } else {
            setInboxThreads(data.threads || []);
          }
          setInboxLoaded(true);
        })
        .catch(err => {
          console.error('Failed to load inbox:', err);
          setInboxError('Failed to load inbox messages');
          setInboxLoaded(true);
        })
        .finally(() => setInboxLoading(false));
    }
  }, [tab, inboxLoaded, inboxLoading]);

  // Load full messages when a conversation is selected
  useEffect(() => {
    if (!selectedConvo) {
      setFullMessages([]);
      return;
    }
    setReplyText('');
    setReplyError(null);
    setMessagesLoading(true);
    fetch(`/api/admin/rotr/inbox?conversationId=${selectedConvo}`)
      .then(res => res.json())
      .then(data => setFullMessages(data.messages || []))
      .catch(err => console.error('Failed to load messages:', err))
      .finally(() => setMessagesLoading(false));
  }, [selectedConvo]);

  // Build event lookup for orders
  const eventMap = new Map(events.map(e => [e.id, e.title]));

  // Build customers from orders
  const customers: Customer[] = (() => {
    const map = new Map<string, Customer>();
    orders.forEach(o => {
      if (!o.email) return;
      const key = o.email.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orderCount++;
        existing.totalSpent += parseFloat(o.totalPrice?.amount || '0');
        existing.ticketCount += o.ticketsQuantity;
        if (o.created > existing.lastOrder) existing.lastOrder = o.created;
      } else {
        map.set(key, {
          email: o.email,
          name: o.fullName || `${o.firstName} ${o.lastName}`.trim(),
          orderCount: 1,
          totalSpent: parseFloat(o.totalPrice?.amount || '0'),
          ticketCount: o.ticketsQuantity,
          lastOrder: o.created,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  })();

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter && o.eventId !== orderFilter) return false;
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const filteredRevenue = filteredOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'),
    0
  );

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const da = new Date(a.dateAndTimeSettings.startDate).getTime();
    const db = new Date(b.dateAndTimeSettings.startDate).getTime();
    return da - db;
  });

  const upcomingEvents = sortedEvents.filter(e => e.status === 'UPCOMING');
  const pastEvents = sortedEvents.filter(e => e.status === 'ENDED');

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1>Rockin&apos; on the River</h1>
            <p>Loading data from Wix...</p>
          </div>
        </div>
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)' }}></i>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{tab === 'email' ? <><i className="fas fa-envelope" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Email Marketing</> : tab === 'files' ? <><i className="fas fa-folder-open" style={{ marginRight: '0.5rem', color: '#D97706' }}></i> Files</> : "Rockin' on the River"}</h1>
          <p>{tab === 'email' ? "Campaign analytics from Constant Contact" : tab === 'files' ? "Shared document and asset repository" : "Concert series data from Wix Events"}</p>
        </div>
        {tab !== 'email' && tab !== 'files' && (
          <div className="admin-header-actions">
            <a
              href="https://www.rockinontheriver.com"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
            >
              <i className="fas fa-external-link-alt"></i> Wix Site
            </a>
          </div>
        )}
      </div>

      {/* === OVERVIEW TAB === */}
      {tab === 'overview' && summary && (
        <div>
          <div className="rotr-stats-row">
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: 'rgba(27,139,235,0.1)', color: '#1B8BEB' }}>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="rotr-stat-value">{summary.upcomingEvents}</div>
              <div className="rotr-stat-label">Upcoming Shows</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                <i className="fas fa-receipt"></i>
              </div>
              <div className="rotr-stat-value">{summary.totalOrders}</div>
              <div className="rotr-stat-label">Total Orders</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="rotr-stat-value">{formatCurrency(summary.totalRevenue)}</div>
              <div className="rotr-stat-label">Total Revenue</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
                <i className="fas fa-ticket-alt"></i>
              </div>
              <div className="rotr-stat-value">{summary.totalTickets}</div>
              <div className="rotr-stat-label">Tickets Sold</div>
            </div>
          </div>

          {/* Upcoming Events Quick View */}
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Upcoming Shows</h3>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No upcoming shows scheduled.</p>
            ) : (
              <div className="rotr-upcoming-list">
                {upcomingEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/admin/rotr/${event.id}`}
                    className="rotr-upcoming-item"
                  >
                    {event.mainImage && (
                      <img
                        src={event.mainImage.url}
                        alt={event.title}
                        className="rotr-upcoming-thumb"
                      />
                    )}
                    <div className="rotr-upcoming-info">
                      <span className="rotr-upcoming-title">{event.title}</span>
                      <span className="rotr-upcoming-date">
                        <i className="fas fa-calendar"></i> {event.dateAndTimeSettings.formatted.startDate}
                        {event.dateAndTimeSettings.formatted.startTime && ` at ${event.dateAndTimeSettings.formatted.startTime}`}
                      </span>
                    </div>
                    <div className="rotr-upcoming-meta">
                      {event.registration.tickets?.soldOut ? (
                        <span className="admin-status-badge" style={{ background: '#DC2626' }}>Sold Out</span>
                      ) : event.registration.tickets?.lowestPrice ? (
                        <span className="rotr-upcoming-price">{event.registration.tickets.lowestPrice.formattedValue}</span>
                      ) : (
                        <span className="rotr-upcoming-price">Free</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by Event */}
          {pastEvents.length > 0 && (
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Past Shows</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEvents.slice(0, 10).map(event => (
                      <tr key={event.id}>
                        <td>
                          <Link href={`/admin/rotr/${event.id}`} style={{ color: 'var(--blue-accent)', fontWeight: 500 }}>
                            {event.title}
                          </Link>
                        </td>
                        <td>{event.dateAndTimeSettings.formatted.startDate}</td>
                        <td>
                          <span className="admin-status-badge" style={{ background: '#6B7280' }}>Ended</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === EVENTS TAB === */}
      {tab === 'events' && (() => {
        // Group events by year
        const yearMap = new Map<number, ROTREvent[]>();
        sortedEvents.forEach(e => {
          const y = new Date(e.dateAndTimeSettings.startDate).getFullYear();
          if (!yearMap.has(y)) yearMap.set(y, []);
          yearMap.get(y)!.push(e);
        });
        const yearGroups = Array.from(yearMap.entries())
          .sort(([a], [b]) => b - a); // newest first

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {yearGroups.map(([year, yearEvents]) => {
              const isCollapsed = collapsedYears.has(year);
              const liveCount = yearEvents.filter(e => publishMap.get(e.id)?.is_published).length;
              // Sort: published first, then by date
              const sorted = [...yearEvents].sort((a, b) => {
                const aPub = publishMap.get(a.id)?.is_published ?? false;
                const bPub = publishMap.get(b.id)?.is_published ?? false;
                if (aPub !== bPub) return aPub ? -1 : 1;
                return 0;
              });

              return (
                <div key={year} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleEventsYear(year)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                      color: 'inherit', fontSize: '1rem', fontWeight: 600, textAlign: 'left',
                    }}
                  >
                    <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'}`} style={{ fontSize: '0.75rem', width: '0.75rem' }}></i>
                    <span>{year}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>
                      {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''} &middot; {liveCount} live
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="admin-table-wrap">
                      <table className="admin-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th></th>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Price</th>
                            <th>Wix Status</th>
                            <th>Tickets</th>
                            <th>Live on Site</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map(event => {
                            const wixUrl = event.eventPageUrl
                              ? `${event.eventPageUrl.base}${event.eventPageUrl.path}`
                              : null;
                            const pubEntry = publishMap.get(event.id);
                            const isLive = pubEntry?.is_published ?? false;
                            const isSynced = !!pubEntry;
                            const dimmed = isSynced && !isLive;
                            return (
                              <tr key={event.id} style={dimmed ? { opacity: 0.55 } : undefined}>
                                <td style={{ width: '50px', padding: '0.5rem' }}>
                                  {event.mainImage ? (
                                    <img
                                      src={event.mainImage.url}
                                      alt=""
                                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                                    />
                                  ) : (
                                    <div style={{ width: '44px', height: '44px', background: 'var(--gray-100)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <i className="fas fa-music" style={{ color: 'var(--gray-400)' }}></i>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <Link href={`/admin/rotr/${event.id}`} style={{ color: dimmed ? '#94a3b8' : 'var(--blue-accent)', fontWeight: 500 }}>
                                    {event.title}
                                  </Link>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  {event.dateAndTimeSettings.formatted.startDate}
                                </td>
                                <td>
                                  {event.registration.tickets?.lowestPrice
                                    ? event.registration.tickets.lowestPrice.formattedValue
                                    : 'Free'}
                                </td>
                                <td>
                                  <span
                                    className="admin-status-badge"
                                    style={{
                                      background: event.status === 'UPCOMING' ? '#10B981'
                                        : event.status === 'ENDED' ? '#6B7280'
                                        : '#EF4444',
                                    }}
                                  >
                                    {event.status}
                                  </span>
                                </td>
                                <td>
                                  {event.registration.tickets?.soldOut ? (
                                    <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.82rem' }}>Sold Out</span>
                                  ) : (
                                    <span style={{ color: '#10B981', fontSize: '0.82rem' }}>Available</span>
                                  )}
                                </td>
                                <td>
                                  {isSynced ? (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                      <div
                                        onClick={() => toggleEventPublished(event.id)}
                                        style={{
                                          width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                                          background: isLive ? '#16a34a' : '#374151', transition: 'background 0.2s', cursor: 'pointer',
                                        }}
                                      >
                                        <div style={{
                                          width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                                          position: 'absolute', top: '0.175rem',
                                          left: isLive ? '1.3rem' : '0.2rem',
                                          transition: 'left 0.2s',
                                        }} />
                                      </div>
                                      <span style={{ fontSize: '0.75rem', color: isLive ? '#16a34a' : '#94a3b8' }}>
                                        {isLive ? 'Live' : 'Hidden'}
                                      </span>
                                    </label>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Not synced</span>
                                  )}
                                </td>
                                <td>
                                  {wixUrl && (
                                    <a href={wixUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View on Wix">
                                      <i className="fas fa-external-link-alt"></i>
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* === ORDERS TAB === */}
      {tab === 'orders' && (
        <div>
          <div className="rotr-orders-toolbar">
            <div className="rotr-orders-filters">
              <select
                value={orderFilter}
                onChange={e => setOrderFilter(e.target.value)}
                className="rotr-filter-select"
              >
                <option value="">All Events</option>
                {events.filter(e => e.status === 'UPCOMING' || e.status === 'ENDED').map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="rotr-filter-select"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="FREE">Free</option>
              </select>
            </div>
            <div className="rotr-orders-summary">
              <span>{filteredOrders.length} orders</span>
              <span className="rotr-orders-revenue">{formatCurrency(filteredRevenue)}</span>
            </div>
          </div>

          {ordersLoading ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
              <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading orders...</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.orderNumber}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.orderNumber}</td>
                        <td style={{ fontWeight: 500 }}>{order.fullName || `${order.firstName} ${order.lastName}`.trim()}</td>
                        <td>
                          <a href={`mailto:${order.email}`} style={{ color: 'var(--blue-accent)' }}>
                            {order.email}
                          </a>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {eventMap.get(order.eventId) || 'Unknown'}
                        </td>
                        <td>{order.ticketsQuantity}</td>
                        <td style={{ fontWeight: 500 }}>
                          {parseFloat(order.totalPrice?.amount || '0') > 0
                            ? formatCurrency(parseFloat(order.totalPrice!.amount))
                            : 'Free'}
                        </td>
                        <td>
                          <span
                            className="admin-status-badge"
                            style={{
                              background: order.status === 'PAID' ? '#10B981'
                                : order.status === 'FREE' ? '#6B7280'
                                : '#EF4444',
                            }}
                          >
                            {order.status === 'NA_ORDER_STATUS' ? 'N/A' : order.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {formatDate(order.created)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === CUSTOMERS TAB === */}
      {tab === 'customers' && (
        <div>
          {ordersLoading ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
              <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading customer data...</p>
            </div>
          ) : (
            <>
              <p style={{ margin: '1rem 0 0.5rem', color: 'var(--gray-500)', fontSize: '0.88rem' }}>
                {customers.length} unique customers
              </p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Orders</th>
                      <th>Tickets</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.email}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td>
                          <a href={`mailto:${c.email}`} style={{ color: 'var(--blue-accent)' }}>
                            {c.email}
                          </a>
                        </td>
                        <td>{c.orderCount}</td>
                        <td>{c.ticketCount}</td>
                        <td style={{ fontWeight: 500 }}>
                          {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : 'Free'}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(c.lastOrder)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* === INBOX TAB === */}
      {tab === 'inbox' && (
        <div>
          {inboxLoading ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
              <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading messages from Wix...</p>
            </div>
          ) : inboxError ? (
            <div className="admin-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#D97706', marginBottom: '0.75rem' }}></i>
              <h3 style={{ marginBottom: '0.5rem' }}>Inbox Unavailable</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{inboxError}</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => { setInboxLoaded(false); setInboxError(null); }}
                  className="admin-btn admin-btn-secondary"
                >
                  <i className="fas fa-redo"></i> Retry
                </button>
                <a
                  href="https://www.wix.com/dashboard/inbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-primary"
                >
                  <i className="fas fa-external-link-alt"></i> Open Wix Inbox
                </a>
              </div>
            </div>
          ) : inboxThreads.length === 0 ? (
            <div className="admin-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.75rem' }}></i>
              <h3 style={{ marginBottom: '0.5rem' }}>No Messages</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No inbox conversations found.</p>
            </div>
          ) : (
            <div className={`rotr-inbox-container ${selectedConvo ? 'has-selected' : ''}`}>
              {/* Thread List */}
              <div className="rotr-inbox-threads">
                <div className="rotr-inbox-threads-header">
                  <span>{inboxThreads.length} conversation{inboxThreads.length !== 1 ? 's' : ''}</span>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {inboxThreads.some(t => t.lastDirection === 'PARTICIPANT_TO_BUSINESS' && !readConvoIds.has(t.conversationId)) && (
                      <button
                        className="admin-btn-icon"
                        title="Mark all as read"
                        onClick={markAllInboxRead}
                      >
                        <i className="fas fa-check-double"></i>
                      </button>
                    )}
                    <button
                      className="admin-btn-icon"
                      title="Refresh"
                      onClick={() => { setInboxLoaded(false); setInboxThreads([]); setSelectedConvo(null); }}
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                    <a
                      href="https://www.wix.com/dashboard/inbox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn-icon"
                      title="Open in Wix"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                </div>
                {inboxThreads.map(thread => {
                  const isUnread = thread.lastDirection === 'PARTICIPANT_TO_BUSINESS' && !readConvoIds.has(thread.conversationId);
                  return (
                  <button
                    key={thread.conversationId}
                    className={`rotr-inbox-thread-item ${selectedConvo === thread.conversationId ? 'active' : ''}${isUnread ? ' unread' : ''}`}
                    onClick={() => setSelectedConvo(
                      selectedConvo === thread.conversationId ? null : thread.conversationId
                    )}
                  >
                    <div className="rotr-inbox-thread-avatar">
                      {thread.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="rotr-inbox-thread-content">
                      <div className="rotr-inbox-thread-top">
                        <span className="rotr-inbox-thread-name">{thread.contactName}</span>
                        <span className="rotr-inbox-thread-date">
                          {new Date(thread.lastMessageDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="rotr-inbox-thread-preview">
                        {thread.lastDirection === 'BUSINESS_TO_PARTICIPANT' && (
                          <span style={{ color: '#94a3b8' }}>You: </span>
                        )}
                        {thread.lastMessagePreview.slice(0, 80)}
                        {thread.lastMessagePreview.length > 80 ? '...' : ''}
                      </div>
                      {thread.contactEmail && (
                        <div className="rotr-inbox-thread-email">{thread.contactEmail}</div>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>

              {/* Message Viewer */}
              <div className="rotr-inbox-messages">
                {!selectedConvo ? (
                  <div className="rotr-inbox-empty">
                    <i className="fas fa-comments"></i>
                    <p>Select a conversation to view messages</p>
                  </div>
                ) : messagesLoading ? (
                  <div className="rotr-inbox-empty">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading messages...</p>
                  </div>
                ) : (
                  <>
                    <div className="rotr-inbox-messages-header">
                      <button
                        className="rotr-inbox-back-btn"
                        onClick={() => setSelectedConvo(null)}
                      >
                        <i className="fas fa-arrow-left"></i>
                      </button>
                      <span className="rotr-inbox-messages-title">
                        {inboxThreads.find(t => t.conversationId === selectedConvo)?.contactName || 'Conversation'}
                      </span>
                    </div>
                    <div className="rotr-inbox-messages-list">
                      {fullMessages.map(msg => {
                        const isForm = msg.content?.contentType === 'FORM';
                        const isOutgoing = msg.direction === 'BUSINESS_TO_PARTICIPANT';
                        const text = isForm
                          ? null
                          : (msg.content?.previewText
                            || msg.content?.basic?.items?.map(i => i.text).filter(Boolean).join(' ')
                            || '');
                        if (!isForm && !text) return null;
                        return (
                          <div
                            key={msg.id}
                            className={`rotr-inbox-message ${isOutgoing ? 'outgoing' : 'incoming'}${isForm ? ' form-submission' : ''}`}
                          >
                            <div className="rotr-inbox-message-bubble">
                              {isForm ? (
                                <div className="rotr-inbox-form">
                                  <div className="rotr-inbox-form-badge">
                                    <i className="fas fa-file-alt"></i> {msg.content?.form?.title || 'Form Submission'}
                                  </div>
                                  {msg.content?.form?.fields?.map((field, idx) => (
                                    <div key={idx} className="rotr-inbox-form-field">
                                      <span className="rotr-inbox-form-label">{field.name}</span>
                                      <span className="rotr-inbox-form-value">{field.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="rotr-inbox-message-text">{text}</div>
                              )}
                              <div className="rotr-inbox-message-time">
                                {new Date(msg.createdDate).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={el => { messagesEndRef.current = el; }} />
                    </div>
                    {replyError && (
                      <div className="rotr-inbox-reply-error">
                        <i className="fas fa-exclamation-circle"></i> {replyError}
                      </div>
                    )}
                    <form
                      className="rotr-inbox-reply-form"
                      onSubmit={e => { e.preventDefault(); handleSendReply(); }}
                    >
                      <input
                        type="text"
                        className="rotr-inbox-reply-input"
                        placeholder="Type a message..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        disabled={replySending}
                      />
                      <button
                        type="submit"
                        className="rotr-inbox-reply-send"
                        disabled={replySending || !replyText.trim()}
                        title="Send message"
                      >
                        {replySending
                          ? <i className="fas fa-spinner fa-spin"></i>
                          : <i className="fas fa-paper-plane"></i>
                        }
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === FINANCES TAB === */}
      {tab === 'finances' && (
        <div>
          {ordersLoading || txnLoading ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
              <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading financial data...</p>
            </div>
          ) : (() => {
            // Get available years from orders
            const orderYears = [...new Set(orders.map(o => new Date(o.created).getFullYear()))].sort((a, b) => b - a);
            const currentYear = new Date().getFullYear();
            const hasTxnData = Object.keys(transactions).length > 0;

            // Filter orders by period
            const periodOrders = orders.filter(o => {
              if (financePeriod === 'all') return true;
              const year = new Date(o.created).getFullYear();
              return year === parseInt(financePeriod);
            });

            // Processing fee: 2.9% + $0.30 (verified exact against Wix payout statements)
            const calcProcessingFee = (ticketTotal: number) => ticketTotal > 0 ? ticketTotal * 0.029 + 0.30 : 0;

            // Get actual service fee from transaction data, or calculate
            const getServiceFee = (orderNumber: string, ticketTotal: number) => {
              const txn = transactions[orderNumber];
              if (txn) return txn.serviceFee;
              return ticketTotal > 0 ? Math.ceil(ticketTotal * 0.025 * 100) / 100 : 0;
            };

            // Get payment method — prefer transaction data (more specific)
            const getMethod = (o: Order) => {
              const txn = transactions[o.orderNumber];
              if (txn) return txn.paymentMethod;
              return o.paymentDetails?.transaction?.method || (o.status === 'FREE' ? 'Free' : 'Unknown');
            };

            // Format payment method name
            const fmtMethod = (method: string) => {
              const names: Record<string, string> = {
                creditCard: 'Credit Card',
                payPal: 'PayPal',
                applePay: 'Apple Pay',
                googlePay: 'Google Pay',
                inPerson: 'In Person',
                cash: 'Cash',
                Free: 'Free',
              };
              return names[method] || method;
            };

            // Summary stats
            const paidOrders = periodOrders.filter(o => o.status === 'PAID');
            const freeOrders = periodOrders.filter(o => o.status === 'FREE');
            const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'), 0);
            const totalTickets = periodOrders.reduce((sum, o) => sum + o.ticketsQuantity, 0);
            const avgOrderValue = paidOrders.length > 0
              ? paidOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'), 0) / paidOrders.length
              : 0;

            // Fee totals (only on paid orders)
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
              return { ...data, fees, net: data.revenue - fees };
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

            // Payment method breakdown (use transaction data for specificity)
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

            // CSV export
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
              const periodLabel = financePeriod === 'all' ? 'All-Time' : financePeriod;
              link.download = `ROTR-Financial-Report-${periodLabel}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            };

            return (
              <>
                {/* Period Filter + Actions */}
                <div className="rotr-finance-toolbar">
                  <select
                    value={financePeriod}
                    onChange={e => setFinancePeriod(e.target.value)}
                    className="rotr-filter-select"
                  >
                    <option value="all">All Time</option>
                    {orderYears.map(y => (
                      <option key={y} value={String(y)}>
                        {y}{y === currentYear ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="rotr-finance-actions">
                    <button onClick={downloadCSV} className="admin-btn admin-btn-secondary">
                      <i className="fas fa-download"></i> Download CSV
                    </button>
                    <button onClick={() => window.print()} className="admin-btn admin-btn-secondary">
                      <i className="fas fa-print"></i> Print Report
                    </button>
                  </div>
                </div>

                {/* Print-only header */}
                <div className="rotr-print-header">
                  <h2>Rockin&apos; on the River — Financial Report</h2>
                  <p>{financePeriod === 'all' ? 'All Time' : financePeriod} &bull; Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Summary Cards */}
                <div className="rotr-stats-row">
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <div className="rotr-stat-value">{formatCurrency(totalRevenue)}</div>
                    <div className="rotr-stat-label">Gross Revenue</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                      <i className="fas fa-minus-circle"></i>
                    </div>
                    <div className="rotr-stat-value">-{formatCurrency(totalProcessingFees)}</div>
                    <div className="rotr-stat-label">Processing Fees</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: 'rgba(27,139,235,0.1)', color: '#1B8BEB' }}>
                      <i className="fas fa-hand-holding-usd"></i>
                    </div>
                    <div className="rotr-stat-value">{formatCurrency(totalNetPayout)}</div>
                    <div className="rotr-stat-label">Net Payout</div>
                  </div>
                  <div className="rotr-stat-card">
                    <div className="rotr-stat-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
                      <i className="fas fa-hand-holding-heart"></i>
                    </div>
                    <div className="rotr-stat-value">{formatCurrency(totalServiceFees)}</div>
                    <div className="rotr-stat-label">Wix Service Fees{hasTxnData ? '' : ' (est)'}</div>
                  </div>
                </div>

                {/* Fee Breakdown Note */}
                <div className="rotr-finance-note">
                  <i className="fas fa-info-circle"></i>
                  <span>
                    Processing fees calculated at Wix rate: <strong>2.9% + $0.30</strong> per transaction (verified against payout statements).
                    {hasTxnData
                      ? <> Wix service fees are <strong>actual amounts</strong> from payment records.</>
                      : <> Wix service fee estimated at <strong>2.5%</strong> (charged to buyer).</>
                    }
                    {' '}{paidOrders.length} paid orders, {freeOrders.length} free orders.
                  </span>
                </div>

                {/* Monthly Revenue Breakdown */}
                {monthlyData.length > 0 && (
                  <div className="rotr-finance-section">
                    <h3><i className="fas fa-calendar-alt"></i> Monthly Breakdown</h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th style={{ textAlign: 'right' }}>Orders</th>
                            <th style={{ textAlign: 'right' }}>Tickets</th>
                            <th style={{ textAlign: 'right' }}>Gross</th>
                            <th style={{ textAlign: 'right' }}>Proc. Fees</th>
                            <th style={{ textAlign: 'right' }}>Svc Fees{hasTxnData ? '' : '*'}</th>
                            <th style={{ textAlign: 'right' }}>Net Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.map(m => (
                            <tr key={m.label}>
                              <td style={{ fontWeight: 500 }}>{m.label}</td>
                              <td style={{ textAlign: 'right' }}>{m.orders}</td>
                              <td style={{ textAlign: 'right' }}>{m.tickets}</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(m.revenue)}</td>
                              <td style={{ textAlign: 'right', color: '#EF4444', fontSize: '0.85rem' }}>-{formatCurrency(m.fees)}</td>
                              <td style={{ textAlign: 'right', color: '#7C3AED', fontSize: '0.85rem' }}>{formatCurrency(m.svcFees)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(m.net)}</td>
                            </tr>
                          ))}
                          <tr className="rotr-finance-total-row">
                            <td>Total</td>
                            <td style={{ textAlign: 'right' }}>{periodOrders.length}</td>
                            <td style={{ textAlign: 'right' }}>{totalTickets}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                            <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</td>
                            <td style={{ textAlign: 'right', color: '#7C3AED' }}>{formatCurrency(totalServiceFees)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalNetPayout)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Revenue by Event */}
                {eventRevenue.length > 0 && (
                  <div className="rotr-finance-section">
                    <h3><i className="fas fa-music"></i> Revenue by Event</h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Orders</th>
                            <th style={{ textAlign: 'right' }}>Gross</th>
                            <th style={{ textAlign: 'right' }}>Proc. Fees</th>
                            <th style={{ textAlign: 'right' }}>Net Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventRevenue.map(ev => (
                            <tr key={ev.name}>
                              <td style={{ fontWeight: 500 }}>{ev.name}</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{ev.date}</td>
                              <td style={{ textAlign: 'right' }}>{ev.orders}</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(ev.revenue)}</td>
                              <td style={{ textAlign: 'right', color: '#EF4444', fontSize: '0.85rem' }}>-{formatCurrency(ev.fees)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(ev.net)}</td>
                            </tr>
                          ))}
                          <tr className="rotr-finance-total-row">
                            <td colSpan={2}>Total</td>
                            <td style={{ textAlign: 'right' }}>{periodOrders.length}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                            <td style={{ textAlign: 'right', color: '#EF4444' }}>-{formatCurrency(totalProcessingFees)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalNetPayout)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payment Method Breakdown */}
                {paymentMethods.length > 0 && (
                  <div className="rotr-finance-section">
                    <h3><i className="fas fa-credit-card"></i> Payment Methods</h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Method</th>
                            <th style={{ textAlign: 'right' }}>Orders</th>
                            <th style={{ textAlign: 'right' }}>Revenue</th>
                            <th style={{ textAlign: 'right' }}>% of Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentMethods.map(pm => (
                            <tr key={pm.method}>
                              <td style={{ fontWeight: 500 }}>
                                {fmtMethod(pm.method)}
                              </td>
                              <td style={{ textAlign: 'right' }}>{pm.count}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(pm.revenue)}</td>
                              <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                {totalRevenue > 0 ? `${((pm.revenue / totalRevenue) * 100).toFixed(1)}%` : '0%'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Transactions — the table the accountant needs */}
                <div className="rotr-finance-section">
                  <h3><i className="fas fa-list"></i> All Transactions</h3>
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
                                  {svcFee > 0 ? formatCurrency(svcFee) : '—'}
                                </td>
                                <td style={{ textAlign: 'right', color: procFee > 0 ? '#EF4444' : undefined, fontSize: '0.85rem' }}>
                                  {procFee > 0 ? `-${formatCurrency(procFee)}` : '—'}
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
            );
          })()}
        </div>
      )}
      {/* === ANALYTICS TAB === */}
      {tab === 'analytics' && (
        <div>
          {/* Period Selector */}
          <div className="rotr-analytics-toolbar">
            <div className="rotr-analytics-periods">
              {[7, 14, 30, 60].map(d => (
                <button
                  key={d}
                  className={`rotr-analytics-period-btn ${analyticsDays === d ? 'active' : ''}`}
                  onClick={() => setAnalyticsDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
            <span className="rotr-analytics-range">
              {analyticsData?.period
                ? `${new Date(analyticsData.period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(analyticsData.period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : ''}
            </span>
          </div>

          {analyticsLoading ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
              <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>Loading analytics...</p>
            </div>
          ) : analyticsData ? (() => {
            const { metrics, previousMetrics } = analyticsData;
            const getMetric = (type: string) => metrics.find(m => m.type === type);
            const getPrevMetric = (type: string) => previousMetrics?.find(m => m.type === type);

            const calcChange = (current: number, previous: number | undefined) => {
              if (!previous || previous === 0) return null;
              return ((current - previous) / previous) * 100;
            };

            const sessions = getMetric('TOTAL_SESSIONS');
            const visitors = getMetric('TOTAL_UNIQUE_VISITORS');
            const sales = getMetric('TOTAL_SALES');
            const ordersMetric = getMetric('TOTAL_ORDERS');
            const contacts = getMetric('CLICKS_TO_CONTACT');
            const forms = getMetric('TOTAL_FORMS_SUBMITTED');

            const prevSessions = getPrevMetric('TOTAL_SESSIONS');
            const prevVisitors = getPrevMetric('TOTAL_UNIQUE_VISITORS');
            const prevSales = getPrevMetric('TOTAL_SALES');
            const prevOrders = getPrevMetric('TOTAL_ORDERS');

            const cards = [
              {
                label: 'Sessions',
                value: sessions?.total?.toLocaleString() || '0',
                change: calcChange(sessions?.total || 0, prevSessions?.total),
                icon: 'fas fa-eye',
                color: '#1B8BEB',
              },
              {
                label: 'Unique Visitors',
                value: visitors?.total?.toLocaleString() || '0',
                change: calcChange(visitors?.total || 0, prevVisitors?.total),
                icon: 'fas fa-users',
                color: '#10B981',
              },
              {
                label: 'Sales',
                value: formatCurrency(sales?.total || 0),
                change: calcChange(sales?.total || 0, prevSales?.total),
                icon: 'fas fa-dollar-sign',
                color: '#D97706',
              },
              {
                label: 'Orders',
                value: ordersMetric?.total?.toLocaleString() || '0',
                change: calcChange(ordersMetric?.total || 0, prevOrders?.total),
                icon: 'fas fa-receipt',
                color: '#7C3AED',
              },
            ];

            // Chart: daily sessions + visitors
            const sessionValues = sessions?.values || [];
            const visitorValues = visitors?.values || [];
            const maxVal = Math.max(...sessionValues.map(v => v.value), 1);

            // Engagement cards
            const engagementCards = [
              { label: 'Clicks to Contact', value: contacts?.total || 0, icon: 'fas fa-phone' },
              { label: 'Forms Submitted', value: forms?.total || 0, icon: 'fas fa-envelope' },
              {
                label: 'Sessions/Visitor',
                value: visitors?.total ? (sessions?.total || 0 / visitors.total).toFixed(1) : '0',
                icon: 'fas fa-redo',
              },
            ];

            return (
              <>
                {/* Summary Cards */}
                <div className="rotr-stats-row">
                  {cards.map(card => (
                    <div key={card.label} className="rotr-stat-card">
                      <div className="rotr-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                        <i className={card.icon}></i>
                      </div>
                      <div className="rotr-stat-value">{card.value}</div>
                      <div className="rotr-stat-label">{card.label}</div>
                      {card.change !== null && (
                        <div className={`rotr-analytics-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                          <i className={`fas fa-arrow-${card.change >= 0 ? 'up' : 'down'}`}></i>
                          {Math.abs(card.change).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {previousMetrics && (
                  <p className="rotr-analytics-compare-note">
                    <i className="fas fa-info-circle"></i> Compared to previous {analyticsDays} days
                  </p>
                )}

                {/* Daily Traffic Chart */}
                <div className="admin-card rotr-analytics-chart-card">
                  <h3><i className="fas fa-chart-area"></i> Daily Traffic</h3>
                  <div className="rotr-analytics-chart">
                    <div className="rotr-analytics-chart-bars">
                      {sessionValues.map((s, i) => {
                        const v = visitorValues[i];
                        const dayLabel = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const sessionHeight = (s.value / maxVal) * 100;
                        const visitorHeight = v ? (v.value / maxVal) * 100 : 0;
                        return (
                          <div key={s.date} className="rotr-analytics-bar-group" title={`${dayLabel}\nSessions: ${s.value}\nVisitors: ${v?.value || 0}`}>
                            <div className="rotr-analytics-bar-container">
                              <div
                                className="rotr-analytics-bar sessions"
                                style={{ height: `${sessionHeight}%` }}
                              ></div>
                              <div
                                className="rotr-analytics-bar visitors"
                                style={{ height: `${visitorHeight}%` }}
                              ></div>
                            </div>
                            {(sessionValues.length <= 14 || i % Math.ceil(sessionValues.length / 14) === 0) && (
                              <span className="rotr-analytics-bar-label">
                                {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="rotr-analytics-chart-legend">
                      <span><span className="rotr-legend-dot sessions"></span> Sessions</span>
                      <span><span className="rotr-legend-dot visitors"></span> Visitors</span>
                    </div>
                  </div>
                </div>

                {/* Engagement Cards */}
                <div className="rotr-analytics-engagement">
                  {engagementCards.map(card => (
                    <div key={card.label} className="rotr-analytics-engagement-card">
                      <i className={card.icon}></i>
                      <div className="rotr-analytics-engagement-value">{card.value}</div>
                      <div className="rotr-analytics-engagement-label">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Daily Breakdown Table */}
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-table"></i> Daily Breakdown</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Sessions</th>
                          <th style={{ textAlign: 'right' }}>Visitors</th>
                          <th style={{ textAlign: 'right' }}>Sales</th>
                          <th style={{ textAlign: 'right' }}>Orders</th>
                          <th style={{ textAlign: 'right' }}>Contacts</th>
                          <th style={{ textAlign: 'right' }}>Forms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...sessionValues].reverse().map((s, i) => {
                          const idx = sessionValues.length - 1 - i;
                          const dayLabel = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          return (
                            <tr key={s.date}>
                              <td style={{ fontWeight: 500 }}>{dayLabel}</td>
                              <td style={{ textAlign: 'right' }}>{s.value}</td>
                              <td style={{ textAlign: 'right' }}>{visitorValues[idx]?.value || 0}</td>
                              <td style={{ textAlign: 'right' }}>
                                {(sales?.values[idx]?.value || 0) > 0
                                  ? formatCurrency(sales!.values[idx].value)
                                  : '—'}
                              </td>
                              <td style={{ textAlign: 'right' }}>{ordersMetric?.values[idx]?.value || 0}</td>
                              <td style={{ textAlign: 'right' }}>{contacts?.values[idx]?.value || 0}</td>
                              <td style={{ textAlign: 'right' }}>{forms?.values[idx]?.value || 0}</td>
                            </tr>
                          );
                        })}
                        <tr className="rotr-finance-total-row">
                          <td>Total</td>
                          <td style={{ textAlign: 'right' }}>{sessions?.total?.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{visitors?.total?.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(sales?.total || 0)}</td>
                          <td style={{ textAlign: 'right' }}>{ordersMetric?.total?.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{contacts?.total}</td>
                          <td style={{ textAlign: 'right' }}>{forms?.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rotr-analytics-note">
                  <i className="fas fa-info-circle"></i>
                  Data from Wix Analytics. Limited to 62 days lookback. Visitors who decline cookies are not tracked.
                </div>
              </>
            );
          })() : (
            <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
              No analytics data available.
            </div>
          )}
        </div>
      )}
      {/* === FILES TAB === */}
      {tab === 'files' && (
        <div>
          <FileRepository />
        </div>
      )}
      {/* === EMAIL MARKETING TAB === */}
      {tab === 'email' && (
        <div>
          <EmailMarketingDashboard context="rotr" />
        </div>
      )}
    </div>
  );
}
