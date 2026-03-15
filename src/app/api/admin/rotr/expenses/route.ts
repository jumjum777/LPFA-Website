import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rotr_expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ expenses: [], error: error.message }, { status: 500 });
  }
  return NextResponse.json({ expenses: data || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { description, amount, category, vendor, expense_date, wix_event_id, po_id, receipt_urls, notes, created_by } = body;

  if (!description?.trim() || !amount || !category || !expense_date || !created_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('rotr_expenses').insert({
    description: description.trim(),
    amount,
    category,
    vendor: vendor?.trim() || null,
    expense_date,
    wix_event_id: wix_event_id || null,
    po_id: po_id || null,
    receipt_urls: receipt_urls || [],
    notes: notes?.trim() || null,
    created_by,
  }).select().single();

  if (error) {
    console.error('Expenses POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ expense: data });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('rotr_expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Expenses PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('rotr_expenses').delete().eq('id', id);

  if (error) {
    console.error('Expenses DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
