import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import BoardPage from '@/components/board/BoardPage';
import { createServerClient } from '@/lib/supabase/server';
import type { BoardMember } from '@/lib/types';

export const metadata = { title: 'Board of Directors' };
export const revalidate = 60;

export default async function BoardOfDirectorsPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('board_members')
    .select('*')
    .eq('is_published', true)
    .order('sort_order');

  const members: BoardMember[] = data || [];

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
            <span className="current">Board of Directors</span>
          </nav>
          <div className="page-hero-label">Governance</div>
          <h1>Board of Directors</h1>
          <p>Appointed leaders providing strategic oversight and governance for the Authority.</p>
        </div>
      </section>

      <BoardPage members={members} />

      {/* CONTACT CTA */}
      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Get Involved</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Interested in Our Public Meetings?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Board meetings are open to the public. Contact our office for schedules and agendas.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-gold">Contact Our Office</Link>
              <Link href="/about" className="btn btn-outline-white">About the Authority</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
