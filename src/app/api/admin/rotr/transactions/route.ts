import { NextResponse } from 'next/server';
import { getWixPaymentTransactions } from '@/lib/wix';

export async function GET() {
  try {
    const transactions = await getWixPaymentTransactions();

    // Build a map keyed by order number for easy lookup
    const byOrder: Record<string, {
      serviceFee: number;
      ticketTotal: number;
      totalCharged: number;
      paymentMethod: string;
      ticketItems: { name: string; quantity: number; price: number }[];
      hasRefunds: boolean;
    }> = {};

    for (const t of transactions) {
      byOrder[t.orderNumber] = {
        serviceFee: t.serviceFee,
        ticketTotal: t.ticketTotal,
        totalCharged: t.totalCharged,
        paymentMethod: t.paymentMethod,
        ticketItems: t.ticketItems,
        hasRefunds: t.refunds.length > 0,
      };
    }

    return NextResponse.json({ transactions: byOrder, total: transactions.length });
  } catch (error) {
    console.error('ROTR Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
