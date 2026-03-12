import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

// This endpoint is called by Vercel Cron to sync tour data from PeekPro
// Configure in vercel.json: { "crons": [{ "path": "/api/peekpro/sync", "schedule": "0 6 * * *" }] }

const OCTO_BASE = 'https://octo.peek.com/integrations/octo';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractPrice(product: OctoProduct): string {
  try {
    const option = product.options?.[0];
    if (!option?.unitPricing?.length) return 'See website';
    // Find the adult/default unit pricing
    const pricing = option.unitPricing.find(
      (u: { unitId: string; price: number }) => u.unitId === 'adult' || u.unitId === 'unit_default'
    ) || option.unitPricing[0];
    if (!pricing?.price) return 'See website';
    // OCTO prices are in cents
    const dollars = pricing.price / 100;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}/person`;
  } catch {
    return 'See website';
  }
}

interface OctoProduct {
  id: string;
  internalName: string;
  shortDescription?: string;
  availabilityType?: string;
  options?: Array<{
    id: string;
    unitPricing?: Array<{ unitId: string; price: number }>;
  }>;
}

export async function GET() {
  const apiKey = process.env.PEEKPRO_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'PeekPro not configured yet' }, { status: 200 });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const supabase = createAdminClient();

    // ─── Step 1: Fetch all products from PeekPro ───
    const productsRes = await fetch(`${OCTO_BASE}/products`, { headers });

    let productsCreated = 0;
    let productsUpdated = 0;

    if (productsRes.ok) {
      const products: OctoProduct[] = await productsRes.json();

      // Get max sort_order for new tours
      const { data: maxRow } = await supabase
        .from('tours')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      let nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

      for (const product of products) {
        const price = extractPrice(product);

        // Check if tour already exists with this peekpro_product_id
        const { data: existing } = await supabase
          .from('tours')
          .select('id')
          .eq('peekpro_product_id', product.id)
          .single();

        if (existing) {
          // Update name and price (PeekPro is source of truth for these)
          await supabase
            .from('tours')
            .update({
              name: product.internalName,
              price,
            })
            .eq('id', existing.id);
          productsUpdated++;
        } else {
          // Create new tour (unpublished — admin must review and publish)
          await supabase.from('tours').insert({
            name: product.internalName,
            slug: slugify(product.internalName),
            section: 'Boat Tours',
            price,
            description: product.shortDescription
              ? `<p>${product.shortDescription}</p>`
              : '<p>Tour details coming soon.</p>',
            peekpro_product_id: product.id,
            is_published: false,
            sort_order: nextSortOrder++,
          });
          productsCreated++;
        }
      }
    } else {
      console.error('PeekPro products fetch failed:', productsRes.status);
    }

    // ─── Step 2: Sync availability/schedules for all linked tours ───
    const { data: tours } = await supabase
      .from('tours')
      .select('id, peekpro_product_id')
      .not('peekpro_product_id', 'is', null);

    let scheduleSynced = 0;

    if (tours && tours.length > 0) {
      for (const tour of tours) {
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await fetch(`${OCTO_BASE}/availability/calendar`, {
          method: 'POST',
          headers,
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

        scheduleSynced++;
      }
    }

    revalidatePath('/events');
    revalidatePath('/recreation');

    return NextResponse.json({
      success: true,
      products: { created: productsCreated, updated: productsUpdated },
      schedules: { synced: scheduleSynced },
    });
  } catch (error) {
    console.error('PeekPro sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
