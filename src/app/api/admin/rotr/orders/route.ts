import { NextRequest, NextResponse } from 'next/server';
import { getWixOrders } from '@/lib/wix';

export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get('eventId') || undefined;
    const orders = await getWixOrders(eventId);

    // Only return confirmed orders with data
    const validOrders = orders.filter(o => o.confirmed && o.fullName);

    return NextResponse.json({ orders: validOrders, total: validOrders.length });
  } catch (error) {
    console.error('ROTR Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
