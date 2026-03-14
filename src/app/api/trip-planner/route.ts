import { NextResponse } from 'next/server';
import { fetchMarineData } from '@/lib/marine';
import { fetchBeachData } from '@/lib/beach';
import { fetchActiveVessels } from '@/lib/vessels';
import { generateTripAnalysis, generateMultiStopAnalysis, DESTINATIONS } from '@/lib/trip-planner';
import type { TripRequest, TripLeg, MultiStopRequest } from '@/lib/trip-planner';

export async function POST(request: Request) {
  let body: TripRequest & { legs?: TripLeg[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { boatSize, experienceLevel } = body;

  if (!['small', 'medium', 'large'].includes(boatSize)) {
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

    const msRequest: MultiStopRequest = { boatSize, experienceLevel, legs };
    const analysis = await generateMultiStopAnalysis(msRequest, marine, beach, vessels);
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
    departurePoint: departurePoint || 'Lorain Harbor',
    destination,
    departureTime,
    returnTime,
    experienceLevel,
  };

  const analysis = await generateTripAnalysis(trip, marine, beach, vessels);
  return NextResponse.json(analysis);
}
