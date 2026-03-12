import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';
import { fetchBeachData } from '@/lib/beach';
import { fetchActiveVessels } from '@/lib/vessels';
import { generateBoatingSummary } from '@/lib/marine-summary';

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  const [marine, beach, vessels] = await Promise.all([
    fetchMarineData(),
    fetchBeachData(),
    fetchActiveVessels(),
  ]);

  const summary = await generateBoatingSummary(marine, beach, vessels);

  return NextResponse.json(summary, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
