import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();

  // Get active vessels + recently departed (last 48h)
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: vessels } = await supabase
    .from('vessel_traffic')
    .select('*')
    .or(`is_active.eq.true,and(status.eq.departed,last_seen_at.gte.${cutoff48h})`)
    .order('status', { ascending: true })
    .order('first_detected_at', { ascending: false });

  return NextResponse.json({ vessels: vessels || [] });
}
