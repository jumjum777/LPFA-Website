import { NextResponse } from 'next/server';
import { fetchBeachData } from '@/lib/beach';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await fetchBeachData();
  return NextResponse.json(data);
}
