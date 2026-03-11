import { NextResponse } from 'next/server';
import { fetchBeachData } from '@/lib/beach';

export const revalidate = 3600; // 1 hour — beach data updates daily

export async function GET() {
  const data = await fetchBeachData();
  return NextResponse.json(data);
}
