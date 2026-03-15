import { NextResponse } from 'next/server';
import { getWixEvents, getWixOrders, getWixTicketDefinitions, getWixInboxThreads } from '@/lib/wix';

export async function GET() {
  try {
    const [events, orders, ticketDefs, inboxResult] = await Promise.all([
      getWixEvents(),
      getWixOrders(),
      getWixTicketDefinitions(),
      getWixInboxThreads().catch(() => [] as Awaited<ReturnType<typeof getWixInboxThreads>>),
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

    // 7-day metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const recentOrders = confirmedOrders.filter(o => o.created >= sevenDaysAgoStr);
    const recentRevenue = recentOrders.reduce(
      (sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'),
      0
    );
    const recentTickets = recentOrders.reduce(
      (sum, o) => sum + (o.ticketsQuantity || 0),
      0
    );

    // Inbox messages received in last 7 days
    const recentInbox = inboxResult.filter(
      (t: { lastMessageDate: string; lastDirection: string }) =>
        t.lastDirection === 'PARTICIPANT_TO_BUSINESS' && t.lastMessageDate >= sevenDaysAgoStr
    ).length;

    return NextResponse.json({
      events: eventsWithTickets,
      summary: {
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        totalOrders: confirmedOrders.length,
        totalRevenue,
        totalTickets,
        recentOrders: recentOrders.length,
        recentRevenue,
        recentTickets,
        recentInbox,
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
