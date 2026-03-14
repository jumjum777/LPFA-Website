import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isGA4Configured, getGA4DailyReport, getGA4Summary } from '@/lib/ga4';
import { ayrshareFetch, getProfileKey } from '@/lib/ayrshare';
import { fetchMarineData } from '@/lib/marine';

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
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(now.getDate() + 7);

  // ── ALL data fetches in parallel ────────────────────────────────────
  // Supabase, GA4, social, and marine all run concurrently
  const [
    supabaseResults,
    trafficResult,
    socialResult,
    marineResult,
  ] = await Promise.all([
    // 1) All Supabase queries
    Promise.all([
      supabase.from('news_articles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('event_date', fmt(now)).lte('event_date', fmt(sevenDaysOut)),
      supabase.from('tour_schedules').select('tour_id, dates'),
      supabase.from('staff_members').select('id', { count: 'exact', head: true }),
      supabase.from('files').select('id', { count: 'exact', head: true }).neq('mime_type', 'application/x-folder'),
      supabase.from('board_documents').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('vessel_traffic').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('purchase_orders').select('status, total_amount'),
      supabase.from('contact_submissions').select('created_at').gte('created_at', eightWeeksAgo.toISOString()),
      supabase.from('purchase_orders').select('id, po_number, title, total_amount, requested_by, created_at, priority')
        .eq('status', 'pending_approval').order('created_at', { ascending: false }).limit(5),
      supabase.from('contact_submissions').select('id, first_name, last_name, subject, created_at')
        .eq('status', 'new').order('created_at', { ascending: false }).limit(5),
      supabase.from('rfps').select('id, title, status, created_at')
        .in('status', ['new', 'open']).order('created_at', { ascending: false }).limit(5),
    ]),

    // 2) GA4 traffic
    (async () => {
      if (!isGA4Configured()) return null;
      try {
        const [daily, currentSummary, previousSummary] = await Promise.all([
          getGA4DailyReport(fmt(thirtyDaysAgo), fmt(now)),
          getGA4Summary(fmt(thirtyDaysAgo), fmt(now)),
          getGA4Summary(fmt(sixtyDaysAgo), fmt(thirtyDaysAgo)),
        ]);
        return {
          configured: true,
          daily: daily.map(d => ({ date: d.date, sessions: d.sessions, users: d.users, pageviews: d.pageviews })),
          summary: {
            sessions: { current: currentSummary.sessions || 0, previous: previousSummary.sessions || 0 },
            users: { current: currentSummary.users || 0, previous: previousSummary.users || 0 },
            pageviews: { current: currentSummary.pageviews || 0, previous: previousSummary.pageviews || 0 },
          },
        };
      } catch { return null; }
    })(),

    // 3) Social media
    (async () => {
      try {
        const profileKey = getProfileKey('lpfa');
        if (!profileKey) return null;
        const { data } = await ayrshareFetch(['facebook', 'youtube'], profileKey);
        if (!data) return null;
        return {
          facebook: data.facebook?.analytics ? (data.facebook.analytics as Record<string, number>) : null,
          youtube: data.youtube?.analytics ? (data.youtube.analytics as Record<string, number>) : null,
        };
      } catch { return null; }
    })(),

    // 4) Marine alerts
    (async () => {
      try {
        const marine = await fetchMarineData();
        return marine.alerts.length;
      } catch { return 0; }
    })(),
  ]);

  // ── Destructure Supabase results ────────────────────────────────────
  const [
    newsRes, eventsRes, toursRes, staffRes,
    filesRes, docsRes, photosRes, vesselsRes,
    posRes, inboxRes,
    pendingPOsRes, unreadInboxRes, activeRFPsRes,
  ] = supabaseResults;

  // ── Upcoming tours (next 7 days) ───────────────────────────────────
  const todayStr = fmt(now);
  const sevenStr = fmt(sevenDaysOut);
  const tourSchedules = toursRes.data || [];
  const upcomingTourIds = new Set<string>();
  for (const sched of tourSchedules) {
    const dates = (sched.dates || []) as string[];
    if (dates.some(d => d >= todayStr && d <= sevenStr)) {
      upcomingTourIds.add(sched.tour_id as string);
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────
  const stats = {
    news: newsRes.count || 0,
    upcomingEvents: eventsRes.count || 0,
    upcomingTours: upcomingTourIds.size,
    staff: staffRes.count || 0,
    files: filesRes.count || 0,
    documents: docsRes.count || 0,
    photos: photosRes.count || 0,
    vessels: vesselsRes.count || 0,
    unread: unreadInboxRes.data?.length || 0,
    pendingPOs: (pendingPOsRes.data?.length || 0),
    activeAlerts: marineResult,
  };

  // ── PO breakdown by status ──────────────────────────────────────────
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

  // ── Inbox activity grouped by week ──────────────────────────────────
  const inboxRows = inboxRes.data || [];
  const weekBuckets: Record<string, number> = {};

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
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

  // ── Needs attention ─────────────────────────────────────────────────
  const attention = {
    pendingPOs: pendingPOsRes.data || [],
    unreadInbox: unreadInboxRes.data || [],
    activeRFPs: activeRFPsRes.data || [],
  };

  return NextResponse.json({
    stats,
    traffic: trafficResult,
    poBreakdown,
    inboxActivity,
    social: socialResult,
    attention,
  }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
