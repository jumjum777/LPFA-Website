import { NextRequest, NextResponse } from 'next/server';
import { ccFetch } from '@/lib/constantcontact';

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get('id');
  if (!campaignId) {
    return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });
  }

  const result = await ccFetch(`/reports/stats/email_campaigns/${campaignId}`);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }

  const data = result.data as { results?: unknown[] } | null;
  return NextResponse.json(data?.results?.[0] || null);
}
