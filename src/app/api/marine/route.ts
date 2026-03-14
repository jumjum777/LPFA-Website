import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await fetchMarineData();
  return NextResponse.json(data);
}
