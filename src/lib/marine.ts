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

export interface MarineData {
  alerts: MarineAlert[];
  forecast: ForecastPeriod[];
  hourly: HourlyPeriod[];
  marineText: string | null;
  marineTextPeriods: MarineTextPeriod[];
  buoy: BuoyData | null;
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

// --- Main fetch ---

export async function fetchMarineData(): Promise<MarineData> {
  const headers = { 'User-Agent': NWS_UA };

  const [alertsRes, forecastRes, hourlyRes, marineTextRes, buoyRes] = await Promise.allSettled([
    fetch('https://api.weather.gov/alerts/active?point=41.4528,-82.1824', {
      headers,
      next: { revalidate: 900 },
    }),
    fetch('https://api.weather.gov/gridpoints/CLE/67,61/forecast', {
      headers,
      next: { revalidate: 1800 },
    }),
    fetch('https://api.weather.gov/gridpoints/CLE/67,61/forecast/hourly', {
      headers,
      next: { revalidate: 1800 },
    }),
    fetch('https://tgftp.nws.noaa.gov/data/forecasts/marine/near_shore/le/lez145.txt', {
      next: { revalidate: 1800 },
    }),
    fetch('https://www.ndbc.noaa.gov/data/realtime2/45005.txt', {
      next: { revalidate: 1800 },
    }),
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

  return {
    alerts,
    forecast,
    hourly,
    marineText,
    marineTextPeriods: marineText ? parseMarineText(marineText) : [],
    buoy,
    fetchedAt: new Date().toISOString(),
  };
}
