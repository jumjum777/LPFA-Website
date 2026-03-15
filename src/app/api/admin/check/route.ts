import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Use service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let userId: string | null = null;

  // Try Bearer token first (from client-side getSession)
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
    }
  }

  // Fallback: read from cookies (avoids client-side getSession entirely)
  if (!userId) {
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ isAdmin: false });
  }

  // Check admin_users table (service role bypasses RLS)
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, display_name, email')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    isAdmin: !!adminUser,
    role: adminUser?.role || null,
    display_name: adminUser?.display_name || null,
    email: adminUser?.email || null,
  });
}
