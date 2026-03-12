'use client';

import { useEffect, useState } from 'react';

interface SummaryMetric {
  current: number;
  previous: number | null;
}

interface DailyRow {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
}

interface TopPage {
  path: string;
  title: string;
  pageviews: number;
  sessions: number;
}

interface TrafficSource {
  channel: string;
  sessions: number;
  users: number;
}

interface GAData {
  configured: boolean;
  error?: string;
  period?: { start: string; end: string; days: number };
  summary?: Record<string, SummaryMetric>;
  daily?: DailyRow[];
  topPages?: TopPage[];
  trafficSources?: TrafficSource[];
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function calcChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<GAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => setData({ configured: false, error: 'Failed to reach API' }))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Website Analytics</h1>
          <p>Loading analytics data...</p>
        </div>
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)' }}></i>
        </div>
      </div>
    );
  }

  // Not configured state
  if (!data?.configured) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Website Analytics</h1>
          <p>Google Analytics data for lorainport.com</p>
        </div>
        <div className="admin-card ga-setup-card">
          <div className="ga-setup-icon">
            <i className="fas fa-chart-pie"></i>
          </div>
          <h3>Google Analytics Not Configured</h3>
          <p>To enable website analytics, add your GA4 Property ID to the environment variables.</p>
          <div className="ga-setup-steps">
            <ol>
              <li>Go to <strong>Google Analytics</strong> &rarr; Admin &rarr; Property Settings</li>
              <li>Copy the <strong>Property ID</strong> (numeric, e.g. 123456789)</li>
              <li>Add <code>GA_PROPERTY_ID=123456789</code> to your <code>.env.local</code></li>
              <li>Grant the service account <strong>Viewer</strong> access to the GA4 property</li>
              <li>Restart the dev server or redeploy</li>
            </ol>
          </div>
          {data?.error && (
            <div className="em-error-msg" style={{ marginTop: '1.5rem' }}>
              <i className="fas fa-exclamation-triangle"></i> {data.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state (configured but failed)
  if (data.error) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Website Analytics</h1>
          <p>Google Analytics data for lorainport.com</p>
        </div>
        <div className="admin-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#D97706', marginBottom: '0.75rem' }}></i>
          <h3 style={{ marginBottom: '0.5rem' }}>Analytics Unavailable</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{data.error}</p>
          <button onClick={() => { setLoading(true); fetch(`/api/admin/analytics?days=${days}`).then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false)); }} className="admin-btn admin-btn-secondary">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = data.summary || {};
  const daily = data.daily || [];
  const topPages = data.topPages || [];
  const trafficSources = data.trafficSources || [];

  const cards = [
    { key: 'sessions', label: 'Sessions', icon: 'fas fa-eye', color: '#1B8BEB', format: (v: number) => formatNumber(v) },
    { key: 'users', label: 'Users', icon: 'fas fa-users', color: '#10B981', format: (v: number) => formatNumber(v) },
    { key: 'pageviews', label: 'Pageviews', icon: 'fas fa-file-alt', color: '#D97706', format: (v: number) => formatNumber(v) },
    { key: 'bounceRate', label: 'Bounce Rate', icon: 'fas fa-sign-out-alt', color: '#EF4444', format: (v: number) => formatPercent(v), invertChange: true },
    { key: 'avgSessionDuration', label: 'Avg Duration', icon: 'fas fa-clock', color: '#7C3AED', format: (v: number) => formatDuration(v) },
    { key: 'newUsers', label: 'New Users', icon: 'fas fa-user-plus', color: '#0D9488', format: (v: number) => formatNumber(v) },
  ];

  // Chart data
  const maxSessions = Math.max(...daily.map(d => d.sessions), 1);

  // Traffic sources total for % calc
  const totalSourceSessions = trafficSources.reduce((s, t) => s + t.sessions, 0);
  const maxSourceSessions = Math.max(...trafficSources.map(t => t.sessions), 1);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Website Analytics</h1>
        <p>Google Analytics data for lorainport.com</p>
      </div>

      {/* Period Selector */}
      <div className="rotr-analytics-toolbar">
        <div className="rotr-analytics-periods">
          {[7, 14, 30, 60].map(d => (
            <button
              key={d}
              className={`rotr-analytics-period-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
        <span className="rotr-analytics-range">
          {data.period
            ? `${new Date(data.period.start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(data.period.end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : ''}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {cards.map(card => {
          const metric = summary[card.key];
          const value = metric?.current ?? 0;
          const change = calcChange(metric?.current ?? 0, metric?.previous ?? null);
          const isPositive = card.invertChange ? (change !== null && change <= 0) : (change !== null && change >= 0);

          return (
            <div key={card.key} className="rotr-stat-card">
              <div className="rotr-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <i className={card.icon}></i>
              </div>
              <div className="rotr-stat-value">{card.format(value)}</div>
              <div className="rotr-stat-label">{card.label}</div>
              {change !== null && (
                <div className={`rotr-analytics-change ${isPositive ? 'positive' : 'negative'}`}>
                  <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'}`}></i>
                  {Math.abs(change).toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {summary.sessions?.previous !== null && (
        <p className="rotr-analytics-compare-note">
          <i className="fas fa-info-circle"></i> Compared to previous {days} days
        </p>
      )}

      {/* Daily Traffic Chart */}
      <div className="admin-card rotr-analytics-chart-card">
        <h3><i className="fas fa-chart-area"></i> Daily Traffic</h3>
        <div className="rotr-analytics-chart">
          <div className="rotr-analytics-chart-bars">
            {daily.map((d, i) => {
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const sessionHeight = (d.sessions / maxSessions) * 100;
              const userHeight = (d.users / maxSessions) * 100;
              return (
                <div key={d.date} className="rotr-analytics-bar-group" title={`${dayLabel}\nSessions: ${d.sessions}\nUsers: ${d.users}`}>
                  <div className="rotr-analytics-bar-container">
                    <div className="rotr-analytics-bar sessions" style={{ height: `${sessionHeight}%` }}></div>
                    <div className="rotr-analytics-bar visitors" style={{ height: `${userHeight}%` }}></div>
                  </div>
                  {(daily.length <= 14 || i % Math.ceil(daily.length / 14) === 0) && (
                    <span className="rotr-analytics-bar-label">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="rotr-analytics-chart-legend">
            <span><span className="rotr-legend-dot sessions"></span> Sessions</span>
            <span><span className="rotr-legend-dot visitors"></span> Users</span>
          </div>
        </div>
      </div>

      {/* Top Pages & Traffic Sources side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Top Pages */}
        <div className="admin-card">
          <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-file-alt" style={{ color: '#D97706', marginRight: '0.5rem' }}></i> Top Pages</h3>
          {topPages.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>No page data available.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th style={{ textAlign: 'right' }}>Views</th>
                    <th style={{ textAlign: 'right' }}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 15).map(page => (
                    <tr key={page.path}>
                      <td>
                        <span className="ga-page-path">{page.path}</span>
                        {page.title && page.title !== '(not set)' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>{page.title}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatNumber(page.pageviews)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(page.sessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="admin-card">
          <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-globe" style={{ color: '#1B8BEB', marginRight: '0.5rem' }}></i> Traffic Sources</h3>
          {trafficSources.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>No traffic source data available.</p>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {trafficSources.map(source => (
                <div key={source.channel} className="ga-source-row">
                  <span className="ga-source-name">{source.channel}</span>
                  <div className="ga-source-bar-container">
                    <div className="ga-source-bar" style={{ width: `${(source.sessions / maxSourceSessions) * 100}%` }}></div>
                  </div>
                  <span className="ga-source-value">{formatNumber(source.sessions)}</span>
                  <span className="ga-source-pct">
                    {totalSourceSessions > 0 ? `${((source.sessions / totalSourceSessions) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
                <th style={{ textAlign: 'right' }}>Users</th>
                <th style={{ textAlign: 'right' }}>Pageviews</th>
                <th style={{ textAlign: 'right' }}>Bounce Rate</th>
                <th style={{ textAlign: 'right' }}>Avg Duration</th>
                <th style={{ textAlign: 'right' }}>New Users</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map(d => {
                const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <tr key={d.date}>
                    <td style={{ fontWeight: 500 }}>{dayLabel}</td>
                    <td style={{ textAlign: 'right' }}>{d.sessions}</td>
                    <td style={{ textAlign: 'right' }}>{d.users}</td>
                    <td style={{ textAlign: 'right' }}>{d.pageviews}</td>
                    <td style={{ textAlign: 'right' }}>{formatPercent(d.bounceRate)}</td>
                    <td style={{ textAlign: 'right' }} className="ga-duration">{formatDuration(d.avgSessionDuration)}</td>
                    <td style={{ textAlign: 'right' }}>{d.newUsers}</td>
                  </tr>
                );
              })}
              <tr className="rotr-finance-total-row">
                <td>Totals</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(summary.sessions?.current ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(summary.users?.current ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(summary.pageviews?.current ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatPercent(summary.bounceRate?.current ?? 0)}</td>
                <td style={{ textAlign: 'right' }} className="ga-duration">{formatDuration(summary.avgSessionDuration?.current ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(summary.newUsers?.current ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rotr-analytics-note">
        <i className="fas fa-info-circle"></i>
        Data from Google Analytics 4. Analytics data may take 24-48 hours to appear. Real-time data is not included.
      </div>
    </div>
  );
}
