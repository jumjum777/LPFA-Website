'use client';

import { useEffect, useState } from 'react';

interface CampaignStats {
  sends: number;
  opens: number;
  clicks: number;
  bounces: number;
  optouts: number;
  forwards: number;
  not_opened: number;
}

interface Campaign {
  campaign_id: string;
  name: string;
  status: string;
  last_sent_date: string;
  created_at: string;
  stats: CampaignStats;
}

interface ContactList {
  list_id: string;
  name: string;
  membership_count: number;
  created_at: string;
  updated_at: string;
}

interface Aggregates {
  open: number;
  click: number;
  bounce: number;
  unsubscribe: number;
  did_not_open: number;
}

interface CampaignDetail {
  campaign_id: string;
  stats: Record<string, number>;
  percents: Record<string, number>;
}

interface EmailData {
  connected: boolean;
  error?: string;
  campaigns: Campaign[];
  aggregates: Aggregates | null;
  lists: ContactList[];
  listsCount: number;
  tokenLastRefreshed?: string | null;
}

type Period = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

interface Props {
  context: 'lpfa' | 'rotr';
}

function getDateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByPeriod(campaigns: Campaign[], period: Period, customStart?: string, customEnd?: string): Campaign[] {
  if (period === 'all') return campaigns;

  let start: Date;
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (period === 'custom' && customStart) {
    start = new Date(customStart + 'T00:00:00');
    if (customEnd) end.setTime(new Date(customEnd + 'T23:59:59').getTime());
  } else {
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    start = getDateNDaysAgo(daysMap[period] || 30);
  }

  return campaigns.filter(c => {
    if (!c.last_sent_date) return false;
    const sent = new Date(c.last_sent_date);
    return sent >= start && sent <= end;
  });
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

function pct(num: number, den: number) {
  if (!den) return '0.0';
  return ((num / den) * 100).toFixed(1);
}

export default function EmailMarketingDashboard({ context }: Props) {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [view, setView] = useState<'campaigns' | 'lists'>('campaigns');
  const [period, setPeriod] = useState<Period>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    fetch('/api/admin/email-marketing')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        setData({ connected: false, error: 'Failed to reach API', campaigns: [], aggregates: null, lists: [], listsCount: 0 });
        setLoading(false);
      });
  }, []);

  const loadCampaignDetail = async (campaignId: string) => {
    if (selectedCampaign === campaignId) {
      setSelectedCampaign(null);
      setCampaignDetail(null);
      return;
    }
    setSelectedCampaign(campaignId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/email-marketing/campaign?id=${campaignId}`);
      if (!res.ok) {
        setSelectedCampaign(null);
        setDetailLoading(false);
        return;
      }
      const d = await res.json();
      setCampaignDetail(d);
    } catch {
      setSelectedCampaign(null);
    }
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)' }}></i>
        <p style={{ marginTop: '1rem', color: '#64748B' }}>Loading email marketing data...</p>
      </div>
    );
  }

  if (!data?.connected) {
    const handleConnect = async () => {
      try {
        const res = await fetch('/api/admin/email-marketing/auth');
        const d = await res.json();
        if (d.authUrl) {
          window.location.href = d.authUrl;
        } else {
          alert('Could not generate authorization URL. Make sure CONSTANTCONTACT_CLIENT_ID is set in environment variables.');
        }
      } catch {
        alert('Failed to reach authorization endpoint.');
      }
    };

    return (
      <div className="admin-card em-setup-card">
        <div className="em-setup-icon">
          <i className="fas fa-envelope-open-text"></i>
        </div>
        <h3>Connect Constant Contact</h3>
        <p>Link your Constant Contact account to view campaign analytics for {context === 'rotr' ? "Rockin' on the River" : 'LPFA'}.</p>
        <button className="admin-btn admin-btn-primary" onClick={handleConnect} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <i className="fas fa-plug"></i> Connect Constant Contact
        </button>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
          Requires <code>CONSTANTCONTACT_CLIENT_ID</code> and <code>CONSTANTCONTACT_CLIENT_SECRET</code> in your environment variables.
        </p>
        {data?.error && (
          <div className="em-error-msg">
            <i className="fas fa-exclamation-triangle"></i> {data.error}
          </div>
        )}
      </div>
    );
  }

  const allCampaigns = data.campaigns || [];
  const agg = data.aggregates;
  const lists = data.lists || [];

  // Filter campaigns by period
  const campaigns = filterByPeriod(allCampaigns, period, customStart, customEnd);

  // Compute totals from filtered campaigns
  const totalSends = campaigns.reduce((s, c) => s + (c.stats?.sends || 0), 0);
  const totalOpens = campaigns.reduce((s, c) => s + (c.stats?.opens || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.stats?.clicks || 0), 0);
  const totalBounces = campaigns.reduce((s, c) => s + (c.stats?.bounces || 0), 0);
  const totalUnsubs = campaigns.reduce((s, c) => s + (c.stats?.optouts || 0), 0);
  const totalContacts = lists.reduce((s, l) => s + (l.membership_count || 0), 0);

  return (
    <div className="em-dashboard">
      {/* Period Selector */}
      <div className="em-period-bar">
        <div className="em-period-buttons">
          {([['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days'], ['1y', '1 Year'], ['all', 'All Time']] as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`em-period-btn ${period === key ? 'active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
          <button
            className={`em-period-btn ${period === 'custom' ? 'active' : ''}`}
            onClick={() => setPeriod('custom')}
          >
            Custom
          </button>
        </div>
        {period === 'custom' && (
          <div className="em-custom-dates">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        )}
        <div className="em-period-info">
          {period !== 'all' && <span>{campaigns.length} of {allCampaigns.length} campaigns</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="em-summary-grid">
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#1B8BEB15', color: '#1B8BEB' }}>
            <i className="fas fa-paper-plane"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalSends)}</div>
          <div className="em-summary-label">Total Sends</div>
        </div>
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#05966915', color: '#059669' }}>
            <i className="fas fa-envelope-open"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalOpens)}</div>
          <div className="em-summary-label">Unique Opens</div>
          <div className="em-summary-pct">{agg ? `${agg.open.toFixed(1)}%` : `${pct(totalOpens, totalSends)}%`} avg</div>
        </div>
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#D9770615', color: '#D97706' }}>
            <i className="fas fa-mouse-pointer"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalClicks)}</div>
          <div className="em-summary-label">Unique Clicks</div>
          <div className="em-summary-pct">{agg ? `${agg.click.toFixed(1)}%` : `${pct(totalClicks, totalSends)}%`} avg</div>
        </div>
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#EF444415', color: '#EF4444' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalBounces)}</div>
          <div className="em-summary-label">Bounces</div>
          <div className="em-summary-pct">{agg ? `${agg.bounce.toFixed(1)}%` : `${pct(totalBounces, totalSends)}%`} avg</div>
        </div>
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#7C3AED15', color: '#7C3AED' }}>
            <i className="fas fa-user-minus"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalUnsubs)}</div>
          <div className="em-summary-label">Unsubscribes</div>
          <div className="em-summary-pct">{agg ? `${agg.unsubscribe.toFixed(1)}%` : `${pct(totalUnsubs, totalSends)}%`} avg</div>
        </div>
        <div className="em-summary-card">
          <div className="em-summary-icon" style={{ background: '#06B6D415', color: '#06B6D4' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="em-summary-value">{formatNumber(totalContacts)}</div>
          <div className="em-summary-label">Active Contacts</div>
          <div className="em-summary-pct">{data.listsCount} list{data.listsCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="em-connection-status">
        <span className="em-status-dot em-status-connected"></span>
        <span>Connected to Constant Contact</span>
        {data.tokenLastRefreshed && (
          <span className="em-status-meta">
            &middot; Token refreshed {new Date(data.tokenLastRefreshed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* View Toggle */}
      <div className="em-view-toggle">
        <button
          className={`em-view-btn ${view === 'campaigns' ? 'active' : ''}`}
          onClick={() => setView('campaigns')}
        >
          <i className="fas fa-envelope"></i> Campaigns ({campaigns.length})
        </button>
        <button
          className={`em-view-btn ${view === 'lists' ? 'active' : ''}`}
          onClick={() => setView('lists')}
        >
          <i className="fas fa-address-book"></i> Contact Lists ({lists.length})
        </button>
      </div>

      {/* Campaigns Table */}
      {view === 'campaigns' && (
        <div className="admin-card">
          {campaigns.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
              No campaigns found.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table em-campaigns-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Sent</th>
                    <th>Sends</th>
                    <th>Opens</th>
                    <th>Clicks</th>
                    <th>Open %</th>
                    <th>Click %</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => {
                    const isExpanded = selectedCampaign === c.campaign_id;
                    const openRate = pct(c.stats?.opens || 0, c.stats?.sends || 0);
                    const clickRate = pct(c.stats?.clicks || 0, c.stats?.sends || 0);

                    return (
                      <tr
                        key={c.campaign_id}
                        className={`em-campaign-row ${isExpanded ? 'em-expanded' : ''}`}
                        onClick={() => loadCampaignDetail(c.campaign_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="em-campaign-name">{c.name}</div>
                          <div className="em-campaign-status">
                            <span className={`em-status-dot em-status-${(c.status || '').toLowerCase()}`}></span>
                            {c.status}
                          </div>
                        </td>
                        <td className="em-td-date">{formatDate(c.last_sent_date)}</td>
                        <td>{formatNumber(c.stats?.sends || 0)}</td>
                        <td>{formatNumber(c.stats?.opens || 0)}</td>
                        <td>{formatNumber(c.stats?.clicks || 0)}</td>
                        <td>
                          <span className={`em-rate ${parseFloat(openRate) >= 20 ? 'em-rate-good' : parseFloat(openRate) >= 10 ? 'em-rate-ok' : 'em-rate-low'}`}>
                            {openRate}%
                          </span>
                        </td>
                        <td>
                          <span className={`em-rate ${parseFloat(clickRate) >= 3 ? 'em-rate-good' : parseFloat(clickRate) >= 1 ? 'em-rate-ok' : 'em-rate-low'}`}>
                            {clickRate}%
                          </span>
                        </td>
                        <td>
                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#94A3B8', fontSize: '0.75rem' }}></i>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Campaign Detail Expansion */}
          {selectedCampaign && (
            <div className="em-campaign-detail">
              {detailLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <i className="fas fa-spinner fa-spin" style={{ color: 'var(--blue-accent)' }}></i>
                </div>
              ) : campaignDetail ? (
                <div className="em-detail-grid">
                  <div className="em-detail-section">
                    <h4><i className="fas fa-envelope-open"></i> Opens</h4>
                    <div className="em-detail-stats">
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.em_opens || 0)}</span>
                        <span className="em-detail-label">Unique Opens</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.['em_opens.all'] || 0)}</span>
                        <span className="em-detail-label">Total Opens</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{campaignDetail.percents?.open?.toFixed(1) || '0'}%</span>
                        <span className="em-detail-label">Open Rate</span>
                      </div>
                    </div>
                    {(campaignDetail.stats?.['em_opens.all.mobile'] || campaignDetail.stats?.['em_opens.all.computer']) && (
                      <div className="em-device-bar">
                        <div className="em-device-segment em-device-desktop" style={{ width: `${campaignDetail.percents?.desktop_open || 0}%` }} title={`Desktop: ${campaignDetail.percents?.desktop_open?.toFixed(1)}%`}></div>
                        <div className="em-device-segment em-device-mobile" style={{ width: `${campaignDetail.percents?.mobile_open || 0}%` }} title={`Mobile: ${campaignDetail.percents?.mobile_open?.toFixed(1)}%`}></div>
                      </div>
                    )}
                    <div className="em-device-legend">
                      <span><span className="em-legend-dot em-device-desktop"></span> Desktop {campaignDetail.percents?.desktop_open?.toFixed(1) || 0}%</span>
                      <span><span className="em-legend-dot em-device-mobile"></span> Mobile {campaignDetail.percents?.mobile_open?.toFixed(1) || 0}%</span>
                    </div>
                  </div>

                  <div className="em-detail-section">
                    <h4><i className="fas fa-mouse-pointer"></i> Clicks</h4>
                    <div className="em-detail-stats">
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.em_clicks || 0)}</span>
                        <span className="em-detail-label">Unique Clicks</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.['em_clicks.all'] || 0)}</span>
                        <span className="em-detail-label">Total Clicks</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{campaignDetail.percents?.click?.toFixed(1) || '0'}%</span>
                        <span className="em-detail-label">Click Rate</span>
                      </div>
                    </div>
                    {(campaignDetail.stats?.['em_clicks.all.mobile'] || campaignDetail.stats?.['em_clicks.all.computer']) && (
                      <div className="em-device-bar">
                        <div className="em-device-segment em-device-desktop" style={{ width: `${campaignDetail.percents?.desktop_click || 0}%` }} title={`Desktop: ${campaignDetail.percents?.desktop_click?.toFixed(1)}%`}></div>
                        <div className="em-device-segment em-device-mobile" style={{ width: `${campaignDetail.percents?.mobile_click || 0}%` }} title={`Mobile: ${campaignDetail.percents?.mobile_click?.toFixed(1)}%`}></div>
                      </div>
                    )}
                    <div className="em-device-legend">
                      <span><span className="em-legend-dot em-device-desktop"></span> Desktop {campaignDetail.percents?.desktop_click?.toFixed(1) || 0}%</span>
                      <span><span className="em-legend-dot em-device-mobile"></span> Mobile {campaignDetail.percents?.mobile_click?.toFixed(1) || 0}%</span>
                    </div>
                  </div>

                  <div className="em-detail-section">
                    <h4><i className="fas fa-exclamation-triangle"></i> Delivery</h4>
                    <div className="em-detail-stats">
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.em_bounces || 0)}</span>
                        <span className="em-detail-label">Bounces</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.em_optouts || 0)}</span>
                        <span className="em-detail-label">Unsubscribes</span>
                      </div>
                      <div className="em-detail-stat">
                        <span className="em-detail-num">{formatNumber(campaignDetail.stats?.em_forwards || 0)}</span>
                        <span className="em-detail-label">Forwards</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem', color: '#94A3B8', textAlign: 'center' }}>
                  Unable to load campaign details.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact Lists */}
      {view === 'lists' && (
        <div className="admin-card">
          {lists.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <i className="fas fa-address-book" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
              No contact lists found.
            </div>
          ) : (
            <div className="em-lists-grid">
              {lists.map(list => (
                <div key={list.list_id} className="em-list-card">
                  <div className="em-list-icon">
                    <i className="fas fa-address-book"></i>
                  </div>
                  <div className="em-list-info">
                    <h4>{list.name}</h4>
                    <div className="em-list-meta">
                      <span><i className="fas fa-users"></i> {formatNumber(list.membership_count)} contacts</span>
                      <span><i className="fas fa-clock"></i> Updated {formatDate(list.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
