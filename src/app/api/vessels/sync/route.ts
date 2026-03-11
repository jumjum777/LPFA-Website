import { NextResponse } from 'next/server';
import { syncVesselTraffic, expireStaleVessels } from '@/lib/vessels';
import { revalidatePath } from 'next/cache';

export const maxDuration = 60; // Allow up to 60 seconds for WebSocket collection

export async function GET(request: Request) {
  // Auth: accept Vercel Cron header or custom CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  const isVercelCron = authHeader === `Bearer ${expectedSecret}`;
  const isManualTrigger = cronSecret === expectedSecret;

  if (expectedSecret && !isVercelCron && !isManualTrigger) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [syncResult, expired] = await Promise.all([
      syncVesselTraffic(),
      expireStaleVessels(),
    ]);

    revalidatePath('/api/vessels');

    return NextResponse.json({
      success: true,
      vessels_found: syncResult.found,
      vessels_upserted: syncResult.upserted,
      vessels_expired: expired,
    });
  } catch (error) {
    console.error('Vessel sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
