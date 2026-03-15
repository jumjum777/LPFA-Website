'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  stats: Record<string, number>;
  traffic: {
    configured: boolean;
    daily: { date: string; sessions: number; users: number; pageviews: number }[];
    summary: {
      sessions: { current: number; previous: number };
      users: { current: number; previous: number };
      pageviews: { current: number; previous: number };
    };
  } | null;
  poBreakdown: { status: string; label: string; count: number; totalAmount: number }[];
  inboxActivity: { week: string; weekStart: string; count: number }[];
  social: {
    facebook: Record<string, number> | null;
    youtube: Record<string, number> | null;
  } | null;
  attention: {
    pendingPOs: { id: string; po_number: string; title: string; total_amount: number; requested_by: string; created_at: string; priority: string }[];
    unreadInbox: { id: string; first_name: string; last_name: string; subject: string; created_at: string }[];
    activeRFPs: { id: string; title: string; status: string; created_at: string }[];
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PO_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  pending_approval: '#D97706',
  approved: '#059669',
  denied: '#DC2626',
  completed: '#1e40af',
  archived: '#cbd5e1',
};

const STAT_CARDS = [
  { title: 'Upcoming Events', key: 'upcomingEvents', href: '/admin/events', icon: 'fas fa-calendar-alt', color: '#D97706', subtitle: 'Next 7 days' },
  { title: 'Upcoming Tours', key: 'upcomingTours', href: '/admin/tours', icon: 'fas fa-ship', color: '#059669', subtitle: 'Next 7 days' },
  { title: 'Unread Messages', key: 'unread', href: '/admin/leads', icon: 'fas fa-envelope', color: '#DC2626' },
  { title: 'Pending POs', key: 'pendingPOs', href: '/admin/purchase-orders', icon: 'fas fa-file-invoice', color: '#7C3AED' },
  { title: 'Trips Planned', key: 'tripsPlanned', href: '/admin/analytics', icon: 'fas fa-route', color: '#059669', subtitle: 'Last 7 days' },
  { title: 'Active Alerts', key: 'activeAlerts', href: '/marine', icon: 'fas fa-exclamation-triangle', color: '#EF4444' },
  { title: 'Vessel Traffic', key: 'vessels', href: '/admin/vessels', icon: 'fas fa-anchor', color: '#0B1F3A' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function calcChange(metric: { current: number; previous: number }): number | null {
  if (!metric.previous) return null;
  return ((metric.current - metric.previous) / metric.previous) * 100;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    fetch('/api/admin/dashboard-summary', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.name === 'AbortError' ? 'Request timed out. Please try again.' : e.message); setLoading(false); })
      .finally(() => clearTimeout(timeout));
  }

  useEffect(() => {
    loadData();
    // Dark mode detection
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page" style={{ maxWidth: '1400px' }}>
        <div className="admin-page-header"><h1><i className="fas fa-gauge-high" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Dashboard</h1></div>
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
          <h3 className="analytics-loading-title">Loading Dashboard...</h3>
          <p className="analytics-loading-step">Building your command center...</p>
          <div className="analytics-loading-progress">
            <div className="analytics-loading-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="admin-page">
        <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#D97706', marginBottom: '0.75rem' }}></i>
          <p style={{ color: '#64748b' }}>Failed to load dashboard data</p>
          <button className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }} onClick={loadData}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Computed ───────────────────────────────────────────────────────────

  const hasAttention = data.attention.pendingPOs.length + data.attention.unreadInbox.length + data.attention.activeRFPs.length > 0;
  const totalPOs = data.poBreakdown.reduce((s, b) => s + b.count, 0);
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = '#94a3b8';
  const tooltipBg = isDark ? '#1e293b' : '#fff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // ─── Custom Tooltip ─────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: isDark ? '#e2e8f0' : '#334155' }}>{label}</div>
        {payload.map((p: { dataKey: string; name: string; value: number; color: string }) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isDark ? '#cbd5e1' : '#475569' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }}></span>
            {p.name}: {formatNumber(p.value)}
          </div>
        ))}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="admin-page" style={{ maxWidth: '1400px' }}>

      {/* Header + Quick Actions */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1><i className="fas fa-gauge-high mr-2 text-blue"></i> Dashboard</h1>
          <p>Welcome to the LPFA website admin portal.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/admin/purchase-orders" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> New PO
          </Link>
          <Link href="/admin/news" className="admin-btn admin-btn-secondary">
            <i className="fas fa-plus"></i> New Article
          </Link>
          <Link href="/admin/leads" className="admin-btn admin-btn-secondary" style={{ position: 'relative' }}>
            <i className="fas fa-inbox"></i> Inbox
            {data.attention.unreadInbox.length > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#DC2626', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.attention.unreadInbox.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats-grid dash-compact" style={{ marginBottom: '1.5rem' }}>
        {STAT_CARDS.map(card => (
          <Link key={card.key} href={card.href} className="admin-stat-card dash-compact-card">
            <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color, width: 36, height: 36, borderRadius: 8, fontSize: '0.95rem' }}>
              <i className={card.icon}></i>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-count" style={{ fontSize: '1.35rem' }}>{data.stats[card.key] ?? 0}</span>
              <span className="admin-stat-label">{card.title}</span>
              {'subtitle' in card && card.subtitle && (
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500, marginTop: '0.1rem', display: 'block' }}>{card.subtitle}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Needs Attention */}
      {hasAttention && (
        <div className="admin-card" style={{ borderLeft: '4px solid #D97706', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDark ? '#fbbf24' : '#92400e', margin: '0 0 1rem' }}>
            <i className="fas fa-exclamation-triangle"></i> Needs Attention
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Pending POs */}
            {data.attention.pendingPOs.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b', margin: '0 0 0.5rem' }}>
                  <i className="fas fa-file-invoice" style={{ marginRight: '0.25rem' }}></i> Pending POs ({data.attention.pendingPOs.length})
                </h4>
                {data.attention.pendingPOs.map(po => (
                  <Link key={po.id} href="/admin/purchase-orders" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, textDecoration: 'none', color: 'inherit', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{po.po_number} — {po.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{po.requested_by} · {timeAgo(po.created_at)}</div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap' }}>{formatCurrency(po.total_amount)}</span>
                  </Link>
                ))}
              </div>
            )}
            {/* Unread Inbox */}
            {data.attention.unreadInbox.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b', margin: '0 0 0.5rem' }}>
                  <i className="fas fa-envelope" style={{ marginRight: '0.25rem' }}></i> Unread Messages ({data.attention.unreadInbox.length})
                </h4>
                {data.attention.unreadInbox.map(msg => (
                  <Link key={msg.id} href="/admin/leads" style={{ display: 'block', padding: '0.5rem 0', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>{msg.first_name} {msg.last_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject || 'No subject'} · {timeAgo(msg.created_at)}</div>
                  </Link>
                ))}
              </div>
            )}
            {/* Active RFPs */}
            {data.attention.activeRFPs.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b', margin: '0 0 0.5rem' }}>
                  <i className="fas fa-file-contract" style={{ marginRight: '0.25rem' }}></i> Active RFPs ({data.attention.activeRFPs.length})
                </h4>
                {data.attention.activeRFPs.map(rfp => (
                  <Link key={rfp.id} href="/admin/rfps" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{rfp.title}</div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{timeAgo(rfp.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Row: Traffic + PO Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Website Traffic */}
        <div className="admin-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
            <i className="fas fa-chart-line" style={{ color: '#1B8BEB' }}></i> Website Traffic
            <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8', marginLeft: 'auto' }}>Last 30 days</span>
          </h3>
          {data.traffic?.configured && data.traffic.daily.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={data.traffic.daily}>
                    <defs>
                      <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B8BEB" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1B8BEB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} stroke={axisColor} fontSize={11} tickLine={false} />
                    <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="sessions" stroke="#1B8BEB" fill="url(#sessionsFill)" strokeWidth={2} name="Sessions" />
                    <Area type="monotone" dataKey="users" stroke="#0B1F3A" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Mini stats below chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                {[
                  { label: 'Sessions', metric: data.traffic.summary.sessions },
                  { label: 'Users', metric: data.traffic.summary.users },
                  { label: 'Pageviews', metric: data.traffic.summary.pageviews },
                ].map(item => {
                  const change = calcChange(item.metric);
                  return (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{formatNumber(item.metric.current)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.label}</div>
                      {change !== null && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: 2, color: change >= 0 ? '#059669' : '#DC2626' }}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
              <p style={{ margin: 0 }}>Google Analytics not configured</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>Add GA4 credentials to enable traffic insights</p>
            </div>
          )}
        </div>

        {/* PO Donut */}
        <div className="admin-card" style={{ position: 'relative' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
            <i className="fas fa-file-invoice" style={{ color: '#6366F1' }}></i> Purchase Orders
          </h3>
          {totalPOs > 0 ? (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.poBreakdown.filter(s => s.count > 0)}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="label"
                      stroke="none"
                    >
                      {data.poBreakdown.filter(s => s.count > 0).map(entry => (
                        <Cell key={entry.status} fill={PO_COLORS[entry.status] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Center label */}
              <div style={{ position: 'absolute', top: '3.5rem', left: 0, right: 0, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{totalPOs}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {data.poBreakdown.filter(s => s.count > 0).map(s => (
                  <span key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PO_COLORS[s.status] || '#94a3b8', display: 'inline-block' }}></span>
                    {s.label}: {s.count}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <i className="fas fa-file-invoice" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
              <p style={{ margin: 0 }}>No purchase orders yet</p>
              <Link href="/admin/purchase-orders" className="admin-btn admin-btn-primary" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
                <i className="fas fa-plus"></i> Create First PO
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Inbox Activity + Social Media */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>

        {/* Inbox Activity */}
        <div className="admin-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
            <i className="fas fa-inbox" style={{ color: '#D97706' }}></i> Inbox Activity
            <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8', marginLeft: 'auto' }}>Last 8 weeks</span>
          </h3>
          {data.inboxActivity.some(w => w.count > 0) ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={data.inboxActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="week" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#D97706" radius={[4, 4, 0, 0]} name="Submissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.4 }}></i>
              <p style={{ margin: 0 }}>No contact submissions in the last 8 weeks</p>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <i className="fas fa-share-alt" style={{ color: '#1B8BEB' }}></i> Social Media
          </h3>

          {data.social?.facebook ? (
            <div style={{ padding: '0.75rem', borderRadius: 8, background: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <i className="fab fa-facebook" style={{ color: '#1877F2' }}></i>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#334155' }}>Facebook</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto' }}>Lifetime</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Followers', value: data.social.facebook.followersCount || data.social.facebook.followers_count || data.social.facebook.fanCount || data.social.facebook.fan_count },
                  { label: 'Total Views', value: data.social.facebook.pageViews || data.social.facebook.page_views || data.social.facebook.pagePostsImpressions || data.social.facebook.page_posts_impressions },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{formatNumber(Number(item.value) || 0)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {data.social?.youtube ? (
            <div style={{ padding: '0.75rem', borderRadius: 8, background: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <i className="fab fa-youtube" style={{ color: '#FF0000' }}></i>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#334155' }}>YouTube</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Subscribers', value: data.social.youtube.subscriberCount || data.social.youtube.subscriber_count },
                  { label: 'Total Views', value: data.social.youtube.viewCount || data.social.youtube.view_count },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{formatNumber(Number(item.value) || 0)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!data.social?.facebook && !data.social?.youtube && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-share-alt" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}></i>
              <p style={{ margin: 0 }}>Social accounts not connected</p>
            </div>
          )}

          <Link href="/admin/analytics" style={{ color: '#1B8BEB', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            View Full Analytics <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
