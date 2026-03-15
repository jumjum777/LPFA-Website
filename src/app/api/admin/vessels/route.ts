import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('vessel_traffic')
    .select('*')
    .order('last_seen_at', { ascending: false });
  if (error) console.error('Vessels API error:', error);
  return NextResponse.json({ vessels: data || [] });
}
