const ADVISORY_THRESHOLD = 235; // cfu/100mL — Ohio single sample maximum

const BEACHES = [
  { id: '21OHBCH-OHLVLO01', name: 'Lakeview Beach' },
  { id: '21OHBCH-OH22025', name: 'Lakewood Beach Park' },
  { id: '21OHBCH-OH42025', name: 'Community Park Beach' },
  { id: '21OHBCH-OHCBLO01', name: 'Century Beach' },
  { id: '21OHBCH-ECHDSHOW', name: 'Showse Park' },
];

export interface BeachReading {
  date: string;
  value: number | null;
}

export interface BeachData {
  id: string;
  name: string;
  latestReading: BeachReading | null;
  status: 'safe' | 'advisory' | 'no-data';
  readings: BeachReading[];
  seasonStats: {
    totalSamples: number;
    advisoryCount: number;
    safePct: number;
  };
}

export interface BeachQualityResponse {
  beaches: BeachData[];
  seasonYear: number;
  isOffSeason: boolean;
  fetchedAt: string;
}

/** Parse WQP CSV response into readings grouped by station */
function parseWqpCsv(csv: string): Map<string, BeachReading[]> {
  const lines = csv.split('\n');
  if (lines.length < 2) return new Map();

  const header = lines[0].split(',');
  const dateIdx = header.indexOf('ActivityStartDate');
  const stationIdx = header.indexOf('MonitoringLocationIdentifier');
  const valueIdx = header.indexOf('ResultMeasureValue');

  if (dateIdx === -1 || stationIdx === -1 || valueIdx === -1) return new Map();

  const byStation = new Map<string, BeachReading[]>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= Math.max(dateIdx, stationIdx, valueIdx)) continue;

    const station = cols[stationIdx];
    const date = cols[dateIdx];
    const rawValue = cols[valueIdx];
    if (!station || !date) continue;

    const value = rawValue ? parseFloat(rawValue) : null;
    if (value !== null && isNaN(value)) continue;

    if (!byStation.has(station)) byStation.set(station, []);
    byStation.get(station)!.push({ date, value });
  }

  // Sort each station's readings by date descending
  for (const readings of byStation.values()) {
    readings.sort((a, b) => b.date.localeCompare(a.date));
  }

  return byStation;
}

// --- In-memory cache ---
let beachCache: { data: BeachQualityResponse; ts: number } | null = null;
const BEACH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Fetch beach water quality data from WQP API */
export async function fetchBeachData(): Promise<BeachQualityResponse> {
  if (beachCache && Date.now() - beachCache.ts < BEACH_CACHE_TTL) {
    return beachCache.data;
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Swim season: May through September
  const isOffSeason = currentMonth < 5 || currentMonth > 9;
  const seasonYear = isOffSeason && currentMonth < 5 ? currentYear - 1 : currentYear;

  // Build station IDs for query
  const stationIds = BEACHES.map(b => b.id).join(';');

  const url = `https://www.waterqualitydata.us/data/Result/search?siteid=${encodeURIComponent(stationIds)}&characteristicName=Escherichia%20coli&mimeType=csv&sorted=no&startDateLo=01-01-${seasonYear}&startDateHi=12-31-${seasonYear}`;

  let csv = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      csv = await res.text();
    }
  } catch (err) {
    console.error('WQP API error:', err);
  }

  // If no data for current season year, try previous year
  let actualYear = seasonYear;
  if (!csv || csv.split('\n').length < 2) {
    const fallbackUrl = `https://www.waterqualitydata.us/data/Result/search?siteid=${encodeURIComponent(stationIds)}&characteristicName=Escherichia%20coli&mimeType=csv&sorted=no&startDateLo=01-01-${seasonYear - 1}&startDateHi=12-31-${seasonYear - 1}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(fallbackUrl, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        csv = await res.text();
        actualYear = seasonYear - 1;
      }
    } catch (err) {
      console.error('WQP API fallback error:', err);
    }
  }

  const byStation = parseWqpCsv(csv);

  const beaches: BeachData[] = BEACHES.map(beach => {
    const readings = byStation.get(beach.id) || [];
    // Find latest reading with a non-null value
    const latestReading = readings.find(r => r.value !== null) || null;

    let status: BeachData['status'] = 'no-data';
    if (latestReading?.value !== null && latestReading?.value !== undefined) {
      status = latestReading.value >= ADVISORY_THRESHOLD ? 'advisory' : 'safe';
    }

    const validReadings = readings.filter(r => r.value !== null);
    const advisoryCount = validReadings.filter(r => r.value! >= ADVISORY_THRESHOLD).length;
    const totalSamples = validReadings.length;

    return {
      id: beach.id,
      name: beach.name,
      latestReading,
      status,
      readings,
      seasonStats: {
        totalSamples,
        advisoryCount,
        safePct: totalSamples > 0 ? Math.round(((totalSamples - advisoryCount) / totalSamples) * 100) : 0,
      },
    };
  });

  const result: BeachQualityResponse = {
    beaches,
    seasonYear: actualYear,
    isOffSeason,
    fetchedAt: new Date().toISOString(),
  };

  beachCache = { data: result, ts: Date.now() };
  return result;
}
