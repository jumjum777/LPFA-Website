import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import ArticleGallery from '@/components/news/ArticleGallery';
import type { NewsArticle } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('news_articles')
    .select('title, excerpt, body')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!data) return { title: 'Article Not Found' };

  const description = data.excerpt || data.body?.replace(/<[^>]*>/g, '').slice(0, 160) || '';
  return { title: data.title, description };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_date', today)
    .single();

  if (!data) notFound();

  const article = data as NewsArticle;
  const galleryImages = article.gallery_images?.length > 0
    ? article.gallery_images
    : article.image_url
      ? [{ url: article.image_url, alt: article.title, sort_order: 0 }]
      : [];

  return (
    <main id="main-content">
      <ScrollAnimator />

      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <Link href="/news">News</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">{article.title}</span>
          </nav>
          <div className="page-hero-label">{article.category}</div>
          <h1>{article.title}</h1>
          <p>
            {new Date(article.published_date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '860px' }}>
          {galleryImages.length > 0 && (
            <ArticleGallery images={galleryImages} />
          )}

          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--gray-200)' }}>
            <Link href="/news" className="btn btn-outline">
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i> Back to News
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
