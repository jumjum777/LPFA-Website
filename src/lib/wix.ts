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

/** Map a WixEvent to a Supabase events table row for sync */
export function formatWixEventForSupabase(wixEvent: WixEvent) {
  const dt = wixEvent.dateAndTimeSettings;
  const startDate = dt?.startDate ? dt.startDate.split('T')[0] : null;

  // Build time string from formatted start/end times
  let time = '';
  if (dt?.formatted?.startTime && dt?.formatted?.endTime) {
    time = `${dt.formatted.startTime} - ${dt.formatted.endTime}`;
  } else if (dt?.formatted?.startTime) {
    time = dt.formatted.startTime;
  }

  // Build price string from ticket pricing
  let price = '';
  const tickets = wixEvent.registration?.tickets;
  if (tickets?.lowestPrice && tickets?.highestPrice) {
    if (tickets.lowestPrice.value === tickets.highestPrice.value) {
      price = tickets.lowestPrice.formattedValue;
    } else {
      price = `${tickets.lowestPrice.formattedValue} - ${tickets.highestPrice.formattedValue}`;
    }
  } else if (tickets?.lowestPrice) {
    price = tickets.lowestPrice.formattedValue;
  }

  // Build ticket URL from Wix event page
  let ticket_url = '';
  if (wixEvent.eventPageUrl) {
    ticket_url = `${wixEvent.eventPageUrl.base}${wixEvent.eventPageUrl.path}`;
  }

  // Location
  const location = wixEvent.location?.address?.formattedAddress
    || wixEvent.location?.name
    || 'Black River Landing, Lorain, OH';

  // Image
  const image_url = wixEvent.mainImage?.url || null;

  return {
    wix_event_id: wixEvent.id,
    title: wixEvent.title,
    category: "Rockin' On The River",
    event_date: startDate,
    description: wixEvent.title,
    location,
    time,
    price,
    ticket_url,
    image_url,
    cta_text: 'Get Tickets',
    cta_url: ticket_url || '/events',
  };
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

// ─── Inbox ─────────────────────────────────────────────────

export interface WixContact {
  id: string;
  info: {
    name?: { first?: string; last?: string };
    emails?: { items?: { email: string }[] };
  };
  lastActivity?: { activityDate: string };
  createdDate: string;
}

export interface WixInboxMessage {
  id: string;
  direction: string;
  content: {
    previewText?: string;
    basic?: { items: { text?: string }[] };
    form?: {
      title: string;
      fields: { name: string; value: string }[];
    };
    contentType?: string;
  };
  sender?: {
    wixUserId?: string;
    contactId?: string;
  };
  badges?: { text: string }[];
  sequence: string;
  createdDate: string;
  visibility: string;
  sourceChannel?: string;
}

export interface InboxThread {
  conversationId: string;
  contactName: string;
  contactEmail?: string;
  messages: WixInboxMessage[];
  lastMessageDate: string;
  lastMessagePreview: string;
  lastDirection: string;
}

/** List recent contacts from Wix (paginated to get all) */
async function getWixContacts(maxContacts = 200): Promise<WixContact[]> {
  const allContacts: WixContact[] = [];
  let offset = 0;
  const pageSize = 100; // Wix max per page

  while (allContacts.length < maxContacts) {
    const limit = Math.min(pageSize, maxContacts - allContacts.length);
    const res = await fetch('https://www.wixapis.com/contacts/v4/contacts/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        query: {
          paging: { limit, offset },
          sort: [{ fieldName: 'lastActivity.activityDate', order: 'DESC' }],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Wix Contacts API error:', res.status, errText);
      if (allContacts.length > 0) break; // Return what we have
      throw new Error(`Wix Contacts API error: ${res.status}`);
    }

    const data = await res.json();
    const contacts = data.contacts || [];
    allContacts.push(...contacts);

    if (contacts.length < limit) break; // No more pages
    offset += contacts.length;
  }

  return allContacts;
}

/** Get or create a conversation for a contact */
async function getConversationForContact(contactId: string): Promise<string | null> {
  const res = await fetch('https://www.wixapis.com/inbox/v2/conversations', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ participantId: { contactId } }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.conversation?.id || null;
}

/** System message types to filter out from BUSINESS visibility */
const SYSTEM_MESSAGE_PREVIEWS = [
  'Subscribed to mailing list', 'Subscriptions',
  'Opened your email campaign', 'Clicked your email campaign',
  'Received your email campaign',
  'Invoice Paid', 'Invoice paid',
];

function isRelevantMessage(msg: WixInboxMessage): boolean {
  // Always keep BUSINESS_AND_PARTICIPANT messages (actual conversations)
  if (msg.visibility === 'BUSINESS_AND_PARTICIPANT') return true;
  // For BUSINESS-only messages, keep form submissions but filter system noise
  if (msg.content?.contentType === 'FORM') return true;
  const preview = msg.content?.previewText || '';
  if (SYSTEM_MESSAGE_PREVIEWS.some(s => preview.includes(s))) return false;
  return true;
}

/** List messages for a conversation (both conversations and form submissions) */
async function listConversationMessages(conversationId: string, limit = 20): Promise<WixInboxMessage[]> {
  // Fetch both visibility types in parallel
  const [bapRes, bRes] = await Promise.all([
    fetch(
      `https://www.wixapis.com/inbox/v2/messages?conversationId=${conversationId}&paging.limit=${limit}&visibility=BUSINESS_AND_PARTICIPANT`,
      { headers: wixHeaders }
    ),
    fetch(
      `https://www.wixapis.com/inbox/v2/messages?conversationId=${conversationId}&paging.limit=${limit}&visibility=BUSINESS`,
      { headers: wixHeaders }
    ),
  ]);

  const bapMessages: WixInboxMessage[] = bapRes.ok ? (await bapRes.json()).messages || [] : [];
  const bMessages: WixInboxMessage[] = bRes.ok ? (await bRes.json()).messages || [] : [];

  // Merge and deduplicate by message ID
  const seen = new Set<string>();
  const all: WixInboxMessage[] = [];
  for (const msg of [...bapMessages, ...bMessages]) {
    if (!seen.has(msg.id) && isRelevantMessage(msg)) {
      seen.add(msg.id);
      all.push(msg);
    }
  }

  return all;
}

/** Fetch inbox threads: contacts → conversations → messages */
export async function getWixInboxThreads(): Promise<InboxThread[]> {
  // Fetch more contacts to ensure we capture all inbox participants
  // (many contacts are ticket buyers/form submitters with no inbox messages)
  const contacts = await getWixContacts(200);
  if (contacts.length === 0) return [];

  const threads: InboxThread[] = [];

  // Process in batches of 15 for parallelism
  for (let i = 0; i < contacts.length; i += 15) {
    const batch = contacts.slice(i, i + 15);
    const results = await Promise.allSettled(
      batch.map(async (contact) => {
        const conversationId = await getConversationForContact(contact.id);
        if (!conversationId) return null;

        // Fetch up to 20 messages per conversation for accurate counts
        const messages = await listConversationMessages(conversationId, 20);
        if (messages.length === 0) return null;

        const name = contact.info?.name
          ? `${contact.info.name.first || ''} ${contact.info.name.last || ''}`.trim()
          : 'Unknown';
        const email = contact.info?.emails?.items?.[0]?.email;

        messages.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
        const lastMsg = messages[messages.length - 1];
        let preview = '';
        if (lastMsg.content?.contentType === 'FORM') {
          // For form submissions, show the Message field value
          const msgField = lastMsg.content.form?.fields?.find(f => f.name === 'Message');
          preview = msgField?.value || lastMsg.content.form?.title || 'Form submission';
        } else {
          preview = lastMsg.content?.previewText
            || lastMsg.content?.basic?.items?.map(i => i.text).filter(Boolean).join(' ')
            || '';
        }

        return {
          conversationId,
          contactName: name || 'Unknown',
          contactEmail: email,
          messages,
          lastMessageDate: lastMsg.createdDate,
          lastMessagePreview: preview,
          lastDirection: lastMsg.direction,
        } as InboxThread;
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        threads.push(result.value);
      }
    }
  }

  threads.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
  return threads;
}

/** Fetch full message history for a conversation (both visibility types) */
export async function getWixMessages(conversationId: string): Promise<WixInboxMessage[]> {
  async function fetchAllWithVisibility(visibility: string): Promise<WixInboxMessage[]> {
    const messages: WixInboxMessage[] = [];
    let cursor: string | undefined;

    while (true) {
      const params = new URLSearchParams({
        conversationId,
        'paging.limit': '30',
        visibility,
      });
      if (cursor) params.set('paging.cursor', cursor);

      const res = await fetch(
        `https://www.wixapis.com/inbox/v2/messages?${params}`,
        { headers: wixHeaders }
      );

      if (!res.ok) break;

      const data = await res.json();
      const batch = data.messages || [];
      messages.push(...batch);

      cursor = data.pagingMetadata?.cursors?.next;
      if (!cursor || batch.length < 30) break;
    }
    return messages;
  }

  // Fetch both visibility types in parallel
  const [bapMessages, bMessages] = await Promise.all([
    fetchAllWithVisibility('BUSINESS_AND_PARTICIPANT'),
    fetchAllWithVisibility('BUSINESS'),
  ]);

  // Merge, deduplicate, and filter system noise
  const seen = new Set<string>();
  const allMessages: WixInboxMessage[] = [];
  for (const msg of [...bapMessages, ...bMessages]) {
    if (!seen.has(msg.id) && isRelevantMessage(msg)) {
      seen.add(msg.id);
      allMessages.push(msg);
    }
  }

  allMessages.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
  return allMessages;
}

/** Send a message to a Wix Inbox conversation */
export async function sendWixMessage(conversationId: string, text: string): Promise<WixInboxMessage> {
  const res = await fetch('https://www.wixapis.com/inbox/v2/messages', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({
      conversationId,
      message: {
        direction: 'BUSINESS_TO_PARTICIPANT',
        visibility: 'BUSINESS_AND_PARTICIPANT',
        content: {
          basic: {
            items: [{ type: 'text', text }],
          },
        },
      },
      sendNotifications: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Wix Send Message error:', res.status, errText);
    throw new Error(`Failed to send message: ${res.status}`);
  }

  const data = await res.json();
  return data.message;
}

