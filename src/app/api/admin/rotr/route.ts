import { NextResponse } from 'next/server';
import { getWixEvents, getWixOrders, getWixTicketDefinitions } from '@/lib/wix';

export async function GET() {
  try {
    const [events, orders, ticketDefs] = await Promise.all([
      getWixEvents(),
      getWixOrders(),
      getWixTicketDefinitions(),
    ]);

    // Merge ticket defs into events
    const eventsWithTickets = events.map(event => ({
      ...event,
      ticketDefinitions: ticketDefs.filter(td => td.eventId === event.id),
    }));

    // Calculate summary stats
    const upcomingEvents = events.filter(e => e.status === 'UPCOMING');
    const confirmedOrders = orders.filter(o => o.confirmed);
    const totalRevenue = confirmedOrders.reduce(
      (sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'),
      0
    );
    const totalTickets = confirmedOrders.reduce(
      (sum, o) => sum + (o.ticketsQuantity || 0),
      0
    );

    return NextResponse.json({
      events: eventsWithTickets,
      summary: {
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        totalOrders: confirmedOrders.length,
        totalRevenue,
        totalTickets,
      },
    });
  } catch (error) {
    console.error('ROTR API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ROTR data' },
      { status: 500 }
    );
  }
}
