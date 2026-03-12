import { NextRequest, NextResponse } from 'next/server';
import { saveOAuthTokens } from '@/lib/constantcontact';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/admin/email-marketing?error=no_code', req.url));
  }

  const clientId = process.env.CONSTANTCONTACT_CLIENT_ID;
  const clientSecret = process.env.CONSTANTCONTACT_CLIENT_SECRET;
  const redirectUri = process.env.CONSTANTCONTACT_REDIRECT_URI || `${req.nextUrl.origin}/api/admin/email-marketing/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin/email-marketing?error=missing_credentials', req.url));
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch('https://authz.constantcontact.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!tokenRes.ok) {
    console.error('CC token exchange failed:', await tokenRes.text());
    return NextResponse.redirect(new URL('/admin/email-marketing?error=token_exchange', req.url));
  }

  const tokens = await tokenRes.json();

  // Save tokens to Supabase — they'll auto-refresh from here
  await saveOAuthTokens(tokens.access_token, tokens.refresh_token);

  // Redirect straight to the dashboard
  return NextResponse.redirect(new URL('/admin/email-marketing', req.url));
}
