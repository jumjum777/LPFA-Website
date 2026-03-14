import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('fishing_catches')
    .select('species, bite_rating')
    .eq('status', 'approved')
    .not('bite_rating', 'is', null)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching bite summary:', error);
    return NextResponse.json({});
  }

  if (!data || data.length === 0) {
    return NextResponse.json({});
  }

  // Aggregate by species in JS since Supabase client doesn't support GROUP BY
  const grouped: Record<string, { totalRating: number; count: number }> = {};

  for (const row of data) {
    const { species, bite_rating } = row;
    if (!grouped[species]) {
      grouped[species] = { totalRating: 0, count: 0 };
    }
    grouped[species].totalRating += bite_rating;
    grouped[species].count += 1;
  }

  const summary: Record<string, { avgRating: number; catchCount: number }> = {};

  for (const [species, agg] of Object.entries(grouped)) {
    summary[species] = {
      avgRating: Math.round((agg.totalRating / agg.count) * 10) / 10,
      catchCount: agg.count,
    };
  }

  return NextResponse.json(summary);
}
