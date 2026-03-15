import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Purchase Orders API error:', error);
    return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [] });
}
