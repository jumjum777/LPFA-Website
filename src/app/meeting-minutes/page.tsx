import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import MinutesPage from '@/components/minutes/MinutesPage';
import { createServerClient } from '@/lib/supabase/server';
import type { BoardDocument } from '@/lib/types';

export const metadata = { title: 'Meeting Minutes' };
export const revalidate = 60;

export default async function MeetingMinutesPage() {
  const supabase = await createServerClient();

  // Fetch all documents in batches (Supabase caps at 1000 rows per request)
  const allDocs: BoardDocument[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('board_documents')
      .select('*')
      .eq('is_published', true)
      .order('document_date', { ascending: false })
      .order('document_type')
      .order('title')
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allDocs.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  const documents: BoardDocument[] = allDocs;

  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/about">About</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Meeting Minutes</span>
          </nav>
          <div className="page-hero-label">Board Documents</div>
          <h1>Meeting Minutes &amp; Documents</h1>
          <p>Access agendas, minutes, resolutions, and board packets from LPFA Board of Directors meetings.</p>
        </div>
      </section>

      <MinutesPage documents={documents} />
    </main>
  );
}
