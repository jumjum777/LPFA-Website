import { NextRequest, NextResponse } from 'next/server';

// Handle OAuth callback from Constant Contact
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
    const err = await tokenRes.text();
    console.error('CC token exchange failed:', err);
    return NextResponse.redirect(new URL('/admin/email-marketing?error=token_exchange', req.url));
  }

  const tokens = await tokenRes.json();

  // Display the tokens for the admin to add to env vars
  // In a production system, you'd store these in a database
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head><title>Constant Contact Connected</title>
    <style>
      body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px; background: #0B1F3A; color: #fff; }
      h1 { color: #1B8BEB; }
      .token-box { background: #1a2d47; border: 1px solid #2a4060; border-radius: 8px; padding: 16px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px; }
      .label { color: #D97706; font-weight: bold; margin-bottom: 4px; }
      .note { color: #94A3B8; font-size: 14px; margin-top: 24px; }
      a { color: #1B8BEB; }
    </style>
    </head>
    <body>
      <h1>Constant Contact Connected!</h1>
      <p>Add these to your <code>.env.local</code> file and restart the server:</p>
      <div class="label">CONSTANTCONTACT_ACCESS_TOKEN</div>
      <div class="token-box">${tokens.access_token}</div>
      <div class="label">CONSTANTCONTACT_REFRESH_TOKEN</div>
      <div class="token-box">${tokens.refresh_token}</div>
      <p class="note">Access token expires in 24 hours. The refresh token is used automatically to get new access tokens. The refresh token expires after 180 days of non-use.</p>
      <p><a href="/admin/email-marketing">Go to Email Marketing Dashboard</a></p>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
