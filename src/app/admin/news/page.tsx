'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { NewsArticle } from '@/lib/types';

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const supabase = createClient();
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_date', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }

  async function deleteArticle(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const supabase = createClient();
    await supabase.from('news_articles').delete().eq('id', id);
    setArticles(articles.filter(a => a.id !== id));
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('news_articles').update({ is_published: !current }).eq('id', id);
    setArticles(articles.map(a => a.id === id ? { ...a, is_published: !current } : a));
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>News Articles</h1>
          <p>Manage news and announcements.</p>
        </div>
        <Link href="/admin/news/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Article
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : articles.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-newspaper"></i>
          <p>No articles yet.</p>
          <Link href="/admin/news/new" className="admin-btn admin-btn-primary">Create First Article</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id}>
                  <td><Link href={`/admin/news/${article.id}`}>{article.title}</Link></td>
                  <td><span className="admin-badge">{article.category}</span></td>
                  <td>{new Date(article.published_date).toLocaleDateString()}</td>
                  <td>
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const isScheduled = article.is_published && article.published_date > today;
                      const status = !article.is_published ? 'draft' : isScheduled ? 'scheduled' : 'published';
                      return (
                        <span className={`admin-status-badge ${status}`}>
                          {status === 'draft' && 'Draft'}
                          {status === 'published' && 'Published'}
                          {status === 'scheduled' && <>
                            <i className="fas fa-clock" style={{ marginRight: '0.3rem' }}></i>
                            {new Date(article.published_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </>}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/news/${article.id}`} className="admin-btn-icon" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button onClick={() => deleteArticle(article.id)} className="admin-btn-icon danger" title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
