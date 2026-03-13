import { NextRequest, NextResponse } from 'next/server';
import { ayrshareFetch, getProfileKey } from '@/lib/ayrshare';

export async function GET(req: NextRequest) {
  const profile = (req.nextUrl.searchParams.get('profile') || 'lpfa') as 'lpfa' | 'rotr';
  const profileKey = getProfileKey(profile);

  if (!profileKey) {
    return NextResponse.json({ connected: false, error: 'Profile key not configured' });
  }

  // LPFA has Facebook + YouTube, ROTR has Facebook only
  const platforms = profile === 'lpfa' ? ['facebook', 'youtube'] : ['facebook'];

  // Fetch both aggregate (lifetime) and daily time-series data in parallel
  const [aggregateResult, dailyResult] = await Promise.all([
    ayrshareFetch(platforms, profileKey),
    ayrshareFetch(platforms, profileKey, { daily: true, quarters: 1 }),
  ]);

  if (aggregateResult.error && dailyResult.error) {
    return NextResponse.json({ connected: false, error: aggregateResult.error }, { status: 500 });
  }

  const aggData = aggregateResult.data;
  const dailyData = dailyResult.data;

  return NextResponse.json({
    connected: true,
    profile,
    facebook: aggData?.facebook?.analytics || null,
    youtube: aggData?.youtube?.analytics || null,
    facebookDaily: dailyData?.facebook?.analytics || null,
    youtubeDaily: dailyData?.youtube?.analytics || null,
    lastUpdated: aggData?.facebook?.lastUpdated || aggData?.youtube?.lastUpdated || null,
  });
}
