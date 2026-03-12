import Anthropic from '@anthropic-ai/sdk';
import type { MarineData, MarineAlert } from './marine';
import type { BeachQualityResponse } from './beach';
import type { VesselRecord } from './vessels';

// --- Types ---

export type BoatingRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';

export interface BoatingSummary {
  rating: BoatingRating;
  summary: string;
  bestTimes: string;
  hazards: string[];
  generatedAt: string;
  isAiGenerated: boolean;
}

// --- Vessel type labels (matches vessels.ts conventions) ---

function vesselTypeLabel(type: number | null): string {
  if (!type) return 'Vessel';
  if (type >= 70 && type <= 79) return 'Cargo';
  if (type >= 80 && type <= 89) return 'Tanker';
  if (type === 60 || type === 69) return 'Passenger';
  if (type === 30) return 'Fishing';
  if (type === 31 || type === 32) return 'Towing';
  if (type === 33) return 'Dredger';
  if (type === 37) return 'Pleasure Craft';
  if (type === 52) return 'Tug';
  return 'Vessel';
}

// --- Assemble context for Claude ---

function assembleContext(
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[]
): string {
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
  });

  const parts: string[] = [];
  parts.push(`Current Date/Time: ${timeStr} ET`);
  parts.push('Location: Lorain Harbor, Lake Erie (Lorain, OH)\n');

  // Alerts
  if (marine.alerts.length > 0) {
    parts.push('ACTIVE ALERTS:');
    for (const a of marine.alerts) {
      const expires = a.expires ? ` (expires ${new Date(a.expires).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })})` : '';
      parts.push(`- ${a.event} [${a.severity}]${expires}: ${a.headline}`);
    }
  } else {
    parts.push('ACTIVE ALERTS: None');
  }
  parts.push('');

  // Today's forecast
  const today = marine.forecast[0];
  if (today) {
    parts.push(`TODAY'S FORECAST: ${today.shortForecast}, High ${today.temperature}°${today.temperatureUnit}, Wind ${today.windDirection} ${today.windSpeed}`);
    if (today.detailedForecast) {
      parts.push(`Detail: ${today.detailedForecast}`);
    }
  }
  parts.push('');

  // Buoy data
  if (marine.buoy && !marine.buoy.isOffline) {
    const b = marine.buoy;
    const windDir = b.windDirection !== null ? `from ${b.windDirection}°` : '';
    parts.push(`BUOY 45005 (18mi NW of Lorain):`);
    parts.push(`  Wind: ${b.windSpeed ?? 'N/A'} kts gusting ${b.windGust ?? 'N/A'} kts ${windDir}`);
    parts.push(`  Waves: ${b.waveHeight ?? 'N/A'} ft, period ${b.wavePeriod ?? 'N/A'}s`);
    parts.push(`  Water Temp: ${b.waterTemp ?? 'N/A'}°F, Air Temp: ${b.airTemp ?? 'N/A'}°F`);
    parts.push(`  Pressure: ${b.pressure ?? 'N/A'} hPa`);
  } else {
    parts.push('BUOY 45005: Offline (seasonal — typically deployed May through November)');
  }
  parts.push('');

  // Next 12 hours hourly
  if (marine.hourly.length > 0) {
    parts.push('NEXT 12 HOURS:');
    for (const h of marine.hourly.slice(0, 12)) {
      const time = new Date(h.startTime).toLocaleString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
      const precip = h.precipChance !== null ? `, ${h.precipChance}% precip` : '';
      parts.push(`  ${time}: ${h.temperature}°F, ${h.windDirection} ${h.windSpeed}, ${h.shortForecast}${precip}`);
    }
  }
  parts.push('');

  // Marine zone text (first period only)
  if (marine.marineTextPeriods.length > 0) {
    const first = marine.marineTextPeriods[0];
    parts.push(`MARINE ZONE FORECAST (${first.title}):`);
    parts.push(first.body.slice(0, 500));
  }
  parts.push('');

  // Vessel traffic
  const enRoute = vessels.filter(v => v.status === 'en_route');
  const inPort = vessels.filter(v => v.status === 'in_port');
  parts.push('VESSEL TRAFFIC:');
  if (enRoute.length > 0) {
    for (const v of enRoute) {
      const eta = v.eta ? ` — ETA ${new Date(v.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })}` : '';
      parts.push(`  - ${v.vessel_name || 'Unknown'} (${vesselTypeLabel(v.vessel_type)}) — En route${eta}`);
    }
  }
  if (inPort.length > 0) {
    parts.push(`  ${inPort.length} vessel(s) currently in port`);
  }
  if (enRoute.length === 0 && inPort.length === 0) {
    parts.push('  No vessels currently tracked near Lorain');
  }
  parts.push('');

  // Beach water quality
  if (beach.isOffSeason) {
    parts.push('BEACH WATER QUALITY: Off-season (monitoring runs May through September)');
  } else {
    const advisory = beach.beaches.filter(b => b.status === 'advisory');
    if (advisory.length > 0) {
      parts.push('BEACH WATER QUALITY:');
      for (const b of advisory) {
        parts.push(`  - ADVISORY: ${b.name} (${b.latestReading?.value?.toFixed(0)} cfu/100mL — exceeds 235 threshold)`);
      }
      const safe = beach.beaches.filter(b => b.status === 'safe');
      if (safe.length > 0) parts.push(`  ${safe.length} other beach(es) within safe limits`);
    } else {
      parts.push('BEACH WATER QUALITY: All monitored beaches within safe E. coli limits');
    }
  }

  return parts.join('\n');
}

// --- Claude AI summary ---

const SYSTEM_PROMPT = `You are the daily boating conditions advisor for Lorain Harbor on Lake Erie, Ohio. Analyze the provided weather, marine, vessel, and water quality data and produce a JSON response with these fields:

- "rating": One of "Excellent", "Good", "Fair", "Poor", or "Dangerous"
- "summary": 3-5 conversational sentences summarizing today's boating conditions for recreational boaters. Be helpful, specific, and natural. Mention relevant conditions like wind, waves, temperature. Avoid overly technical jargon.
- "bestTimes": A sentence about the best time window(s) to be on the water today based on hourly data. If dangerous all day, say so clearly.
- "hazards": An array of short hazard strings. Examples: "Small Craft Advisory until 6 PM", "Cargo vessel arriving ~2 PM — stay clear of the harbor channel", "Elevated E. coli at Lakeview Beach — avoid swimming". Empty array if none.

Rating guidelines:
- Excellent: Calm winds (<10 kts), small waves (<2 ft), no alerts, pleasant temps
- Good: Moderate winds (10-15 kts), waves 2-3 ft, no severe alerts
- Fair: Winds 15-20 kts, waves 3-5 ft, or minor advisories active
- Poor: Winds 20-30 kts, waves 5-7 ft, or active warnings
- Dangerous: Gale/storm warnings, winds >30 kts, waves >7 ft

If the buoy is offline, base your rating on the NWS forecast data instead.
If it's nighttime or late evening, adjust your language appropriately (don't recommend heading out at midnight).

Respond with ONLY valid JSON. No markdown, no code fences, no explanation.`;

async function generateAiSummary(context: string): Promise<BoatingSummary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey, timeout: 15_000 });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context }],
    });

    let text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    // Validate required fields
    if (!parsed.rating || !parsed.summary) return null;

    const validRatings: BoatingRating[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'];
    if (!validRatings.includes(parsed.rating)) return null;

    return {
      rating: parsed.rating,
      summary: parsed.summary,
      bestTimes: parsed.bestTimes || '',
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
    };
  } catch (err) {
    console.error('Claude summary generation failed:', err);
    return null;
  }
}

// --- Rule-based fallback ---

function generateFallbackSummary(
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[]
): BoatingSummary {
  let rating: BoatingRating = 'Excellent';
  const hazards: string[] = [];
  const summaryParts: string[] = [];

  // Check alerts — downgrade from Excellent baseline
  const severeEvents = ['Gale Warning', 'Storm Warning', 'Hurricane Warning', 'Tornado Warning'];
  const moderateEvents = ['Small Craft Advisory', 'Hazardous Seas Warning', 'Heavy Freezing Spray Warning'];

  function worstRating(current: BoatingRating, candidate: BoatingRating): BoatingRating {
    const order: BoatingRating[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'];
    return order.indexOf(candidate) > order.indexOf(current) ? candidate : current;
  }

  for (const a of marine.alerts) {
    if (severeEvents.some(e => a.event.includes(e))) {
      rating = worstRating(rating, 'Dangerous');
      hazards.push(`${a.event} in effect`);
    } else if (moderateEvents.some(e => a.event.includes(e))) {
      rating = worstRating(rating, 'Poor');
      hazards.push(`${a.event} in effect`);
    } else if (a.severity === 'Severe' || a.severity === 'Extreme') {
      rating = worstRating(rating, 'Dangerous');
      hazards.push(`${a.event} in effect`);
    } else if (a.severity === 'Moderate') {
      rating = worstRating(rating, 'Fair');
      hazards.push(`${a.event} in effect`);
    }
  }

  // Check buoy conditions
  const buoy = marine.buoy;
  if (buoy && !buoy.isOffline) {
    const wind = buoy.windSpeed ?? 0;
    const gust = buoy.windGust ?? 0;
    const waves = buoy.waveHeight ?? 0;

    if (wind > 30 || gust > 40 || waves > 7) {
      rating = worstRating(rating, 'Dangerous');
    } else if (wind > 20 || gust > 30 || waves > 5) {
      rating = worstRating(rating, 'Poor');
    } else if (wind > 15 || waves > 3) {
      rating = worstRating(rating, 'Fair');
    } else if (wind >= 10 || waves >= 2) {
      rating = worstRating(rating, 'Good');
    }

    summaryParts.push(`Winds are currently ${wind} knots${gust > wind ? ` gusting to ${gust} knots` : ''} with waves around ${waves} feet.`);
    if (buoy.waterTemp !== null) {
      summaryParts.push(`Water temperature is ${buoy.waterTemp}°F.`);
    }
  } else {
    // Use NWS forecast instead
    const today = marine.forecast[0];
    if (today) {
      summaryParts.push(`Today's forecast: ${today.shortForecast}, ${today.temperature}°${today.temperatureUnit}, winds ${today.windDirection} ${today.windSpeed}.`);
      // Try to parse wind speed from forecast string
      const windMatch = today.windSpeed.match(/(\d+)/);
      if (windMatch) {
        const forecastWind = parseInt(windMatch[1]);
        if (forecastWind > 25) rating = worstRating(rating, 'Poor');
        else if (forecastWind > 15) rating = worstRating(rating, 'Fair');
        else if (forecastWind >= 10) rating = worstRating(rating, 'Good');
      }
    }
    summaryParts.push('Offshore buoy data is currently unavailable.');
  }

  // Vessel warnings
  const enRoute = vessels.filter(v => v.status === 'en_route' && v.vessel_type !== null && v.vessel_type >= 70);
  for (const v of enRoute) {
    const eta = v.eta ? new Date(v.eta).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }) : 'unknown time';
    hazards.push(`${vesselTypeLabel(v.vessel_type)} ${v.vessel_name || 'vessel'} arriving ~${eta} — avoid the channel`);
  }

  // Beach warnings
  if (!beach.isOffSeason) {
    const advisory = beach.beaches.filter(b => b.status === 'advisory');
    for (const b of advisory) {
      hazards.push(`Elevated E. coli at ${b.name} — avoid swimming`);
    }
  }

  // Overall summary sentence
  const ratingDescriptions: Record<BoatingRating, string> = {
    'Excellent': 'Conditions look excellent for boating today.',
    'Good': 'Good conditions for being on the water today.',
    'Fair': 'Fair boating conditions — exercise caution.',
    'Poor': 'Poor conditions — not recommended for small craft.',
    'Dangerous': 'Dangerous conditions — stay off the water.',
  };
  summaryParts.unshift(ratingDescriptions[rating]);

  return {
    rating,
    summary: summaryParts.join(' '),
    bestTimes: rating === 'Dangerous' ? 'Not recommended to go out today.' :
               rating === 'Poor' ? 'Conditions are unfavorable most of the day.' :
               'Check the hourly forecast tab for the calmest windows.',
    hazards,
    generatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

// --- Main entry ---

export async function generateBoatingSummary(
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[]
): Promise<BoatingSummary> {
  const context = assembleContext(marine, beach, vessels);

  const aiSummary = await generateAiSummary(context);
  if (aiSummary) return aiSummary;

  return generateFallbackSummary(marine, beach, vessels);
}
