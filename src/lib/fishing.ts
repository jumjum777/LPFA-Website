// ─── Types ────────────────────────────────────────────────────────────────────

export type FishingZone = 'nearshore' | 'offshore' | 'tributary' | 'pier' | 'harbor' | 'river-mouth';

export interface SeasonalProfile {
  months: number[];           // which months this profile applies (1-12)
  zone: FishingZone;
  depthRange: string;
  bestBait: string;
  technique: string;
  bestSpots: string;
  notes: string;              // expert-level seasonal note
  tempSource: 'nearshore' | 'offshore'; // which temp to use for activity calc
}

export interface FishSpecies {
  id: string;
  name: string;
  icon: string;       // Font Awesome icon
  color: string;      // Marker/badge color
  idealTempMin: number;  // °F
  idealTempMax: number;
  tolerableTempMin: number;
  tolerableTempMax: number;
  maxWind: number;       // kts — above this, activity drops
  mayflyImpact: number;  // 0-1 how much mayfly hatch affects this species
  seasonalProfiles: SeasonalProfile[];
  winterNote: string;    // displayed when no active seasonal profile
}

// ─── Species Data (Lake Erie Central Basin / Lorain) ─────────────────────────

export const SPECIES: FishSpecies[] = [
  {
    id: 'walleye',
    name: 'Walleye',
    icon: 'fa-fish',
    color: '#059669',
    idealTempMin: 55, idealTempMax: 68,
    tolerableTempMin: 45, tolerableTempMax: 75,
    maxWind: 20,
    mayflyImpact: 0.8,
    winterNote: 'Walleye are less active in winter. Ice fishing possible on western basin reefs when safe.',
    seasonalProfiles: [
      {
        months: [3, 4, 5],
        zone: 'nearshore',
        depthRange: '8-20 ft',
        bestBait: 'Jigs tipped with minnows, shallow crankbaits, blade baits',
        technique: 'Casting jigs along breakwalls and river mouths, trolling shallow crankbaits',
        bestSpots: 'Black River mouth, East Breakwall, Lorain Pier, nearshore reefs',
        notes: 'Spring walleye stage nearshore after spawning in tributaries. Fish are hungry and accessible from shore or small boats. Best action at dawn/dusk.',
        tempSource: 'nearshore',
      },
      {
        months: [6, 7, 8, 9],
        zone: 'offshore',
        depthRange: '25-55 ft',
        bestBait: 'Crawler harness, deep-diving crankbaits, worm harness, spoons',
        technique: 'Trolling with planer boards and dipsy divers, drifting with bottom bouncers',
        bestSpots: 'Offshore reefs 5-10 miles out, edges of the central basin thermocline',
        notes: 'Summer walleye move offshore to cooler water below the thermocline. Need a boat with trolling setup. Target 50-65°F water — fish stack on thermocline edges. Central basin dead zone (low oxygen below 50ft) pushes fish to edges.',
        tempSource: 'offshore',
      },
      {
        months: [10, 11],
        zone: 'nearshore',
        depthRange: '10-30 ft',
        bestBait: 'Crankbaits, blade baits, jigs with minnows',
        technique: 'Trolling nearshore, casting blade baits from breakwalls',
        bestSpots: 'Nearshore reefs, breakwalls, river mouths',
        notes: 'Fall walleye return nearshore as water cools. Aggressive feeders fattening up before winter. Some of the best shore-accessible fishing of the year.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'yellow-perch',
    name: 'Yellow Perch',
    icon: 'fa-fish',
    color: '#D97706',
    idealTempMin: 60, idealTempMax: 72,
    tolerableTempMin: 45, tolerableTempMax: 78,
    maxWind: 18,
    mayflyImpact: 0.7,
    winterNote: 'Perch can be caught through ice on western basin. Nearshore action picks up as water warms in April.',
    seasonalProfiles: [
      {
        months: [4, 5],
        zone: 'nearshore',
        depthRange: '10-25 ft',
        bestBait: 'Minnows on spreader rigs, small jigs tipped with minnows',
        technique: 'Drifting or anchored with spreader rigs near bottom',
        bestSpots: 'Nearshore reefs, harbor channel, east of Lorain in 15-25ft',
        notes: 'Spring perch move nearshore after ice-out. Schools can be found on rocky bottom in 15-25ft. Anchor on structure and use spreader rigs.',
        tempSource: 'nearshore',
      },
      {
        months: [6, 7, 8],
        zone: 'offshore',
        depthRange: '25-40 ft',
        bestBait: 'Emerald shiners on spreader rigs, small crankbaits',
        technique: 'Drifting with spreader rigs, anchored fishing on reefs',
        bestSpots: 'Mid-lake reefs, 3-8 miles offshore, near thermocline edges',
        notes: 'Summer perch move to deeper, cooler water. Locate schools with electronics. Best bite early morning. Mayfly hatch triggers feeding frenzy in June-July.',
        tempSource: 'offshore',
      },
      {
        months: [9, 10, 11],
        zone: 'nearshore',
        depthRange: '15-30 ft',
        bestBait: 'Minnows on spreader rigs, small jigs, blade baits',
        technique: 'Drifting or anchored, vertical jigging',
        bestSpots: 'Nearshore reefs east of Lorain, harbor edges, 15-30ft rocky bottom',
        notes: 'Fall perch return nearshore and school heavily in preparation for winter. Some of the best perch fishing of the year with consistent limits.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'steelhead',
    name: 'Steelhead',
    icon: 'fa-fish-fins',
    color: '#6366F1',
    idealTempMin: 38, idealTempMax: 55,
    tolerableTempMin: 33, tolerableTempMax: 65,
    maxWind: 25,
    mayflyImpact: 0.1,
    winterNote: 'Winter steelhead fishing in tributaries is excellent. Black River offers good access points.',
    seasonalProfiles: [
      {
        months: [10, 11, 12, 1, 2, 3, 4],
        zone: 'tributary',
        depthRange: '2-8 ft (rivers)',
        bestBait: 'Spawn sacs, egg patterns, inline spinners, marabou jigs',
        technique: 'Float fishing with centerpin or spinning rod, casting spinners',
        bestSpots: 'Black River (multiple access points), Vermilion River, Rocky River',
        notes: 'Fall through spring steelhead run up tributaries to spawn. Black River is the closest to Lorain with good public access. Fish deep pools and tailouts. Best after rain events that raise water levels. Peak runs typically Nov-Dec and Mar-Apr.',
        tempSource: 'nearshore',
      },
      {
        months: [5, 6, 7, 8, 9],
        zone: 'nearshore',
        depthRange: '15-40 ft',
        bestBait: 'Spoons, stickbaits, crankbaits',
        technique: 'Trolling nearshore, casting from breakwalls',
        bestSpots: 'Nearshore Lake Erie, breakwalls, river mouths',
        notes: 'Summer steelhead hold in cooler nearshore water and can be caught trolling. Not as targeted as tributary fishing but still available. Fish early morning near cooler water inflows.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'smallmouth-bass',
    name: 'Smallmouth Bass',
    icon: 'fa-fish',
    color: '#16a34a',
    idealTempMin: 60, idealTempMax: 75,
    tolerableTempMin: 50, tolerableTempMax: 80,
    maxWind: 20,
    mayflyImpact: 0.4,
    winterNote: 'Smallmouth are largely dormant in cold water. Catch-and-release season May 1 - Jun 25.',
    seasonalProfiles: [
      {
        months: [5, 6],
        zone: 'nearshore',
        depthRange: '5-15 ft',
        bestBait: 'Tube jigs, ned rigs, small crankbaits',
        technique: 'Casting near rocky structure, sight fishing beds (May)',
        bestSpots: 'Rocky shorelines, breakwalls, harbor structure, near river mouths',
        notes: 'Spring smallmouth move shallow for spawning. Sight fishing possible in clear water. Note: catch-and-release only May 1 through Jun 25 per ODNR. After Jun 26, harvest opens.',
        tempSource: 'nearshore',
      },
      {
        months: [7, 8, 9],
        zone: 'nearshore',
        depthRange: '8-25 ft',
        bestBait: 'Drop shot, tube jigs, crankbaits, topwater (early AM)',
        technique: 'Drop shot on reefs, casting crankbaits along structure',
        bestSpots: 'Rocky reefs, breakwall, harbor structure, boulder fields',
        notes: 'Summer smallmouth hold on nearshore reefs and structure in 8-25ft. Topwater action at dawn and dusk. Drop shot is king mid-day. Some of the best smallmouth fishing in the Great Lakes.',
        tempSource: 'nearshore',
      },
      {
        months: [10, 11],
        zone: 'nearshore',
        depthRange: '15-35 ft',
        bestBait: 'Blade baits, hair jigs, tube jigs, drop shot',
        technique: 'Vertical jigging blade baits, slow presentations',
        bestSpots: 'Deep breakwall edges, deeper reefs, transition areas',
        notes: 'Fall smallmouth move slightly deeper but remain nearshore. Aggressive feeders — blade baits and hair jigs worked slowly produce big fish. Some trophy-sized fish caught in October.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'white-bass',
    name: 'White Bass',
    icon: 'fa-fish',
    color: '#94a3b8',
    idealTempMin: 55, idealTempMax: 70,
    tolerableTempMin: 45, tolerableTempMax: 78,
    maxWind: 22,
    mayflyImpact: 0.5,
    winterNote: 'White bass are largely inactive in winter. Spring run begins when water hits 50-55°F.',
    seasonalProfiles: [
      {
        months: [4, 5],
        zone: 'river-mouth',
        depthRange: '3-12 ft',
        bestBait: 'Small jigs, rooster tails, inline spinners, minnows',
        technique: 'Casting at river mouths and piers, retrieving small jigs/spinners',
        bestSpots: 'Black River mouth, pier, harbor channel, river mouths along shoreline',
        notes: 'Spring white bass run is one of the most exciting shore-fishing events. Schools stack up at river mouths as they stage to spawn upstream. Non-stop action possible — easy to catch limits. Best action when water temps hit 50-55°F.',
        tempSource: 'nearshore',
      },
      {
        months: [6, 7, 8],
        zone: 'nearshore',
        depthRange: '5-20 ft',
        bestBait: 'Small jigs, crankbaits, spoons, live minnows',
        technique: 'Casting or trolling near schools, following bird activity',
        bestSpots: 'Nearshore open water, near baitfish schools, pier areas',
        notes: 'Summer white bass school in open nearshore water chasing shad and emerald shiners. Watch for surface activity and diving birds. When you find a school, action is fast.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'channel-catfish',
    name: 'Channel Catfish',
    icon: 'fa-fish',
    color: '#78716c',
    idealTempMin: 65, idealTempMax: 82,
    tolerableTempMin: 50, tolerableTempMax: 85,
    maxWind: 25,
    mayflyImpact: 0.15,
    winterNote: 'Catfish are sluggish in cold water. Some catches possible in deep river holes on warm days.',
    seasonalProfiles: [
      {
        months: [6, 7, 8, 9],
        zone: 'harbor',
        depthRange: '5-20 ft',
        bestBait: 'Cut shad, chicken liver, nightcrawlers, stink bait',
        technique: 'Bottom fishing with rod holders, slip sinker rigs',
        bestSpots: 'Black River, harbor channel, pier areas, river mouth',
        notes: 'Summer catfish are the most active. Best fishing at night or early morning. Black River offers excellent catfishing — target deeper pools and near structure. Scent is key — use fresh cut bait or chicken liver.',
        tempSource: 'nearshore',
      },
      {
        months: [4, 5, 10],
        zone: 'river-mouth',
        depthRange: '5-15 ft',
        bestBait: 'Nightcrawlers, cut bait, shrimp',
        technique: 'Bottom fishing in river holes, slow presentation',
        bestSpots: 'Black River deeper pools, harbor edges',
        notes: 'Spring and fall catfish are less active but still catchable in warmer afternoon hours. Target deeper river holes where water holds more heat.',
        tempSource: 'nearshore',
      },
    ],
  },
  {
    id: 'lake-trout',
    name: 'Lake Trout',
    icon: 'fa-fish-fins',
    color: '#1B8BEB',
    idealTempMin: 42, idealTempMax: 55,
    tolerableTempMin: 35, tolerableTempMax: 62,
    maxWind: 20,
    mayflyImpact: 0.05,
    winterNote: 'Lake trout remain deep in winter. Some ice fishing success on western basin when conditions allow.',
    seasonalProfiles: [
      {
        months: [4, 5, 6],
        zone: 'offshore',
        depthRange: '40-80 ft',
        bestBait: 'Flutter spoons, jigging spoons, cut bait, swimbaits',
        technique: 'Vertical jigging over deep structure, trolling with downriggers',
        bestSpots: 'Deep water 8-15 miles offshore, deep rock piles and drop-offs',
        notes: 'Spring lake trout move to feeding areas on deep structure. Vertical jigging with flutter spoons is most effective. Central basin has developing lake trout population from stocking efforts. Fish prefer cold, well-oxygenated water.',
        tempSource: 'offshore',
      },
      {
        months: [7, 8, 9],
        zone: 'offshore',
        depthRange: '60-100+ ft',
        bestBait: 'Spoons, cut bait on set lines, large jigging lures',
        technique: 'Deep trolling with downriggers, vertical jigging',
        bestSpots: 'Deepest water available in central basin, edges of thermocline',
        notes: 'Summer lake trout seek the coldest water available. In central basin, they stack near the thermocline above the dead zone. Very deep presentations needed — 60-100ft+. Requires specialized deep-water equipment.',
        tempSource: 'offshore',
      },
      {
        months: [10, 11],
        zone: 'offshore',
        depthRange: '40-70 ft',
        bestBait: 'Flutter spoons, jigging spoons, swimbaits',
        technique: 'Vertical jigging, trolling with downriggers',
        bestSpots: 'Deep structure offshore, rock piles, drop-offs',
        notes: 'Fall turnover mixes the water column and lake trout become more accessible. Some of the best lake trout fishing as they feed aggressively before winter.',
        tempSource: 'offshore',
      },
    ],
  },
];

// ─── Fishing Spots ──────────────────────────────────────────────────────────

export interface FishingSpot {
  id: string;
  name: string;
  type: 'pier' | 'shore' | 'river' | 'offshore' | 'launch';
  latitude: number;
  longitude: number;
  description: string;
  icon: string;
}

export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: 'lorain-pier',
    name: 'Lorain Lighthouse Pier',
    type: 'pier',
    latitude: 41.4710,
    longitude: -82.1785,
    description: 'Popular pier fishing for perch, walleye, and catfish. Accessible from Lakeview Park.',
    icon: 'fa-landmark',
  },
  {
    id: 'east-breakwall',
    name: 'East Breakwall',
    type: 'pier',
    latitude: 41.4725,
    longitude: -82.1700,
    description: 'Long breakwall with deep water access. Good for walleye, steelhead, and white bass.',
    icon: 'fa-road',
  },
  {
    id: 'black-river-mouth',
    name: 'Black River Mouth',
    type: 'river',
    latitude: 41.4680,
    longitude: -82.1795,
    description: 'River mouth where Black River meets Lake Erie. Steelhead runs in fall/spring, catfish in summer.',
    icon: 'fa-water',
  },
  {
    id: 'black-river-upstream',
    name: 'Black River (Upstream)',
    type: 'river',
    latitude: 41.4550,
    longitude: -82.1780,
    description: 'Upstream sections for steelhead, smallmouth bass, and catfish. Multiple access points.',
    icon: 'fa-water',
  },
  {
    id: 'boat-launch',
    name: 'LPFA Boat Launch',
    type: 'launch',
    latitude: 41.4665,
    longitude: -82.1830,
    description: 'Public boat launch at Black River Landing. Access to harbor and open lake.',
    icon: 'fa-ship',
  },
  {
    id: 'lakeview-shore',
    name: 'Lakeview Park Shoreline',
    type: 'shore',
    latitude: 41.4700,
    longitude: -82.1700,
    description: 'Sandy beach and rocky shoreline. Good for shore casting — perch, smallmouth, white bass.',
    icon: 'fa-umbrella-beach',
  },
  {
    id: 'offshore-reefs',
    name: 'Offshore Reefs (Boat)',
    type: 'offshore',
    latitude: 41.5200,
    longitude: -82.1800,
    description: 'Rocky reefs 5-8 miles offshore. Prime walleye and perch fishing grounds.',
    icon: 'fa-anchor',
  },
  {
    id: 'harbor-channel',
    name: 'Harbor Channel',
    type: 'pier',
    latitude: 41.4695,
    longitude: -82.1810,
    description: 'Deep water channel with good structure. Walleye, sheephead, and catfish.',
    icon: 'fa-route',
  },
];

// ─── Location Presets (for catch submission dropdown) ────────────────────────

export const LOCATION_PRESETS = [
  'Lorain Lighthouse Pier',
  'East Breakwall',
  'Black River Mouth',
  'Black River (Upstream)',
  'Lakeview Park Shoreline',
  'Harbor Channel',
  'Offshore — Nearshore (< 3 mi)',
  'Offshore — Mid-Lake (3-10 mi)',
  'Offshore — Deep Water (10+ mi)',
  'Other',
];

// ─── Structured Submission Constants ────────────────────────────────────────

export const BAIT_OPTIONS = [
  'Crawler harness', 'Crankbait', 'Jig', 'Minnow', 'Spoon', 'Spinner',
  'Soft plastic', 'Cut bait', 'Spawn sac', 'Chicken liver', 'Nightcrawler',
  'Spreader rig', 'Blade bait', 'Topwater', 'Drop shot', 'Other',
];

export const METHOD_OPTIONS = [
  'Trolling', 'Casting', 'Jigging', 'Drifting', 'Bottom fishing',
  'Float fishing', 'Shore casting', 'Pier fishing', 'Other',
];

export const DEPTH_OPTIONS = [
  'Shore/Pier (0-5 ft)',
  'Shallow (5-15 ft)',
  'Mid-depth (15-30 ft)',
  'Deep (30-50 ft)',
  'Very Deep (50+ ft)',
];

export const BITE_RATINGS = [
  { value: 1, label: 'Dead — Nothing biting' },
  { value: 2, label: 'Slow — Few bites' },
  { value: 3, label: 'Moderate — Steady action' },
  { value: 4, label: 'Good — Solid fishing' },
  { value: 5, label: 'Hot — Non-stop action' },
];

export const GPS_BOUNDS = {
  latMin: 41.25,
  latMax: 42.10,
  lngMin: -82.60,
  lngMax: -81.50,
};

// ─── Seasonal Profile Helpers ───────────────────────────────────────────────

export function getCurrentSeason(species: FishSpecies, month: number): SeasonalProfile | null {
  return species.seasonalProfiles.find(p => p.months.includes(month)) || null;
}

// ─── Species Activity Logic ─────────────────────────────────────────────────

export type ActivityLevel = 'active' | 'moderate' | 'slow' | 'inactive';
export type MayflyActivityLevel = 'none' | 'low' | 'medium' | 'high';

export interface ActivityInput {
  nearshoreTemp: number | null;
  offshoreTemp: number | null;
  windSpeed: number | null;
  month: number; // 1-12
  mayflyLevel: MayflyActivityLevel | null;
  communityBiteAvg: number | null; // 1-5 from recent reports, per species
}

export interface SpeciesActivity {
  species: FishSpecies;
  level: ActivityLevel;
  reason: string;
  tip: string;
  season: SeasonalProfile | null;
}

const MAYFLY_WEIGHTS: Record<MayflyActivityLevel, number> = {
  none: 0,
  low: 0.3,
  medium: 0.6,
  high: 1.0,
};

export function getSpeciesActivity(
  input: ActivityInput,
): SpeciesActivity[] {
  const { nearshoreTemp, offshoreTemp, windSpeed, month, mayflyLevel, communityBiteAvg } = input;

  return SPECIES.map(sp => {
    const season = getCurrentSeason(sp, month);

    // Pick the right water temp for this species' current zone
    const waterTemp = season
      ? (season.tempSource === 'nearshore' ? nearshoreTemp : offshoreTemp)
      : nearshoreTemp; // default to nearshore when off-season

    // Off-season
    if (!season) {
      return {
        species: sp,
        level: 'slow' as ActivityLevel,
        reason: `Off-season for ${sp.name.toLowerCase()} this month.`,
        tip: sp.winterNote,
        season: null,
      };
    }

    if (waterTemp === null) {
      return {
        species: sp,
        level: 'moderate' as ActivityLevel,
        reason: 'Water temperature data unavailable — conditions estimated from season.',
        tip: `${season.technique}. Try ${season.bestBait.split(',')[0].trim().toLowerCase()}.`,
        season,
      };
    }

    const wind = windSpeed ?? 0;
    const tempInIdeal = waterTemp >= sp.idealTempMin && waterTemp <= sp.idealTempMax;
    const tempInTolerable = waterTemp >= sp.tolerableTempMin && waterTemp <= sp.tolerableTempMax;
    const windOk = wind <= sp.maxWind;

    // Base activity level from temp + wind
    let level: ActivityLevel;
    let reason: string;
    let tip: string;

    if (tempInIdeal && windOk) {
      level = 'active';
      reason = `Water temp ${waterTemp}°F is ideal (${sp.idealTempMin}-${sp.idealTempMax}°F).`;
      tip = `${season.technique}. Try ${season.bestBait.split(',')[0].trim().toLowerCase()}.`;
    } else if (tempInIdeal && !windOk) {
      level = 'moderate';
      reason = `Water temp is ideal but wind ${wind} kts may make it choppy.`;
      tip = season.zone === 'tributary' || season.zone === 'pier'
        ? 'Sheltered areas still fishable.'
        : 'Try closer to shore or sheltered areas.';
    } else if (tempInTolerable && windOk) {
      level = 'moderate';
      reason = `Water temp ${waterTemp}°F is ${waterTemp < sp.idealTempMin ? 'cooler' : 'warmer'} than ideal (${sp.idealTempMin}-${sp.idealTempMax}°F).`;
      tip = waterTemp < sp.idealTempMin
        ? 'Slower bite — try slower presentations and deeper water.'
        : 'Fish early morning or target deeper, cooler water.';
    } else if (!tempInTolerable && waterTemp < sp.tolerableTempMin) {
      level = 'slow';
      reason = `Water temp ${waterTemp}°F is too cold for ${sp.name.toLowerCase()}.`;
      tip = 'Wait for warmer water. Target cold-water species instead.';
    } else {
      level = 'inactive';
      reason = `Water temp ${waterTemp}°F is too warm for ${sp.name.toLowerCase()}.`;
      tip = 'Too warm — fish deep or target warm-water species.';
    }

    // Mayfly impact adjustment (during mayfly season months 5-9)
    if (mayflyLevel && sp.mayflyImpact > 0 && month >= 5 && month <= 9) {
      const impact = MAYFLY_WEIGHTS[mayflyLevel] * sp.mayflyImpact;
      if (mayflyLevel === 'high' && sp.mayflyImpact >= 0.5) {
        // During peak mayfly hatch, walleye/perch gorge on mayflies — mixed effect
        // They're feeding heavily but may ignore baits
        if (level === 'active') {
          reason += ' Heavy mayfly hatch — fish are feeding but may be selective.';
          tip = 'Match the hatch with light-colored jigs. Mayfly patterns effective.';
        }
      } else if (mayflyLevel === 'medium' && sp.mayflyImpact >= 0.5) {
        if (level === 'active' || level === 'moderate') {
          reason += ' Mayfly activity increasing — great feeding conditions.';
          tip += ' Fish near mayfly hatching areas for bonus action.';
        }
      }
    }

    // Community bite data nudge
    if (communityBiteAvg !== null && communityBiteAvg > 0) {
      if (communityBiteAvg >= 4 && level !== 'active') {
        reason += ' Community reports: fishing is hot!';
        level = level === 'slow' ? 'moderate' : 'active';
      } else if (communityBiteAvg <= 1.5 && level === 'active') {
        reason += ' Community reports: bite has been slow despite good conditions.';
        level = 'moderate';
      }
    }

    return { species: sp, level, reason, tip, season };
  });
}

// ─── Mayfly Hatch ───────────────────────────────────────────────────────────

export interface MayflyStatus {
  phase: 'pre-hatch' | 'imminent' | 'hatching' | 'post-hatch' | 'off-season';
  waterTemp: number | null;
  threshold: number; // 68°F
  message: string;
  communityLevel: MayflyActivityLevel | null;
}

export function getMayflyStatus(
  nearshoreTemp: number | null,
  month: number,
  communityLevel: MayflyActivityLevel | null = null,
): MayflyStatus {
  const threshold = 68;

  // Off-season: Oct-Apr
  if (month < 5 || month > 9) {
    return {
      phase: 'off-season',
      waterTemp: nearshoreTemp,
      threshold,
      message: 'Mayfly season runs May through September. Check back in late spring.',
      communityLevel,
    };
  }

  // Community reports can override sensor-only data
  if (communityLevel === 'high') {
    return {
      phase: 'hatching',
      waterTemp: nearshoreTemp,
      threshold,
      message: nearshoreTemp
        ? `Water temp ${nearshoreTemp}°F. Community reports: heavy mayfly activity! Expect excellent feeding conditions.`
        : 'Community reports: heavy mayfly activity! Expect excellent feeding conditions for walleye and perch.',
      communityLevel,
    };
  }

  if (communityLevel === 'medium') {
    const phase = nearshoreTemp && nearshoreTemp >= threshold ? 'hatching' : 'imminent';
    return {
      phase,
      waterTemp: nearshoreTemp,
      threshold,
      message: nearshoreTemp
        ? `Water temp ${nearshoreTemp}°F. Community reports: moderate mayfly activity. Hatch is underway.`
        : 'Community reports: moderate mayfly activity. Hatch conditions developing.',
      communityLevel,
    };
  }

  if (nearshoreTemp === null) {
    return {
      phase: 'pre-hatch',
      waterTemp: null,
      threshold,
      message: 'Water temperature data unavailable. Mayflies typically emerge in June when nearshore temps reach 68°F.',
      communityLevel,
    };
  }

  if (nearshoreTemp >= 72) {
    return {
      phase: 'post-hatch',
      waterTemp: nearshoreTemp,
      threshold,
      message: `Nearshore temp ${nearshoreTemp}°F. Primary hatch has likely occurred. Walleye and perch feed heavily on mayflies — great fishing expected.`,
      communityLevel,
    };
  }

  if (nearshoreTemp >= threshold) {
    return {
      phase: 'hatching',
      waterTemp: nearshoreTemp,
      threshold,
      message: `Nearshore temp ${nearshoreTemp}°F has reached hatch threshold! Mayflies emerging. Hot fishing expected.`,
      communityLevel,
    };
  }

  if (nearshoreTemp >= 62) {
    return {
      phase: 'imminent',
      waterTemp: nearshoreTemp,
      threshold,
      message: `Nearshore temp ${nearshoreTemp}°F and climbing. Hatch likely within 1-2 weeks when temps reach 68°F. Get your gear ready!`,
      communityLevel,
    };
  }

  return {
    phase: 'pre-hatch',
    waterTemp: nearshoreTemp,
    threshold,
    message: `Nearshore temp ${nearshoreTemp}°F. Mayfly hatch triggers around 68°F — still warming up.`,
    communityLevel,
  };
}

// ─── Fishing Forecast Rating ────────────────────────────────────────────────

export type FishingRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export function getFishingRating(
  windSpeed: number,
  precipChance: number,
  shortForecast: string,
): { rating: FishingRating; reason: string } {
  const lower = shortForecast.toLowerCase();
  const hasStorm = lower.includes('thunderstorm') || lower.includes('severe');
  const hasRain = lower.includes('rain') || lower.includes('showers');

  if (hasStorm || windSpeed > 25) {
    return { rating: 'Poor', reason: hasStorm ? 'Storms expected — stay off the water' : 'High winds — dangerous conditions' };
  }
  if (windSpeed > 18 || (hasRain && precipChance > 60)) {
    return { rating: 'Fair', reason: windSpeed > 18 ? 'Choppy conditions — experienced anglers only' : 'Rain likely — dress for wet weather' };
  }
  if (windSpeed > 12 || (hasRain && precipChance > 30)) {
    return { rating: 'Good', reason: windSpeed > 12 ? 'Light chop — good fishing conditions' : 'Chance of rain but fishable' };
  }
  return { rating: 'Excellent', reason: 'Calm conditions — ideal fishing weather' };
}

// ─── Catch Record Type ──────────────────────────────────────────────────────

export interface FishingCatch {
  id: string;
  angler_name: string;
  angler_email?: string;
  species: string;
  weight_lbs: number | null;
  length_inches: number | null;
  catch_date: string;
  location_name: string;
  location_description?: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  user_id?: string | null;
  // New structured fields
  bait_used?: string | null;
  fishing_method?: string | null;
  quantity_kept?: number | null;
  depth_range?: string | null;
  bite_rating?: number | null;
  display_name?: string | null;
}
