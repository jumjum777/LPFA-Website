import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import NewsGrid from '@/components/news/NewsGrid';
import { createServerClient } from '@/lib/supabase/server';
import type { NewsArticle } from '@/lib/types';

export const metadata = { title: 'News & Announcements' };

export const revalidate = 60;

export default async function NewsPage() {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: articles } = await supabase
    .from('news_articles')
    .select('*')
    .eq('is_published', true)
    .lte('published_date', today)
    .order('published_date', { ascending: false });

  const newsList = (articles as NewsArticle[]) || [];

  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">News</span>
          </nav>
          <div className="page-hero-label">Latest Updates</div>
          <h1>News &amp; Announcements</h1>
          <p>Stay up to date with the latest from the Lorain Port &amp; Finance Authority &mdash; project updates, community events, and economic development news.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {newsList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '1.1rem', padding: '3rem 0' }}>
              No news articles yet. Check back soon!
            </p>
          ) : (
            <NewsGrid articles={newsList} />
          )}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%,rgba(27,139,235,0.18) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div data-animate="fade-up">
            <div className="section-label">Stay Connected</div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Want to Stay Informed?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2rem' }}>Follow us on social media or contact our office for the latest updates on projects, events, and opportunities.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <Link href="/contact" className="btn btn-gold">Contact Us</Link>
              <a href="https://www.facebook.com/lorainportfinance" target="_blank" rel="noopener" className="btn btn-outline-white"><i className="fab fa-facebook-f" style={{ marginRight: '0.5rem' }}></i> Follow on Facebook</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
