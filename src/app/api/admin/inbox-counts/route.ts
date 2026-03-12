import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWixInboxThreads } from '@/lib/wix';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counts: { lpfa: number; rotr: number; rotrUnreadIds: string[] } = { lpfa: 0, rotr: 0, rotrUnreadIds: [] };

  // LPFA: count contact_submissions with status 'new'
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { count } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    counts.lpfa = count ?? 0;
  } catch (err) {
    console.error('LPFA inbox count error:', err);
  }

  // ROTR: count Wix inbox threads where last message is from participant (unread)
  try {
    const threads = await getWixInboxThreads();
    const unread = threads.filter(
      (t) => t.lastDirection === 'PARTICIPANT_TO_BUSINESS'
    );
    counts.rotr = unread.length;
    counts.rotrUnreadIds = unread.map(t => t.conversationId);
  } catch (err) {
    console.error('ROTR inbox count error:', err);
  }

  return NextResponse.json(counts);
}
