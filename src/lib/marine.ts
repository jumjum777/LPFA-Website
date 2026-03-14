/* =========================================================
   Marine Forecast — Data Fetching & Parsing
   Shared by /api/marine route and /marine page
   ========================================================= */

const NWS_UA = 'lorainport.com, info@lorainport.com';

// --- Types ---

export interface MarineAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  onset: string;
  expires: string;
  areaDesc: string;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
}

export interface HourlyPeriod {
  startTime: string;
  temperature: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  precipChance: number | null;
}

export interface BuoyData {
  timestamp: string;
  windSpeed: number | null;     // knots
  windGust: number | null;      // knots
  windDirection: number | null;  // degrees
  waveHeight: number | null;    // feet
  wavePeriod: number | null;    // seconds
  waterTemp: number | null;     // °F
  airTemp: number | null;       // °F
  pressure: number | null;      // hPa
  isOffline: boolean;
}

export interface MarineTextPeriod {
  title: string;
  body: string;
}

export interface NearshoreTemp {
  value: number | null;       // degrees F
  source: 'coops' | 'nws-text' | null;
  station: string;
  timestamp: string;
}

export interface MarineData {
  alerts: MarineAlert[];
  forecast: ForecastPeriod[];
  hourly: HourlyPeriod[];
  marineText: string | null;
  marineTextPeriods: MarineTextPeriod[];
  buoy: BuoyData | null;
  nearshoreTemp: NearshoreTemp;
  fetchedAt: string;
}

// --- Unit conversions ---

function msToKnots(ms: number): number {
  return Math.round(ms * 1.94384 * 10) / 10;
}

function metersToFeet(m: number): number {
  return Math.round(m * 3.28084 * 10) / 10;
}

function celsiusToF(c: number): number {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}

function parseNumOrNull(val: string): number | null {
  if (!val || val === 'MM' || val === 'N/A') return null;
  const n = parseFloat(val);
  if (isNaN(n) || n >= 99 && val.replace(/\./g, '').match(/^9+0*$/)) return null;
  return n;
}

// --- Parsers ---

function parseAlerts(json: unknown): MarineAlert[] {
  const data = json as { features?: { properties: Record<string, string>; id: string }[] };
  if (!data?.features) return [];
  return data.features.map(f => ({
    id: f.id || f.properties.id || '',
    event: f.properties.event || '',
    headline: f.properties.headline || '',
    description: f.properties.description || '',
    severity: f.properties.severity || '',
    urgency: f.properties.urgency || '',
    onset: f.properties.onset || '',
    expires: f.properties.expires || '',
    areaDesc: f.properties.areaDesc || '',
  }));
}

function parseForecast(json: unknown): ForecastPeriod[] {
  const data = json as { properties?: { periods?: Record<string, unknown>[] } };
  if (!data?.properties?.periods) return [];
  return data.properties.periods.map(p => ({
    number: p.number as number,
    name: p.name as string,
    startTime: p.startTime as string,
    endTime: p.endTime as string,
    isDaytime: p.isDaytime as boolean,
    temperature: p.temperature as number,
    temperatureUnit: p.temperatureUnit as string,
    windSpeed: p.windSpeed as string,
    windDirection: p.windDirection as string,
    shortForecast: p.shortForecast as string,
    detailedForecast: p.detailedForecast as string,
    icon: p.icon as string,
  }));
}

function parseHourly(json: unknown): HourlyPeriod[] {
  const data = json as { properties?: { periods?: Record<string, unknown>[] } };
  if (!data?.properties?.periods) return [];
  return data.properties.periods.slice(0, 48).map(p => {
    const probPrecip = p.probabilityOfPrecipitation as { value: number | null } | undefined;
    return {
      startTime: p.startTime as string,
      temperature: p.temperature as number,
      windSpeed: p.windSpeed as string,
      windDirection: p.windDirection as string,
      shortForecast: p.shortForecast as string,
      precipChance: probPrecip?.value ?? null,
    };
  });
}

function parseBuoy(text: string): BuoyData {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return { timestamp: '', windSpeed: null, windGust: null, windDirection: null, waveHeight: null, wavePeriod: null, waterTemp: null, airTemp: null, pressure: null, isOffline: true };

  const cols = lines[2].trim().split(/\s+/);
  // Columns: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE
  if (cols.length < 15) return { timestamp: '', windSpeed: null, windGust: null, windDirection: null, waveHeight: null, wavePeriod: null, waterTemp: null, airTemp: null, pressure: null, isOffline: true };

  const windSpeedRaw = parseNumOrNull(cols[6]);
  const gustRaw = parseNumOrNull(cols[7]);
  const waveRaw = parseNumOrNull(cols[8]);
  const wavePeriodRaw = parseNumOrNull(cols[9]);
  const pressureRaw = parseNumOrNull(cols[12]);
  const airTempRaw = parseNumOrNull(cols[13]);
  const waterTempRaw = parseNumOrNull(cols[14]);
  const windDirRaw = parseNumOrNull(cols[5]);

  const allNull = [windSpeedRaw, gustRaw, waveRaw, wavePeriodRaw, airTempRaw, waterTempRaw].every(v => v === null);

  return {
    timestamp: `${cols[0]}-${cols[1]}-${cols[2]}T${cols[3]}:${cols[4]}:00Z`,
    windSpeed: windSpeedRaw !== null ? msToKnots(windSpeedRaw) : null,
    windGust: gustRaw !== null ? msToKnots(gustRaw) : null,
    windDirection: windDirRaw,
    waveHeight: waveRaw !== null ? metersToFeet(waveRaw) : null,
    wavePeriod: wavePeriodRaw,
    waterTemp: waterTempRaw !== null ? celsiusToF(waterTempRaw) : null,
    airTemp: airTempRaw !== null ? celsiusToF(airTempRaw) : null,
    pressure: pressureRaw,
    isOffline: allNull,
  };
}

// --- Nearshore water temperature parsers ---

function parseCoOpsWaterTemp(json: unknown): NearshoreTemp {
  const data = json as { metadata?: { id?: string }; data?: { t?: string; v?: string }[] };
  if (!data?.data?.[0]?.v) {
    return { value: null, source: null, station: '9063063', timestamp: '' };
  }
  const val = parseFloat(data.data[0].v);
  if (isNaN(val)) {
    return { value: null, source: null, station: '9063063', timestamp: '' };
  }
  return {
    value: Math.round(val * 10) / 10,
    source: 'coops',
    station: 'Cleveland (9063063)',
    timestamp: data.data[0].t || '',
  };
}

function parseNwsTextWaterTemp(text: string): NearshoreTemp {
  // NWS nearshore text contains: "off Cleveland 37 degrees"
  const match = text.match(/off Cleveland\s+(\d+)\s+degrees/i);
  if (!match) {
    return { value: null, source: null, station: '', timestamp: '' };
  }
  return {
    value: parseInt(match[1], 10),
    source: 'nws-text',
    station: 'NWS Nearshore Forecast',
    timestamp: '',
  };
}

// --- Marine text parser ---

function parseMarineText(raw: string): MarineTextPeriod[] {
  const periods: MarineTextPeriod[] = [];
  // NWS marine text uses lines starting with "." for period headers, e.g. ".TODAY...", ".TONIGHT..."
  const blocks = raw.split(/\n(?=\.(?!\.\.))/).filter(b => b.trim());
  for (const block of blocks) {
    const match = block.match(/^\.([^.]+)\.\.\.([\s\S]*)/);
    if (match) {
      periods.push({
        title: match[1].trim(),
        body: match[2].trim(),
      });
    }
  }
  return periods;
}

// --- In-memory cache ---
let marineCache: { data: MarineData; ts: number } | null = null;
const MARINE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// --- Main fetch ---

export async function fetchMarineData(): Promise<MarineData> {
  if (marineCache && Date.now() - marineCache.ts < MARINE_CACHE_TTL) {
    return marineCache.data;
  }
  const headers = { 'User-Agent': NWS_UA };

  function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...opts, cache: 'no-store', signal: controller.signal }).finally(() => clearTimeout(timeout));
  }

  const [alertsRes, marineAlertsRes, forecastRes, hourlyRes, marineTextRes, buoyRes, coopsRes] = await Promise.allSettled([
    fetchWithTimeout('https://api.weather.gov/alerts/active?point=41.4528,-82.1824', { headers }),
    // Marine zone alerts — LEZ144 (Islands–Vermilion), LEZ145 (Vermilion–Avon Point),
    // LEZ146 (Avon Point–Willowick) — three nearshore zones covering Lorain area
    fetchWithTimeout('https://api.weather.gov/alerts/active?zone=LEZ144,LEZ145,LEZ146', { headers }),
    fetchWithTimeout('https://api.weather.gov/gridpoints/CLE/67,61/forecast', { headers }),
    fetchWithTimeout('https://api.weather.gov/gridpoints/CLE/67,61/forecast/hourly', { headers }),
    fetchWithTimeout('https://tgftp.nws.noaa.gov/data/forecasts/marine/near_shore/le/lez145.txt'),
    fetchWithTimeout('https://www.ndbc.noaa.gov/data/realtime2/45005.txt'),
    // NOAA CO-OPS Cleveland station — year-round nearshore water temp
    fetchWithTimeout('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9063063&product=water_temperature&units=english&time_zone=lst_ldt&format=json'),
  ]);

  let alerts: MarineAlert[] = [];
  let forecast: ForecastPeriod[] = [];
  let hourly: HourlyPeriod[] = [];
  let marineText: string | null = null;
  let buoy: BuoyData | null = null;

  try {
    if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
      alerts = parseAlerts(await alertsRes.value.json());
    }
  } catch { /* ignore */ }

  // Merge marine zone alerts, deduplicating by alert ID
  try {
    if (marineAlertsRes.status === 'fulfilled' && marineAlertsRes.value.ok) {
      const marineAlerts = parseAlerts(await marineAlertsRes.value.json());
      const existingIds = new Set(alerts.map(a => a.id));
      for (const a of marineAlerts) {
        if (!existingIds.has(a.id)) {
          alerts.push(a);
        }
      }
    }
  } catch { /* ignore */ }

  try {
    if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
      forecast = parseForecast(await forecastRes.value.json());
    }
  } catch { /* ignore */ }

  try {
    if (hourlyRes.status === 'fulfilled' && hourlyRes.value.ok) {
      hourly = parseHourly(await hourlyRes.value.json());
    }
  } catch { /* ignore */ }

  try {
    if (marineTextRes.status === 'fulfilled' && marineTextRes.value.ok) {
      marineText = await marineTextRes.value.text();
    }
  } catch { /* ignore */ }

  try {
    if (buoyRes.status === 'fulfilled' && buoyRes.value.ok) {
      buoy = parseBuoy(await buoyRes.value.text());
    } else {
      buoy = { timestamp: '', windSpeed: null, windGust: null, windDirection: null, waveHeight: null, wavePeriod: null, waterTemp: null, airTemp: null, pressure: null, isOffline: true };
    }
  } catch {
    buoy = { timestamp: '', windSpeed: null, windGust: null, windDirection: null, waveHeight: null, wavePeriod: null, waterTemp: null, airTemp: null, pressure: null, isOffline: true };
  }

  // Nearshore water temp: CO-OPS primary, NWS text fallback
  let nearshoreTemp: NearshoreTemp = { value: null, source: null, station: '', timestamp: '' };
  try {
    if (coopsRes.status === 'fulfilled' && coopsRes.value.ok) {
      nearshoreTemp = parseCoOpsWaterTemp(await coopsRes.value.json());
    }
  } catch { /* ignore */ }

  // Fallback to NWS marine text if CO-OPS failed
  if (nearshoreTemp.value === null && marineText) {
    nearshoreTemp = parseNwsTextWaterTemp(marineText);
  }

  const result: MarineData = {
    alerts,
    forecast,
    hourly,
    marineText,
    marineTextPeriods: marineText ? parseMarineText(marineText) : [],
    buoy,
    nearshoreTemp,
    fetchedAt: new Date().toISOString(),
  };

  marineCache = { data: result, ts: Date.now() };
  return result;
}
