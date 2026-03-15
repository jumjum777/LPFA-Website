import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  // Get current user's role from the browser session cookie
  let currentRole = '';
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
      const adminClient = createAdminClient();
      const { data: me } = await adminClient
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      currentRole = me?.role || '';
    }
  } catch (err) {
    console.error('Users API auth error:', err);
  }

  // Fetch all admin users
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at');
  if (error) console.error('Users API error:', error);

  return NextResponse.json({ users: data || [], currentRole });
}
