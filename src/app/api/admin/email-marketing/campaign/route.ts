import { NextRequest, NextResponse } from 'next/server';

const CC_BASE = 'https://api.cc.email/v3';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('id');
  if (!campaignId) {
    return NextResponse.json({ error: 'Missing campaign id' }, { status: 400 });
  }

  const accessToken = process.env.CONSTANTCONTACT_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 });
  }

  const res = await fetch(`${CC_BASE}/reports/stats/email_campaigns/${campaignId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch campaign stats' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.results?.[0] || null);
}
