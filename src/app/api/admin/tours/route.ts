import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .order('sort_order');
  if (error) console.error('Tours API error:', error);
  return NextResponse.json({ tours: data || [] });
}
