import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();

  const [photosResult, categoriesResult] = await Promise.all([
    supabase.from('photos').select('*').order('created_at', { ascending: false }),
    supabase.from('photo_categories').select('*').order('sort_order').order('name'),
  ]);

  if (photosResult.error) console.error('Photos API error:', photosResult.error);
  if (categoriesResult.error) console.error('Photo categories API error:', categoriesResult.error);

  return NextResponse.json({
    photos: photosResult.data || [],
    categories: categoriesResult.data || [],
  });
}
