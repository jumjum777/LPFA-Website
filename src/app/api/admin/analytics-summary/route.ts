import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchMarineData, type MarineData } from '@/lib/marine';
import { fetchBeachData, type BeachQualityResponse } from '@/lib/beach';

interface AnalyticsContext {
  profile: 'lpfa' | 'rotr';
  period: string;
  activeDays?: number;
  web: Record<string, unknown> | null;
  social: {
    facebook: Record<string, unknown> | null;
    youtube: Record<string, unknown> | null;
    facebookDaily: Record<string, unknown> | null;
    youtubeDaily: Record<string, unknown> | null;
  } | null;
  email: Record<string, unknown> | null;
  events: Record<string, unknown> | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body: AnalyticsContext = await req.json();

    // Fetch weather + beach data server-side (cached, fast)
    const [marine, beach] = await Promise.all([
      fetchMarineData().catch(() => null),
      fetchBeachData().catch(() => null),
    ]);

    const context = assembleContext(body, marine, beach);
    const orgName = body.profile === 'lpfa'
      ? 'the Lorain Port & Finance Authority (LPFA)'
      : "Rockin' on the River (ROTR), a major concert series";

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are the digital analytics advisor for ${orgName} in Lorain, Ohio. Your job is to provide a concise executive summary that a director can use when speaking to sponsors, board members, or community partners about digital reach, brand exposure, and event performance.

Respond with a JSON object:
{
  "summary": "2-4 paragraphs separated by \\n\\n. Lead with total reach numbers. Highlight what's working well. Note any standout engagement. Frame everything as value for sponsors. Be specific with numbers. If weather or event data is available, weave in observations about conditions. Keep it professional but accessible. Do NOT use emojis, HTML entities, or special unicode characters.",
  "highlights": ["5-7 bullet point highlights — plain text only, no emojis or special characters"],
  "trend": "positive" | "stable" | "declining"
}

Guidelines:
- CRITICAL: All numbers in the data are pre-computed for the selected period. Use them EXACTLY as provided — do NOT recalculate, re-sum, or estimate. If the data says "Post Impressions in period: 163756", report "163,756 post impressions" or "163.8K impressions" — never a different number.
- When data is labeled "LIFETIME TOTALS", clearly present it as lifetime/all-time — never as period-specific.
- For period-specific data (web, email, social): report as "during [period]" or "in the past X days"
- For lifetime-only data: report as "to date", "overall", or "across all time"
- Lead with period-specific highlights then frame lifetime social reach as supporting context
- Email open rates above 20% are above industry average — mention it
- Social media engagement rates above 1% are strong — highlight it
- Mention specific audience sizes (followers, subscribers, email contacts) as current totals
- If video content has significant views, emphasize it — video is premium exposure
- Frame numbers in context ("X impressions means Y% of the community saw our content")
- Lorain has ~65,000 residents — you can reference local reach in that context
- If data is zero or missing for a platform, skip it gracefully — don't draw attention to gaps

Weather & Event Context:
- If weather data is provided, note how current/upcoming conditions may affect outdoor events, boat tours, or waterfront activities
- Correlate weather with event timing: "Clear skies and 75°F forecast for Saturday bodes well for the upcoming show"
- If there are marine alerts (Small Craft Advisory, etc.), mention implications for boat tours
- If beach water quality data shows advisories, note it as a factor for waterfront events
- If event/ticket data is provided, connect the dots: revenue trends, ticket velocity, per-event performance
- For ROTR: frame ticket sales and attendance as sponsor ROI — "X tickets sold represents Y potential sponsor impressions"
- Weather-event correlation is a premium insight — always include it when both data sources are available
- Keep the summary to 2-4 tight paragraphs, not longer`,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        summary: text,
        highlights: [],
        trend: 'stable',
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Analytics summary error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function assembleContext(
  data: AnalyticsContext,
  marine: MarineData | null,
  beach: BeachQualityResponse | null,
): string {
  const lines: string[] = [];
  const org = data.profile === 'lpfa' ? 'Lorain Port & Finance Authority' : "Rockin' on the River";

  lines.push(`Analytics Report for: ${org}`);
  lines.push(`Period: ${data.period}`);
  lines.push(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}\n`);

  // ─── Weather & Marine Conditions ───────────────────────────────────
  if (marine) {
    lines.push('=== CURRENT WEATHER & MARINE CONDITIONS ===');

    // Active alerts
    if (marine.alerts.length > 0) {
      lines.push(`⚠ Active Alerts (${marine.alerts.length}):`);
      for (const alert of marine.alerts.slice(0, 3)) {
        lines.push(`  - ${alert.event} (${alert.severity}): ${alert.headline}`);
        if (alert.expires) lines.push(`    Expires: ${new Date(alert.expires).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
      }
    } else {
      lines.push('No active weather or marine alerts.');
    }

    // Today's forecast
    if (marine.forecast.length > 0) {
      const today = marine.forecast[0];
      lines.push(`Today's Forecast: ${today.name} — ${today.shortForecast}, ${today.temperature}°${today.temperatureUnit}`);
      lines.push(`Wind: ${today.windSpeed} ${today.windDirection}`);
      if (today.detailedForecast) {
        lines.push(`Details: ${today.detailedForecast}`);
      }
      // Include tonight + tomorrow if available
      for (const period of marine.forecast.slice(1, 4)) {
        lines.push(`${period.name}: ${period.shortForecast}, ${period.temperature}°${period.temperatureUnit}, Wind ${period.windSpeed} ${period.windDirection}`);
      }
    }

    // Buoy data (real-time offshore conditions)
    if (marine.buoy && !marine.buoy.isOffline) {
      lines.push(`\nOffshore Buoy Data (NDBC 45005 — 18mi NW of Lorain):`);
      if (marine.buoy.waveHeight != null) lines.push(`  Wave Height: ${marine.buoy.waveHeight} ft`);
      if (marine.buoy.wavePeriod != null) lines.push(`  Wave Period: ${marine.buoy.wavePeriod}s`);
      if (marine.buoy.windSpeed != null) lines.push(`  Wind: ${marine.buoy.windSpeed} kts${marine.buoy.windGust ? `, gusting ${marine.buoy.windGust} kts` : ''}`);
      if (marine.buoy.waterTemp != null) lines.push(`  Water Temp: ${marine.buoy.waterTemp}°F`);
      if (marine.buoy.airTemp != null) lines.push(`  Air Temp: ${marine.buoy.airTemp}°F`);
    } else if (marine.buoy?.isOffline) {
      lines.push('Offshore buoy is offline for the season.');
    }

    // Next 12 hours highlights
    if (marine.hourly.length > 0) {
      const next12 = marine.hourly.slice(0, 12);
      const temps = next12.map(h => h.temperature);
      const highTemp = Math.max(...temps);
      const lowTemp = Math.min(...temps);
      const rainPeriods = next12.filter(h => h.shortForecast.toLowerCase().includes('rain') || h.shortForecast.toLowerCase().includes('thunder') || h.shortForecast.toLowerCase().includes('shower'));
      lines.push(`\nNext 12 Hours: High ${highTemp}°F, Low ${lowTemp}°F`);
      if (rainPeriods.length > 0) {
        lines.push(`Rain/storms expected in ${rainPeriods.length} of next 12 hours`);
      } else {
        lines.push('No precipitation expected in next 12 hours');
      }
    }
    lines.push('');
  }

  // ─── Beach Water Quality ───────────────────────────────────────────
  if (beach && !beach.isOffSeason && beach.beaches.length > 0) {
    lines.push('=== BEACH WATER QUALITY ===');
    const advisories = beach.beaches.filter(b => b.status === 'advisory');
    const safe = beach.beaches.filter(b => b.status === 'safe');
    lines.push(`Season: ${beach.seasonYear}, ${safe.length} of ${beach.beaches.length} beaches rated safe`);
    if (advisories.length > 0) {
      lines.push(`Advisories: ${advisories.map(b => b.name).join(', ')}`);
    }
    lines.push('');
  }

  // ─── Events & Ticket Sales ────────────────────────────────────────
  if (data.events) {
    const ev = data.events as any;
    if (ev.summary) {
      lines.push('=== EVENTS & TICKET SALES (ALL TIME) ===');
      lines.push(`Total Events: ${ev.summary.totalEvents ?? 'N/A'}`);
      lines.push(`Upcoming Events: ${ev.summary.upcomingEvents ?? 0}`);
      lines.push(`Total Orders: ${ev.summary.totalOrders ?? 0}`);
      lines.push(`Total Tickets Sold: ${ev.summary.totalTickets ?? 0}`);
      if (ev.summary.totalRevenue != null) {
        lines.push(`Total Revenue: $${Number(ev.summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }
    }
    if (ev.events && Array.isArray(ev.events)) {
      const recent = ev.events.slice(0, 6);
      for (const event of recent) {
        const status = event.status || 'Unknown';
        const title = event.title || event.name || 'Untitled';
        const date = event.dateFormatted || event.date || '';
        lines.push(`  - ${title} (${status})${date ? ` — ${date}` : ''}`);
        if (event.ticketDefinitions?.length > 0) {
          for (const td of event.ticketDefinitions) {
            const price = td.free ? 'Free' : `$${td.price?.amount || '0'}`;
            lines.push(`    Ticket: ${td.name} — ${price}${td.saleStatus ? ` (${td.saleStatus})` : ''}`);
          }
        }
      }
    }
    lines.push('');
  }

  // ─── Web Analytics ────────────────────────────────────────────────
  if (data.web) {
    lines.push(`=== WEBSITE ANALYTICS — for ${data.period} ===`);
    const w = data.web as any;
    if (w.summary) {
      lines.push(`Sessions: ${w.summary.sessions?.current ?? 'N/A'}`);
      lines.push(`Users: ${w.summary.users?.current ?? 'N/A'}`);
      lines.push(`Pageviews: ${w.summary.pageviews?.current ?? 'N/A'}`);
      if (w.summary.bounceRate?.current != null) {
        lines.push(`Bounce Rate: ${(w.summary.bounceRate.current * 100).toFixed(1)}%`);
      }
      if (w.summary.avgSessionDuration?.current != null) {
        lines.push(`Avg Session Duration: ${Math.round(w.summary.avgSessionDuration.current)}s`);
      }
    } else if (w.metrics) {
      for (const m of w.metrics) {
        lines.push(`${m.type}: ${m.total}`);
      }
    }
    if (w.topPages) {
      lines.push(`Top pages: ${w.topPages.slice(0, 5).map((p: any) => `${p.path} (${p.pageviews} views)`).join(', ')}`);
    }
    if (w.trafficSources) {
      lines.push(`Traffic sources: ${w.trafficSources.map((s: any) => `${s.channel} (${s.sessions} sessions)`).join(', ')}`);
    }
    lines.push('');
  }

  // ─── Facebook ──────────────────────────────────────────────────────
  if (data.social?.facebook) {
    const fb = data.social.facebook as any;
    const fbDaily = data.social.facebookDaily as any;
    const days = data.activeDays || 30;
    const hasDailyData = fbDaily && typeof fbDaily === 'object';

    // Pre-compute period-specific totals from daily data
    const fbPeriod = hasDailyData ? {
      impressions: sumMetric(fbDaily, 'pagePostsImpressions', days),
      engagements: sumMetric(fbDaily, 'pagePostEngagements', days),
      videoViews: sumMetric(fbDaily, 'pageVideoViews', days),
      mediaViews: sumMetric(fbDaily, 'pageMediaView', days),
      impOrganic: sumMetric(fbDaily, 'pagePostsImpressionsOrganicUnique', days),
      impPaid: sumMetric(fbDaily, 'pagePostsImpressionsPaid', days),
      impViral: sumMetric(fbDaily, 'pagePostsImpressionsViral', days),
      newFollowers: diffMetric(fbDaily, 'pageFollows', days),
    } : null;

    if (fbPeriod && fbPeriod.impressions !== null) {
      lines.push(`=== FACEBOOK — for ${data.period} ===`);
      if (fb.name) lines.push(`Page: ${fb.name}`);
      lines.push(`Followers (current): ${fb.followersCount ?? 'N/A'}`);
      if (fbPeriod.newFollowers !== null) lines.push(`New Followers in period: +${fbPeriod.newFollowers}`);
      lines.push(`Post Impressions in period: ${fbPeriod.impressions}`);
      lines.push(`Post Engagements in period: ${fbPeriod.engagements}`);
      lines.push(`Video Views in period: ${fbPeriod.videoViews}`);
      lines.push(`Media Views in period: ${fbPeriod.mediaViews}`);
      if (fbPeriod.impOrganic) lines.push(`Organic Impressions: ${fbPeriod.impOrganic}`);
      if (fbPeriod.impPaid) lines.push(`Paid Impressions: ${fbPeriod.impPaid}`);
      if (fbPeriod.impViral) lines.push(`Viral Impressions: ${fbPeriod.impViral}`);
      if (fb.overallStarRating) lines.push(`Star Rating: ${fb.overallStarRating}/5`);
      if (fb.reactions) lines.push(`Reactions (lifetime): ${fb.reactions.total} — Like: ${fb.reactions.like}, Love: ${fb.reactions.love}`);
      lines.push('These are period-specific totals — use them as-is.');
    } else {
      lines.push('=== FACEBOOK (LIFETIME TOTALS — not specific to the period above) ===');
      if (fb.name) lines.push(`Page: ${fb.name}`);
      lines.push(`Followers (current): ${fb.followersCount ?? 'N/A'}`);
      lines.push(`Lifetime Post Impressions: ${fb.pagePostsImpressions ?? 'N/A'}`);
      lines.push(`Lifetime Post Engagements: ${fb.pagePostEngagements ?? 'N/A'}`);
      lines.push(`Lifetime Video Views: ${fb.pageVideoViews ?? 'N/A'}`);
      lines.push(`Lifetime Media Views: ${fb.pageMediaView ?? 'N/A'}`);
      if (fb.reactions) lines.push(`Lifetime Reactions: ${fb.reactions.total}`);
      if (fb.overallStarRating) lines.push(`Star Rating: ${fb.overallStarRating}/5`);
      lines.push('NOTE: These are cumulative lifetime totals. Present them as overall platform reach.');
    }
    lines.push('');
  }

  // ─── YouTube ──────────────────────────────────────────────────────
  if (data.social?.youtube) {
    const yt = data.social.youtube as any;
    const ytDaily = data.social.youtubeDaily as any;
    const days = data.activeDays || 30;
    const hasDailyData = ytDaily && typeof ytDaily === 'object';

    const ytPeriod = hasDailyData ? {
      views: sumMetric(ytDaily, 'views', days),
      likes: sumMetric(ytDaily, 'likes', days),
      comments: sumMetric(ytDaily, 'comments', days),
      shares: sumMetric(ytDaily, 'shares', days),
      watchMinutes: sumMetric(ytDaily, 'estimatedMinutesWatched', days),
      subsGained: sumMetric(ytDaily, 'subscribersGained', days),
      subsLost: sumMetric(ytDaily, 'subscribersLost', days),
    } : null;

    if (ytPeriod && ytPeriod.views !== null) {
      lines.push(`=== YOUTUBE — for ${data.period} ===`);
      if (yt.title) lines.push(`Channel: ${yt.title}`);
      lines.push(`Subscribers (current): ${yt.subscriberCount ?? 'N/A'}`);
      lines.push(`Videos Published: ${yt.videoCount ?? 'N/A'}`);
      lines.push(`Views in period: ${ytPeriod.views}`);
      lines.push(`Watch Minutes in period: ${ytPeriod.watchMinutes}`);
      lines.push(`Likes in period: ${ytPeriod.likes}`);
      lines.push(`Comments in period: ${ytPeriod.comments}`);
      lines.push(`Shares in period: ${ytPeriod.shares}`);
      if (ytPeriod.subsGained) lines.push(`Subscribers Gained: +${ytPeriod.subsGained}`);
      if (ytPeriod.subsLost) lines.push(`Subscribers Lost: -${ytPeriod.subsLost}`);
      if (yt.playlists) lines.push(`Playlists: ${yt.playlists.length}`);
      lines.push('These are period-specific totals — use them as-is.');
    } else {
      lines.push('=== YOUTUBE (LIFETIME TOTALS — not specific to the period above) ===');
      if (yt.title) lines.push(`Channel: ${yt.title}`);
      lines.push(`Subscribers (current): ${yt.subscriberCount ?? 'N/A'}`);
      lines.push(`Lifetime Views: ${yt.viewCount ?? 'N/A'}`);
      lines.push(`Lifetime Watch Minutes: ${yt.estimatedMinutesWatched ?? 'N/A'}`);
      lines.push(`Videos Published: ${yt.videoCount ?? 'N/A'}`);
      lines.push(`Lifetime Likes: ${yt.likes ?? 0}, Comments: ${yt.comments ?? 0}, Shares: ${yt.shares ?? 0}`);
      if (yt.subscribersGained) lines.push(`Subscribers Gained (recent): ${yt.subscribersGained}`);
      if (yt.playlists) lines.push(`Playlists: ${yt.playlists.length}`);
      lines.push('NOTE: These are cumulative lifetime totals. Present them as overall channel reach.');
    }
    lines.push('');
  }

  // ─── Email Marketing ──────────────────────────────────────────────
  if (data.email) {
    const e = data.email as any;
    if (e.connected) {
      lines.push(`=== EMAIL MARKETING (Constant Contact) — for ${data.period} ===`);
      const campaigns = e.campaigns || [];
      const totalSends = campaigns.reduce((s: number, c: any) => s + (c.stats?.sends || 0), 0);
      const totalOpens = campaigns.reduce((s: number, c: any) => s + (c.stats?.opens || 0), 0);
      const totalClicks = campaigns.reduce((s: number, c: any) => s + (c.stats?.clicks || 0), 0);
      const totalBounces = campaigns.reduce((s: number, c: any) => s + (c.stats?.bounces || 0), 0);
      lines.push(`Campaigns sent in this period: ${campaigns.length}`);
      lines.push(`Sends in period: ${totalSends}`);
      lines.push(`Total Opens: ${totalOpens} (${totalSends > 0 ? ((totalOpens / totalSends) * 100).toFixed(1) : 0}% rate)`);
      lines.push(`Total Clicks: ${totalClicks} (${totalSends > 0 ? ((totalClicks / totalSends) * 100).toFixed(1) : 0}% rate)`);
      lines.push(`Bounces: ${totalBounces}`);
      const contactCount = (e.lists || []).reduce((s: number, l: any) => s + (l.membership_count || 0), 0);
      lines.push(`Contact Lists: ${e.listsCount || 0}, Total Contacts: ${contactCount}`);
      if (campaigns.length > 0) {
        lines.push(`Recent campaigns: ${campaigns.slice(0, 3).map((c: any) => c.name).join(', ')}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Sum the last N daily entries for a metric. Handles Ayrshare format: { values: [{value, endTime}], total } */
function sumMetric(dailyData: any, key: string, days: number): number | null {
  const metric = dailyData?.[key];
  if (!metric) return null;
  const arr = Array.isArray(metric) ? metric : (Array.isArray(metric?.values) ? metric.values : null);
  if (!arr || arr.length === 0) return null;
  const slice = arr.slice(-days);
  return slice.reduce((sum: number, entry: any) => {
    const val = typeof entry === 'number' ? entry : (entry?.value ?? 0);
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);
}

/** Diff last - first in slice for cumulative metrics (e.g. follower count) */
function diffMetric(dailyData: any, key: string, days: number): number | null {
  const metric = dailyData?.[key];
  if (!metric) return null;
  const arr = Array.isArray(metric) ? metric : (Array.isArray(metric?.values) ? metric.values : null);
  if (!arr || arr.length < 2) return null;
  const slice = arr.slice(-days);
  const first = typeof slice[0] === 'number' ? slice[0] : (slice[0]?.value ?? 0);
  const last = typeof slice[slice.length - 1] === 'number' ? slice[slice.length - 1] : (slice[slice.length - 1]?.value ?? 0);
  return last - first;
}
