import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWixEvents, formatWixEventForSupabase } from '@/lib/wix';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Fetch all events from Wix
    const wixEvents = await getWixEvents();

    if (wixEvents.length === 0) {
      return NextResponse.json({
        synced: 0, new: 0, updated: 0, errors: [],
        message: 'No events found from Wix.',
      });
    }

    // Get existing Wix-synced events to preserve is_published state
    const wixIds = wixEvents.map(e => e.id);
    const { data: existing, error: selectError } = await supabase
      .from('events')
      .select('wix_event_id, is_published, is_featured, headliner, opening_band, gates_time, opener_time, headliner_time, event_policy, description')
      .in('wix_event_id', wixIds);

    if (selectError) {
      console.error('Supabase select error:', selectError);
      return NextResponse.json({
        synced: 0, new: 0, updated: 0,
        errors: [selectError.message],
        message: 'Failed to query existing events. Make sure the wix_event_id column exists.',
      }, { status: 500 });
    }

    const existingMap = new Map(
      (existing || []).map(e => [e.wix_event_id, e])
    );

    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const wixEvent of wixEvents) {
      const mapped = formatWixEventForSupabase(wixEvent);
      const prev = existingMap.get(wixEvent.id);

      if (prev) {
        // Update: preserve admin overrides (is_published, is_featured, headliner, etc.)
        const updateData: Record<string, unknown> = {
          title: mapped.title,
          event_date: mapped.event_date,
          location: mapped.location,
          time: mapped.time,
          price: mapped.price,
          ticket_url: mapped.ticket_url,
          image_url: mapped.image_url,
          cta_text: mapped.cta_text,
          cta_url: mapped.cta_url,
          // Preserve admin-entered fields — only update if admin hasn't set them
          description: prev.description && prev.description !== prev.headliner && prev.description !== mapped.title
            ? prev.description
            : mapped.description,
        };

        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('wix_event_id', wixEvent.id);

        if (error) {
          errors.push(`Update "${mapped.title}": ${error.message}`);
        } else {
          updatedCount++;
        }
      } else {
        // New event — insert as unpublished
        const { error } = await supabase
          .from('events')
          .insert({
            ...mapped,
            is_published: false,
            is_featured: false,
            sort_order: 0,
          });

        if (error) {
          errors.push(`Insert "${mapped.title}": ${error.message}`);
        } else {
          newCount++;
        }
      }
    }

    return NextResponse.json({
      synced: wixEvents.length,
      new: newCount,
      updated: updatedCount,
      errors,
    });
  } catch (err) {
    console.error('Wix sync error:', err);
    return NextResponse.json({
      synced: 0, new: 0, updated: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      message: 'Sync failed.',
    }, { status: 500 });
  }
}
