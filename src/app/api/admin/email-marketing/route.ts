import { NextRequest, NextResponse } from 'next/server';

const CC_BASE = 'https://api.cc.email/v3';

async function getTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
  const access = process.env.CONSTANTCONTACT_ACCESS_TOKEN;
  const refresh = process.env.CONSTANTCONTACT_REFRESH_TOKEN;
  if (access && refresh) return { access_token: access, refresh_token: refresh };
  return null;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.CONSTANTCONTACT_CLIENT_ID;
  const clientSecret = process.env.CONSTANTCONTACT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://authz.constantcontact.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (!res.ok) return null;
  const data = await res.json();
  // In production, you'd persist the new tokens
  return data.access_token;
}

async function ccFetch(endpoint: string, accessToken: string) {
  const res = await fetch(`${CC_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) {
    return { error: 'unauthorized', status: 401 };
  }
  if (!res.ok) {
    const text = await res.text();
    return { error: text, status: res.status };
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const tokens = await getTokens();
  if (!tokens) {
    return NextResponse.json({
      connected: false,
      error: 'Constant Contact not connected. Add API credentials to environment variables.',
    });
  }

  let accessToken = tokens.access_token;

  // Try fetching campaign summaries
  let summaries = await ccFetch(
    '/reports/summary_reports/email_campaign_summaries?limit=100',
    accessToken
  );

  // If unauthorized, try refreshing
  if (summaries?.error === 'unauthorized') {
    const newToken = await refreshAccessToken(tokens.refresh_token);
    if (!newToken) {
      return NextResponse.json({
        connected: false,
        error: 'Token expired. Re-authorize Constant Contact.',
      });
    }
    accessToken = newToken;
    summaries = await ccFetch(
      '/reports/summary_reports/email_campaign_summaries?limit=100',
      accessToken
    );
  }

  if (summaries?.error) {
    return NextResponse.json({ connected: false, error: summaries.error }, { status: summaries.status || 500 });
  }

  // Fetch campaigns list for names/dates
  const campaigns = await ccFetch('/emails?limit=100', accessToken);

  // Fetch contact lists
  const lists = await ccFetch('/contact_lists?include_membership_count=active&include_count=true&limit=50', accessToken);

  // Build campaign name map
  const nameMap: Record<string, { name: string; status: string; created_at: string; updated_at: string }> = {};
  if (campaigns?.campaigns) {
    for (const c of campaigns.campaigns) {
      nameMap[c.campaign_id] = {
        name: c.name || 'Untitled',
        status: c.current_status,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    }
  }

  // Merge summaries with names
  const campaignData = (summaries?.bulk_email_campaign_summaries || []).map((s: Record<string, unknown>) => ({
    campaign_id: s.campaign_id,
    name: nameMap[s.campaign_id as string]?.name || 'Unknown Campaign',
    status: nameMap[s.campaign_id as string]?.status || 'Unknown',
    last_sent_date: s.last_sent_date,
    created_at: nameMap[s.campaign_id as string]?.created_at,
    stats: s.unique_counts,
  }));

  return NextResponse.json({
    connected: true,
    campaigns: campaignData,
    aggregates: summaries?.aggregate_percents?.[0] || null,
    lists: lists?.lists || [],
    listsCount: lists?.lists_count || 0,
  });
}
