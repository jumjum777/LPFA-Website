import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isGA4Configured, getGA4DailyReport, getGA4Summary } from '@/lib/ga4';
import { ayrshareFetch, getProfileKey } from '@/lib/ayrshare';

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = createAdminClient();

  // Date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(now.getDate() - 56);

  // ── All Supabase queries in parallel ──────────────────────────────────
  const [
    newsRes, eventsRes, toursRes, staffRes,
    filesRes, docsRes, photosRes, vesselsRes,
    posRes, inboxRes,
    pendingPOsRes, unreadInboxRes, activeRFPsRes,
  ] = await Promise.all([
    // 8 stat counts
    supabase.from('news_articles').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('tours').select('id', { count: 'exact', head: true }),
    supabase.from('staff_members').select('id', { count: 'exact', head: true }),
    supabase.from('files').select('id', { count: 'exact', head: true }).neq('mime_type', 'application/x-folder'),
    supabase.from('board_documents').select('id', { count: 'exact', head: true }),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
    supabase.from('vessel_traffic').select('id', { count: 'exact', head: true }).eq('is_active', true),
    // PO breakdown
    supabase.from('purchase_orders').select('status, total_amount'),
    // Inbox activity (last 8 weeks)
    supabase.from('contact_submissions').select('created_at').gte('created_at', eightWeeksAgo.toISOString()),
    // Needs attention
    supabase.from('purchase_orders').select('id, po_number, title, total_amount, requested_by, created_at, priority')
      .eq('status', 'pending_approval').order('created_at', { ascending: false }).limit(5),
    supabase.from('contact_submissions').select('id, first_name, last_name, subject, created_at')
      .eq('status', 'new').order('created_at', { ascending: false }).limit(5),
    supabase.from('rfps').select('id, title, status, created_at')
      .in('status', ['new', 'open']).order('created_at', { ascending: false }).limit(5),
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = {
    news: newsRes.count || 0,
    events: eventsRes.count || 0,
    tours: toursRes.count || 0,
    staff: staffRes.count || 0,
    files: filesRes.count || 0,
    documents: docsRes.count || 0,
    photos: photosRes.count || 0,
    vessels: vesselsRes.count || 0,
  };

  // ── PO breakdown by status ────────────────────────────────────────────
  const poRows = posRes.data || [];
  const poStatusMap: Record<string, { count: number; totalAmount: number }> = {};
  for (const po of poRows) {
    const s = po.status as string;
    if (!poStatusMap[s]) poStatusMap[s] = { count: 0, totalAmount: 0 };
    poStatusMap[s].count++;
    poStatusMap[s].totalAmount += Number(po.total_amount) || 0;
  }
  const PO_LABELS: Record<string, string> = {
    draft: 'Draft', pending_approval: 'Pending', approved: 'Approved',
    denied: 'Denied', completed: 'Completed', archived: 'Archived',
  };
  const poBreakdown = Object.entries(PO_LABELS).map(([status, label]) => ({
    status,
    label,
    count: poStatusMap[status]?.count || 0,
    totalAmount: poStatusMap[status]?.totalAmount || 0,
  }));

  // ── Inbox activity grouped by week ────────────────────────────────────
  const inboxRows = inboxRes.data || [];
  const weekBuckets: Record<string, number> = {};

  // Initialize 8 week buckets
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    // Set to Monday of that week
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const key = fmt(weekStart);
    weekBuckets[key] = 0;
  }

  for (const row of inboxRows) {
    const d = new Date(row.created_at);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const key = fmt(monday);
    if (key in weekBuckets) {
      weekBuckets[key]++;
    }
  }

  const inboxActivity = Object.entries(weekBuckets).sort().map(([weekStart, count]) => {
    const d = new Date(weekStart + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { week: label, weekStart, count };
  });

  // ── GA4 traffic (non-blocking) ────────────────────────────────────────
  let traffic: {
    configured: boolean;
    daily: { date: string; sessions: number; users: number; pageviews: number }[];
    summary: {
      sessions: { current: number; previous: number };
      users: { current: number; previous: number };
      pageviews: { current: number; previous: number };
    };
  } | null = null;

  if (isGA4Configured()) {
    try {
      const [daily, currentSummary, previousSummary] = await Promise.all([
        getGA4DailyReport(fmt(thirtyDaysAgo), fmt(now)),
        getGA4Summary(fmt(thirtyDaysAgo), fmt(now)),
        getGA4Summary(fmt(sixtyDaysAgo), fmt(thirtyDaysAgo)),
      ]);
      traffic = {
        configured: true,
        daily: daily.map(d => ({ date: d.date, sessions: d.sessions, users: d.users, pageviews: d.pageviews })),
        summary: {
          sessions: { current: currentSummary.sessions || 0, previous: previousSummary.sessions || 0 },
          users: { current: currentSummary.users || 0, previous: previousSummary.users || 0 },
          pageviews: { current: currentSummary.pageviews || 0, previous: previousSummary.pageviews || 0 },
        },
      };
    } catch { /* GA4 failure shouldn't break dashboard */ }
  }

  // ── Social media (non-blocking) ───────────────────────────────────────
  let social: {
    facebook: Record<string, number> | null;
    youtube: Record<string, number> | null;
  } | null = null;

  try {
    const profileKey = getProfileKey('lpfa');
    if (profileKey) {
      const { data } = await ayrshareFetch(['facebook', 'youtube'], profileKey);
      if (data) {
        social = {
          facebook: data.facebook?.analytics ? (data.facebook.analytics as Record<string, number>) : null,
          youtube: data.youtube?.analytics ? (data.youtube.analytics as Record<string, number>) : null,
        };
      }
    }
  } catch { /* social failure shouldn't break dashboard */ }

  // ── Needs attention ───────────────────────────────────────────────────
  const attention = {
    pendingPOs: pendingPOsRes.data || [],
    unreadInbox: unreadInboxRes.data || [],
    activeRFPs: activeRFPsRes.data || [],
  };

  return NextResponse.json({
    stats,
    traffic,
    poBreakdown,
    inboxActivity,
    social,
    attention,
  }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
