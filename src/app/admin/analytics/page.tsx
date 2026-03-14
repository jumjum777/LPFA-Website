'use client';

import { useEffect, useState, Fragment } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateAnalyticsPdf } from '@/lib/generateAnalyticsPdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SummaryMetric { current: number; previous: number | null; }
interface DailyRow { date: string; sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionDuration: number; newUsers: number; }
interface TopPage { path: string; title: string; pageviews: number; sessions: number; }
interface TrafficSource { channel: string; sessions: number; users: number; }
interface GAData {
  configured: boolean; error?: string;
  period?: { start: string; end: string; days: number };
  summary?: Record<string, SummaryMetric>;
  daily?: DailyRow[]; topPages?: TopPage[]; trafficSources?: TrafficSource[];
}

interface FacebookData {
  name?: string; username?: string; category?: string; overallStarRating?: number;
  fanCount?: number; followersCount?: number;
  pagePostsImpressions?: number; pagePostEngagements?: number;
  pageVideoViews?: number; pageMediaView?: number;
  reactions?: { like: number; love: number; wow: number; haha: number; sorry: number; anger: number; total: number };
  // Impressions breakdown
  pagePostsImpressionsOrganicUnique?: number;
  pagePostsImpressionsPaid?: number;
  pagePostsImpressionsViral?: number;
  pagePostsImpressionsNonviral?: number;
  // Video breakdown
  pageVideoViewsAutoplayed?: number;
  pageVideoViewsClickToPlay?: number;
  pageVideoViewsOrganic?: number;
  pageVideoViewsPaid?: number;
  pageVideoViewsByPaidNonPaid?: { paid?: number; nonPaid?: number; total?: number };
  pageVideoViewsByUploadedHosted?: { uploaded?: number; hosted?: number };
  pageVideoCompleteViews30S?: { total?: number; paid?: number; organic?: number; autoplayed?: number; clickToPlay?: number; repeat?: number; unique?: number };
  // Media views
  pageMediaViewIsFromAds?: number;
  pageMediaViewIsFromFollowers?: number;
  // Page details
  location?: { city?: string; state?: string; country?: string; street?: string; zip?: string; lat?: number; lng?: number };
  about?: string;
  emails?: string[];
  phone?: string;
  website?: string;
  [key: string]: unknown;
}

interface YouTubeData {
  title?: string; handle?: string; url?: string; thumbnailUrl?: string;
  subscriberCount?: number; viewCount?: number; videoCount?: number;
  estimatedMinutesWatched?: number; averageViewDuration?: number;
  averageViewPercentage?: number;
  likes?: number; comments?: number; shares?: number;
  subscribersGained?: number; subscribersLost?: number;
  playlists?: { id: string; title: string; url: string; views?: number; estimatedMinutesWatched?: number; viewsPerPlaylistStart?: number; playlistStarts?: number; averageTimeInPlaylist?: number }[];
  [key: string]: unknown;
}

interface SocialData {
  connected: boolean; error?: string; profile: string;
  facebook: FacebookData | null; youtube: YouTubeData | null;
  facebookDaily: Record<string, unknown> | null;
  youtubeDaily: Record<string, unknown> | null;
  lastUpdated?: string;
}

interface EmailData {
  connected: boolean; error?: string;
  campaigns: { campaign_id: string; name: string; status: string; last_sent_date: string; stats: { sends: number; opens: number; clicks: number; bounces: number } }[];
  aggregates: { open: number; click: number; bounce: number } | null;
  lists: { list_id: string; name: string; membership_count: number }[];
  listsCount: number;
  tokenLastRefreshed?: string | null;
}

// Wix analytics types (ROTR)
interface WixMetric { type: string; total: number; values: { date: string; value: number }[] }
interface WixData {
  metrics: WixMetric[];
  previousMetrics: WixMetric[] | null;
  period: { start: string; end: string; days: number };
}

type Profile = 'lpfa' | 'rotr';
type Period = 'this-month' | 'last-month' | '7d' | '14d' | '30d' | '60d' | 'ytd' | 'custom';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n)); }
function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return formatNumber(n);
}
function formatDuration(seconds: number) { const m = Math.floor(seconds / 60); const s = Math.round(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; }
function formatWatchTime(minutes: number) {
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)}h`;
  return `${Math.round(minutes)}m`;
}
function formatPercent(rate: number) { return `${(rate * 100).toFixed(1)}%`; }

// ─── Sections ────────────────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, iconColor, badge, children, defaultOpen = true }: {
  title: string; icon: string; iconColor: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="admin-card ua-section" style={{ marginTop: '1.5rem' }}>
      <div className="ua-section-header" onClick={() => setOpen(!open)}>
        <div className="ua-section-title">
          <i className={icon} style={{ color: iconColor, marginRight: '0.5rem' }}></i>
          <span>{title}</span>
          {badge && <span className="ua-section-badge">{badge}</span>}
        </div>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
      </div>
      {open && <div className="ua-section-body">{children}</div>}
    </div>
  );
}

function StatCard({ label, value, icon, color, subtitle }: {
  label: string; value: string; icon: string; color: string; subtitle?: string;
}) {
  return (
    <div className="rotr-stat-card">
      <div className="rotr-stat-icon" style={{ background: `${color}15`, color }}>
        <i className={icon}></i>
      </div>
      <div className="rotr-stat-value">{value}</div>
      <div className="rotr-stat-label">{label}</div>
      {subtitle && <div className="ua-stat-subtitle">{subtitle}</div>}
    </div>
  );
}

function SubSection({ title, icon, children, defaultOpen = false }: {
  title: string; icon?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ua-subsection">
      <div className="ua-subsection-header" onClick={() => setOpen(!open)}>
        <span>
          {icon && <i className={icon} style={{ marginRight: '0.4rem', fontSize: '0.8rem' }}></i>}
          {title}
        </span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color: '#94a3b8', fontSize: '0.75rem' }}></i>
      </div>
      {open && <div className="ua-subsection-body">{children}</div>}
    </div>
  );
}

function BreakdownBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div>
      <div className="ua-breakdown-bar">
        {segments.map(seg => {
          const pct = (seg.value / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={seg.label}
              className="ua-breakdown-segment"
              style={{ width: `${pct}%`, background: seg.color }}
              title={`${seg.label}: ${formatCompact(seg.value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="ua-breakdown-legend">
        {segments.filter(s => s.value > 0).map(seg => (
          <span key={seg.label} className="ua-breakdown-legend-item">
            <span className="ua-breakdown-dot" style={{ background: seg.color }}></span>
            {seg.label}: {formatCompact(seg.value)} ({((seg.value / total) * 100).toFixed(1)}%)
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UnifiedAnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProfile = (searchParams.get('profile') as Profile) || 'lpfa';

  const [profile, setProfile] = useState<Profile>(initialProfile);

  // Update URL when profile changes so sidebar stays in sync
  const handleProfileChange = (p: Profile) => {
    setProfile(p);
    router.replace(`/admin/analytics${p === 'rotr' ? '?profile=rotr' : ''}`, { scroll: false });
  };
  const [period, setPeriod] = useState<Period>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [webData, setWebData] = useState<GAData | WixData | null>(null);
  const [webLoading, setWebLoading] = useState(true);
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [eventsData, setEventsData] = useState<Record<string, unknown> | null>(null);
  const [socialEmailLoading, setSocialEmailLoading] = useState(true);

  // AI Executive Summary
  const [summaryData, setSummaryData] = useState<{
    summary: string; highlights: string[]; trend: string; generatedAt: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loading = webLoading || socialEmailLoading;

  // Convert period to days for web analytics API
  const now = new Date();
  const periodDays = (() => {
    if (period === '7d') return 7;
    if (period === '14d') return 14;
    if (period === '30d') return 30;
    if (period === '60d') return 60;
    if (period === 'this-month') return now.getDate(); // days into current month
    if (period === 'last-month') return new Date(now.getFullYear(), now.getMonth(), 0).getDate(); // days in prev month
    if (period === 'ytd') {
      const jan1 = new Date(now.getFullYear(), 0, 1);
      return Math.ceil((now.getTime() - jan1.getTime()) / 86400000);
    }
    return 30;
  })();
  // GA4 max 90 days, Wix max 62 days
  const maxWebDays = profile === 'rotr' ? 62 : 90;
  const webDays = Math.min(periodDays, maxWebDays);
  const isCustomReady = period === 'custom' && customStart && customEnd;

  // Social + email + events: only re-fetch when profile changes (lifetime/aggregate data)
  useEffect(() => {
    setSocialEmailLoading(true);
    const fetches: Promise<unknown>[] = [
      fetch(`/api/admin/social?profile=${profile}`).then(r => r.json()).catch(() => null),
      fetch('/api/admin/email-marketing').then(r => r.json()).catch(() => null),
      profile === 'rotr'
        ? fetch('/api/admin/rotr').then(r => r.json()).catch(() => null)
        : Promise.resolve(null),
    ];
    Promise.all(fetches).then(([social, email, events]) => {
      setSocialData(social as SocialData | null);
      setEmailData(email as EmailData | null);
      setEventsData(events as Record<string, unknown> | null);
    }).finally(() => setSocialEmailLoading(false));
  }, [profile]);

  // Web analytics: re-fetch when profile, period, or custom dates change
  useEffect(() => {
    // For custom period, wait until both dates are set
    if (period === 'custom' && (!customStart || !customEnd)) return;

    setWebLoading(true);
    const base = profile === 'lpfa' ? '/api/admin/analytics' : '/api/admin/rotr/analytics';
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    let webUrl: string;

    if (period === 'custom' && customStart && customEnd) {
      webUrl = `${base}?start=${customStart}&end=${customEnd}`;
    } else if (period === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      webUrl = `${base}?start=${fmt(start)}&end=${fmt(now)}`;
    } else if (period === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      webUrl = `${base}?start=${fmt(start)}&end=${fmt(end)}`;
    } else if (period === 'ytd') {
      const start = new Date(now.getFullYear(), 0, 1);
      webUrl = `${base}?start=${fmt(start)}&end=${fmt(now)}`;
    } else {
      webUrl = `${base}?days=${webDays}`;
    }
    fetch(webUrl).then(r => r.json()).catch(() => null)
      .then(web => setWebData(web))
      .finally(() => setWebLoading(false));
  }, [profile, webDays, period, customStart, customEnd]);

  // Generate AI executive summary
  const periodLabel = (() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (period === 'this-month') return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    if (period === 'last-month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${monthNames[prev.getMonth()]} ${prev.getFullYear()}`;
    }
    if (period === '7d') return 'the past 7 days';
    if (period === '14d') return 'the past 14 days';
    if (period === '30d') return 'the past 30 days';
    if (period === '60d') return 'the past 60 days';
    if (period === 'ytd') return `${now.getFullYear()} Year-to-Date`;
    if (isCustomReady) return `${customStart} to ${customEnd}`;
    return 'the selected period';
  })();

  async function generateSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch('/api/admin/analytics-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          period: periodLabel,
          activeDays,
          web: webData,
          social: socialData?.connected ? {
            facebook: socialData.facebook,
            youtube: socialData.youtube,
            facebookDaily: socialData.facebookDaily,
            youtubeDaily: socialData.youtubeDaily,
          } : null,
          email: emailData?.connected ? { ...emailData, campaigns: filteredCampaigns } : null,
          events: eventsData,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaryData(data);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  }

  // Clear summary when profile or period changes
  useEffect(() => {
    setSummaryData(null);
    setSummaryError(null);
  }, [profile, period]);

  // Export branded PDF
  async function exportPdf() {
    setPdfLoading(true);
    try {
      const ga = profile === 'lpfa' ? (webData as GAData | null) : null;
      const wix = profile === 'rotr' ? (webData as WixData | null) : null;

      await generateAnalyticsPdf({
        profile,
        periodLabel,
        summary: summaryData,
        crossPlatform: { totalReach, totalAudience: totalFollowers, totalEngagements, totalVideoViews },
        web: webData ? {
          sessions: ga?.summary?.sessions?.current ?? wix?.metrics?.find(m => m.type === 'TOTAL_SESSIONS')?.total ?? 0,
          users: ga?.summary?.users?.current ?? wix?.metrics?.find(m => m.type === 'TOTAL_UNIQUE_VISITORS')?.total ?? 0,
          pageviews: ga?.summary?.pageviews?.current ?? 0,
          bounceRate: ga?.summary?.bounceRate?.current,
          topPages: ga?.topPages,
        } : null,
        facebook: fb ? {
          followers: fb.followersCount ?? 0,
          impressions: fbImpressions,
          engagements: fbEngagements,
          videoViews: fbVideoViews,
          reactions: fb.reactions as Record<string, number> | undefined,
        } : null,
        youtube: yt ? {
          subscribers: yt.subscriberCount ?? 0,
          views: ytViews,
          watchMinutes: yt.estimatedMinutesWatched ?? 0,
          videos: yt.videoCount ?? 0,
          likes: ytLikes,
          comments: ytComments,
        } : null,
        email: emailData?.connected ? {
          sends: emailTotalSends,
          opens: emailTotalOpens,
          clicks: emailTotalClicks,
          contacts: emailContactCount,
          campaigns: filteredCampaigns.length,
        } : null,
        events: eventsData ? {
          totalEvents: (eventsData as any)?.summary?.totalEvents ?? 0,
          totalTickets: (eventsData as any)?.summary?.totalTickets ?? 0,
          totalRevenue: (eventsData as any)?.summary?.totalRevenue ?? 0,
        } : null,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setPdfLoading(false);
    }
  }

  // Filter email campaigns by selected period
  function filterCampaignsByPeriod(campaigns: EmailData['campaigns']) {
    if (period === 'custom' && customStart) {
      const start = new Date(customStart + 'T00:00:00');
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
      return campaigns.filter(c => {
        if (!c.last_sent_date) return false;
        const d = new Date(c.last_sent_date);
        return d >= start && d <= end;
      });
    }
    if (period === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return campaigns.filter(c => c.last_sent_date && new Date(c.last_sent_date) >= start);
    }
    if (period === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return campaigns.filter(c => {
        if (!c.last_sent_date) return false;
        const d = new Date(c.last_sent_date);
        return d >= start && d <= end;
      });
    }
    if (period === 'ytd') {
      const start = new Date(now.getFullYear(), 0, 1);
      return campaigns.filter(c => c.last_sent_date && new Date(c.last_sent_date) >= start);
    }
    const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '60d': 60 };
    const days = daysMap[period] || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return campaigns.filter(c => {
      if (!c.last_sent_date) return false;
      return new Date(c.last_sent_date) >= cutoff;
    });
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Analytics</h1>
        </div>
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)' }}></i>
          <p style={{ marginTop: '1rem', color: '#64748B', fontWeight: 500 }}>Loading analytics...</p>
          <p style={{ marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.82rem', maxWidth: '380px', margin: '0.4rem auto 0' }}>
            This may take a few moments. We&apos;re pulling in-depth analytics from your website, social media, and email platforms all at once.
          </p>
        </div>
      </div>
    );
  }

  // Parse data based on profile
  const fb = socialData?.facebook || null;
  const yt = profile === 'lpfa' ? (socialData?.youtube || null) : null;
  const fbDaily = socialData?.facebookDaily as Record<string, unknown> | null;
  const ytDaily = socialData?.youtubeDaily as Record<string, unknown> | null;

  // Compute period-specific social metrics from daily data
  // Ayrshare daily format: { period, total, values: [{ value, endTime }, ...] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function sumDailyMetric(dailyData: Record<string, unknown> | null, key: string, days: number): number | null {
    if (!dailyData) return null;
    const metric = (dailyData as any)?.[key];
    if (!metric) return null;

    // Handle Ayrshare daily format: { values: [{value, endTime}, ...], total }
    const arr = Array.isArray(metric) ? metric : (Array.isArray(metric?.values) ? metric.values : null);
    if (!arr || arr.length === 0) return null;

    // Daily arrays are ordered by date — take the last N entries
    const slice = arr.slice(-days);
    return slice.reduce((sum: number, entry: any) => {
      const val = typeof entry === 'number' ? entry : (entry?.value ?? entry?.count ?? 0);
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
  }

  // For cumulative metrics (e.g. followers): compute gain as last - first in the slice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function diffDailyMetric(dailyData: Record<string, unknown> | null, key: string, days: number): number | null {
    if (!dailyData) return null;
    const metric = (dailyData as any)?.[key];
    if (!metric) return null;
    const arr = Array.isArray(metric) ? metric : (Array.isArray(metric?.values) ? metric.values : null);
    if (!arr || arr.length < 2) return null;
    const slice = arr.slice(-days);
    const first = typeof slice[0] === 'number' ? slice[0] : (slice[0]?.value ?? 0);
    const last = typeof slice[slice.length - 1] === 'number' ? slice[slice.length - 1] : (slice[slice.length - 1]?.value ?? 0);
    return last - first;
  }

  const activeDays = periodDays;

  // Try period-specific first, fall back to lifetime
  const fbImpressions = sumDailyMetric(fbDaily, 'pagePostsImpressions', activeDays) ?? (fb?.pagePostsImpressions ?? 0);
  const fbEngagements = sumDailyMetric(fbDaily, 'pagePostEngagements', activeDays) ?? (fb?.pagePostEngagements ?? 0);
  const fbVideoViews = sumDailyMetric(fbDaily, 'pageVideoViews', activeDays) ?? (fb?.pageVideoViews ?? 0);
  const hasFbDaily = sumDailyMetric(fbDaily, 'pagePostsImpressions', activeDays) !== null;

  // FB detail metrics (for section cards)
  const fbNewFollowers = diffDailyMetric(fbDaily, 'pageFollows', activeDays);
  const fbMediaViews = sumDailyMetric(fbDaily, 'pageMediaView', activeDays) ?? (fb?.pageMediaView ?? 0);
  const fbMediaFromFollowers = sumDailyMetric(fbDaily, 'pageMediaViewIsFromFollowers', activeDays) ?? (fb?.pageMediaViewIsFromFollowers ?? 0);
  const fbMediaFromAds = sumDailyMetric(fbDaily, 'pageMediaViewIsFromAds', activeDays) ?? (fb?.pageMediaViewIsFromAds ?? 0);
  const fbImpOrganic = sumDailyMetric(fbDaily, 'pagePostsImpressionsOrganicUnique', activeDays) ?? (fb?.pagePostsImpressionsOrganicUnique ?? 0);
  const fbImpPaid = sumDailyMetric(fbDaily, 'pagePostsImpressionsPaid', activeDays) ?? (fb?.pagePostsImpressionsPaid ?? 0);
  const fbImpViral = sumDailyMetric(fbDaily, 'pagePostsImpressionsViral', activeDays) ?? (fb?.pagePostsImpressionsViral ?? 0);
  const fbImpNonviral = sumDailyMetric(fbDaily, 'pagePostsImpressionsNonviral', activeDays) ?? (fb?.pagePostsImpressionsNonviral ?? 0);
  const fbVidAutoplayed = sumDailyMetric(fbDaily, 'pageVideoViewsAutoplayed', activeDays) ?? (fb?.pageVideoViewsAutoplayed ?? 0);
  const fbVidClickToPlay = sumDailyMetric(fbDaily, 'pageVideoViewsClickToPlay', activeDays) ?? (fb?.pageVideoViewsClickToPlay ?? 0);
  const fbVidOrganic = sumDailyMetric(fbDaily, 'pageVideoViewsOrganic', activeDays) ?? (fb?.pageVideoViewsOrganic ?? 0);
  const fbVidPaid = sumDailyMetric(fbDaily, 'pageVideoViewsPaid', activeDays) ?? (fb?.pageVideoViewsPaid ?? 0);

  const ytViews = sumDailyMetric(ytDaily, 'views', activeDays) ?? (yt?.viewCount ?? 0);
  const ytLikes = sumDailyMetric(ytDaily, 'likes', activeDays) ?? (yt?.likes ?? 0);
  const ytComments = sumDailyMetric(ytDaily, 'comments', activeDays) ?? (yt?.comments ?? 0);
  const ytShares = sumDailyMetric(ytDaily, 'shares', activeDays) ?? (yt?.shares ?? 0);
  const ytWatchMinutes = sumDailyMetric(ytDaily, 'estimatedMinutesWatched', activeDays) ?? (yt?.estimatedMinutesWatched ?? 0);
  const ytSubsGained = sumDailyMetric(ytDaily, 'subscribersGained', activeDays) ?? (yt?.subscribersGained ?? 0);
  const ytSubsLost = sumDailyMetric(ytDaily, 'subscribersLost', activeDays) ?? (yt?.subscribersLost ?? 0);
  const hasYtDaily = sumDailyMetric(ytDaily, 'views', activeDays) !== null;

  // Web analytics summary
  let webSessions = 0, webUsers = 0, webPageviews = 0;
  if (profile === 'lpfa') {
    const ga = webData as GAData | null;
    if (ga?.summary) {
      webSessions = ga.summary.sessions?.current ?? 0;
      webUsers = ga.summary.users?.current ?? 0;
      webPageviews = ga.summary.pageviews?.current ?? 0;
    }
  } else {
    const wix = webData as WixData | null;
    if (wix?.metrics) {
      webSessions = wix.metrics.find(m => m.type === 'TOTAL_SESSIONS')?.total ?? 0;
      webUsers = wix.metrics.find(m => m.type === 'TOTAL_UNIQUE_VISITORS')?.total ?? 0;
    }
  }

  // Email totals (filtered by period)
  const filteredCampaigns = emailData?.campaigns ? filterCampaignsByPeriod(emailData.campaigns) : [];
  const emailTotalSends = filteredCampaigns.reduce((s, c) => s + (c.stats?.sends || 0), 0);
  const emailTotalOpens = filteredCampaigns.reduce((s, c) => s + (c.stats?.opens || 0), 0);
  const emailTotalClicks = filteredCampaigns.reduce((s, c) => s + (c.stats?.clicks || 0), 0);
  const emailContactCount = emailData?.lists?.reduce((s, l) => s + (l.membership_count || 0), 0) ?? 0;

  // Cross-platform totals (period-specific when daily data available)
  const totalReach = fbImpressions + (yt ? ytViews : 0) + webPageviews;
  const totalFollowers = (fb?.followersCount ?? 0) + (yt?.subscriberCount ?? 0) + emailContactCount;
  const totalEngagements = fbEngagements + (yt ? (ytLikes + ytComments) : 0) + emailTotalOpens;
  const totalVideoViews = fbVideoViews + (yt ? ytViews : 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><i className="fas fa-chart-line" style={{ marginRight: '0.5rem', color: '#1B8BEB' }}></i> Analytics</h1>
        <p>Unified view across web, social, and email</p>
      </div>

      {/* Profile Toggle + Period Selector */}
      <div className="ua-toolbar">
        <div className="em-view-toggle">
          <button className={`em-view-btn ${profile === 'lpfa' ? 'active' : ''}`} onClick={() => handleProfileChange('lpfa')}>
            <i className="fas fa-anchor"></i> LPFA
          </button>
          <button className={`em-view-btn ${profile === 'rotr' ? 'active' : ''}`} onClick={() => handleProfileChange('rotr')}>
            <i className="fas fa-music"></i> ROTR
          </button>
        </div>
        <div className="rotr-finance-periods">
          {(['this-month', 'last-month', '30d', 'ytd'] as const).map(p => (
            <button
              key={p}
              className={`rotr-analytics-period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'this-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : p === 'ytd' ? 'YTD' : p}
            </button>
          ))}
          <select
            value={['this-month', 'last-month', '30d', 'ytd'].includes(period) ? '' : period}
            onChange={e => setPeriod(e.target.value as Period)}
            className="rotr-filter-select"
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="" disabled>More...</option>
            <option value="7d">Past 7 Days</option>
            <option value="14d">Past 14 Days</option>
            <option value="60d">Past 60 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Platform indicators */}
      <div className="ua-platforms">
        <span className="ua-platform-chip"><i className="fas fa-globe"></i> Website</span>
        <span className="ua-platform-chip"><i className="fab fa-facebook" style={{ color: '#1877F2' }}></i> Facebook</span>
        {profile === 'lpfa' && <span className="ua-platform-chip"><i className="fab fa-youtube" style={{ color: '#FF0000' }}></i> YouTube</span>}
        <span className="ua-platform-chip"><i className="fas fa-envelope" style={{ color: '#F4811F' }}></i> Email</span>
        <span className="ua-platform-chip"><i className="fas fa-cloud-sun" style={{ color: '#0EA5E9' }}></i> Weather</span>
        {profile === 'rotr' && <span className="ua-platform-chip"><i className="fas fa-ticket-alt" style={{ color: '#7C3AED' }}></i> Tickets</span>}
      </div>

      {/* ─── AI Executive Summary ──────────────────────────────────────────── */}
      <div className="ua-ai-summary-card">
        <div className="ua-ai-summary-header">
          <div className="ua-ai-summary-title">
            <i className="fas fa-robot"></i>
            <span>Executive Summary</span>
          </div>
          <div className="ua-ai-header-actions">
            {summaryData && !summaryLoading && (
              <button className="admin-btn admin-btn-secondary ua-ai-btn" onClick={exportPdf} disabled={pdfLoading}>
                <i className={`fas fa-${pdfLoading ? 'spinner fa-spin' : 'file-pdf'}`}></i>
                {pdfLoading ? 'Generating...' : 'Export PDF'}
              </button>
            )}
            {!summaryLoading && (
              <button className="admin-btn admin-btn-secondary ua-ai-btn" onClick={generateSummary} disabled={loading}>
                <i className={`fas fa-${summaryData ? 'sync-alt' : 'magic'}`}></i>
                {summaryData ? 'Refresh' : 'Generate Summary'}
              </button>
            )}
          </div>
        </div>

        {summaryLoading && (
          <div className="ua-ai-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Analyzing analytics, weather, and platform data...</span>
          </div>
        )}

        {summaryError && (
          <div className="ua-ai-error">
            <i className="fas fa-exclamation-triangle"></i> {summaryError}
          </div>
        )}

        {summaryData && !summaryLoading && (
          <div className="ua-ai-content">
            {summaryData.trend && (
              <span className={`ua-ai-trend-badge ua-ai-trend-${summaryData.trend}`}>
                <i className={`fas fa-arrow-${summaryData.trend === 'positive' ? 'up' : summaryData.trend === 'declining' ? 'down' : 'right'}`}></i>
                {summaryData.trend.charAt(0).toUpperCase() + summaryData.trend.slice(1)} Trend
              </span>
            )}
            <div className="ua-ai-summary-text">
              {summaryData.summary.split(/\n\n|\n/).filter(p => p.trim()).map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            </div>
            {summaryData.highlights.length > 0 && (
              <div className="ua-ai-highlights">
                <div className="ua-ai-highlights-title">
                  <i className="fas fa-star"></i> Key Highlights
                </div>
                <ul>
                  {summaryData.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="ua-ai-footer">
              <i className="fas fa-info-circle"></i>
              AI-generated summary for {periodLabel} &middot; {new Date(summaryData.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        )}

        {!summaryData && !summaryLoading && !summaryError && (
          <p className="ua-ai-placeholder">
            Generate an AI-powered executive summary combining analytics, social media, email marketing, live weather conditions{profile === 'rotr' ? ', and ticket sales' : ''} — ideal for sponsor reports, board presentations, and stakeholder updates.
          </p>
        )}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="ua-custom-dates">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
          <span>to</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
        </div>
      )}

      {/* ─── Cross-Platform Summary ─────────────────────────────────────────── */}
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '1rem' }}>
        <StatCard
          label="Total Reach"
          value={formatCompact(totalReach)}
          icon="fas fa-bullhorn"
          color="#1B8BEB"
          subtitle={`Web: ${formatCompact(webPageviews)} · FB: ${formatCompact(fbImpressions)}${yt ? ` · YT: ${formatCompact(ytViews)}` : ''}`}
        />
        <StatCard
          label="Total Audience"
          value={formatCompact(totalFollowers)}
          icon="fas fa-users"
          color="#10B981"
          subtitle={`FB: ${formatCompact(fb?.followersCount ?? 0)}${yt ? ` · YT: ${formatCompact(yt.subscriberCount ?? 0)}` : ''} · Email: ${formatCompact(emailContactCount)}`}
        />
        <StatCard
          label="Total Engagements"
          value={formatCompact(totalEngagements)}
          icon="fas fa-heart"
          color="#EF4444"
          subtitle={`FB: ${formatCompact(fbEngagements)}${yt ? ` · YT: ${formatCompact(ytLikes + ytComments)}` : ''} · Email: ${formatCompact(emailTotalOpens)}`}
        />
        <StatCard
          label="Total Video Views"
          value={formatCompact(totalVideoViews)}
          icon="fas fa-play-circle"
          color="#D97706"
          subtitle={`FB: ${formatCompact(fbVideoViews)}${yt ? ` · YT: ${formatCompact(ytViews)}` : ''}`}
        />
      </div>

      {/* ─── Website Analytics ──────────────────────────────────────────────── */}
      <CollapsibleSection
        title={profile === 'lpfa' ? 'Website — Google Analytics' : 'Website — Wix Analytics'}
        icon={profile === 'lpfa' ? 'fab fa-google' : 'fas fa-globe'}
        iconColor={profile === 'lpfa' ? '#4285F4' : '#1B8BEB'}
      >
        {profile === 'lpfa' ? (
          <LPFAWebSection data={webData as GAData | null} />
        ) : (
          <ROTRWebSection data={webData as WixData | null} />
        )}
      </CollapsibleSection>

      {/* ─── Facebook ───────────────────────────────────────────────────────── */}
      <CollapsibleSection
        title={`Facebook${fb?.name ? ` — ${fb.name}` : ''}`}
        icon="fab fa-facebook"
        iconColor="#1877F2"
        badge={fb?.followersCount ? `${formatCompact(fb.followersCount)} followers` : undefined}
      >
        {fb ? <FacebookSection data={fb} periodMetrics={hasFbDaily ? {
          impressions: fbImpressions, engagements: fbEngagements, videoViews: fbVideoViews,
          newFollowers: fbNewFollowers,
          impOrganic: fbImpOrganic, impPaid: fbImpPaid, impViral: fbImpViral, impNonviral: fbImpNonviral,
          vidAutoplayed: fbVidAutoplayed, vidClickToPlay: fbVidClickToPlay, vidOrganic: fbVidOrganic, vidPaid: fbVidPaid,
          mediaViews: fbMediaViews, mediaFromFollowers: fbMediaFromFollowers, mediaFromAds: fbMediaFromAds,
        } : undefined} /> : (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Facebook not connected for this profile.</p>
        )}
      </CollapsibleSection>

      {/* ─── YouTube (LPFA only) ────────────────────────────────────────────── */}
      {profile === 'lpfa' && (
        <CollapsibleSection
          title={`YouTube${yt?.title ? ` — ${yt.title}` : ''}`}
          icon="fab fa-youtube"
          iconColor="#FF0000"
          badge={yt?.subscriberCount ? `${formatCompact(yt.subscriberCount)} subscribers` : undefined}
        >
          {yt ? <YouTubeSection data={yt} periodMetrics={hasYtDaily ? {
            views: ytViews, likes: ytLikes, comments: ytComments, shares: ytShares,
            watchMinutes: ytWatchMinutes, subsGained: ytSubsGained, subsLost: ytSubsLost,
          } : undefined} /> : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>YouTube not connected for this profile.</p>
          )}
        </CollapsibleSection>
      )}

      {/* ─── Email Marketing ────────────────────────────────────────────────── */}
      <CollapsibleSection
        title="Email Marketing — Constant Contact"
        icon="fas fa-envelope"
        iconColor="#F4811F"
        badge={emailData?.connected ? `${emailData.listsCount} lists` : undefined}
      >
        {emailData?.connected ? <EmailSection data={{ ...emailData, campaigns: filteredCampaigns }} /> : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ color: '#94a3b8' }}>Constant Contact not connected.</p>
            <a href="/admin/email-marketing" className="admin-btn admin-btn-secondary" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
              <i className="fas fa-plug"></i> Connect
            </a>
          </div>
        )}
      </CollapsibleSection>

      {/* ─── Footer Note ────────────────────────────────────────────────────── */}
      <div className="rotr-analytics-note" style={{ marginTop: '1.5rem' }}>
        <i className="fas fa-info-circle"></i>
        <strong>Data sources:</strong>{' '}
        {profile === 'lpfa'
          ? 'Google Analytics 4 (web, up to 365 days)'
          : 'Wix Analytics (web, max 62-day lookback)'}
        {' '}&middot; Ayrshare (Facebook{profile === 'lpfa' ? ', YouTube' : ''}, ~85 days of daily data)
        {' '}&middot; Constant Contact (email, full history)
        {period === 'ytd' && profile === 'rotr' && (
          <span><br /><em>Note: Wix web data is capped to the most recent 62 days even for longer periods. Social and email data reflect the full period.</em></span>
        )}
        <br />Refresh rates: social ~24hrs, web ~48hrs, email real-time.
      </div>
    </div>
  );
}

// ─── LPFA Web Analytics Section ──────────────────────────────────────────────

function LPFAWebSection({ data }: { data: GAData | null }) {
  if (!data?.configured) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ color: '#94a3b8' }}>Google Analytics not configured.</p>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>Add <code>GA_PROPERTY_ID</code> to your environment variables.</p>
      </div>
    );
  }
  if (data.error) {
    return <p style={{ color: '#EF4444', textAlign: 'center', padding: '1rem' }}><i className="fas fa-exclamation-triangle"></i> {data.error}</p>;
  }

  const s = data.summary || {};
  const daily = data.daily || [];
  const topPages = data.topPages || [];
  const trafficSources = data.trafficSources || [];
  const maxSessions = Math.max(...daily.map(d => d.sessions), 1);
  const maxSourceSessions = Math.max(...trafficSources.map(t => t.sessions), 1);
  const totalSourceSessions = trafficSources.reduce((a, t) => a + t.sessions, 0);

  return (
    <>
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard label="Sessions" value={formatNumber(s.sessions?.current ?? 0)} icon="fas fa-eye" color="#1B8BEB" />
        <StatCard label="Users" value={formatNumber(s.users?.current ?? 0)} icon="fas fa-users" color="#10B981" />
        <StatCard label="Pageviews" value={formatNumber(s.pageviews?.current ?? 0)} icon="fas fa-file-alt" color="#D97706" />
        <StatCard label="Bounce Rate" value={formatPercent(s.bounceRate?.current ?? 0)} icon="fas fa-sign-out-alt" color="#EF4444" />
      </div>

      {/* Daily chart */}
      {daily.length > 0 && (
        <div className="rotr-analytics-chart" style={{ marginBottom: '1rem' }}>
          <div className="rotr-analytics-chart-bars">
            {daily.map((d, i) => {
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={d.date} className="rotr-analytics-bar-group" title={`${dayLabel}\nSessions: ${d.sessions}\nUsers: ${d.users}`}>
                  <div className="rotr-analytics-bar-container">
                    <div className="rotr-analytics-bar sessions" style={{ height: `${(d.sessions / maxSessions) * 100}%` }}></div>
                    <div className="rotr-analytics-bar visitors" style={{ height: `${(d.users / maxSessions) * 100}%` }}></div>
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
      )}

      {/* Top Pages & Traffic Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            <i className="fas fa-file-alt" style={{ color: '#D97706', marginRight: '0.4rem' }}></i> Top Pages
          </h4>
          {topPages.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No data available.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Page</th><th style={{ textAlign: 'right' }}>Views</th></tr></thead>
                <tbody>
                  {topPages.slice(0, 10).map(p => (
                    <tr key={p.path}>
                      <td><span className="ga-page-path">{p.path}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatNumber(p.pageviews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            <i className="fas fa-globe" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i> Traffic Sources
          </h4>
          {trafficSources.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No data available.</p>
          ) : (
            <div>
              {trafficSources.map(src => (
                <div key={src.channel} className="ga-source-row">
                  <span className="ga-source-name">{src.channel}</span>
                  <div className="ga-source-bar-container">
                    <div className="ga-source-bar" style={{ width: `${(src.sessions / maxSourceSessions) * 100}%` }}></div>
                  </div>
                  <span className="ga-source-value">{formatNumber(src.sessions)}</span>
                  <span className="ga-source-pct">{totalSourceSessions > 0 ? `${((src.sessions / totalSourceSessions) * 100).toFixed(0)}%` : '0%'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── ROTR Web Analytics Section ──────────────────────────────────────────────

function ROTRWebSection({ data }: { data: WixData | null }) {
  if (!data?.metrics) {
    return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No Wix analytics data available.</p>;
  }

  const getMetric = (type: string) => data.metrics.find(m => m.type === type);
  const sessions = getMetric('TOTAL_SESSIONS');
  const visitors = getMetric('TOTAL_UNIQUE_VISITORS');
  const sales = getMetric('TOTAL_SALES');
  const orders = getMetric('TOTAL_ORDERS');
  const contacts = getMetric('CLICKS_TO_CONTACT');
  const forms = getMetric('TOTAL_FORMS_SUBMITTED');

  const daily = sessions?.values || [];
  const visitorDaily = visitors?.values || [];
  const maxVal = Math.max(...daily.map(d => d.value), 1);

  return (
    <>
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard label="Sessions" value={formatNumber(sessions?.total ?? 0)} icon="fas fa-eye" color="#1B8BEB" />
        <StatCard label="Unique Visitors" value={formatNumber(visitors?.total ?? 0)} icon="fas fa-users" color="#10B981" />
        <StatCard label="Sales" value={`$${formatNumber(sales?.total ?? 0)}`} icon="fas fa-dollar-sign" color="#D97706" />
        <StatCard label="Orders" value={formatNumber(orders?.total ?? 0)} icon="fas fa-receipt" color="#7C3AED" />
      </div>

      {/* Daily chart */}
      {daily.length > 0 && (
        <div className="rotr-analytics-chart" style={{ marginBottom: '1rem' }}>
          <div className="rotr-analytics-chart-bars">
            {daily.map((d, i) => {
              const vVal = visitorDaily[i]?.value ?? 0;
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={d.date} className="rotr-analytics-bar-group" title={`${dayLabel}\nSessions: ${d.value}\nVisitors: ${vVal}`}>
                  <div className="rotr-analytics-bar-container">
                    <div className="rotr-analytics-bar sessions" style={{ height: `${(d.value / maxVal) * 100}%` }}></div>
                    <div className="rotr-analytics-bar visitors" style={{ height: `${(vVal / maxVal) * 100}%` }}></div>
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
            <span><span className="rotr-legend-dot visitors"></span> Visitors</span>
          </div>
        </div>
      )}

      {/* Extra engagement cards */}
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard label="Clicks to Contact" value={formatNumber(contacts?.total ?? 0)} icon="fas fa-phone" color="#0D9488" />
        <StatCard label="Forms Submitted" value={formatNumber(forms?.total ?? 0)} icon="fas fa-file-alt" color="#6366F1" />
        <StatCard label="Sessions / Visitor" value={visitors?.total ? (sessions!.total / visitors.total).toFixed(1) : '—'} icon="fas fa-chart-bar" color="#94a3b8" />
      </div>
    </>
  );
}

// ─── Facebook Section ────────────────────────────────────────────────────────

interface FbPeriodMetrics {
  impressions: number; engagements: number; videoViews: number;
  newFollowers: number | null;
  impOrganic: number; impPaid: number; impViral: number; impNonviral: number;
  vidAutoplayed: number; vidClickToPlay: number; vidOrganic: number; vidPaid: number;
  mediaViews: number; mediaFromFollowers: number; mediaFromAds: number;
}

function FacebookSection({ data, periodMetrics: pm }: { data: FacebookData; periodMetrics?: FbPeriodMetrics }) {
  const reactions = data.reactions;
  const reactionTotal = reactions?.total ?? 1;
  const reactionTypes = [
    { key: 'like', label: 'Like', color: '#1877F2', icon: '👍' },
    { key: 'love', label: 'Love', color: '#F44336', icon: '❤️' },
    { key: 'wow', label: 'Wow', color: '#FFB300', icon: '😮' },
    { key: 'haha', label: 'Haha', color: '#FFD54F', icon: '😂' },
    { key: 'sorry', label: 'Sad', color: '#FFA726', icon: '😢' },
    { key: 'anger', label: 'Angry', color: '#E53935', icon: '😡' },
  ];

  // Use period-specific values when available, fall back to lifetime
  const impressions = pm?.impressions ?? (data.pagePostsImpressions ?? 0);
  const engagements = pm?.engagements ?? (data.pagePostEngagements ?? 0);
  const videoViews = pm?.videoViews ?? (data.pageVideoViews ?? 0);
  const impOrganic = pm?.impOrganic ?? (data.pagePostsImpressionsOrganicUnique ?? 0);
  const impPaid = pm?.impPaid ?? (data.pagePostsImpressionsPaid ?? 0);
  const impViral = pm?.impViral ?? (data.pagePostsImpressionsViral ?? 0);
  const impNonviral = pm?.impNonviral ?? (data.pagePostsImpressionsNonviral ?? 0);
  const vidAutoplayed = pm?.vidAutoplayed ?? (data.pageVideoViewsAutoplayed ?? 0);
  const vidClickToPlay = pm?.vidClickToPlay ?? (data.pageVideoViewsClickToPlay ?? 0);
  const vidOrganic = pm?.vidOrganic ?? (data.pageVideoViewsOrganic ?? 0);
  const vidPaid = pm?.vidPaid ?? (data.pageVideoViewsPaid ?? 0);
  const mediaViews = pm?.mediaViews ?? (data.pageMediaView ?? 0);
  const mediaFromFollowers = pm?.mediaFromFollowers ?? (data.pageMediaViewIsFromFollowers ?? 0);
  const mediaFromAds = pm?.mediaFromAds ?? (data.pageMediaViewIsFromAds ?? 0);

  const hasImpressionBreakdown = impOrganic > 0 || impPaid > 0 || impViral > 0;
  const hasVideoBreakdown = vidAutoplayed > 0 || vidClickToPlay > 0;
  const hasLocation = data.location && (data.location.city || data.location.state || data.location.country);
  const hasPageDetails = data.about || data.website || data.phone || (data.emails && data.emails.length > 0) || hasLocation;

  return (
    <>
      {/* Top stat cards */}
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard
          label={pm?.newFollowers != null ? 'New Followers' : 'Followers'}
          value={pm?.newFollowers != null ? `+${formatCompact(pm.newFollowers)}` : formatCompact(data.followersCount ?? 0)}
          icon="fas fa-users"
          color="#1877F2"
          subtitle={pm?.newFollowers != null ? `${formatCompact(data.followersCount ?? 0)} total` : (data.fanCount ? `${formatCompact(data.fanCount)} fans` : undefined)}
        />
        <StatCard label="Post Impressions" value={formatCompact(impressions)} icon="fas fa-eye" color="#10B981" />
        <StatCard label="Post Engagements" value={formatCompact(engagements)} icon="fas fa-heart" color="#EF4444" />
        <StatCard label="Video Views" value={formatCompact(videoViews)} icon="fas fa-play" color="#D97706" />
      </div>

      {/* Impressions Breakdown */}
      {hasImpressionBreakdown && (
        <SubSection title="Impressions Breakdown" icon="fas fa-chart-pie">
          <BreakdownBar segments={[
            { label: 'Organic', value: impOrganic, color: '#10B981' },
            { label: 'Paid', value: impPaid, color: '#3B82F6' },
            { label: 'Viral', value: impViral, color: '#8B5CF6' },
            { label: 'Non-viral', value: impNonviral, color: '#94a3b8' },
          ]} />
        </SubSection>
      )}

      {/* Video Analytics */}
      {hasVideoBreakdown && (
        <SubSection title="Video Analytics" icon="fas fa-film">
          <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '0.75rem' }}>
            <StatCard label="Autoplayed" value={formatCompact(vidAutoplayed)} icon="fas fa-play-circle" color="#1B8BEB" />
            <StatCard label="Click to Play" value={formatCompact(vidClickToPlay)} icon="fas fa-mouse-pointer" color="#10B981" />
            <StatCard label="Organic Views" value={formatCompact(vidOrganic)} icon="fas fa-leaf" color="#059669" />
            <StatCard label="Paid Views" value={formatCompact(vidPaid)} icon="fas fa-dollar-sign" color="#3B82F6" />
          </div>
          <BreakdownBar segments={[
            { label: 'Organic', value: vidOrganic, color: '#10B981' },
            { label: 'Paid', value: vidPaid, color: '#3B82F6' },
          ]} />
          {data.pageVideoCompleteViews30S && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                Complete Views (30s+)
              </div>
              <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <StatCard label="Total" value={formatCompact(data.pageVideoCompleteViews30S.total ?? 0)} icon="fas fa-check-circle" color="#10B981" />
                <StatCard label="Unique" value={formatCompact(data.pageVideoCompleteViews30S.unique ?? 0)} icon="fas fa-user" color="#6366F1" />
                <StatCard label="Repeat" value={formatCompact(data.pageVideoCompleteViews30S.repeat ?? 0)} icon="fas fa-redo" color="#D97706" />
              </div>
            </div>
          )}
        </SubSection>
      )}

      {/* Media View Sources */}
      {(mediaFromAds > 0 || mediaFromFollowers > 0 || mediaViews > 0) && (
        <SubSection title="Media View Sources" icon="fas fa-image">
          <BreakdownBar segments={[
            { label: 'From Followers', value: mediaFromFollowers, color: '#10B981' },
            { label: 'From Ads', value: mediaFromAds, color: '#3B82F6' },
          ]} />
          <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '0.75rem' }}>
            <StatCard label="Total Media Views" value={formatCompact(mediaViews)} icon="fas fa-images" color="#D97706" />
            <StatCard label="From Followers" value={formatCompact(mediaFromFollowers)} icon="fas fa-users" color="#10B981" />
            <StatCard label="From Ads" value={formatCompact(mediaFromAds)} icon="fas fa-ad" color="#3B82F6" />
          </div>
        </SubSection>
      )}

      {/* Reactions bar */}
      {reactions && (
        <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Reactions ({formatNumber(reactions.total)})
          </h4>
          <div className="sm-reactions-bar">
            {reactionTypes.map(r => {
              const val = (reactions as Record<string, number>)[r.key] ?? 0;
              const pct = (val / reactionTotal) * 100;
              if (pct < 0.5) return null;
              return (
                <div
                  key={r.key}
                  className="sm-reaction-segment"
                  style={{ width: `${pct}%`, background: r.color }}
                  title={`${r.label}: ${formatNumber(val)} (${pct.toFixed(1)}%)`}
                ></div>
              );
            })}
          </div>
          <div className="sm-reaction-legend">
            {reactionTypes.map(r => {
              const val = (reactions as Record<string, number>)[r.key] ?? 0;
              if (val === 0) return null;
              return (
                <span key={r.key} className="sm-reaction-legend-item">
                  <span>{r.icon}</span> {formatCompact(val)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Page Details */}
      {hasPageDetails && (
        <SubSection title="Page Details" icon="fas fa-info-circle">
          <div className="ua-detail-grid">
            {hasLocation && (
              <div className="ua-detail-item ua-detail-wide">
                <div className="ua-detail-label"><i className="fas fa-map-marker-alt" style={{ color: '#EF4444' }}></i> Location</div>
                <div className="ua-detail-value">
                  {[data.location!.street, data.location!.city, data.location!.state, data.location!.zip, data.location!.country]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            )}
            {data.about && (
              <div className="ua-detail-item ua-detail-wide">
                <div className="ua-detail-label"><i className="fas fa-align-left" style={{ color: '#6366F1' }}></i> About</div>
                <div className="ua-detail-value" style={{ fontSize: '0.8rem' }}>{data.about}</div>
              </div>
            )}
            {data.website && (
              <div className="ua-detail-item">
                <div className="ua-detail-label"><i className="fas fa-globe" style={{ color: '#1B8BEB' }}></i> Website</div>
                <div className="ua-detail-value">
                  <a href={data.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-accent)', textDecoration: 'none' }}>
                    {data.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
            {data.phone && (
              <div className="ua-detail-item">
                <div className="ua-detail-label"><i className="fas fa-phone" style={{ color: '#10B981' }}></i> Phone</div>
                <div className="ua-detail-value">{data.phone}</div>
              </div>
            )}
            {data.emails && data.emails.length > 0 && (
              <div className="ua-detail-item">
                <div className="ua-detail-label"><i className="fas fa-envelope" style={{ color: '#D97706' }}></i> Email</div>
                <div className="ua-detail-value">{data.emails.join(', ')}</div>
              </div>
            )}
          </div>
        </SubSection>
      )}

      {/* Page info footer */}
      <div className="sm-page-info">
        {data.category && <span><i className="fas fa-tag"></i> {data.category}</span>}
        {data.overallStarRating !== undefined && data.overallStarRating > 0 && (
          <span><i className="fas fa-star" style={{ color: '#D97706' }}></i> {data.overallStarRating.toFixed(1)} rating</span>
        )}
        {data.username && <span><i className="fab fa-facebook"></i> @{data.username}</span>}
        {data.pageMediaView !== undefined && (
          <span><i className="fas fa-image"></i> {formatCompact(data.pageMediaView)} media views</span>
        )}
      </div>
    </>
  );
}

// ─── YouTube Section ─────────────────────────────────────────────────────────

interface YtPeriodMetrics {
  views: number; likes: number; comments: number; shares: number;
  watchMinutes: number; subsGained: number; subsLost: number;
}

function YouTubeSection({ data, periodMetrics: pm }: { data: YouTubeData; periodMetrics?: YtPeriodMetrics }) {
  // Use period-specific values when available, fall back to lifetime
  const views = pm?.views ?? (data.viewCount ?? 0);
  const likes = pm?.likes ?? (data.likes ?? 0);
  const comments = pm?.comments ?? (data.comments ?? 0);
  const shares = pm?.shares ?? (data.shares ?? 0);
  const watchMinutes = pm?.watchMinutes ?? (data.estimatedMinutesWatched ?? 0);
  const subsGained = pm?.subsGained ?? (data.subscribersGained ?? 0);
  const subsLost = pm?.subsLost ?? (data.subscribersLost ?? 0);

  const engagementTotal = likes + comments + shares;
  const engagementRate = views > 0 ? (engagementTotal / views * 100) : 0;

  return (
    <>
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard label="Subscribers" value={formatCompact(data.subscriberCount ?? 0)} icon="fas fa-users" color="#FF0000"
          subtitle={`+${formatNumber(subsGained)} / -${formatNumber(subsLost)}`} />
        <StatCard label="Views" value={formatCompact(views)} icon="fas fa-play" color="#1B8BEB" />
        <StatCard label="Watch Time" value={formatWatchTime(watchMinutes)} icon="fas fa-clock" color="#10B981" />
        <StatCard label="Videos" value={formatNumber(data.videoCount ?? 0)} icon="fas fa-video" color="#D97706" />
      </div>

      {/* View Performance */}
      <SubSection title="View Performance" icon="fas fa-tachometer-alt" defaultOpen={true}>
        <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {data.averageViewDuration !== undefined && (
            <StatCard label="Avg View Duration" value={formatDuration(data.averageViewDuration)} icon="fas fa-stopwatch" color="#6366F1" />
          )}
          {data.averageViewPercentage !== undefined && (
            <StatCard label="Avg View %" value={`${data.averageViewPercentage.toFixed(1)}%`} icon="fas fa-percentage" color="#0D9488" />
          )}
          <StatCard label="Engagement Rate" value={`${engagementRate.toFixed(2)}%`} icon="fas fa-chart-line" color="#D97706"
            subtitle={`${formatCompact(engagementTotal)} total interactions`} />
          <StatCard
            label="Views / Video"
            value={(data.videoCount ?? 0) > 0 ? formatCompact(Math.round(views / (data.videoCount ?? 1))) : '—'}
            icon="fas fa-calculator"
            color="#94a3b8"
          />
        </div>
      </SubSection>

      {/* Engagement */}
      <SubSection title="Engagement Breakdown" icon="fas fa-heart" defaultOpen={true}>
        <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '0.75rem' }}>
          <StatCard label="Likes" value={formatNumber(likes)} icon="fas fa-thumbs-up" color="#1877F2" />
          <StatCard label="Comments" value={formatNumber(comments)} icon="fas fa-comment" color="#7C3AED" />
          <StatCard label="Shares" value={formatNumber(shares)} icon="fas fa-share" color="#0D9488" />
          <StatCard label="Total" value={formatNumber(engagementTotal)} icon="fas fa-fire" color="#EF4444" />
        </div>
        <BreakdownBar segments={[
          { label: 'Likes', value: likes, color: '#1877F2' },
          { label: 'Comments', value: comments, color: '#7C3AED' },
          { label: 'Shares', value: shares, color: '#0D9488' },
        ]} />
      </SubSection>

      {data.handle && (
        <div className="sm-page-info" style={{ marginTop: '0.75rem' }}>
          <span><i className="fab fa-youtube" style={{ color: '#FF0000' }}></i> {data.handle}</span>
          {data.url && (
            <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-accent)', textDecoration: 'none', fontSize: '0.8rem' }}>
              Visit Channel <i className="fas fa-external-link-alt"></i>
            </a>
          )}
        </div>
      )}
    </>
  );
}

// ─── Email Marketing Section ─────────────────────────────────────────────────

function EmailSection({ data }: { data: EmailData }) {
  const totalSends = data.campaigns.reduce((s, c) => s + (c.stats?.sends || 0), 0);
  const totalOpens = data.campaigns.reduce((s, c) => s + (c.stats?.opens || 0), 0);
  const totalClicks = data.campaigns.reduce((s, c) => s + (c.stats?.clicks || 0), 0);
  const totalBounces = data.campaigns.reduce((s, c) => s + (c.stats?.bounces || 0), 0);
  const contactCount = data.lists.reduce((s, l) => s + (l.membership_count || 0), 0);
  const openRate = totalSends > 0 ? (totalOpens / totalSends) * 100 : 0;
  const clickRate = totalSends > 0 ? (totalClicks / totalSends) * 100 : 0;
  const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
  const bounceRate = totalSends > 0 ? (totalBounces / totalSends) * 100 : 0;

  return (
    <>
      <div className="rotr-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard label="Total Sends" value={formatNumber(totalSends)} icon="fas fa-paper-plane" color="#1B8BEB" />
        <StatCard label="Total Opens" value={formatNumber(totalOpens)} icon="fas fa-envelope-open" color="#10B981"
          subtitle={`${openRate.toFixed(1)}% open rate`} />
        <StatCard label="Total Clicks" value={formatNumber(totalClicks)} icon="fas fa-mouse-pointer" color="#D97706"
          subtitle={`${clickRate.toFixed(1)}% click rate`} />
        <StatCard label="Contacts" value={formatNumber(contactCount)} icon="fas fa-address-book" color="#7C3AED"
          subtitle={`${data.listsCount} lists`} />
      </div>

      {/* Delivery & Engagement Rates */}
      <SubSection title="Delivery & Engagement Rates" icon="fas fa-chart-bar" defaultOpen={true}>
        <div className="ua-rate-bars">
          <div className="ua-rate-row">
            <span className="ua-rate-label">Open Rate</span>
            <div className="ua-rate-bar-container">
              <div className="ua-rate-bar" style={{ width: `${Math.min(openRate, 100)}%`, background: '#10B981' }}></div>
            </div>
            <span className="ua-rate-value">{openRate.toFixed(1)}%</span>
          </div>
          <div className="ua-rate-row">
            <span className="ua-rate-label">Click Rate</span>
            <div className="ua-rate-bar-container">
              <div className="ua-rate-bar" style={{ width: `${Math.min(clickRate, 100)}%`, background: '#D97706' }}></div>
            </div>
            <span className="ua-rate-value">{clickRate.toFixed(1)}%</span>
          </div>
          <div className="ua-rate-row">
            <span className="ua-rate-label">Click-to-Open</span>
            <div className="ua-rate-bar-container">
              <div className="ua-rate-bar" style={{ width: `${Math.min(clickToOpenRate, 100)}%`, background: '#6366F1' }}></div>
            </div>
            <span className="ua-rate-value">{clickToOpenRate.toFixed(1)}%</span>
          </div>
          <div className="ua-rate-row">
            <span className="ua-rate-label">Bounce Rate</span>
            <div className="ua-rate-bar-container">
              <div className="ua-rate-bar" style={{ width: `${Math.min(bounceRate, 100)}%`, background: '#EF4444' }}></div>
            </div>
            <span className="ua-rate-value">{bounceRate.toFixed(1)}%</span>
          </div>
        </div>
      </SubSection>

      {/* Contact Lists */}
      {data.lists.length > 0 && (
        <SubSection title={`Contact Lists (${data.lists.length})`} icon="fas fa-address-book">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>List Name</th>
                  <th style={{ textAlign: 'right' }}>Members</th>
                </tr>
              </thead>
              <tbody>
                {data.lists.map(l => (
                  <tr key={l.list_id}>
                    <td>{l.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatNumber(l.membership_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>
      )}

      {/* Recent campaigns */}
      {data.campaigns.length > 0 && (
        <SubSection title={`Recent Campaigns (${data.campaigns.length})`} icon="fas fa-bullhorn" defaultOpen={true}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th style={{ textAlign: 'right' }}>Sends</th>
                  <th style={{ textAlign: 'right' }}>Opens</th>
                  <th style={{ textAlign: 'right' }}>Clicks</th>
                  <th style={{ textAlign: 'right' }}>Open %</th>
                  <th style={{ textAlign: 'right' }}>Click %</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.slice(0, 10).map(c => {
                  const cOpenRate = c.stats?.sends > 0 ? ((c.stats.opens / c.stats.sends) * 100).toFixed(1) : '0.0';
                  const cClickRate = c.stats?.sends > 0 ? ((c.stats.clicks / c.stats.sends) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={c.campaign_id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {c.last_sent_date ? new Date(c.last_sent_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : c.status}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(c.stats?.sends || 0)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(c.stats?.opens || 0)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(c.stats?.clicks || 0)}</td>
                      <td style={{ textAlign: 'right', color: '#10B981' }}>{cOpenRate}%</td>
                      <td style={{ textAlign: 'right', color: '#D97706' }}>{cClickRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <a href="/admin/email-marketing" style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--blue-accent)', fontSize: '0.85rem', textDecoration: 'none' }}>
            View all campaigns <i className="fas fa-arrow-right"></i>
          </a>
        </SubSection>
      )}
    </>
  );
}
