import { createClient } from '@supabase/supabase-js';

const CC_BASE = 'https://api.cc.email/v3';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CCTokens {
  access_token: string;
  refresh_token: string;
}

/** Read tokens from Supabase cc_tokens table */
export async function getTokens(): Promise<CCTokens | null> {
  const { data } = await supabaseAdmin
    .from('cc_tokens')
    .select('access_token, refresh_token')
    .eq('id', 'default')
    .single();
  if (!data?.access_token) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

/** Save tokens to Supabase */
async function saveTokens(accessToken: string, refreshToken: string) {
  await supabaseAdmin.from('cc_tokens').upsert({
    id: 'default',
    access_token: accessToken,
    refresh_token: refreshToken,
    updated_at: new Date().toISOString(),
  });
}

/** Exchange refresh token for a new access token, save both to DB */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.CONSTANTCONTACT_CLIENT_ID;
  const clientSecret = process.env.CONSTANTCONTACT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://authz.constantcontact.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (!res.ok) return null;
  const data = await res.json();
  // Constant Contact returns a new refresh token too — save both
  await saveTokens(data.access_token, data.refresh_token || refreshToken);
  return data.access_token;
}

/** Make an authenticated request to Constant Contact, auto-refreshing on 401 */
export async function ccFetch(endpoint: string): Promise<{ data: unknown; error?: string; status?: number }> {
  const tokens = await getTokens();
  if (!tokens) return { data: null, error: 'Not connected', status: 401 };

  let accessToken = tokens.access_token;

  // First attempt
  let res = await fetch(`${CC_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // If 401, try refreshing
  if (res.status === 401) {
    const newToken = await refreshAccessToken(tokens.refresh_token);
    if (!newToken) return { data: null, error: 'Token expired. Re-authorize Constant Contact.', status: 401 };
    accessToken = newToken;

    res = await fetch(`${CC_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    return { data: null, error: text, status: res.status };
  }

  return { data: await res.json() };
}

/** Save initial tokens from OAuth callback */
export async function saveOAuthTokens(accessToken: string, refreshToken: string) {
  await saveTokens(accessToken, refreshToken);
}
