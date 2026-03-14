import Anthropic from '@anthropic-ai/sdk';
import type { MarineData, MarineAlert, HourlyPeriod, ForecastPeriod } from './marine';
import type { BeachQualityResponse } from './beach';
import type { VesselRecord } from './vessels';

// ─── Types ──────────────────────────────────────────────────────────────────

export type BoatingRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
export type BoatSize = 'small' | 'medium' | 'large' | 'jetski';
export type BoatType = 'powerboat' | 'sailboat';
export type BoatActivity = 'cruising' | 'fishing' | 'swimming' | 'watersports' | 'wave-jumping';
type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';

export interface TripRequest {
  boatSize: BoatSize;
  boatType?: BoatType;
  activities?: BoatActivity[];
  departurePoint: string;
  destination: string;
  departureTime: string; // ISO datetime
  returnTime: string;    // ISO datetime
  experienceLevel: ExperienceLevel;
}

export interface WindowAnalysis {
  rating: BoatingRating;
  narrative: string;
  wind: string | null;
  waves: string | null;
  precip: string | null;
  temp: string | null;
}

export interface AlternativeWindow {
  label: string;
  departure: string;
  returnBy: string;
  rating: BoatingRating;
  reason: string;
}

export interface TripAnalysis {
  overallRating: BoatingRating;
  departure: WindowAnalysis;
  returnWindow: WindowAnalysis;
  summary: string;
  hazards: string[];
  recommendations: string[];
  alternativeTimes: AlternativeWindow[];
  travelWarning: string | null;
  dataConfidence: 'high' | 'medium' | 'low';
  dataLimitations: string[];
  generatedAt: string;
  isAiGenerated: boolean;
}

// ─── Multi-Stop Types ────────────────────────────────────────────────────────

export interface TripLeg {
  from: string;          // destination ID
  to: string;            // destination ID
  departureTime: string; // ISO — when leaving `from`
}

export interface LegAnalysis {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  departureTime: string;
  estimatedArrival: string;
  transitMinutes: number;
  conditions: WindowAnalysis;
  travelWarning: string | null;
}

export interface MultiStopAnalysis {
  overallRating: BoatingRating;
  legs: LegAnalysis[];
  summary: string;
  hazards: string[];
  recommendations: string[];
  dataConfidence: 'high' | 'medium' | 'low';
  dataLimitations: string[];
  generatedAt: string;
  isAiGenerated: boolean;
}

export interface MultiStopRequest {
  boatSize: BoatSize;
  boatType?: BoatType;
  activities?: BoatActivity[];
  experienceLevel: ExperienceLevel;
  legs: TripLeg[];
}

// ─── Destinations ───────────────────────────────────────────────────────────

export const DESTINATIONS = [
  { value: 'lorain', label: 'Lorain Harbor', distance: '0 mi', time: '—', lat: 41.468, lng: -82.178, transitMinutes: 0 },
  { value: 'ashtabula', label: 'Ashtabula Harbor', distance: '65 mi E', time: '~3.5 hr', lat: 41.911, lng: -80.790, transitMinutes: 210 },
  { value: 'avon-lake', label: 'Avon Lake', distance: '6 mi E', time: '~20 min', lat: 41.494, lng: -82.028, transitMinutes: 20 },
  { value: 'avon-point', label: 'Avon Point', distance: '7 mi E', time: '~20 min', lat: 41.506, lng: -82.032, transitMinutes: 20 },
  { value: 'bay-village', label: 'Bay Village', distance: '14 mi E', time: '~40 min', lat: 41.494, lng: -81.922, transitMinutes: 40 },
  { value: 'cleveland', label: 'Cleveland Harbor', distance: '25 mi E', time: '~1.5 hr', lat: 41.509, lng: -81.704, transitMinutes: 85 },
  { value: 'edgewater', label: 'Edgewater Marina', distance: '23 mi E', time: '~1.25 hr', lat: 41.497, lng: -81.735, transitMinutes: 75 },
  { value: 'fairport', label: 'Fairport Harbor', distance: '40 mi E', time: '~2 hr', lat: 41.762, lng: -81.281, transitMinutes: 120 },
  { value: 'geneva', label: 'Geneva-on-the-Lake', distance: '55 mi E', time: '~3 hr', lat: 41.860, lng: -80.951, transitMinutes: 180 },
  { value: 'huron', label: 'Huron Harbor', distance: '20 mi W', time: '~1 hr', lat: 41.405, lng: -82.555, transitMinutes: 60 },
  { value: 'kelleys-island', label: 'Kelleys Island', distance: '35 mi NW', time: '~2 hr', lat: 41.601, lng: -82.708, transitMinutes: 120 },
  { value: 'lakewood', label: 'Lakewood', distance: '20 mi E', time: '~1 hr', lat: 41.490, lng: -81.798, transitMinutes: 60 },
  { value: 'mentor-headlands', label: 'Mentor Headlands', distance: '43 mi E', time: '~2.25 hr', lat: 41.770, lng: -81.228, transitMinutes: 135 },
  { value: 'put-in-bay', label: 'Put-in-Bay', distance: '50 mi NW', time: '~2.5-3 hr', lat: 41.653, lng: -82.820, transitMinutes: 165 },
  { value: 'rocky-river', label: 'Rocky River', distance: '18 mi E', time: '~55 min', lat: 41.483, lng: -81.841, transitMinutes: 55 },
  { value: 'sandusky', label: 'Sandusky Bay', distance: '25 mi W', time: '~1.5 hr', lat: 41.464, lng: -82.708, transitMinutes: 90 },
  { value: 'sheffield-lake', label: 'Sheffield Lake', distance: '3 mi E', time: '~10 min', lat: 41.484, lng: -82.101, transitMinutes: 10 },
  { value: 'vermilion', label: 'Vermilion Harbor', distance: '8 mi W', time: '~30 min', lat: 41.424, lng: -82.365, transitMinutes: 30 },
  { value: 'open-water', label: 'Open Water / Fishing Trip', distance: 'varies', time: '—', lat: 41.55, lng: -82.18, transitMinutes: 0 },
];

// ─── Transit Helpers ──────────────────────────────────────────────────────────

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get estimated transit in minutes between two destinations.
 *  Powerboats/jet skis cruise at ~18 kts, sailboats at ~7 kts. */
export function getTransitMinutes(fromId: string, toId: string, boatType?: BoatType): number {
  if (fromId === toId) return 0;
  const from = DESTINATIONS.find(d => d.value === fromId);
  const to = DESTINATIONS.find(d => d.value === toId);
  if (!from || !to) return 0;
  const nm = haversineNM(from.lat, from.lng, to.lat, to.lng);
  const speed = boatType === 'sailboat' ? 7 : 18; // knots
  return Math.round(nm / speed * 60);
}

/** Format minutes into readable transit time */
export function formatTransitTime(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `~${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hrs} hr ${mins} min` : `~${hrs} hr`;
}

/** Get destination label (short name) by ID */
export function getDestLabel(id: string): string {
  return DESTINATIONS.find(d => d.value === id)?.label || id;
}

// ─── Boat-Size Thresholds ───────────────────────────────────────────────────

interface Thresholds {
  excellent: { wind: number; waves: number };
  good: { wind: number; waves: number };
  fair: { wind: number; waves: number };
  poor: { wind: number; waves: number };
}

const SIZE_THRESHOLDS: Record<BoatSize, Thresholds> = {
  jetski: {
    excellent: { wind: 12, waves: 2.5 },
    good: { wind: 18, waves: 3.5 },
    fair: { wind: 22, waves: 4.5 },
    poor: { wind: 28, waves: 6 },
  },
  small: {
    excellent: { wind: 10, waves: 2 },
    good: { wind: 15, waves: 3 },
    fair: { wind: 20, waves: 5 },
    poor: { wind: 30, waves: 7 },
  },
  medium: {
    excellent: { wind: 12, waves: 2.5 },
    good: { wind: 18, waves: 4 },
    fair: { wind: 25, waves: 6 },
    poor: { wind: 35, waves: 8 },
  },
  large: {
    excellent: { wind: 15, waves: 3 },
    good: { wind: 20, waves: 5 },
    fair: { wind: 30, waves: 7 },
    poor: { wind: 40, waves: 10 },
  },
};

// Sailboat thresholds — wind has a floor (too little = bad) and ceiling
const SAILBOAT_THRESHOLDS: Record<'small' | 'medium' | 'large', Thresholds & { minWind: number }> = {
  small: {
    excellent: { wind: 18, waves: 2.5 },
    good: { wind: 22, waves: 3.5 },
    fair: { wind: 28, waves: 5 },
    poor: { wind: 35, waves: 7 },
    minWind: 6,
  },
  medium: {
    excellent: { wind: 20, waves: 3 },
    good: { wind: 25, waves: 4 },
    fair: { wind: 30, waves: 6 },
    poor: { wind: 38, waves: 8 },
    minWind: 5,
  },
  large: {
    excellent: { wind: 22, waves: 3.5 },
    good: { wind: 28, waves: 5 },
    fair: { wind: 35, waves: 7 },
    poor: { wind: 42, waves: 10 },
    minWind: 5,
  },
};

/** Get the effective thresholds based on boat size + type */
function getThresholds(boatSize: BoatSize, boatType?: BoatType): Thresholds {
  if (boatType === 'sailboat' && boatSize !== 'jetski') {
    return SAILBOAT_THRESHOLDS[boatSize as 'small' | 'medium' | 'large'];
  }
  return SIZE_THRESHOLDS[boatSize];
}

// ─── Data Slicing ───────────────────────────────────────────────────────────

interface TimeWindow {
  hourly: HourlyPeriod[];
  forecast: ForecastPeriod[];
  alerts: MarineAlert[];
  confidence: 'high' | 'medium' | 'low';
}

function sliceToWindow(
  centerTime: Date,
  marine: MarineData,
  windowHours: number = 1.5
): TimeWindow {
  const windowStart = new Date(centerTime.getTime() - windowHours * 3600000);
  const windowEnd = new Date(centerTime.getTime() + windowHours * 3600000);

  // Hourly data within window
  const hourly = marine.hourly.filter(h => {
    const t = new Date(h.startTime);
    return t >= windowStart && t <= windowEnd;
  });

  // 7-day forecast periods overlapping window
  const forecast = marine.forecast.filter(f => {
    const start = new Date(f.startTime);
    const end = new Date(f.endTime);
    return start <= windowEnd && end >= windowStart;
  });

  // Alerts active during window
  const alerts = marine.alerts.filter(a => {
    if (!a.onset && !a.expires) return true; // no time info, assume active
    const onset = a.onset ? new Date(a.onset) : new Date(0);
    const expires = a.expires ? new Date(a.expires) : new Date('2099-01-01');
    return onset <= windowEnd && expires >= windowStart;
  });

  const confidence: 'high' | 'medium' | 'low' =
    hourly.length >= 2 ? 'high' :
    forecast.length > 0 ? 'medium' : 'low';

  return { hourly, forecast, alerts, confidence };
}

function parseWindSpeed(windStr: string): number {
  // Parse "10 mph", "10 to 15 mph", "15 knots", etc.
  const matches = windStr.match(/(\d+)/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function extractWindowConditions(window: TimeWindow): {
  maxWind: number; avgTemp: number; maxPrecip: number; windStr: string;
} {
  if (window.hourly.length > 0) {
    const winds = window.hourly.map(h => parseWindSpeed(h.windSpeed));
    const temps = window.hourly.map(h => h.temperature);
    const precips = window.hourly.map(h => h.precipChance ?? 0);
    return {
      maxWind: Math.max(...winds),
      avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
      maxPrecip: Math.max(...precips),
      windStr: window.hourly[0].windDirection + ' ' + window.hourly[0].windSpeed,
    };
  }
  if (window.forecast.length > 0) {
    const f = window.forecast[0];
    return {
      maxWind: parseWindSpeed(f.windSpeed),
      avgTemp: f.temperature,
      maxPrecip: 0,
      windStr: f.windDirection + ' ' + f.windSpeed,
    };
  }
  return { maxWind: 0, avgTemp: 0, maxPrecip: 0, windStr: 'N/A' };
}

function rateConditions(
  maxWind: number,
  waveHeight: number | null,
  boatSize: BoatSize,
  alerts: MarineAlert[],
  boatType?: BoatType,
  activities?: BoatActivity[]
): BoatingRating {
  const t = getThresholds(boatSize, boatType);
  let rating: BoatingRating = 'Excellent';

  const effectiveWaves = waveHeight ?? estimateWavesFromWind(maxWind);

  if (maxWind > t.poor.wind || effectiveWaves > t.poor.waves) rating = 'Dangerous';
  else if (maxWind > t.fair.wind || effectiveWaves > t.fair.waves) rating = 'Poor';
  else if (maxWind > t.good.wind || effectiveWaves > t.good.waves) rating = 'Fair';
  else if (maxWind > t.excellent.wind || effectiveWaves > t.excellent.waves) rating = 'Good';

  // Sailboat low-wind downgrade
  if (boatType === 'sailboat' && boatSize !== 'jetski') {
    const minWind = SAILBOAT_THRESHOLDS[boatSize as 'small' | 'medium' | 'large'].minWind;
    if (maxWind < minWind) {
      rating = worseRating(rating, 'Fair'); // too little wind for sailing
    }
  }

  // Activity-based downgrades
  const acts = activities || ['cruising'];
  if (acts.includes('swimming')) {
    // Swimming needs calm water
    if (effectiveWaves > 2) rating = worseRating(rating, 'Poor');
    else if (effectiveWaves > 1.5 || maxWind > 15) rating = worseRating(rating, 'Fair');
  }
  if (acts.includes('fishing')) {
    // Fishing is harder in chop — more sensitive than cruising
    if (effectiveWaves > 3) rating = worseRating(rating, 'Poor');
    else if (effectiveWaves > 2 || maxWind > 18) rating = worseRating(rating, 'Fair');
  }
  if (acts.includes('watersports')) {
    // Tubing/skiing needs relatively calm water
    if (effectiveWaves > 2.5 || maxWind > 18) rating = worseRating(rating, 'Poor');
    else if (effectiveWaves > 1.5 || maxWind > 12) rating = worseRating(rating, 'Fair');
  }
  if (acts.includes('wave-jumping')) {
    // Wave jumping wants some chop — too calm is boring, too rough is dangerous
    if (effectiveWaves < 1) rating = worseRating(rating, 'Fair'); // not enough waves
    // Very high waves still dangerous for PWC
    if (effectiveWaves > 5) rating = worseRating(rating, 'Dangerous');
    else if (effectiveWaves > 4) rating = worseRating(rating, 'Poor');
  }

  // Alert-based downgrades
  const severeEvents = ['Gale Warning', 'Storm Warning', 'Hurricane Warning'];
  const moderateEvents = ['Small Craft Advisory', 'Hazardous Seas Warning'];
  const stormEvents = ['Thunderstorm', 'Lightning'];

  for (const a of alerts) {
    if (severeEvents.some(e => a.event.includes(e))) {
      rating = worseRating(rating, 'Dangerous');
    } else if (moderateEvents.some(e => a.event.includes(e))) {
      rating = worseRating(rating, 'Poor');
    }
    // Thunderstorms are extra dangerous for jet skis (no shelter) and sailboats (mast/lightning)
    if ((boatSize === 'jetski' || boatType === 'sailboat') && stormEvents.some(e => a.event.includes(e))) {
      rating = worseRating(rating, 'Dangerous');
    }
  }

  return rating;
}

function estimateWavesFromWind(windKts: number): number {
  // Rough Lake Erie estimate: waves ≈ wind_kts / 5 in feet
  return windKts / 5;
}

function worseRating(a: BoatingRating, b: BoatingRating): BoatingRating {
  const order: BoatingRating[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'];
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

// ─── Vessel Type Labels ─────────────────────────────────────────────────────

function vesselTypeLabel(type: number | null): string {
  if (!type) return 'Vessel';
  if (type >= 70 && type <= 79) return 'Cargo';
  if (type >= 80 && type <= 89) return 'Tanker';
  if (type === 60 || type === 69) return 'Passenger';
  if (type === 30) return 'Fishing';
  if (type === 31 || type === 32) return 'Towing';
  if (type === 52) return 'Tug';
  if (type === 37) return 'Pleasure Craft';
  return 'Vessel';
}

// ─── Context Assembly for Claude ────────────────────────────────────────────

function assembleTripContext(
  trip: TripRequest,
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[],
  depWindow: TimeWindow,
  retWindow: TimeWindow,
  limitations: string[]
): string {
  const dep = new Date(trip.departureTime);
  const ret = new Date(trip.returnTime);
  const durationHrs = Math.round((ret.getTime() - dep.getTime()) / 3600000 * 10) / 10;
  const dest = DESTINATIONS.find(d => d.value === trip.destination);
  const fmtTime = (d: Date) => d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
  });

  const sizeLabels: Record<BoatSize, string> = {
    jetski: 'Jet Ski / PWC', small: 'Small (<20 ft)', medium: 'Medium (20-30 ft)', large: 'Large (30+ ft)',
  };
  const typeLabel = trip.boatType === 'sailboat' ? ' (Sailboat)' : trip.boatSize === 'jetski' ? '' : ' (Powerboat)';

  const parts: string[] = [];

  const activityLabels: Record<BoatActivity, string> = {
    cruising: 'Cruising / Sightseeing', fishing: 'Fishing',
    swimming: 'Swimming / Anchoring', watersports: 'Tubing / Water Sports',
    'wave-jumping': 'Wave Jumping (PWC)',
  };
  const acts = trip.activities?.length ? trip.activities : ['cruising' as BoatActivity];

  parts.push('TRIP DETAILS:');
  parts.push(`  Vessel: ${sizeLabels[trip.boatSize]}${typeLabel}`);
  parts.push(`  Planned Activities: ${acts.map(a => activityLabels[a]).join(', ')}`);
  parts.push(`  Experience Level: ${trip.experienceLevel.charAt(0).toUpperCase() + trip.experienceLevel.slice(1)}`);
  parts.push(`  Departure: ${fmtTime(dep)} from ${trip.departurePoint}`);
  parts.push(`  Return: ${fmtTime(ret)} to ${trip.departurePoint}`);
  parts.push(`  Destination: ${dest?.label || trip.destination} (${dest?.distance || 'unknown distance'})`);
  parts.push(`  Trip Duration: ~${durationHrs} hours`);
  if (dest?.time && dest.time !== '—') {
    parts.push(`  Estimated Transit Time: ${dest.time} each way at cruising speed`);
  }
  parts.push('');

  // Departure window
  parts.push('DEPARTURE WINDOW CONDITIONS:');
  if (depWindow.hourly.length > 0) {
    for (const h of depWindow.hourly) {
      const time = new Date(h.startTime).toLocaleString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
      const precip = h.precipChance !== null ? `, ${h.precipChance}% precip` : '';
      parts.push(`  ${time}: ${h.temperature}°F, ${h.windDirection} ${h.windSpeed}, ${h.shortForecast}${precip}`);
    }
  } else if (depWindow.forecast.length > 0) {
    const f = depWindow.forecast[0];
    parts.push(`  ${f.name}: ${f.shortForecast}, ${f.temperature}°${f.temperatureUnit}, Wind ${f.windDirection} ${f.windSpeed}`);
    parts.push(`  (7-day period forecast — less precise than hourly)`);
  } else {
    parts.push('  No forecast data available for this window');
  }
  parts.push('');

  // Return window
  parts.push('RETURN WINDOW CONDITIONS:');
  if (retWindow.hourly.length > 0) {
    for (const h of retWindow.hourly) {
      const time = new Date(h.startTime).toLocaleString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
      const precip = h.precipChance !== null ? `, ${h.precipChance}% precip` : '';
      parts.push(`  ${time}: ${h.temperature}°F, ${h.windDirection} ${h.windSpeed}, ${h.shortForecast}${precip}`);
    }
  } else if (retWindow.forecast.length > 0) {
    const f = retWindow.forecast[0];
    parts.push(`  ${f.name}: ${f.shortForecast}, ${f.temperature}°${f.temperatureUnit}, Wind ${f.windDirection} ${f.windSpeed}`);
    parts.push(`  (7-day period forecast — less precise than hourly)`);
  } else {
    parts.push('  No forecast data available for this window');
  }
  parts.push('');

  // Full trip window hourly (for context)
  const tripStart = dep;
  const tripEnd = ret;
  const fullTripHourly = marine.hourly.filter(h => {
    const t = new Date(h.startTime);
    return t >= tripStart && t <= tripEnd;
  });
  if (fullTripHourly.length > 0) {
    parts.push('FULL TRIP HOURLY FORECAST:');
    for (const h of fullTripHourly) {
      const time = new Date(h.startTime).toLocaleString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
      const precip = h.precipChance !== null ? `, ${h.precipChance}% precip` : '';
      parts.push(`  ${time}: ${h.temperature}°F, ${h.windDirection} ${h.windSpeed}, ${h.shortForecast}${precip}`);
    }
    parts.push('');
  }

  // Alerts
  const tripAlerts = marine.alerts.filter(a => {
    const onset = a.onset ? new Date(a.onset) : new Date(0);
    const expires = a.expires ? new Date(a.expires) : new Date('2099-01-01');
    return onset <= tripEnd && expires >= tripStart;
  });
  if (tripAlerts.length > 0) {
    parts.push('ALERTS OVERLAPPING TRIP:');
    for (const a of tripAlerts) {
      const area = a.areaDesc ? ` (${a.areaDesc})` : '';
      const expires = a.expires ? ` — expires ${new Date(a.expires).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })}` : '';
      parts.push(`  - ${a.event} [${a.severity}]${area}${expires}`);
    }
  } else {
    parts.push('ALERTS OVERLAPPING TRIP: None');
  }
  parts.push('');

  // Buoy
  if (marine.buoy && !marine.buoy.isOffline) {
    const b = marine.buoy;
    parts.push('CURRENT BUOY CONDITIONS (45005, 18mi NW of Lorain):');
    parts.push(`  Wind: ${b.windSpeed ?? 'N/A'} kts gusting ${b.windGust ?? 'N/A'} kts`);
    parts.push(`  Waves: ${b.waveHeight ?? 'N/A'} ft, period ${b.wavePeriod ?? 'N/A'}s`);
    parts.push(`  Water Temp: ${b.waterTemp ?? 'N/A'}°F`);
  } else {
    parts.push('BUOY 45005: Offline (seasonal)');
  }
  parts.push('');

  // Marine zone text
  if (marine.marineTextPeriods.length > 0) {
    parts.push('MARINE ZONE FORECAST:');
    for (const p of marine.marineTextPeriods.slice(0, 3)) {
      parts.push(`  ${p.title}: ${p.body.slice(0, 300)}`);
    }
    parts.push('');
  }

  // Vessels
  const enRoute = vessels.filter(v => v.status === 'en_route');
  if (enRoute.length > 0) {
    parts.push('VESSEL TRAFFIC:');
    for (const v of enRoute) {
      const eta = v.eta ? ` — ETA ${new Date(v.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })}` : '';
      parts.push(`  - ${v.vessel_name || 'Unknown'} (${vesselTypeLabel(v.vessel_type)}) en route${eta}`);
    }
    parts.push('');
  }

  // Beach quality
  if (!beach.isOffSeason) {
    const advisory = beach.beaches.filter(b => b.status === 'advisory');
    if (advisory.length > 0) {
      parts.push('BEACH WATER QUALITY ADVISORIES:');
      for (const b of advisory) {
        parts.push(`  - ${b.name}: ${b.latestReading?.value?.toFixed(0)} cfu/100mL (above 235 threshold)`);
      }
      parts.push('');
    }
  }

  // Data limitations
  if (limitations.length > 0) {
    parts.push('DATA LIMITATIONS:');
    for (const l of limitations) {
      parts.push(`  - ${l}`);
    }
  }

  return parts.join('\n');
}

// ─── Claude AI Trip Analysis ────────────────────────────────────────────────

const TRIP_SYSTEM_PROMPT = `You are a boat trip planning advisor for Lake Erie, based out of Lorain Harbor, Ohio. Analyze the provided weather, marine, and vessel data for the specific trip window and produce a JSON response.

Adjust safety thresholds based on vessel type:
- Jet Ski / PWC: Can handle moderate chop (2-3ft) but no shelter from weather. Thunderstorms = Dangerous (fully exposed rider). Flag water temp below 60°F (hypothermia risk). Flag trips over 30 miles one-way (fuel range). Always recommend life jacket + kill switch lanyard.
- Small boats (<20ft) Powerboat: Conservative. Winds >15kts or waves >3ft = Fair at best.
- Medium boats (20-30ft) Powerboat: Moderate tolerance. Can handle moderate chop.
- Large boats (30ft+) Powerboat: More tolerant but still flag serious conditions.
- Sailboats: Wind is essential — calm conditions (<5-6 kts) are Poor for sailing. Moderate wind (10-20 kts) is ideal. Higher wind tolerance than same-size powerboats, but gusty/shifting winds are dangerous (knockdown risk). Thunderstorms = Dangerous (mast = lightning target). Note wind direction relative to route when possible (headwind = slower, beam reach = fastest).

Adjust for planned activities:
- Cruising / Sightseeing: Baseline — most forgiving of conditions.
- Fishing: Choppy water (2+ ft) makes fishing difficult. High wind causes fast drift. Note whether trolling or anchor fishing would be better given conditions.
- Swimming / Anchoring: Needs calm water (under 1.5 ft waves). Flag water temperature below 65°F. If beach water quality advisories exist, warn about elevated bacteria levels. Wind over 15 kts creates unsafe swimming conditions.
- Tubing / Water Sports: Needs calm water (under 1.5 ft). Wind over 12 kts makes tubing/skiing dangerous. Choppy water (2+ ft) = Poor for watersports.
- Wave Jumping (PWC): Wants moderate chop (1-3 ft waves ideal). Calm/flat water = boring (downgrade to Fair). Waves over 4 ft = dangerous even for experienced riders. Always flag if no other boats are in the area (safety).

Adjust for experience level:
- Beginner: Be conservative. Recommend calm conditions only.
- Intermediate: Standard thresholds.
- Experienced: Can handle moderate conditions but still flag real hazards.

Response fields (ONLY valid JSON, no markdown):
{
  "overallRating": "Excellent|Good|Fair|Poor|Dangerous",
  "departure": {
    "rating": "Excellent|Good|Fair|Poor|Dangerous",
    "narrative": "2-3 sentences about departure conditions",
    "wind": "SW 8-12 kts",
    "waves": "1-2 ft",
    "precip": "10%",
    "temp": "72°F"
  },
  "returnWindow": {
    "rating": "Excellent|Good|Fair|Poor|Dangerous",
    "narrative": "2-3 sentences about return conditions",
    "wind": "SW 18-22 kts",
    "waves": "4-6 ft",
    "precip": "30%",
    "temp": "76°F"
  },
  "summary": "3-5 conversational sentences about the overall trip outlook. Be specific about what changes during the trip window.",
  "hazards": ["array of short hazard strings relevant to the trip window"],
  "recommendations": ["array of actionable suggestions, e.g. 'Consider departing 2 hours earlier for calmer winds'"],
  "alternativeTimes": [
    {
      "label": "Tomorrow Morning",
      "departure": "ISO timestamp",
      "returnBy": "ISO timestamp",
      "rating": "Excellent",
      "reason": "Calm winds under 8 kts, waves under 1 ft"
    }
  ]
}

Rules:
- alternativeTimes: Suggest up to 3 better windows if conditions are Fair/Poor/Dangerous. Leave empty if Good/Excellent.
- If data is limited (beyond hourly forecast), note this and be more conservative.
- If trip duration seems unrealistic for the destination distance, mention this.
- If the trip is overnight, flag nighttime boating risks.
- Always mention monitoring VHF Channel 16 if conditions are Fair or worse.`;

async function generateAiAnalysis(context: string): Promise<Omit<TripAnalysis, 'dataConfidence' | 'dataLimitations' | 'generatedAt' | 'isAiGenerated' | 'travelWarning'> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey, timeout: 20_000 });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.3,
      system: TRIP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context }],
    });

    let text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    const validRatings: BoatingRating[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'];
    if (!parsed.overallRating || !validRatings.includes(parsed.overallRating)) return null;
    if (!parsed.summary) return null;

    return {
      overallRating: parsed.overallRating,
      departure: {
        rating: validRatings.includes(parsed.departure?.rating) ? parsed.departure.rating : parsed.overallRating,
        narrative: parsed.departure?.narrative || '',
        wind: parsed.departure?.wind || null,
        waves: parsed.departure?.waves || null,
        precip: parsed.departure?.precip || null,
        temp: parsed.departure?.temp || null,
      },
      returnWindow: {
        rating: validRatings.includes(parsed.returnWindow?.rating) ? parsed.returnWindow.rating : parsed.overallRating,
        narrative: parsed.returnWindow?.narrative || '',
        wind: parsed.returnWindow?.wind || null,
        waves: parsed.returnWindow?.waves || null,
        precip: parsed.returnWindow?.precip || null,
        temp: parsed.returnWindow?.temp || null,
      },
      summary: parsed.summary,
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      alternativeTimes: Array.isArray(parsed.alternativeTimes) ? parsed.alternativeTimes : [],
    };
  } catch (err) {
    console.error('Trip planner AI generation failed:', err);
    return null;
  }
}

// ─── Rule-Based Fallback ────────────────────────────────────────────────────

function generateFallbackAnalysis(
  trip: TripRequest,
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[],
  depWindow: TimeWindow,
  retWindow: TimeWindow
): Omit<TripAnalysis, 'dataConfidence' | 'dataLimitations' | 'generatedAt' | 'isAiGenerated' | 'travelWarning'> {
  const depCond = extractWindowConditions(depWindow);
  const retCond = extractWindowConditions(retWindow);

  const buoyWaves = marine.buoy && !marine.buoy.isOffline ? marine.buoy.waveHeight : null;

  const depRating = rateConditions(depCond.maxWind, buoyWaves, trip.boatSize, depWindow.alerts, trip.boatType, trip.activities);
  const retRating = rateConditions(retCond.maxWind, buoyWaves, trip.boatSize, retWindow.alerts, trip.boatType, trip.activities);
  const overallRating = worseRating(depRating, retRating);

  // Experience downgrade for beginners
  const finalOverall = trip.experienceLevel === 'beginner' && overallRating === 'Fair'
    ? 'Poor' : overallRating;

  const hazards: string[] = [];
  const recommendations: string[] = [];

  // Collect alerts
  const allAlerts = [...new Set([...depWindow.alerts, ...retWindow.alerts].map(a => a.id))]
    .map(id => marine.alerts.find(a => a.id === id)!)
    .filter(Boolean);

  for (const a of allAlerts) {
    const area = a.areaDesc ? ` (${a.areaDesc})` : '';
    hazards.push(`${a.event}${area}`);
  }

  // Vessel hazards
  const enRoute = vessels.filter(v => v.status === 'en_route' && v.vessel_type !== null && v.vessel_type >= 70);
  for (const v of enRoute) {
    const eta = v.eta ? ` ~${new Date(v.eta).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })}` : '';
    hazards.push(`${vesselTypeLabel(v.vessel_type)} ${v.vessel_name || 'vessel'} arriving${eta} — avoid channel`);
  }

  // Beach advisories
  if (!beach.isOffSeason) {
    for (const b of beach.beaches.filter(b => b.status === 'advisory')) {
      hazards.push(`Elevated E. coli at ${b.name} — avoid swimming`);
    }
  }

  // Activity-specific hazards & recommendations
  const acts = trip.activities || ['cruising' as BoatActivity];
  const effectiveWaves = buoyWaves ?? estimateWavesFromWind(depCond.maxWind);

  if (acts.includes('swimming')) {
    const waterTemp = marine.buoy && !marine.buoy.isOffline ? marine.buoy.waterTemp : null;
    if (waterTemp !== null && waterTemp < 65) {
      hazards.push(`Water temperature ${waterTemp}°F — cold for swimming`);
    }
    if (effectiveWaves > 1.5) {
      hazards.push('Waves too rough for safe swimming');
    }
  }
  if (acts.includes('fishing') && effectiveWaves > 2) {
    recommendations.push('Choppy conditions — anchor fishing may be more comfortable than trolling');
  }
  if (acts.includes('watersports') && (effectiveWaves > 1.5 || depCond.maxWind > 12)) {
    hazards.push('Conditions may be too rough for tubing/water sports');
  }
  if (acts.includes('wave-jumping') && effectiveWaves < 1) {
    recommendations.push('Flat conditions — not ideal for wave jumping');
  }

  // Recommendations
  if (worseRating(depRating, 'Good') !== depRating && worseRating(retRating, 'Fair') === retRating) {
    recommendations.push('Consider shortening your trip to return before conditions deteriorate');
  }
  if (finalOverall === 'Fair' || finalOverall === 'Poor') {
    recommendations.push('Monitor VHF Channel 16 for weather updates');
  }
  if (finalOverall === 'Dangerous') {
    recommendations.push('Strongly recommend postponing this trip');
  }
  if (trip.experienceLevel === 'beginner' && finalOverall !== 'Excellent') {
    recommendations.push('As a beginner, consider waiting for calmer conditions');
  }

  const ratingDescriptions: Record<BoatingRating, string> = {
    'Excellent': 'Conditions look excellent for your trip.',
    'Good': 'Good conditions expected for your trip.',
    'Fair': 'Fair conditions — exercise caution on the water.',
    'Poor': 'Poor conditions — not recommended for this trip.',
    'Dangerous': 'Dangerous conditions — this trip is not safe.',
  };

  const summary = [
    ratingDescriptions[finalOverall as BoatingRating],
    depCond.windStr !== 'N/A' ? `Departure winds expected around ${depCond.windStr}.` : '',
    retCond.windStr !== 'N/A' && retCond.maxWind !== depCond.maxWind
      ? `Return winds expected around ${retCond.windStr}.` : '',
  ].filter(Boolean).join(' ');

  return {
    overallRating: finalOverall as BoatingRating,
    departure: {
      rating: depRating,
      narrative: `Winds ${depCond.windStr}, temperature around ${depCond.avgTemp}°F.`,
      wind: depCond.windStr,
      waves: buoyWaves ? `${buoyWaves} ft` : null,
      precip: depCond.maxPrecip > 0 ? `${depCond.maxPrecip}%` : null,
      temp: `${depCond.avgTemp}°F`,
    },
    returnWindow: {
      rating: retRating,
      narrative: `Winds ${retCond.windStr}, temperature around ${retCond.avgTemp}°F.`,
      wind: retCond.windStr,
      waves: null,
      precip: retCond.maxPrecip > 0 ? `${retCond.maxPrecip}%` : null,
      temp: `${retCond.avgTemp}°F`,
    },
    summary,
    hazards,
    recommendations,
    alternativeTimes: [],
  };
}

// ─── Travel Feasibility ──────────────────────────────────────────────────────

function checkTravelFeasibility(trip: TripRequest): string | null {
  const transit = getTransitMinutes('lorain', trip.destination);
  if (transit === 0) return null; // lorain or open-water

  const dep = new Date(trip.departureTime);
  const ret = new Date(trip.returnTime);
  const tripMinutes = (ret.getTime() - dep.getTime()) / 60000;
  const roundTrip = transit * 2;

  const dest = DESTINATIONS.find(d => d.value === trip.destination);
  const destName = dest?.label || trip.destination;
  const transitStr = formatTransitTime(transit);

  if (tripMinutes <= roundTrip) {
    const tripHrs = Math.round(tripMinutes / 60 * 10) / 10;
    const rtHrs = Math.round(roundTrip / 60 * 10) / 10;
    return `Your ${tripHrs}-hour trip window may not be enough for ${destName}. Transit alone is ${transitStr} each way (~${rtHrs} hrs round trip), leaving no time at your destination.`;
  }

  const timeAtDest = tripMinutes - roundTrip;
  if (timeAtDest < 60) {
    return `After ${transitStr} transit each way, you'll have roughly ${Math.round(timeAtDest)} minutes at ${destName}. Consider extending your return time for more time on the water.`;
  }

  return null;
}

// ─── Main Entry ─────────────────────────────────────────────────────────────

export async function generateTripAnalysis(
  trip: TripRequest,
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[]
): Promise<TripAnalysis> {
  const dep = new Date(trip.departureTime);
  const ret = new Date(trip.returnTime);
  const limitations: string[] = [];

  // Slice data to windows
  const depWindow = sliceToWindow(dep, marine);
  const retWindow = sliceToWindow(ret, marine);

  // Determine data confidence
  let dataConfidence: 'high' | 'medium' | 'low' = 'high';

  if (depWindow.confidence === 'low' && retWindow.confidence === 'low') {
    dataConfidence = 'low';
    limitations.push('Trip is beyond the available forecast range. Analysis will be limited.');
  } else if (depWindow.confidence === 'low' || retWindow.confidence === 'low') {
    dataConfidence = 'low';
    limitations.push('Part of your trip is beyond the forecast range.');
  } else if (depWindow.confidence === 'medium' || retWindow.confidence === 'medium') {
    dataConfidence = 'medium';
  }

  if (depWindow.confidence !== 'high') {
    limitations.push('Departure window uses 7-day period forecast (less precise than hourly).');
  }
  if (retWindow.confidence !== 'high') {
    limitations.push('Return window uses 7-day period forecast (less precise than hourly).');
  }

  if (marine.buoy?.isOffline || !marine.buoy) {
    limitations.push('Buoy 45005 is offline. Wave data estimated from NWS forecast.');
  }

  // Check if overnight
  const depHour = dep.getHours();
  const retHour = ret.getHours();
  if (ret.getDate() !== dep.getDate() || retHour < 5 || depHour >= 21) {
    limitations.push('Trip includes nighttime hours — use extra caution and ensure proper lighting.');
  }

  // Check travel feasibility
  const travelWarning = checkTravelFeasibility(trip);
  if (travelWarning) {
    limitations.push(travelWarning);
  }

  // Build context and generate
  const context = assembleTripContext(trip, marine, beach, vessels, depWindow, retWindow, limitations);

  // Try AI first
  const aiResult = await generateAiAnalysis(context);
  if (aiResult) {
    return {
      ...aiResult,
      travelWarning,
      dataConfidence,
      dataLimitations: limitations,
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
    };
  }

  // Fallback to rule-based
  const fallback = generateFallbackAnalysis(trip, marine, beach, vessels, depWindow, retWindow);
  if (travelWarning) {
    fallback.recommendations.unshift(travelWarning);
  }
  return {
    ...fallback,
    travelWarning,
    dataConfidence,
    dataLimitations: limitations,
    generatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

// ─── Multi-Stop Analysis ─────────────────────────────────────────────────────

const MULTI_STOP_SYSTEM_PROMPT = `You are a boat trip planning advisor for Lake Erie, based out of Lorain Harbor, Ohio. Analyze conditions for a MULTI-STOP trip and produce a JSON response.

Adjust safety thresholds based on vessel type:
- Jet Ski / PWC: Can handle moderate chop but no shelter. Thunderstorms = Dangerous. Flag water temp <60°F. Flag legs over 30 miles (fuel). Recommend life jacket + kill switch.
- Small boats (<20ft) Powerboat: Conservative. Winds >15kts or waves >3ft = Fair at best.
- Medium boats (20-30ft) Powerboat: Moderate tolerance. Can handle moderate chop.
- Large boats (30ft+) Powerboat: More tolerant but still flag serious conditions.
- Sailboats: Calm (<5-6 kts) = Poor. Moderate wind (10-20 kts) = ideal. Higher wind tolerance than powerboats but gusty/shifting = dangerous. Thunderstorms = Dangerous (mast lightning). Note wind direction vs route.

Adjust for planned activities:
- Cruising / Sightseeing: Baseline — most forgiving.
- Fishing: Chop (2+ ft) makes fishing difficult. Wind causes drift. Note trolling vs anchor fishing.
- Swimming / Anchoring: Needs calm water (<1.5 ft). Flag water temp <65°F. Flag bacteria advisories.
- Tubing / Water Sports: Needs calm water (<1.5 ft). Wind >12 kts = dangerous.
- Wave Jumping (PWC): Wants moderate chop (1-3 ft ideal). Flat water = boring. >4 ft = dangerous.

Adjust for experience level:
- Beginner: Be conservative. Recommend calm conditions only.
- Intermediate: Standard thresholds.
- Experienced: Can handle moderate conditions but still flag real hazards.

Response fields (ONLY valid JSON, no markdown):
{
  "overallRating": "Excellent|Good|Fair|Poor|Dangerous",
  "legs": [
    {
      "rating": "Excellent|Good|Fair|Poor|Dangerous",
      "narrative": "2-3 sentences about conditions for this leg",
      "wind": "SW 8-12 kts",
      "waves": "1-2 ft",
      "precip": "10%",
      "temp": "72°F"
    }
  ],
  "summary": "3-5 conversational sentences about the overall multi-stop trip. Note how conditions change across legs.",
  "hazards": ["array of hazard strings"],
  "recommendations": ["array of actionable suggestions"]
}

Rules:
- The "legs" array must have one entry per leg, in order.
- If time at a stop is very short (under 30 min), mention this.
- If transit time for a leg seems unrealistic given the time window, flag it.
- If any leg is overnight, flag nighttime boating risks.
- Always mention monitoring VHF Channel 16 if conditions are Fair or worse.`;

async function generateMultiStopAi(context: string, legCount: number): Promise<{
  overallRating: BoatingRating;
  legs: WindowAnalysis[];
  summary: string;
  hazards: string[];
  recommendations: string[];
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey, timeout: 25_000 });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      temperature: 0.3,
      system: MULTI_STOP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context }],
    });

    let text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    const validRatings: BoatingRating[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Dangerous'];
    if (!parsed.overallRating || !validRatings.includes(parsed.overallRating)) return null;
    if (!parsed.summary || !Array.isArray(parsed.legs) || parsed.legs.length !== legCount) return null;

    return {
      overallRating: parsed.overallRating,
      legs: parsed.legs.map((l: Record<string, string>) => ({
        rating: validRatings.includes(l.rating as BoatingRating) ? l.rating as BoatingRating : parsed.overallRating,
        narrative: l.narrative || '',
        wind: l.wind || null,
        waves: l.waves || null,
        precip: l.precip || null,
        temp: l.temp || null,
      })),
      summary: parsed.summary,
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err) {
    console.error('Multi-stop AI generation failed:', err);
    return null;
  }
}

export async function generateMultiStopAnalysis(
  request: MultiStopRequest,
  marine: MarineData,
  beach: BeachQualityResponse,
  vessels: VesselRecord[]
): Promise<MultiStopAnalysis> {
  const { boatSize, boatType, activities, experienceLevel, legs } = request;
  const limitations: string[] = [];
  const buoyWaves = marine.buoy && !marine.buoy.isOffline ? marine.buoy.waveHeight : null;

  if (marine.buoy?.isOffline || !marine.buoy) {
    limitations.push('Buoy 45005 is offline. Wave data estimated from NWS forecast.');
  }

  // Analyze each leg
  const legAnalyses: LegAnalysis[] = [];
  let prevArrivalTime: Date | null = null;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const depTime = new Date(leg.departureTime);
    const transitMins = getTransitMinutes(leg.from, leg.to);
    const arrivalTime = new Date(depTime.getTime() + transitMins * 60000);

    // Check dwell time at this stop (time between arrival and departure)
    let travelWarning: string | null = null;
    if (prevArrivalTime && i > 0) {
      const dwellMinutes = (depTime.getTime() - prevArrivalTime.getTime()) / 60000;
      const stopName = getDestLabel(leg.from);
      if (dwellMinutes < 0) {
        travelWarning = `You're departing ${stopName} before you'd arrive based on transit from the previous stop.`;
      } else if (dwellMinutes < 30) {
        travelWarning = `Only ~${Math.round(dwellMinutes)} minutes at ${stopName} between arriving and departing.`;
      }
    }

    // Slice conditions at departure time
    const window = sliceToWindow(depTime, marine);
    const cond = extractWindowConditions(window);
    const rating = rateConditions(cond.maxWind, buoyWaves, boatSize, window.alerts, boatType, activities);

    if (window.confidence !== 'high') {
      const legLabel = `Leg ${i + 1}`;
      if (window.confidence === 'low') {
        limitations.push(`${legLabel} is beyond the available forecast range.`);
      } else {
        limitations.push(`${legLabel} uses 7-day period forecast (less precise than hourly).`);
      }
    }

    legAnalyses.push({
      from: leg.from,
      to: leg.to,
      fromLabel: getDestLabel(leg.from),
      toLabel: getDestLabel(leg.to),
      departureTime: leg.departureTime,
      estimatedArrival: arrivalTime.toISOString(),
      transitMinutes: transitMins,
      conditions: {
        rating,
        narrative: `Winds ${cond.windStr}, temperature around ${cond.avgTemp}°F.`,
        wind: cond.windStr,
        waves: buoyWaves ? `${buoyWaves} ft` : null,
        precip: cond.maxPrecip > 0 ? `${cond.maxPrecip}%` : null,
        temp: `${cond.avgTemp}°F`,
      },
      travelWarning,
    });

    prevArrivalTime = arrivalTime;
  }

  // Overall rating = worst across all legs
  let overallRating: BoatingRating = 'Excellent';
  for (const la of legAnalyses) {
    overallRating = worseRating(overallRating, la.conditions.rating);
  }
  if (experienceLevel === 'beginner' && overallRating === 'Fair') {
    overallRating = 'Poor';
  }

  // Check overnight
  const firstDep = new Date(legs[0].departureTime);
  const lastArr = prevArrivalTime!;
  if (lastArr.getDate() !== firstDep.getDate() || firstDep.getHours() >= 21 || lastArr.getHours() < 5) {
    limitations.push('Trip includes nighttime hours — use extra caution and ensure proper lighting.');
  }

  // Build context for AI
  const fmtTime = (d: Date) => d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
  });

  const sizeLabels: Record<BoatSize, string> = {
    jetski: 'Jet Ski / PWC', small: 'Small (<20 ft)', medium: 'Medium (20-30 ft)', large: 'Large (30+ ft)',
  };
  const typeLabel = boatType === 'sailboat' ? ' (Sailboat)' : boatSize === 'jetski' ? '' : ' (Powerboat)';

  const ctxParts: string[] = [];
  const activityLabels: Record<BoatActivity, string> = {
    cruising: 'Cruising / Sightseeing', fishing: 'Fishing',
    swimming: 'Swimming / Anchoring', watersports: 'Tubing / Water Sports',
    'wave-jumping': 'Wave Jumping (PWC)',
  };
  const acts = activities?.length ? activities : ['cruising' as BoatActivity];

  ctxParts.push('MULTI-STOP TRIP DETAILS:');
  ctxParts.push(`  Vessel: ${sizeLabels[boatSize]}${typeLabel}`);
  ctxParts.push(`  Planned Activities: ${acts.map(a => activityLabels[a]).join(', ')}`);
  ctxParts.push(`  Experience Level: ${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}`);
  ctxParts.push(`  Route: ${legAnalyses.map(l => l.fromLabel).join(' → ')} → ${legAnalyses[legAnalyses.length - 1].toLabel}`);
  ctxParts.push('');

  for (let i = 0; i < legAnalyses.length; i++) {
    const la = legAnalyses[i];
    ctxParts.push(`LEG ${i + 1}: ${la.fromLabel} → ${la.toLabel}`);
    ctxParts.push(`  Departing: ${fmtTime(new Date(la.departureTime))}`);
    ctxParts.push(`  Transit: ${formatTransitTime(la.transitMinutes)}`);
    ctxParts.push(`  Estimated Arrival: ${fmtTime(new Date(la.estimatedArrival))}`);
    if (la.travelWarning) {
      ctxParts.push(`  WARNING: ${la.travelWarning}`);
    }

    const window = sliceToWindow(new Date(la.departureTime), marine);
    if (window.hourly.length > 0) {
      for (const h of window.hourly) {
        const time = new Date(h.startTime).toLocaleString('en-US', { hour: 'numeric', hour12: true, timeZone: 'America/New_York' });
        const precip = h.precipChance !== null ? `, ${h.precipChance}% precip` : '';
        ctxParts.push(`  ${time}: ${h.temperature}°F, ${h.windDirection} ${h.windSpeed}, ${h.shortForecast}${precip}`);
      }
    } else if (window.forecast.length > 0) {
      const f = window.forecast[0];
      ctxParts.push(`  ${f.name}: ${f.shortForecast}, ${f.temperature}°${f.temperatureUnit}, Wind ${f.windDirection} ${f.windSpeed}`);
    }
    ctxParts.push('');
  }

  // Alerts
  const tripStart = new Date(legs[0].departureTime);
  const tripEnd = prevArrivalTime!;
  const tripAlerts = marine.alerts.filter(a => {
    const onset = a.onset ? new Date(a.onset) : new Date(0);
    const expires = a.expires ? new Date(a.expires) : new Date('2099-01-01');
    return onset <= tripEnd && expires >= tripStart;
  });
  if (tripAlerts.length > 0) {
    ctxParts.push('ALERTS OVERLAPPING TRIP:');
    for (const a of tripAlerts) {
      ctxParts.push(`  - ${a.event} [${a.severity}]${a.areaDesc ? ` (${a.areaDesc})` : ''}`);
    }
    ctxParts.push('');
  }

  if (limitations.length > 0) {
    ctxParts.push('DATA LIMITATIONS:');
    for (const l of limitations) ctxParts.push(`  - ${l}`);
  }

  const context = ctxParts.join('\n');

  // Try AI
  const aiResult = await generateMultiStopAi(context, legs.length);
  if (aiResult) {
    // Merge AI conditions into legAnalyses
    for (let i = 0; i < legAnalyses.length; i++) {
      if (aiResult.legs[i]) {
        legAnalyses[i].conditions = aiResult.legs[i];
      }
    }
    return {
      overallRating: aiResult.overallRating,
      legs: legAnalyses,
      summary: aiResult.summary,
      hazards: aiResult.hazards,
      recommendations: aiResult.recommendations,
      dataConfidence: legAnalyses.some(l => l.conditions.wind === null) ? 'low' : 'medium',
      dataLimitations: limitations,
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
    };
  }

  // Fallback — rule-based
  const hazards: string[] = [];
  const recommendations: string[] = [];

  // Collect unique alerts
  const allAlertIds = new Set<string>();
  for (const la of legAnalyses) {
    const window = sliceToWindow(new Date(la.departureTime), marine);
    for (const a of window.alerts) {
      if (!allAlertIds.has(a.id)) {
        allAlertIds.add(a.id);
        hazards.push(`${a.event}${a.areaDesc ? ` (${a.areaDesc})` : ''}`);
      }
    }
  }

  // Travel warnings as recommendations
  for (const la of legAnalyses) {
    if (la.travelWarning) recommendations.push(la.travelWarning);
  }

  if (overallRating === 'Fair' || overallRating === 'Poor') {
    recommendations.push('Monitor VHF Channel 16 for weather updates');
  }
  if (overallRating === 'Dangerous') {
    recommendations.push('Strongly recommend postponing this trip');
  }

  const ratingDesc: Record<BoatingRating, string> = {
    Excellent: 'Conditions look excellent for your multi-stop trip.',
    Good: 'Good conditions expected across all legs.',
    Fair: 'Fair conditions on some legs — exercise caution.',
    Poor: 'Poor conditions on one or more legs — not recommended.',
    Dangerous: 'Dangerous conditions — this trip is not safe.',
  };

  return {
    overallRating,
    legs: legAnalyses,
    summary: ratingDesc[overallRating],
    hazards,
    recommendations,
    dataConfidence: limitations.length > 0 ? 'medium' : 'high',
    dataLimitations: limitations,
    generatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}
