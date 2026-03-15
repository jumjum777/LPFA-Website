import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const allDocs: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('board_documents')
      .select('*')
      .order('document_date', { ascending: false })
      .order('document_type')
      .order('title')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Documents API error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allDocs.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return NextResponse.json({ documents: allDocs });
}
