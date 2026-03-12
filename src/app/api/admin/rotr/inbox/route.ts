import { NextRequest, NextResponse } from 'next/server';
import { getWixInboxThreads, getWixMessages, sendWixMessage } from '@/lib/wix';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get('conversationId');

  try {
    if (conversationId) {
      const messages = await getWixMessages(conversationId);
      return NextResponse.json({ messages });
    }

    const threads = await getWixInboxThreads();
    return NextResponse.json({ threads });
  } catch (err) {
    console.error('Wix Inbox error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, text } = await request.json();

    if (!conversationId || !text?.trim()) {
      return NextResponse.json(
        { error: 'conversationId and text are required' },
        { status: 400 }
      );
    }

    const message = await sendWixMessage(conversationId, text.trim());
    return NextResponse.json({ message });
  } catch (err) {
    console.error('Wix Send Message error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
