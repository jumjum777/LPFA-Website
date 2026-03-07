import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';

export const revalidate = 1800; // 30 minutes

export async function GET() {
  const data = await fetchMarineData();
  return NextResponse.json(data);
}
