import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Verify the caller is a super_admin
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can invite users' }, { status: 403 });
  }

  const { email, display_name, role } = await request.json();

  if (!email || !display_name || !role) {
    return NextResponse.json({ error: 'Email, display_name, and role are required' }, { status: 400 });
  }

  // Use admin client to invite user
  const adminClient = createAdminClient();
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  // Add to admin_users table
  if (inviteData.user) {
    const { error: insertError } = await adminClient
      .from('admin_users')
      .insert({
        user_id: inviteData.user.id,
        role,
        display_name,
        email,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
