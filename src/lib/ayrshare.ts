const AYRSHARE_BASE = 'https://app.ayrshare.com/api';

interface AyrshareResponse {
  status: string;
  facebook?: { analytics: Record<string, unknown>; lastUpdated?: string };
  youtube?: { analytics: Record<string, unknown>; lastUpdated?: string };
  message?: string;
  code?: number;
}

interface AyrshareFetchOptions {
  daily?: boolean;
  quarters?: number;
}

/** Make a read-only analytics request to Ayrshare */
export async function ayrshareFetch(
  platforms: string[],
  profileKey?: string,
  options?: AyrshareFetchOptions
): Promise<{ data: AyrshareResponse | null; error?: string }> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) return { data: null, error: 'AYRSHARE_API_KEY not set' };

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (profileKey) {
    headers['Profile-Key'] = profileKey;
  }

  const body: Record<string, unknown> = { platforms };
  if (options?.daily) body.daily = true;
  if (options?.quarters) body.quarters = options.quarters;

  try {
    const res = await fetch(`${AYRSHARE_BASE}/analytics/social`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Ayrshare returns partial success — e.g. facebook works but youtube not linked
    // The overall status may be 400 but individual platforms still have data
    return { data };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

/** Get the profile key for a given context */
export function getProfileKey(profile: 'lpfa' | 'rotr'): string | undefined {
  return profile === 'rotr'
    ? process.env.AYRSHARE_PROFILE_KEY_ROTR
    : process.env.AYRSHARE_PROFILE_KEY_LPFA;
}
