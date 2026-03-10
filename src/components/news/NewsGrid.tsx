import Link from 'next/link';
import type { NewsArticle } from '@/lib/types';

export default function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className="news-grid" id="news-grid">
      {articles.map((article) => (
            <article key={article.id} className="news-card animated">
              <div className="news-card-image-link">
                {(article.image_url || article.gallery_images?.[0]?.url) ? (
                  <img
                    src={article.image_url || article.gallery_images[0].url}
                    alt={article.title}
                    className="news-card-img"
                    loading="lazy"
                  />
                ) : (
                  <img
                    src="/images/logo-stacked.png"
                    alt="Lorain Port & Finance Authority"
                    className="news-card-img news-card-img--logo"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="news-card-body">
                <span className="news-card-badge">{article.category}</span>
                <h2 className="news-card-title">{article.title}</h2>
                <div className="news-card-meta">
                  <i className="fas fa-calendar-alt"></i>{' '}
                  {new Date(article.published_date + 'T00:00:00').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {article.excerpt ? (
                  <p className="news-card-excerpt">{article.excerpt}</p>
                ) : article.body ? (
                  <p className="news-card-excerpt">
                    {article.body.replace(/<[^>]*>/g, '').slice(0, 200)}
                    {article.body.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                  </p>
                ) : null}
                <Link href={`/news/${article.slug}`} className="news-card-link">
                  Read More <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          ))}
    </div>
  );
}
