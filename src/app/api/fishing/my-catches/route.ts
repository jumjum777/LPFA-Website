import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ catches: [] }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('fishing_catches')
    .select('*')
    .eq('user_id', user.id)
    .order('catch_date', { ascending: false });

  if (error) {
    return NextResponse.json({ catches: [] }, { status: 500 });
  }

  return NextResponse.json({ catches: data || [] });
}
