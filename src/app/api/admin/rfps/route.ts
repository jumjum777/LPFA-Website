import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .order('posted_date', { ascending: false });

  if (error) {
    console.error('RFPs API error:', error);
    return NextResponse.json({ rfps: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rfps: data || [] });
}
