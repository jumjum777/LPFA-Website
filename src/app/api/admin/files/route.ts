import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ files: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data || [] });
}
