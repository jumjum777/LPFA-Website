import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('published_date', { ascending: false });
  if (error) console.error('News API error:', error);
  return NextResponse.json({ articles: data || [] });
}
