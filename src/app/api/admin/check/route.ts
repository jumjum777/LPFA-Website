import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ isAdmin: false });
  }

  // Use service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the JWT and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ isAdmin: false });
  }

  // Check admin_users table (service role bypasses RLS)
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, display_name, email')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    isAdmin: !!adminUser,
    role: adminUser?.role || null,
    display_name: adminUser?.display_name || null,
    email: adminUser?.email || null,
  });
}
