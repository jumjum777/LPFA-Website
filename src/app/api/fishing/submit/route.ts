import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { SPECIES, LOCATION_PRESETS, BAIT_OPTIONS, METHOD_OPTIONS, DEPTH_OPTIONS, GPS_BOUNDS } from '@/lib/fishing';

export async function POST(request: Request) {
  // ── Auth required ──────────────────────────────────────────────
  let userId: string;
  let displayName: string;

  try {
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to submit a catch.' }, { status: 401 });
    }
    userId = user.id;

    // Get display name from public_profiles
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();
    displayName = profile?.display_name || user.email || 'Angler';
  } catch {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    species, weightLbs, lengthInches, catchDate, locationName,
    locationDescription, latitude, longitude, quantityKept,
    baitUsed, fishingMethod, depthRange, biteRating,
  } = body as Record<string, string | number | null>;

  // ── Validate required fields ───────────────────────────────────
  if (!species || !SPECIES.some(s => s.id === species) && species !== 'other') {
    return NextResponse.json({ error: 'Please select a valid fish species.' }, { status: 400 });
  }
  if (!catchDate || typeof catchDate !== 'string') {
    return NextResponse.json({ error: 'Catch date is required.' }, { status: 400 });
  }
  if (!locationName || typeof locationName !== 'string') {
    return NextResponse.json({ error: 'Location is required.' }, { status: 400 });
  }

  // Validate location is a known preset or "Other"
  const isKnownLocation = LOCATION_PRESETS.includes(locationName as string) || locationName === 'Other';
  if (!isKnownLocation) {
    return NextResponse.json({ error: 'Please select a valid location.' }, { status: 400 });
  }

  // ── GPS required + bounding box ────────────────────────────────
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return NextResponse.json({ error: 'GPS location is required.' }, { status: 400 });
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid GPS coordinates.' }, { status: 400 });
  }
  if (lat < GPS_BOUNDS.latMin || lat > GPS_BOUNDS.latMax || lng < GPS_BOUNDS.lngMin || lng > GPS_BOUNDS.lngMax) {
    return NextResponse.json({ error: 'Your location is outside the Lake Erie / Lorain fishing area.' }, { status: 400 });
  }

  // ── Date validation (within last 7 days) ───────────────────────
  const catchDateObj = new Date(catchDate + 'T12:00:00');
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  if (catchDateObj > now) {
    return NextResponse.json({ error: 'Catch date cannot be in the future.' }, { status: 400 });
  }
  if (catchDateObj < sevenDaysAgo) {
    return NextResponse.json({ error: 'Catch date must be within the last 7 days.' }, { status: 400 });
  }

  // ── Validate optional numeric fields ───────────────────────────
  const weight = weightLbs ? Number(weightLbs) : null;
  const length = lengthInches ? Number(lengthInches) : null;
  if (weight !== null && (isNaN(weight) || weight <= 0 || weight > 200)) {
    return NextResponse.json({ error: 'Weight must be between 0 and 200 lbs.' }, { status: 400 });
  }
  if (length !== null && (isNaN(length) || length <= 0 || length > 100)) {
    return NextResponse.json({ error: 'Length must be between 0 and 100 inches.' }, { status: 400 });
  }

  // ── Validate structured fields ─────────────────────────────────
  const bait = baitUsed && typeof baitUsed === 'string' ? baitUsed : null;
  if (bait && !BAIT_OPTIONS.includes(bait)) {
    return NextResponse.json({ error: 'Please select a valid bait option.' }, { status: 400 });
  }

  const method = fishingMethod && typeof fishingMethod === 'string' ? fishingMethod : null;
  if (method && !METHOD_OPTIONS.includes(method)) {
    return NextResponse.json({ error: 'Please select a valid fishing method.' }, { status: 400 });
  }

  const depth = depthRange && typeof depthRange === 'string' ? depthRange : null;
  if (depth && !DEPTH_OPTIONS.includes(depth)) {
    return NextResponse.json({ error: 'Please select a valid depth range.' }, { status: 400 });
  }

  const bite = biteRating ? Number(biteRating) : null;
  if (bite !== null && (!Number.isInteger(bite) || bite < 1 || bite > 5)) {
    return NextResponse.json({ error: 'Bite rating must be between 1 and 5.' }, { status: 400 });
  }
  if (bite === null) {
    return NextResponse.json({ error: 'Bite rating is required.' }, { status: 400 });
  }

  const qty = quantityKept ? Number(quantityKept) : null;
  if (qty !== null && (!Number.isInteger(qty) || qty < 0 || qty > 100)) {
    return NextResponse.json({ error: 'Quantity kept must be between 0 and 100.' }, { status: 400 });
  }

  // ── Rate limiting ──────────────────────────────────────────────
  const supabase = createAdminClient();

  // 5 catches per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('fishing_catches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  if (todayCount !== null && todayCount >= 5) {
    return NextResponse.json({ error: 'You can submit up to 5 catch reports per day.' }, { status: 429 });
  }

  // 2-minute cooldown
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: recentCatches } = await supabase
    .from('fishing_catches')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', twoMinAgo)
    .limit(1);

  if (recentCatches && recentCatches.length > 0) {
    return NextResponse.json({ error: 'Please wait 2 minutes between submissions.' }, { status: 429 });
  }

  // Duplicate detection (same user + species + date)
  const { data: duplicates } = await supabase
    .from('fishing_catches')
    .select('id')
    .eq('user_id', userId)
    .eq('species', species as string)
    .eq('catch_date', catchDate as string)
    .limit(1);

  if (duplicates && duplicates.length > 0) {
    return NextResponse.json({ error: 'You already submitted a catch for this species on this date.' }, { status: 400 });
  }

  // ── Insert (auto-approved) ─────────────────────────────────────
  const { error } = await supabase.from('fishing_catches').insert({
    angler_name: displayName,
    display_name: displayName,
    species: species as string,
    weight_lbs: weight,
    length_inches: length,
    catch_date: catchDate as string,
    location_name: locationName as string,
    location_description: locationDescription ? (locationDescription as string).trim() : null,
    latitude: lat,
    longitude: lng,
    quantity_kept: qty,
    bait_used: bait,
    fishing_method: method,
    depth_range: depth,
    bite_rating: bite,
    user_id: userId,
    status: 'approved',
  });

  if (error) {
    console.error('Error submitting catch:', error);
    return NextResponse.json({ error: 'Failed to submit catch. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Your catch has been added to the board!' });
}
