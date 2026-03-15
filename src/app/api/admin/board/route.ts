import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Board API error:', error);
    return NextResponse.json({ members: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}
