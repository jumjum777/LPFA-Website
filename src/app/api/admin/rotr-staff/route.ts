import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const [{ data: contractors, error: cErr }, { data: assignments, error: aErr }] = await Promise.all([
    supabase.from('rotr_contractors').select('*').order('last_name'),
    supabase.from('rotr_event_assignments').select('*').order('event_date', { ascending: false }),
  ]);

  if (cErr) console.error('Staff load error:', cErr);
  if (aErr) console.error('Assignments load error:', aErr);

  return NextResponse.json({
    contractors: contractors || [],
    assignments: assignments || [],
  });
}
