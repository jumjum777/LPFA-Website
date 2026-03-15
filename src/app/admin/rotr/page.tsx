'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EmailMarketingDashboard from '@/components/admin/EmailMarketingDashboard';
import dynamic from 'next/dynamic';
const FileRepository = dynamic(() => import('@/app/admin/files/page'), { ssr: false });
const ROTRStaffManager = dynamic(() => import('@/components/admin/ROTRStaffManager'), { ssr: false });
const PurchaseOrders = dynamic(() => import('@/app/admin/purchase-orders/page'), { ssr: false });
const ROTRFinances = dynamic(() => import('@/components/admin/ROTRFinances'), { ssr: false });

type Tab = 'overview' | 'events' | 'orders' | 'customers' | 'inbox' | 'finances' | 'analytics' | 'files' | 'email' | 'staff' | 'purchase-orders';

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
  recentOrders: number;
  recentRevenue: number;
  recentTickets: number;
  recentInbox: number;
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
        <div className="analytics-loading-card">
          <div className="music-loading-scene">
            <div className="music-loading-eq">
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
            </div>
            <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
            <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
            <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
          </div>
          <h3 className="analytics-loading-title">Loading...</h3>
          <p className="analytics-loading-step">Loading ROTR dashboard...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
          </div>
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
  const [overviewLoadingStep, setOverviewLoadingStep] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [analyticsData, setAnalyticsData] = useState<{ metrics: AnalyticsMetric[]; previousMetrics: AnalyticsMetric[] | null; period: { start: string; end: string; days: number } } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [analyticsLoadingStep, setAnalyticsLoadingStep] = useState(0);
  const [publishMap, setPublishMap] = useState<Map<string, { id: string; is_published: boolean }>>(new Map());
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
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
    if ((tab === 'overview' || tab === 'orders' || tab === 'customers' || tab === 'finances') && orders.length === 0 && !ordersLoading) {
      setOrdersLoading(true);
      fetch('/api/admin/rotr/orders')
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error('Failed to load orders:', err))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab, orders.length, ordersLoading]);


  // Cycle overview loading steps
  const OVERVIEW_STEPS = [
    'Connecting to Wix Events...',
    'Loading the lineup...',
    'Counting ticket sales...',
    'Checking the inbox...',
    'Warming up the stage...',
  ];
  useEffect(() => {
    if (!loading) { setOverviewLoadingStep(0); return; }
    const interval = setInterval(() => {
      setOverviewLoadingStep(prev => (prev + 1) % OVERVIEW_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Cycle analytics loading steps
  const ANALYTICS_STEPS = [
    'Scanning website traffic...',
    'Measuring visitor engagement...',
    'Counting page sessions...',
    'Tracking ticket sales...',
    'Analyzing contact conversions...',
    'Compiling form submissions...',
    'Charting your insights...',
  ];
  useEffect(() => {
    if (!analyticsLoading) { setAnalyticsLoadingStep(0); return; }
    const interval = setInterval(() => {
      setAnalyticsLoadingStep(prev => (prev + 1) % ANALYTICS_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [analyticsLoading]);

  // Load analytics when analytics tab opens (or period changes)
  useEffect(() => {
    if (tab === 'analytics') {
      setAnalyticsLoading(true);
      const now = new Date();
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      let url: string;

      if (analyticsPeriod === 'this-month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        url = `/api/admin/rotr/analytics?start=${fmt(start)}&end=${fmt(now)}`;
      } else if (analyticsPeriod === 'last-month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        url = `/api/admin/rotr/analytics?start=${fmt(start)}&end=${fmt(end)}`;
      } else if (analyticsPeriod === 'ytd') {
        const start = new Date(now.getFullYear(), 0, 1);
        url = `/api/admin/rotr/analytics?start=${fmt(start)}&end=${fmt(now)}`;
      } else {
        const days = parseInt(analyticsPeriod);
        url = `/api/admin/rotr/analytics?days=${days}`;
      }

      fetch(url)
        .then(res => res.json())
        .then(data => setAnalyticsData(data))
        .catch(err => console.error('Failed to load analytics:', err))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [tab, analyticsPeriod]);

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
          </div>
        </div>
        <div className="analytics-loading-card">
          <div className="music-loading-scene">
            <div className="music-loading-eq">
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
              <div className="music-eq-bar"></div>
            </div>
            <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
            <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
            <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
          </div>
          <h3 className="analytics-loading-title">Loading ROTR</h3>
          <p className="analytics-loading-step">{OVERVIEW_STEPS[overviewLoadingStep]}</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{tab === 'email' ? <><i className="fas fa-envelope" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Email Marketing</> : tab === 'files' ? <><i className="fas fa-folder-open" style={{ marginRight: '0.5rem', color: '#D97706' }}></i> Files</> : tab === 'staff' ? <><i className="fas fa-hard-hat" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Staff &amp; Contractors</> : tab === 'purchase-orders' ? <><i className="fas fa-file-invoice" style={{ marginRight: '0.5rem', color: '#7C3AED' }}></i> Purchase Orders</> : "Rockin' on the River"}</h1>
          <p>{tab === 'email' ? "Campaign analytics from Constant Contact" : tab === 'files' ? "Shared document and asset repository" : tab === 'staff' ? "Manage event staff, assignments, hours, and payroll exports" : tab === 'purchase-orders' ? "Shared purchase orders across all departments" : "Concert series data from Wix Events"}</p>
        </div>
        {tab !== 'email' && tab !== 'files' && tab !== 'staff' && tab !== 'purchase-orders' && (
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
        <div style={{ maxWidth: '1400px' }}>
          {/* Stat Cards — Last 7 Days */}
          <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.5rem' }}>
            {[
              { title: 'Upcoming Shows', subtitle: 'Next 7 days', value: summary.upcomingEvents, icon: 'fas fa-calendar-alt', color: '#1B8BEB', href: '/admin/rotr?tab=events' },
              { title: 'Orders', subtitle: 'Last 7 days', value: summary.recentOrders, icon: 'fas fa-receipt', color: '#10B981', href: '/admin/rotr?tab=orders' },
              { title: 'Revenue', subtitle: 'Last 7 days', value: formatCurrency(summary.recentRevenue), icon: 'fas fa-dollar-sign', color: '#D97706', href: '/admin/rotr?tab=finances' },
              { title: 'Tickets Sold', subtitle: 'Last 7 days', value: summary.recentTickets, icon: 'fas fa-ticket-alt', color: '#7C3AED', href: '/admin/rotr?tab=orders' },
              { title: 'Inbox Messages', subtitle: 'Last 7 days', value: summary.recentInbox, icon: 'fas fa-envelope', color: '#EF4444', href: '/admin/rotr?tab=inbox' },
            ].map(card => (
              <Link key={card.title} href={card.href} className="admin-stat-card dash-compact-card">
                <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                  <i className={card.icon}></i>
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{card.value}</span>
                  <span className="admin-stat-label">{card.title}</span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500, marginTop: '0.1rem', display: 'block' }}>{card.subtitle}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Two-column layout: Upcoming Shows + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* Upcoming Shows */}
            <div className="admin-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                <i className="fas fa-calendar-alt" style={{ color: '#1B8BEB' }}></i> Upcoming Shows
                <Link href="/admin/rotr?tab=events" style={{ fontSize: '0.82rem', fontWeight: 500, color: '#1B8BEB', marginLeft: 'auto', textDecoration: 'none' }}>
                  View All <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
                </Link>
              </h3>
              {upcomingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  <i className="fas fa-calendar-alt" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
                  <p style={{ margin: 0 }}>No upcoming shows scheduled</p>
                  <a href="https://www.rockinontheriver.com" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-primary" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
                    <i className="fas fa-plus"></i> Create on Wix
                  </a>
                </div>
              ) : (() => {
                const ticketsByEvent = new Map<string, number>();
                orders.forEach(o => {
                  if (o.status === 'CONFIRMED' || o.status === 'PAID') {
                    ticketsByEvent.set(o.eventId, (ticketsByEvent.get(o.eventId) || 0) + o.ticketsQuantity);
                  }
                });
                const displayed = showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 5);
                return (
                  <>
                    <div className="rotr-upcoming-list">
                      {displayed.map(event => (
                        <Link
                          key={event.id}
                          href={`/admin/rotr/${event.id}`}
                          className="rotr-upcoming-item"
                        >
                          {event.mainImage ? (
                            <img
                              src={event.mainImage.url}
                              alt={event.title}
                              className="rotr-upcoming-thumb"
                            />
                          ) : (
                            <div className="rotr-upcoming-thumb" style={{ background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fas fa-music" style={{ color: 'var(--gray-400)' }}></i>
                            </div>
                          )}
                          <div className="rotr-upcoming-info">
                            <span className="rotr-upcoming-title">{event.title}</span>
                            <span className="rotr-upcoming-date">
                              <i className="fas fa-calendar"></i> {event.dateAndTimeSettings.formatted.startDate}
                              {event.dateAndTimeSettings.formatted.startTime && ` at ${event.dateAndTimeSettings.formatted.startTime}`}
                            </span>
                          </div>
                          <div className="rotr-upcoming-meta" style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>{ticketsByEvent.get(event.id) || 0}</span>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>tickets sold</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {upcomingEvents.length > 5 && (
                      <button
                        onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                        style={{ width: '100%', padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: '#1B8BEB', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}
                      >
                        {showAllUpcoming ? 'Show Less' : `Show All ${upcomingEvents.length} Shows`}
                        <i className={`fas fa-chevron-${showAllUpcoming ? 'up' : 'down'}`} style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}></i>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Quick Actions + Recent Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick Actions */}
              <div className="admin-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <i className="fas fa-bolt" style={{ color: '#D97706' }}></i> Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a href="https://www.rockinontheriver.com" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <i className="fas fa-external-link-alt"></i> Manage on Wix
                  </a>
                  <Link href="/admin/rotr?tab=orders" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <i className="fas fa-receipt"></i> View Orders
                  </Link>
                  <Link href="/admin/rotr?tab=finances" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <i className="fas fa-chart-pie"></i> Financial Reports
                  </Link>
                  <Link href="/admin/rotr?tab=analytics" className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <i className="fas fa-chart-line"></i> Site Analytics
                  </Link>
                </div>
              </div>

              {/* 2026 Season Totals */}
              <div className="admin-card" style={{ flex: 1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <i className="fas fa-chart-bar" style={{ color: '#7C3AED' }}></i> 2026 Season
                </h3>
                {(() => {
                  const yearStart = '2026-01-01T00:00:00.000Z';
                  const yearOrders = orders.filter(o => (o.status === 'CONFIRMED' || o.status === 'PAID') && o.created >= yearStart);
                  const yearRevenue = yearOrders.reduce((s, o) => s + parseFloat(o.totalPrice?.amount || '0'), 0);
                  const yearTickets = yearOrders.reduce((s, o) => s + o.ticketsQuantity, 0);
                  const yearEvents = events.filter(e => new Date(e.dateAndTimeSettings.startDate).getFullYear() === 2026).length;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { label: 'Events', value: yearEvents, color: '#1B8BEB' },
                        { label: 'Orders', value: yearOrders.length, color: '#10B981' },
                        { label: 'Revenue', value: formatCurrency(yearRevenue), color: '#D97706' },
                        { label: 'Tickets Sold', value: yearTickets, color: '#7C3AED' },
                        { label: 'Avg. Order Value', value: yearOrders.length > 0 ? formatCurrency(yearRevenue / yearOrders.length) : '$0', color: '#EF4444' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{item.label}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

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

        // Ticket counts from orders
        const ticketsByEvent = new Map<string, number>();
        orders.forEach(o => {
          if (o.status === 'CONFIRMED' || o.status === 'PAID') {
            ticketsByEvent.set(o.eventId, (ticketsByEvent.get(o.eventId) || 0) + o.ticketsQuantity);
          }
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {yearGroups.map(([year, yearEvents]) => {
              const isCollapsed = collapsedYears.has(year);
              const liveCount = yearEvents.filter(e => publishMap.get(e.id)?.is_published).length;
              const yearTickets = yearEvents.reduce((s, e) => s + (ticketsByEvent.get(e.id) || 0), 0);
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
                      padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
                      color: 'inherit', fontSize: '1rem', fontWeight: 600, textAlign: 'left',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--gray-100)',
                    }}
                  >
                    <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'}`} style={{ fontSize: '0.75rem', width: '0.75rem', color: '#94a3b8' }}></i>
                    <span>{year}</span>
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 500 }}>
                      <span style={{ color: '#1B8BEB' }}><i className="fas fa-calendar-alt" style={{ marginRight: '0.3rem' }}></i>{yearEvents.length} events</span>
                      <span style={{ color: '#10B981' }}><i className="fas fa-check-circle" style={{ marginRight: '0.3rem' }}></i>{liveCount} live</span>
                      <span style={{ color: '#7C3AED' }}><i className="fas fa-ticket-alt" style={{ marginRight: '0.3rem' }}></i>{yearTickets} sold</span>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {sorted.map((event, idx) => {
                        const wixUrl = event.eventPageUrl
                          ? `${event.eventPageUrl.base}${event.eventPageUrl.path}`
                          : null;
                        const pubEntry = publishMap.get(event.id);
                        const isLive = pubEntry?.is_published ?? false;
                        const isSynced = !!pubEntry;
                        const dimmed = isSynced && !isLive;
                        const eventTickets = ticketsByEvent.get(event.id) || 0;
                        return (
                          <div
                            key={event.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '1rem',
                              padding: '0.85rem 1.25rem',
                              borderBottom: idx < sorted.length - 1 ? '1px solid var(--gray-100)' : 'none',
                              opacity: dimmed ? 0.55 : 1,
                              transition: 'background 0.15s',
                            }}
                            className="rotr-event-row"
                          >
                            {/* Thumbnail */}
                            <div style={{ flexShrink: 0 }}>
                              {event.mainImage ? (
                                <img
                                  src={event.mainImage.url}
                                  alt=""
                                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              ) : (
                                <div style={{ width: '48px', height: '48px', background: 'var(--gray-100)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fas fa-music" style={{ color: 'var(--gray-400)' }}></i>
                                </div>
                              )}
                            </div>

                            {/* Event Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/admin/rotr/${event.id}`} style={{ color: dimmed ? '#94a3b8' : 'var(--blue-accent)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none' }}>
                                {event.title}
                              </Link>
                              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                                <span><i className="fas fa-calendar" style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}></i>{event.dateAndTimeSettings.formatted.startDate}</span>
                                {event.dateAndTimeSettings.formatted.startTime && (
                                  <span><i className="fas fa-clock" style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}></i>{event.dateAndTimeSettings.formatted.startTime}</span>
                                )}
                                <span>
                                  {event.registration.tickets?.lowestPrice
                                    ? event.registration.tickets.lowestPrice.formattedValue
                                    : 'Free'}
                                </span>
                              </div>
                            </div>

                            {/* Tickets Sold */}
                            <div style={{ textAlign: 'center', minWidth: '60px' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>{eventTickets}</div>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>tickets</div>
                            </div>

                            {/* Status */}
                            <div style={{ minWidth: '70px', textAlign: 'center' }}>
                              <span
                                className="admin-status-badge"
                                style={{
                                  background: event.status === 'UPCOMING' ? '#10B981'
                                    : event.status === 'ENDED' ? '#6B7280'
                                    : '#EF4444',
                                  fontSize: '0.7rem',
                                }}
                              >
                                {event.status}
                              </span>
                              {event.registration.tickets?.soldOut && (
                                <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 600, marginTop: '0.2rem' }}>Sold Out</div>
                              )}
                            </div>

                            {/* Live Toggle */}
                            <div style={{ minWidth: '80px' }}>
                              {isSynced ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleEventPublished(event.id)}>
                                  <div
                                    style={{
                                      width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative',
                                      background: isLive ? '#16a34a' : '#374151', transition: 'background 0.2s',
                                    }}
                                  >
                                    <div style={{
                                      width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff',
                                      position: 'absolute', top: '0.175rem',
                                      left: isLive ? '1.3rem' : '0.2rem',
                                      transition: 'left 0.2s',
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: isLive ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>
                                    {isLive ? 'Live' : 'Hidden'}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: 0.5 }}>
                                  <div style={{ width: '2.5rem', height: '1.35rem', borderRadius: '999px', position: 'relative', background: '#374151' }}>
                                    <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff', position: 'absolute', top: '0.175rem', left: '0.2rem' }} />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Hidden</span>
                                </div>
                              )}
                            </div>

                            {/* Wix Link */}
                            <div style={{ flexShrink: 0 }}>
                              {wixUrl && (
                                <a href={wixUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-icon" title="View on Wix" style={{ fontSize: '0.8rem' }}>
                                  <i className="fas fa-external-link-alt"></i>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
        <div style={{ marginTop: '0.5rem' }}>
          {/* Summary Stats */}
          <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
            {[
              { title: 'Total Orders', value: filteredOrders.length, icon: 'fas fa-receipt', color: '#1B8BEB' },
              { title: 'Revenue', value: formatCurrency(filteredRevenue), icon: 'fas fa-dollar-sign', color: '#10B981' },
              { title: 'Tickets', value: filteredOrders.reduce((s, o) => s + o.ticketsQuantity, 0), icon: 'fas fa-ticket-alt', color: '#7C3AED' },
              { title: 'Avg. Order', value: filteredOrders.length > 0 ? formatCurrency(filteredRevenue / filteredOrders.length) : '$0', icon: 'fas fa-chart-line', color: '#D97706' },
            ].map(card => (
              <div key={card.title} className="admin-stat-card dash-compact-card">
                <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                  <i className={card.icon}></i>
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{card.value}</span>
                  <span className="admin-stat-label">{card.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <i className="fas fa-filter" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
            <select
              value={orderFilter}
              onChange={e => setOrderFilter(e.target.value)}
              className="rotr-filter-select"
              style={{ flex: '1', maxWidth: '280px' }}
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
              style={{ maxWidth: '160px' }}
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="FREE">Free</option>
            </select>
            {(orderFilter || orderStatusFilter) && (
              <button
                onClick={() => { setOrderFilter(''); setOrderStatusFilter(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.82rem', fontWeight: 500 }}
              >
                <i className="fas fa-times" style={{ marginRight: '0.25rem' }}></i> Clear
              </button>
            )}
          </div>

          {ordersLoading ? (
            <div className="analytics-loading-card">
              <div className="music-loading-scene">
                <div className="music-loading-eq">
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                </div>
                <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
              </div>
              <h3 className="analytics-loading-title">Loading Orders...</h3>
              <p className="analytics-loading-step">Fetching ticket orders...</p>
              <div className="analytics-loading-progress">
                <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fas fa-receipt" style={{ fontSize: '2rem', color: '#94a3b8', opacity: 0.4, marginBottom: '0.5rem', display: 'block' }}></i>
              <p style={{ color: '#94a3b8', margin: 0 }}>No orders found</p>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredOrders.map((order, idx) => (
                  <div
                    key={order.orderNumber}
                    className="rotr-event-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.85rem 1.25rem',
                      borderBottom: idx < filteredOrders.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    }}
                  >
                    {/* Order Icon */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                      background: order.status === 'PAID' ? '#10B98115' : '#6B728015',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: order.status === 'PAID' ? '#10B981' : '#6B7280',
                    }}>
                      <i className={order.status === 'PAID' ? 'fas fa-credit-card' : 'fas fa-ticket-alt'}></i>
                    </div>

                    {/* Order Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>
                        {order.fullName || `${order.firstName} ${order.lastName}`.trim()}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.15rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                        <span style={{ fontFamily: 'monospace' }}>#{order.orderNumber}</span>
                        <span>{eventMap.get(order.eventId) || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Tickets */}
                    <div style={{ textAlign: 'center', minWidth: '45px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>{order.ticketsQuantity}</div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>qty</div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: parseFloat(order.totalPrice?.amount || '0') > 0 ? 'var(--navy)' : '#94a3b8' }}>
                        {parseFloat(order.totalPrice?.amount || '0') > 0
                          ? formatCurrency(parseFloat(order.totalPrice!.amount))
                          : 'Free'}
                      </div>
                    </div>

                    {/* Status + Date */}
                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: order.status === 'PAID' ? '#10B981'
                            : order.status === 'FREE' ? '#6B7280'
                            : '#EF4444',
                          fontSize: '0.7rem',
                        }}
                      >
                        {order.status === 'NA_ORDER_STATUS' ? 'N/A' : order.status}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>{formatDate(order.created)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CUSTOMERS TAB === */}
      {tab === 'customers' && (
        <div style={{ marginTop: '0.5rem' }}>
          {ordersLoading ? (
            <div className="analytics-loading-card">
              <div className="music-loading-scene">
                <div className="music-loading-eq">
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                </div>
                <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
              </div>
              <h3 className="analytics-loading-title">Loading Customers...</h3>
              <p className="analytics-loading-step">Analyzing customer data...</p>
              <div className="analytics-loading-progress">
                <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
                {[
                  { title: 'Unique Customers', value: customers.length, icon: 'fas fa-users', color: '#1B8BEB' },
                  { title: 'Repeat Buyers', value: customers.filter(c => c.orderCount > 1).length, icon: 'fas fa-redo', color: '#7C3AED' },
                  { title: 'Total Spent', value: formatCurrency(customers.reduce((s, c) => s + c.totalSpent, 0)), icon: 'fas fa-dollar-sign', color: '#D97706' },
                  { title: 'Avg. per Customer', value: customers.length > 0 ? formatCurrency(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length) : '$0', icon: 'fas fa-chart-line', color: '#10B981' },
                ].map(card => (
                  <div key={card.title} className="admin-stat-card dash-compact-card">
                    <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{card.value}</span>
                      <span className="admin-stat-label">{card.title}</span>
                    </div>
                  </div>
                ))}
              </div>

              {customers.length === 0 ? (
                <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <i className="fas fa-users" style={{ fontSize: '2rem', color: '#94a3b8', opacity: 0.4, marginBottom: '0.5rem', display: 'block' }}></i>
                  <p style={{ color: '#94a3b8', margin: 0 }}>No customers yet</p>
                </div>
              ) : (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {customers.map((c, idx) => (
                      <div
                        key={c.email}
                        className="rotr-event-row"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.85rem 1.25rem',
                          borderBottom: idx < customers.length - 1 ? '1px solid var(--gray-100)' : 'none',
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          background: '#1B8BEB15', color: '#1B8BEB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem',
                        }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Customer Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>{c.name}</div>
                          <a href={`mailto:${c.email}`} style={{ fontSize: '0.78rem', color: '#1B8BEB', textDecoration: 'none' }}>{c.email}</a>
                        </div>

                        {/* Orders */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>{c.orderCount}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>orders</div>
                        </div>

                        {/* Tickets */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>{c.ticketCount}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>tickets</div>
                        </div>

                        {/* Total Spent */}
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>
                            {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : 'Free'}
                          </div>
                        </div>

                        {/* Last Order */}
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{formatDate(c.lastOrder)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === INBOX TAB === */}
      {tab === 'inbox' && (
        <div style={{ marginTop: '0.5rem' }}>
          {inboxLoading ? (
            <div className="analytics-loading-card">
              <div className="music-loading-scene">
                <div className="music-loading-eq">
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                </div>
                <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
              </div>
              <h3 className="analytics-loading-title">Loading Inbox...</h3>
              <p className="analytics-loading-step">Fetching messages from Wix...</p>
              <div className="analytics-loading-progress">
                <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
              </div>
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
            <>
              {/* Inbox Stats */}
              {(() => {
                const unreadCount = inboxThreads.filter(t => t.lastDirection === 'PARTICIPANT_TO_BUSINESS' && !readConvoIds.has(t.conversationId)).length;
                const formCount = inboxThreads.filter(t => t.messages?.some(m => m.content?.contentType === 'FORM')).length;
                return (
                  <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
                    {[
                      { title: 'Conversations', value: inboxThreads.length, icon: 'fas fa-comments', color: '#1B8BEB' },
                      { title: 'Unread', value: unreadCount, icon: 'fas fa-envelope', color: unreadCount > 0 ? '#EF4444' : '#10B981' },
                      { title: 'Form Submissions', value: formCount, icon: 'fas fa-file-alt', color: '#7C3AED' },
                    ].map(card => (
                      <div key={card.title} className="admin-stat-card dash-compact-card">
                        <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                          <i className={card.icon}></i>
                        </div>
                        <div className="admin-stat-info">
                          <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{card.value}</span>
                          <span className="admin-stat-label">{card.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

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
            </>
          )}
        </div>
      )}

      {/* === FINANCES TAB === */}
      {tab === 'finances' && (
        <ROTRFinances events={events} orders={orders} ordersLoading={ordersLoading} />
      )}
      {/* === ANALYTICS TAB === */}
      {tab === 'analytics' && (
        <div style={{ marginTop: '0.5rem' }}>
          {/* Period Filter */}
          <div className="admin-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <i className="fas fa-calendar-alt" style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
            <div className="rotr-finance-periods">
              {(['this-month', 'last-month', '30', 'ytd'] as const).map(p => (
                <button
                  key={p}
                  className={`rotr-analytics-period-btn ${analyticsPeriod === p ? 'active' : ''}`}
                  onClick={() => setAnalyticsPeriod(p)}
                >
                  {p === 'this-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : p === 'ytd' ? 'YTD' : `${p}d`}
                </button>
              ))}
              <select
                value={['this-month', 'last-month', '30', 'ytd'].includes(analyticsPeriod) ? '' : analyticsPeriod}
                onChange={e => setAnalyticsPeriod(e.target.value)}
                className="rotr-filter-select"
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="" disabled>More...</option>
                <option value="7">Past 7 Days</option>
                <option value="14">Past 14 Days</option>
                <option value="60">Past 60 Days</option>
              </select>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#94a3b8' }}>
              {analyticsData?.period
                ? `${new Date(analyticsData.period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(analyticsData.period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : ''}
            </span>
          </div>

          {analyticsLoading ? (
            <div className="analytics-loading-card">
              <div className="music-loading-scene">
                <div className="music-loading-eq">
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                  <div className="music-eq-bar"></div>
                </div>
                <div className="music-loading-note music-note-1"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-2"><i className="fas fa-music"></i></div>
                <div className="music-loading-note music-note-3"><i className="fas fa-music"></i></div>
              </div>
              <h3 className="analytics-loading-title">Loading Analytics</h3>
              <p className="analytics-loading-step">{ANALYTICS_STEPS[analyticsLoadingStep]}</p>
              <div className="analytics-loading-progress">
                <div className="analytics-loading-progress-bar" style={{ background: 'linear-gradient(90deg, #7C3AED, #EF4444)' }}></div>
              </div>
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
              { label: 'Sessions', value: sessions?.total?.toLocaleString() || '0', change: calcChange(sessions?.total || 0, prevSessions?.total), icon: 'fas fa-eye', color: '#1B8BEB' },
              { label: 'Unique Visitors', value: visitors?.total?.toLocaleString() || '0', change: calcChange(visitors?.total || 0, prevVisitors?.total), icon: 'fas fa-users', color: '#10B981' },
              { label: 'Sales', value: formatCurrency(sales?.total || 0), change: calcChange(sales?.total || 0, prevSales?.total), icon: 'fas fa-dollar-sign', color: '#D97706' },
              { label: 'Orders', value: ordersMetric?.total?.toLocaleString() || '0', change: calcChange(ordersMetric?.total || 0, prevOrders?.total), icon: 'fas fa-receipt', color: '#7C3AED' },
              { label: 'Clicks to Contact', value: String(contacts?.total || 0), change: null, icon: 'fas fa-phone', color: '#EF4444' },
              { label: 'Forms Submitted', value: String(forms?.total || 0), change: null, icon: 'fas fa-envelope', color: '#0B1F3A' },
            ];

            // Chart: daily sessions + visitors
            const sessionValues = sessions?.values || [];
            const visitorValues = visitors?.values || [];
            const maxVal = Math.max(...sessionValues.map(v => v.value), 1);

            return (
              <>
                {/* Summary Cards */}
                <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.25rem' }}>
                  {cards.map(card => (
                    <div key={card.label} className="admin-stat-card dash-compact-card">
                      <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
                        <i className={card.icon}></i>
                      </div>
                      <div className="admin-stat-info">
                        <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{card.value}</span>
                        <span className="admin-stat-label">{card.label}</span>
                        {card.change !== null && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: card.change >= 0 ? '#10B981' : '#EF4444' }}>
                            <i className={`fas fa-arrow-${card.change >= 0 ? 'up' : 'down'}`} style={{ marginRight: '0.2rem' }}></i>
                            {Math.abs(card.change).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {previousMetrics && (
                  <div className="admin-card" style={{ padding: '0.5rem 1rem', marginBottom: '1.25rem', borderLeft: '4px solid #1B8BEB', fontSize: '0.82rem', color: '#64748b' }}>
                    <i className="fas fa-info-circle" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i>
                    Compared to previous {analyticsData?.period.days || 30} days
                  </div>
                )}

                {/* Daily Traffic Chart */}
                <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                    <i className="fas fa-chart-area" style={{ color: '#1B8BEB' }}></i> Daily Traffic
                    <div className="rotr-analytics-chart-legend" style={{ marginLeft: 'auto' }}>
                      <span><span className="rotr-legend-dot sessions"></span> Sessions</span>
                      <span><span className="rotr-legend-dot visitors"></span> Visitors</span>
                    </div>
                  </h3>
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
                              <div className="rotr-analytics-bar sessions" style={{ height: `${sessionHeight}%` }}></div>
                              <div className="rotr-analytics-bar visitors" style={{ height: `${visitorHeight}%` }}></div>
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
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <i className="fas fa-table" style={{ color: '#6B7280' }}></i> Daily Breakdown
                    <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8', marginLeft: 'auto' }}>{sessionValues.length} days</span>
                  </h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table" style={{ marginTop: 0 }}>
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

                {/* Data Source Note */}
                <div className="admin-card" style={{ padding: '0.5rem 1rem', borderLeft: '4px solid #94a3b8', fontSize: '0.82rem', color: '#64748b' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '0.4rem' }}></i>
                  <strong>Wix Analytics</strong> &middot; Max 62-day lookback
                  {(analyticsPeriod === 'ytd' || analyticsPeriod === '60') && (
                    <span> &middot; <em>Capped to most recent 62 days</em></span>
                  )}
                  {analyticsPeriod !== 'ytd' && analyticsPeriod !== '60' && (
                    <span> &middot; Visitors who decline cookies are not tracked</span>
                  )}
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
      {/* === PURCHASE ORDERS TAB === */}
      {tab === 'purchase-orders' && (
        <div>
          <PurchaseOrders />
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
      {/* === STAFF TAB === */}
      {tab === 'staff' && (
        <div>
          <ROTRStaffManager events={events} />
        </div>
      )}
    </div>
  );
}
