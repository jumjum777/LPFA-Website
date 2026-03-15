import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Staff API error:', error);
    return NextResponse.json({ staff: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data || [] });
}
