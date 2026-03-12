import { NextRequest, NextResponse } from 'next/server';
import { ccFetch, getTokens } from '@/lib/constantcontact';

export async function GET(req: NextRequest) {
  const tokens = await getTokens();
  if (!tokens) {
    return NextResponse.json({
      connected: false,
      error: 'Constant Contact not connected. Click "Connect" to authorize.',
    });
  }

  // Fetch campaign summaries
  const summaries = await ccFetch('/reports/summary_reports/email_campaign_summaries?limit=100');
  if (summaries.error) {
    return NextResponse.json({
      connected: false,
      error: summaries.error,
    }, { status: summaries.status || 500 });
  }

  // Fetch campaigns list for names/dates
  const campaigns = await ccFetch('/emails?limit=100');

  // Fetch contact lists
  const lists = await ccFetch('/contact_lists?include_membership_count=active&include_count=true&limit=50');

  // Build campaign name map
  const nameMap: Record<string, { name: string; status: string; created_at: string; updated_at: string }> = {};
  const campaignsData = campaigns.data as { campaigns?: Record<string, string>[] } | null;
  if (campaignsData?.campaigns) {
    for (const c of campaignsData.campaigns) {
      nameMap[c.campaign_id] = {
        name: c.name || 'Untitled',
        status: c.current_status,
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    }
  }

  // Merge summaries with names
  const summariesData = summaries.data as { bulk_email_campaign_summaries?: Record<string, unknown>[]; aggregate_percents?: Record<string, unknown>[] } | null;
  const campaignData = (summariesData?.bulk_email_campaign_summaries || []).map((s) => ({
    campaign_id: s.campaign_id,
    name: nameMap[s.campaign_id as string]?.name || 'Unknown Campaign',
    status: nameMap[s.campaign_id as string]?.status || 'Unknown',
    last_sent_date: s.last_sent_date,
    created_at: nameMap[s.campaign_id as string]?.created_at,
    stats: s.unique_counts,
  }));

  const listsData = lists.data as { lists?: unknown[]; lists_count?: number } | null;

  return NextResponse.json({
    connected: true,
    campaigns: campaignData,
    aggregates: summariesData?.aggregate_percents?.[0] || null,
    lists: listsData?.lists || [],
    listsCount: listsData?.lists_count || 0,
  });
}
