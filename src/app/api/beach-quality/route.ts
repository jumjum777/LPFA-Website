import { NextResponse } from 'next/server';
import { fetchBeachData } from '@/lib/beach';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await fetchBeachData();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
