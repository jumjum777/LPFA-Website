import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await fetchMarineData();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}
