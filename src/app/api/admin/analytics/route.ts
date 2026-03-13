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

  const startParam = req.nextUrl.searchParams.get('start');
  const endParam = req.nextUrl.searchParams.get('end');

  let start: Date;
  let end: Date;
  let days: number;

  if (startParam && endParam) {
    start = new Date(startParam + 'T00:00:00');
    end = new Date(endParam + 'T23:59:59');
    days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    days = Math.min(Math.max(days, 1), 365);
  } else {
    days = Math.min(parseInt(req.nextUrl.searchParams.get('days') || '30') || 30, 90);
    end = new Date();
    start = new Date();
    start.setDate(end.getDate() - days);
  }

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
