import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MayflyActivityLevel } from '@/lib/fishing';

const LEVEL_TO_NUMBER: Record<MayflyActivityLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function numberToLevel(avg: number): MayflyActivityLevel {
  if (avg < 0.5) return 'none';
  if (avg < 1.5) return 'low';
  if (avg < 2.5) return 'medium';
  return 'high';
}

export async function GET() {
  const supabase = createAdminClient();

  // Query reports from the last 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: reports, error } = await supabase
    .from('mayfly_reports')
    .select('activity_level, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mayfly reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mayfly status.' },
      { status: 500 },
    );
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({
      level: null,
      reportCount: 0,
      lastReported: null,
    });
  }

  // Aggregate: compute average activity level
  const total = reports.reduce((sum, r) => {
    const num = LEVEL_TO_NUMBER[r.activity_level as MayflyActivityLevel];
    return sum + (num ?? 0);
  }, 0);

  const avg = total / reports.length;

  return NextResponse.json({
    level: numberToLevel(avg),
    reportCount: reports.length,
    lastReported: reports[0].created_at,
  });
}
