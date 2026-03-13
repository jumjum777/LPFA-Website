import { NextRequest, NextResponse } from 'next/server';
import { getWixAnalytics } from '@/lib/wix';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  let start: Date;
  let today: Date;
  let lookback: number;

  if (startParam && endParam) {
    start = new Date(startParam + 'T00:00:00');
    today = new Date(endParam + 'T23:59:59');
    lookback = Math.min(Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 62);
    // Recalculate start if clamped
    start = new Date(today);
    start.setDate(start.getDate() - lookback);
  } else {
    const days = parseInt(searchParams.get('days') || '30');
    // Wix caps at 62 days
    lookback = Math.min(days, 62);
    today = new Date();
    start = new Date(today);
    start.setDate(start.getDate() - lookback);
  }

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  try {
    // Fetch current period
    const metrics = await getWixAnalytics(fmt(start), fmt(today));

    // Fetch previous period for comparison
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - lookback);

    // Only fetch comparison if within 62-day limit
    const totalDaysBack = lookback * 2 + 1;
    let prevMetrics = null;
    if (totalDaysBack <= 62) {
      prevMetrics = await getWixAnalytics(fmt(prevStart), fmt(prevEnd));
    }

    return NextResponse.json({
      metrics,
      previousMetrics: prevMetrics,
      period: { start: fmt(start), end: fmt(today), days: lookback },
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
