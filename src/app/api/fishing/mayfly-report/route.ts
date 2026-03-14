import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GPS_BOUNDS, MayflyActivityLevel } from '@/lib/fishing';

const VALID_ACTIVITY_LEVELS: MayflyActivityLevel[] = ['none', 'low', 'medium', 'high'];

export async function POST(request: Request) {
  // Auth required
  const authClient = await createServerClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { activity_level, latitude, longitude } = body as {
    activity_level: string;
    latitude: number;
    longitude: number;
  };

  // Validate activity_level
  if (!activity_level || !VALID_ACTIVITY_LEVELS.includes(activity_level as MayflyActivityLevel)) {
    return NextResponse.json(
      { error: 'Invalid activity_level. Must be one of: none, low, medium, high.' },
      { status: 400 },
    );
  }

  // Validate GPS coordinates are provided
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (latitude == null || longitude == null || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'GPS coordinates (latitude and longitude) are required.' },
      { status: 400 },
    );
  }

  // Validate GPS within bounds
  if (lat < GPS_BOUNDS.latMin || lat > GPS_BOUNDS.latMax) {
    return NextResponse.json(
      { error: `Latitude must be between ${GPS_BOUNDS.latMin} and ${GPS_BOUNDS.latMax}.` },
      { status: 400 },
    );
  }
  if (lng < GPS_BOUNDS.lngMin || lng > GPS_BOUNDS.lngMax) {
    return NextResponse.json(
      { error: `Longitude must be between ${GPS_BOUNDS.lngMin} and ${GPS_BOUNDS.lngMax}.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Rate limit: 1 report per day per user
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existingReport, error: checkError } = await supabase
    .from('mayfly_reports')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing mayfly report:', checkError);
    return NextResponse.json(
      { error: 'Failed to check existing reports. Please try again.' },
      { status: 500 },
    );
  }

  if (existingReport) {
    return NextResponse.json(
      { error: 'You have already submitted a mayfly report today. Try again tomorrow.' },
      { status: 429 },
    );
  }

  // Insert the report
  const { error: insertError } = await supabase.from('mayfly_reports').insert({
    user_id: user.id,
    activity_level,
    latitude: lat,
    longitude: lng,
  });

  if (insertError) {
    console.error('Error inserting mayfly report:', insertError);
    return NextResponse.json(
      { error: 'Failed to submit mayfly report. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
