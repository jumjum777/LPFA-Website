import { NextRequest, NextResponse } from 'next/server';

// GET: Initiate OAuth flow — redirect to Constant Contact authorization
export async function GET(req: NextRequest) {
  const clientId = process.env.CONSTANTCONTACT_CLIENT_ID;
  const redirectUri = process.env.CONSTANTCONTACT_REDIRECT_URI || `${req.nextUrl.origin}/api/admin/email-marketing/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'CONSTANTCONTACT_CLIENT_ID not set' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const scope = 'campaign_data contact_data offline_access';

  const authUrl = new URL('https://authz.constantcontact.com/oauth2/default/v1/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}
