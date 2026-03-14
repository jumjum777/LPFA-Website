import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const supabase = createAdminClient();

  // Build date filter
  let query = supabase.from('trip_submissions').select('*');
  if (start) query = query.gte('created_at', `${start}T00:00:00`);
  if (end) query = query.lte('created_at', `${end}T23:59:59`);
  query = query.order('created_at', { ascending: false });

  const { data: trips, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!trips || trips.length === 0) {
    return NextResponse.json({
      totalTrips: 0,
      tripsByType: { single: 0, 'multi-stop': 0 },
      tripsByBoatSize: {},
      tripsByBoatType: {},
      tripsByExperience: {},
      tripsByRating: {},
      tripsByActivity: {},
      topDestinations: [],
      tripsByDayOfWeek: [],
      tripsByHour: [],
      tripsByMonth: [],
      uniqueUsers: 0,
      recentTrips: [],
    });
  }

  // Aggregate stats
  const tripsByType: Record<string, number> = {};
  const tripsByBoatSize: Record<string, number> = {};
  const tripsByBoatType: Record<string, number> = {};
  const tripsByExperience: Record<string, number> = {};
  const tripsByRating: Record<string, number> = {};
  const tripsByActivity: Record<string, number> = {};
  const destCounts: Record<string, number> = {};
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const hourCounts = new Array(24).fill(0);
  const monthCounts: Record<string, number> = {};
  const uniqueIPs = new Set<string>();

  for (const trip of trips) {
    // Type
    tripsByType[trip.trip_type] = (tripsByType[trip.trip_type] || 0) + 1;

    // Boat size
    tripsByBoatSize[trip.boat_size] = (tripsByBoatSize[trip.boat_size] || 0) + 1;

    // Boat type
    tripsByBoatType[trip.boat_type] = (tripsByBoatType[trip.boat_type] || 0) + 1;

    // Experience
    tripsByExperience[trip.experience_level] = (tripsByExperience[trip.experience_level] || 0) + 1;

    // Rating
    tripsByRating[trip.overall_rating] = (tripsByRating[trip.overall_rating] || 0) + 1;

    // Activities
    if (Array.isArray(trip.activities)) {
      for (const a of trip.activities) {
        tripsByActivity[a] = (tripsByActivity[a] || 0) + 1;
      }
    }

    // Destinations
    if (Array.isArray(trip.destinations)) {
      for (const d of trip.destinations) {
        destCounts[d] = (destCounts[d] || 0) + 1;
      }
    }

    // Day of week (based on departure_time)
    const depDate = new Date(trip.departure_time);
    if (!isNaN(depDate.getTime())) {
      dayOfWeekCounts[depDate.getDay()]++;
      hourCounts[depDate.getHours()]++;
    }

    // Month (based on submission time)
    const created = new Date(trip.created_at);
    const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

    // Unique users
    if (trip.ip_hash) uniqueIPs.add(trip.ip_hash);
  }

  // Sort destinations by count
  const topDestinations = Object.entries(destCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([destination, count]) => ({ destination, count }));

  // Day of week labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const tripsByDayOfWeek = dayLabels.map((day, i) => ({ day, count: dayOfWeekCounts[i] }));

  // Hour distribution
  const tripsByHour = hourCounts.map((count: number, hour: number) => ({ hour, count }));

  // Monthly trend (sorted)
  const tripsByMonth = Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  // Recent trips (last 20)
  const recentTrips = trips.slice(0, 20).map(t => ({
    tripType: t.trip_type,
    boatSize: t.boat_size,
    boatType: t.boat_type,
    experienceLevel: t.experience_level,
    destinations: t.destinations,
    overallRating: t.overall_rating,
    departureTime: t.departure_time,
    createdAt: t.created_at,
  }));

  return NextResponse.json({
    totalTrips: trips.length,
    tripsByType,
    tripsByBoatSize,
    tripsByBoatType,
    tripsByExperience,
    tripsByRating,
    tripsByActivity,
    topDestinations,
    tripsByDayOfWeek,
    tripsByHour,
    tripsByMonth,
    uniqueUsers: uniqueIPs.size,
    recentTrips,
  });
}
