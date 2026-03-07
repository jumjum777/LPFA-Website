import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

// This endpoint is called by Vercel Cron to sync tour data from PeekPro
// Configure in vercel.json: { "crons": [{ "path": "/api/peekpro/sync", "schedule": "0 6 * * *" }] }

export async function GET(request: Request) {
  const apiKey = process.env.PEEKPRO_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'PeekPro not configured yet' }, { status: 200 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch tours that have a peekpro_product_id
    const { data: tours } = await supabase
      .from('tours')
      .select('id, peekpro_product_id')
      .not('peekpro_product_id', 'is', null);

    if (!tours || tours.length === 0) {
      return NextResponse.json({ message: 'No tours linked to PeekPro' });
    }

    // For each linked tour, fetch availability from PeekPro OCTO API
    for (const tour of tours) {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch('https://octo.peek.com/integrations/octo/availability/calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: tour.peekpro_product_id,
          localDateStart: today,
          localDateEnd: endDate,
        }),
      });

      if (!response.ok) continue;

      const availability = await response.json();

      // Group by month and upsert into tour_schedules
      const monthMap: Record<string, string[]> = {};
      for (const day of availability) {
        if (!day.available) continue;
        const date = new Date(day.localDate);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        const monthOrder = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${monthOrder}-${monthName}`;

        if (!monthMap[key]) monthMap[key] = [];
        const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        monthMap[key].push(formatted);
      }

      // Delete existing PeekPro schedules for this tour
      await supabase
        .from('tour_schedules')
        .delete()
        .eq('tour_id', tour.id)
        .eq('source', 'peekpro');

      // Insert new schedules
      for (const [key, dates] of Object.entries(monthMap)) {
        const [year, monthOrder, month] = key.split('-');
        await supabase.from('tour_schedules').insert({
          tour_id: tour.id,
          year: parseInt(year),
          month,
          month_order: parseInt(monthOrder),
          dates,
          source: 'peekpro',
        });
      }
    }

    revalidatePath('/recreation');
    return NextResponse.json({ success: true, synced: tours.length });
  } catch (error) {
    console.error('PeekPro sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
