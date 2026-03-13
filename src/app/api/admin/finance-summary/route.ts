import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface FinanceContext {
  period: string;
  totals: {
    grossRevenue: number;
    processingFees: number;
    serviceFees: number;
    netPayout: number;
    totalOrders: number;
    paidOrders: number;
    freeOrders: number;
    totalTickets: number;
    avgOrderValue: number;
  };
  monthly: Array<{
    label: string;
    orders: number;
    paidOrders: number;
    tickets: number;
    revenue: number;
    fees: number;
    svcFees: number;
    net: number;
  }>;
  events: Array<{
    name: string;
    date: string;
    orders: number;
    paidOrders: number;
    tickets: number;
    revenue: number;
    fees: number;
    net: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  hasTxnData: boolean;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body: FinanceContext = await req.json();
    const context = assembleContext(body);

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are a financial analyst for Rockin' on the River (ROTR), a major concert series operated by the Lorain Port & Finance Authority in Lorain, Ohio. Your job is to provide a concise financial summary that a director can hand to an accountant for monthly charge verification and reconciliation.

Respond with a JSON object:
{
  "summary": "2-4 paragraphs separated by \\n\\n. Lead with total revenue and net payout. Highlight fee structures and verify they align with expected rates. Note any monthly anomalies or trends. Frame observations as actionable items for accountant review. Be specific with dollar amounts. Keep it professional and accounting-focused. Do NOT use emojis, HTML entities, or special unicode characters.",
  "highlights": ["5-7 bullet point highlights — plain text only, no emojis or special characters"],
  "trend": "positive" | "stable" | "declining"
}

Guidelines:
- CRITICAL: All numbers are pre-computed for the selected period. Use them EXACTLY as provided — do NOT recalculate, re-sum, or estimate.
- Processing fees should be approximately 2.9% + $0.30 per paid transaction. If the effective rate deviates significantly, flag it.
- Service fees are charged to buyers by Wix. Note whether they are actual (from transaction records) or estimated (at 2.5%).
- For monthly breakdowns: identify the highest/lowest revenue months, note any unusual spikes or drops.
- For events: highlight top earners by revenue and ticket volume. Note events with high free-order ratios.
- Payment method insights: note the dominant method and any shift patterns.
- Net payout efficiency: calculate what percentage of gross revenue is retained after fees.
- Frame everything as "verify this", "confirm these charges", "reconcile against bank statements" — accountant-ready language.
- If data covers multiple months, note month-over-month trends.
- Average order value context: compare against ticket pricing to identify multi-ticket purchases.
- Keep the summary to 2-4 tight paragraphs suitable for a one-page financial brief.`,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        summary: text,
        highlights: [],
        trend: 'stable',
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Finance summary error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

function assembleContext(data: FinanceContext): string {
  const lines: string[] = [];
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  lines.push(`Financial Report for: Rockin' on the River (ROTR)`);
  lines.push(`Period: ${data.period}`);
  lines.push(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}\n`);

  // ─── Summary Totals ─────────────────────────────────────────────
  lines.push('=== FINANCIAL SUMMARY ===');
  lines.push(`Gross Revenue: ${fmt(data.totals.grossRevenue)}`);
  lines.push(`Processing Fees (2.9% + $0.30/txn): ${fmt(data.totals.processingFees)}`);
  lines.push(`Wix Service Fees${data.hasTxnData ? '' : ' (estimated at 2.5%)'}: ${fmt(data.totals.serviceFees)}`);
  lines.push(`Net Payout: ${fmt(data.totals.netPayout)}`);
  lines.push(`Total Orders: ${data.totals.totalOrders} (${data.totals.paidOrders} paid, ${data.totals.freeOrders} free)`);
  lines.push(`Total Tickets Sold: ${data.totals.totalTickets}`);
  lines.push(`Average Order Value (paid orders): ${fmt(data.totals.avgOrderValue)}`);

  if (data.totals.grossRevenue > 0) {
    const feeRate = (data.totals.processingFees / data.totals.grossRevenue * 100).toFixed(2);
    const retentionRate = (data.totals.netPayout / data.totals.grossRevenue * 100).toFixed(1);
    lines.push(`Effective Processing Fee Rate: ${feeRate}%`);
    lines.push(`Revenue Retention Rate: ${retentionRate}%`);
  }
  lines.push('');

  // ─── Monthly Breakdown ──────────────────────────────────────────
  if (data.monthly.length > 0) {
    lines.push('=== MONTHLY BREAKDOWN ===');
    for (const m of data.monthly) {
      lines.push(`${m.label}: ${m.orders} orders (${m.paidOrders} paid), ${m.tickets} tickets, Gross ${fmt(m.revenue)}, Proc Fees ${fmt(m.fees)}, Svc Fees ${fmt(m.svcFees)}, Net ${fmt(m.net)}`);
    }
    lines.push('');
  }

  // ─── Revenue by Event ──────────────────────────────────────────
  if (data.events.length > 0) {
    lines.push('=== REVENUE BY EVENT ===');
    for (const ev of data.events) {
      lines.push(`${ev.name}${ev.date ? ` (${ev.date})` : ''}: ${ev.orders} orders (${ev.paidOrders} paid), ${ev.tickets} tickets, Gross ${fmt(ev.revenue)}, Fees ${fmt(ev.fees)}, Net ${fmt(ev.net)}`);
    }
    lines.push('');
  }

  // ─── Payment Methods ───────────────────────────────────────────
  if (data.paymentMethods.length > 0) {
    lines.push('=== PAYMENT METHODS ===');
    for (const pm of data.paymentMethods) {
      const pct = data.totals.grossRevenue > 0 ? ((pm.revenue / data.totals.grossRevenue) * 100).toFixed(1) : '0';
      lines.push(`${pm.method}: ${pm.count} orders, ${fmt(pm.revenue)} (${pct}% of revenue)`);
    }
    lines.push('');
  }

  lines.push('All numbers are pre-computed for the selected period. Use them EXACTLY as provided.');

  return lines.join('\n');
}
