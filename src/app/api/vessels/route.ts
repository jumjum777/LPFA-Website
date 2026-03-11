import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();

  const { data: vessels } = await supabase
    .from('vessel_traffic')
    .select('*')
    .eq('is_active', true)
    .order('first_detected_at', { ascending: false });

  return NextResponse.json({ vessels: vessels || [] });
}
