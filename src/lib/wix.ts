const WIX_API_KEY = process.env.WIX_API_KEY!;
const WIX_SITE_ID = process.env.WIX_SITE_ID!;

const wixHeaders = {
  'Authorization': WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
};

export interface WixEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  dateAndTimeSettings: {
    startDate: string;
    endDate: string;
    timeZoneId: string;
    formatted: {
      dateAndTime: string;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    };
  };
  location: {
    name: string;
    address?: {
      formattedAddress: string;
    };
  };
  mainImage?: {
    url: string;
    width: number;
    height: number;
  };
  registration: {
    type: string;
    status: string;
    tickets?: {
      currency: string;
      lowestPrice?: { value: string; formattedValue: string };
      highestPrice?: { value: string; formattedValue: string };
      soldOut: boolean;
    };
  };
  eventPageUrl?: {
    base: string;
    path: string;
  };
}

export interface WixOrder {
  orderNumber: string;
  eventId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  method: string;
  ticketsQuantity: number;
  totalPrice?: {
    amount: string;
    currency: string;
  };
  created: string;
  updated: string;
  confirmed: boolean;
  channel: string;
  transactionId: string;
  paymentDetails?: {
    transaction?: {
      transactionId: string;
      method: string;
    };
  };
}

export interface WixTicketDefinition {
  id: string;
  name: string;
  description: string;
  eventId: string;
  free: boolean;
  price: {
    amount: string;
    currency: string;
  };
  limitPerCheckout: number;
  saleStatus: string;
  pricing: {
    fixedPrice?: {
      amount: string;
      currency: string;
    };
    pricingType: string;
  };
}

/** Fetch all events (or filter by status) */
export async function getWixEvents(status?: string): Promise<WixEvent[]> {
  const filter = status ? { status } : {};
  const allEvents: WixEvent[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await fetch('https://www.wixapis.com/events/v3/events/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        query: {
          filter,
          paging: { limit, offset },
        },
      }),
    });

    if (!res.ok) {
      console.error('Wix Events API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const events = data.events || [];
    allEvents.push(...events);

    if (events.length < limit || allEvents.length >= (data.pagingMetadata?.total || 0)) break;
    offset += limit;
  }

  // Filter out test/canceled events
  return allEvents.filter(e =>
    e.status !== 'CANCELED' &&
    !e.title.toLowerCase().startsWith('test')
  );
}

/** Fetch orders with full details, optionally filtered by event */
export async function getWixOrders(eventId?: string): Promise<WixOrder[]> {
  const allOrders: WixOrder[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const params = new URLSearchParams({
      fieldset: 'DETAILS',
      limit: String(limit),
      offset: String(offset),
    });
    if (eventId) params.set('eventId', eventId);

    const res = await fetch(
      `https://www.wixapis.com/events/v1/orders?${params}`,
      { headers: wixHeaders }
    );

    if (!res.ok) {
      console.error('Wix Orders API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const orders = data.orders || [];
    allOrders.push(...orders);

    if (orders.length < limit || allOrders.length >= (data.total || 0)) break;
    offset += limit;
  }

  return allOrders;
}

export interface WixPaymentTransaction {
  orderNumber: string;
  transactionId: string;
  serviceFee: number;
  ticketTotal: number;
  totalCharged: number;
  paymentMethod: string;
  ticketItems: { name: string; quantity: number; price: number }[];
  refunds: unknown[];
  createdAt: string;
}

/** Fetch all payment transactions from Wix Payments v2 */
export async function getWixPaymentTransactions(): Promise<WixPaymentTransaction[]> {
  const allTxns: WixPaymentTransaction[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `https://www.wixapis.com/payments/v2/transactions?limit=${limit}&offset=${offset}`,
      { headers: wixHeaders }
    );

    if (!res.ok) {
      console.error('Wix Payments API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const transactions = data.transactions || [];

    for (const t of transactions) {
      const orderNumber = t.order?.description?.wixAppOrderId;
      if (!orderNumber) continue;

      const items = t.order?.description?.items || [];
      const svcFeeItem = items.find((i: { id: string }) => i.id === 'SERVICE_FEE');
      const ticketItems = items
        .filter((i: { id: string }) => i.id !== 'SERVICE_FEE')
        .map((i: { name: string; quantity: number; price: number }) => ({
          name: i.name,
          quantity: i.quantity || 1,
          price: i.price,
        }));

      allTxns.push({
        orderNumber,
        transactionId: t.transactionId,
        serviceFee: svcFeeItem?.price || 0,
        ticketTotal: ticketItems.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0),
        totalCharged: t.amount?.amount || 0,
        paymentMethod: t.paymentMethod || 'unknown',
        ticketItems,
        refunds: t.refunds || [],
        createdAt: t.createdAt,
      });
    }

    if (transactions.length < limit) break;
    offset += limit;
  }

  // Deduplicate by orderNumber (keep first SALE entry)
  const seen = new Set<string>();
  return allTxns.filter(t => {
    if (seen.has(t.orderNumber)) return false;
    seen.add(t.orderNumber);
    return true;
  });
}

// ─── Analytics ─────────────────────────────────────────────

export type AnalyticsMeasurement = 'TOTAL_SESSIONS' | 'TOTAL_UNIQUE_VISITORS' | 'TOTAL_SALES' | 'TOTAL_ORDERS' | 'CLICKS_TO_CONTACT' | 'TOTAL_FORMS_SUBMITTED';

export interface AnalyticsDataPoint {
  date: string;
  value: number;
}

export interface AnalyticsMetric {
  type: AnalyticsMeasurement;
  values: AnalyticsDataPoint[];
  total: number;
}

/** Fetch site analytics from Wix (max 62 days lookback) */
export async function getWixAnalytics(
  startDate: string,
  endDate: string,
  types: AnalyticsMeasurement[] = ['TOTAL_SESSIONS', 'TOTAL_UNIQUE_VISITORS', 'TOTAL_SALES', 'TOTAL_ORDERS', 'CLICKS_TO_CONTACT', 'TOTAL_FORMS_SUBMITTED']
): Promise<AnalyticsMetric[]> {
  const params = new URLSearchParams();
  params.append('dateRange.startDate', startDate);
  params.append('dateRange.endDate', endDate);
  for (const t of types) {
    params.append('measurementTypes', t);
  }

  const res = await fetch(
    `https://www.wixapis.com/analytics/v2/site-analytics/data?${params}`,
    {
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Accept': 'application/json',
      },
    }
  );

  if (!res.ok) {
    console.error('Wix Analytics API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data.data || [];
}

/** Fetch ticket definitions, optionally filtered by event */
export async function getWixTicketDefinitions(eventId?: string): Promise<WixTicketDefinition[]> {
  const allDefs: WixTicketDefinition[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (eventId) params.set('eventId', eventId);

    const res = await fetch(
      `https://www.wixapis.com/events/v1/ticket-definitions?${params}`,
      { headers: wixHeaders }
    );

    if (!res.ok) {
      console.error('Wix Ticket Defs API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const defs = data.definitions || [];
    allDefs.push(...defs);

    if (defs.length < limit || allDefs.length >= (data.metaData?.total || 0)) break;
    offset += limit;
  }

  return allDefs;
}
