import { NextRequest, NextResponse } from 'next/server';
import {
  isGA4Configured,
  getGA4DailyReport,
  getGA4Summary,
  getGA4TopPages,
  getGA4TrafficSources,
} from '@/lib/ga4';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  if (!isGA4Configured()) {
    return NextResponse.json({ configured: false });
  }

  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') || '30') || 30, 90);

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const prevStartStr = formatDate(prevStart);
  const prevEndStr = formatDate(prevEnd);

  try {
    const [daily, currentSummary, previousSummary, topPages, trafficSources] = await Promise.all([
      getGA4DailyReport(startStr, endStr),
      getGA4Summary(startStr, endStr),
      getGA4Summary(prevStartStr, prevEndStr),
      getGA4TopPages(startStr, endStr),
      getGA4TrafficSources(startStr, endStr),
    ]);

    const summary: Record<string, { current: number; previous: number | null }> = {};
    for (const key of ['sessions', 'users', 'pageviews', 'bounceRate', 'avgSessionDuration', 'newUsers']) {
      summary[key] = {
        current: currentSummary[key] ?? 0,
        previous: previousSummary[key] ?? null,
      };
    }

    return NextResponse.json({
      configured: true,
      period: { start: startStr, end: endStr, days },
      summary,
      daily,
      topPages,
      trafficSources,
    });
  } catch (err) {
    console.error('GA4 analytics error:', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
    return NextResponse.json({ configured: true, error: message });
  }
}
