import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';
import { fetchBeachData } from '@/lib/beach';
import { fetchActiveVessels } from '@/lib/vessels';
import { generateTripAnalysis, generateMultiStopAnalysis, DESTINATIONS } from '@/lib/trip-planner';
import type { TripRequest, TripLeg, MultiStopRequest, BoatingRating, BoatActivity } from '@/lib/trip-planner';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Rate Limiting (in-memory, per-instance) ───────────────────────────────
const ipSubmissions = new Map<string, number[]>();
const RATE_LIMIT = 5;        // max submissions
const RATE_WINDOW = 3600000; // per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipSubmissions.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return false;
}

// ─── Trip Logging ───────────────────────────────────────────────────────────
async function logTrip(params: {
  ip: string;
  tripType: 'single' | 'multi-stop';
  boatSize: string;
  boatType: string;
  experienceLevel: string;
  activities: string[];
  destinations: string[];
  departureTime: string;
  overallRating: BoatingRating;
  legCount: number;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from('trip_submissions').insert({
      ip_hash: await hashIP(params.ip),
      trip_type: params.tripType,
      boat_size: params.boatSize,
      boat_type: params.boatType,
      experience_level: params.experienceLevel,
      activities: params.activities,
      destinations: params.destinations,
      departure_time: params.departureTime,
      overall_rating: params.overallRating,
      leg_count: params.legCount,
    });
  } catch {
    // Non-blocking — don't fail the request if logging fails
  }
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(0, 8));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(request: Request) {
  // Rate limit check
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: TripRequest & { legs?: TripLeg[]; website?: string; _ts?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Bot protection: honeypot field (hidden input that humans never fill)
  if (body.website) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Bot protection: timing check (submissions faster than 2 seconds are likely bots)
  if (body._ts && Date.now() - body._ts < 2000) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { boatSize, experienceLevel } = body;
  const boatType = body.boatType || 'powerboat';
  const validActivities: BoatActivity[] = ['cruising', 'fishing', 'swimming', 'watersports', 'wave-jumping'];
  const activities: BoatActivity[] = Array.isArray(body.activities)
    ? body.activities.filter((a: string) => validActivities.includes(a as BoatActivity)) as BoatActivity[]
    : ['cruising'];

  if (!['small', 'medium', 'large', 'jetski'].includes(boatSize)) {
    return NextResponse.json({ error: 'Invalid boat size' }, { status: 400 });
  }
  if (!['beginner', 'intermediate', 'experienced'].includes(experienceLevel)) {
    return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
  }

  // ─── Multi-Stop Mode ─────────────────────────────────────────────────
  if (body.legs && Array.isArray(body.legs)) {
    const { legs } = body;

    if (legs.length < 2 || legs.length > 5) {
      return NextResponse.json({ error: 'Multi-stop trips require 2-5 legs' }, { status: 400 });
    }

    // Validate each leg
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (!leg.from || !leg.to || !leg.departureTime) {
        return NextResponse.json({ error: `Leg ${i + 1} is missing required fields` }, { status: 400 });
      }
      if (!DESTINATIONS.some(d => d.value === leg.from) || !DESTINATIONS.some(d => d.value === leg.to)) {
        return NextResponse.json({ error: `Leg ${i + 1} has an invalid destination` }, { status: 400 });
      }
      const depTime = new Date(leg.departureTime);
      if (isNaN(depTime.getTime())) {
        return NextResponse.json({ error: `Leg ${i + 1} has an invalid departure time` }, { status: 400 });
      }
      // Each leg's departure must be after the previous
      if (i > 0) {
        const prevDep = new Date(legs[i - 1].departureTime);
        if (depTime <= prevDep) {
          return NextResponse.json({ error: `Leg ${i + 1} departure must be after leg ${i} departure` }, { status: 400 });
        }
      }
    }

    // Check total trip duration
    const firstDep = new Date(legs[0].departureTime);
    const lastDep = new Date(legs[legs.length - 1].departureTime);
    const totalHours = (lastDep.getTime() - firstDep.getTime()) / 3600000;
    if (totalHours > 72) {
      return NextResponse.json({ error: 'Trip duration cannot exceed 72 hours' }, { status: 400 });
    }

    const [marine, beach, vessels] = await Promise.all([
      fetchMarineData(),
      fetchBeachData(),
      fetchActiveVessels(),
    ]);

    const msRequest: MultiStopRequest = { boatSize, experienceLevel, boatType, activities, legs };
    const analysis = await generateMultiStopAnalysis(msRequest, marine, beach, vessels);

    // Log (non-blocking)
    const allDests = legs.map(l => l.from).concat(legs[legs.length - 1].to);
    logTrip({
      ip, tripType: 'multi-stop', boatSize, boatType, experienceLevel, activities,
      destinations: [...new Set(allDests)],
      departureTime: legs[0].departureTime,
      overallRating: analysis.overallRating,
      legCount: legs.length,
    });

    return NextResponse.json(analysis);
  }

  // ─── Single-Destination Mode ─────────────────────────────────────────
  const { destination, departureTime, returnTime, departurePoint } = body;

  if (!DESTINATIONS.some(d => d.value === destination)) {
    return NextResponse.json({ error: 'Invalid destination' }, { status: 400 });
  }
  if (!departureTime || !returnTime) {
    return NextResponse.json({ error: 'Departure and return times are required' }, { status: 400 });
  }

  const dep = new Date(departureTime);
  const ret = new Date(returnTime);

  if (isNaN(dep.getTime()) || isNaN(ret.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (ret <= dep) {
    return NextResponse.json({ error: 'Return time must be after departure time' }, { status: 400 });
  }

  const durationHours = (ret.getTime() - dep.getTime()) / 3600000;
  if (durationHours > 72) {
    return NextResponse.json({ error: 'Trip duration cannot exceed 72 hours' }, { status: 400 });
  }

  const [marine, beach, vessels] = await Promise.all([
    fetchMarineData(),
    fetchBeachData(),
    fetchActiveVessels(),
  ]);

  const trip: TripRequest = {
    boatSize,
    boatType,
    activities,
    departurePoint: departurePoint || 'Lorain Harbor',
    destination,
    departureTime,
    returnTime,
    experienceLevel,
  };

  const analysis = await generateTripAnalysis(trip, marine, beach, vessels);

  // Log (non-blocking)
  logTrip({
    ip, tripType: 'single', boatSize, boatType, experienceLevel, activities,
    destinations: ['lorain', destination],
    departureTime,
    overallRating: analysis.overallRating,
    legCount: 1,
  });

  return NextResponse.json(analysis);
}
