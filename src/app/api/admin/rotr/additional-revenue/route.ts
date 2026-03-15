import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rotr_additional_revenue')
    .select('*')
    .order('revenue_date', { ascending: false });

  if (error) {
    console.error('Additional revenue GET error:', error);
    return NextResponse.json({ revenue: [], error: error.message }, { status: 500 });
  }
  return NextResponse.json({ revenue: data || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { description, amount, source_type, wix_event_id, revenue_date, notes, created_by } = body;

  if (!description?.trim() || !amount || !source_type || !revenue_date || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('rotr_additional_revenue').insert({
    description: description.trim(),
    amount,
    source_type,
    wix_event_id: wix_event_id || null,
    revenue_date,
    notes: notes?.trim() || null,
    created_by,
  }).select().single();

  if (error) {
    console.error('Additional revenue POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: data });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('rotr_additional_revenue')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Additional revenue PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('rotr_additional_revenue').delete().eq('id', id);

  if (error) {
    console.error('Additional revenue DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
