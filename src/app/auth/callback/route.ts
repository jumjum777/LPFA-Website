import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // signup | recovery | invite
  const next = searchParams.get('next');

  if (!code) {
    const errorPage = type === 'invite' ? '/admin/login?error=missing_code' : '/login?error=missing_code';
    return NextResponse.redirect(new URL(errorPage, request.url));
  }

  // Determine redirect based on type
  let redirectTo: string;
  if (type === 'invite') {
    redirectTo = '/admin/set-password';
  } else if (type === 'recovery') {
    redirectTo = '/reset-password';
  } else {
    redirectTo = next || '/account';
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorPage = type === 'invite'
      ? '/admin/login?error=invite_expired'
      : '/login?error=verification_failed';
    return NextResponse.redirect(new URL(errorPage, request.url));
  }

  // For signup: create public_profiles row if it doesn't exist
  if (type === 'signup' && data.user) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await adminClient
      .from('public_profiles')
      .select('id')
      .eq('user_id', data.user.id)
      .single();

    if (!existing) {
      const displayName = data.user.user_metadata?.display_name
        || data.user.email?.split('@')[0]
        || 'Angler';

      await adminClient.from('public_profiles').insert({
        user_id: data.user.id,
        display_name: displayName,
      });
    }
  }

  return response;
}
