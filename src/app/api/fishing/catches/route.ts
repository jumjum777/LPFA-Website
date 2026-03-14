import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 300; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const species = searchParams.get('species');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const supabase = createAdminClient();

  let query = supabase
    .from('fishing_catches')
    .select('*')
    .eq('status', 'approved')
    .order('catch_date', { ascending: false })
    .limit(limit);

  if (species && species !== 'all') {
    query = query.eq('species', species);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching catches:', error);
    return NextResponse.json({ catches: [] });
  }

  return NextResponse.json({ catches: data || [] });
}
