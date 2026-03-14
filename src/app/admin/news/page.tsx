'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { NewsArticle } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'published' | 'draft' | 'scheduled';

function getArticleStatus(article: NewsArticle): 'published' | 'draft' | 'scheduled' {
  if (!article.is_published) return 'draft';
  const today = new Date().toISOString().split('T')[0];
  return article.published_date > today ? 'scheduled' : 'published';
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1mo ago' : `${months}mo ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

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

  // ─── Computed ─────────────────────────────────────────────────────────

  const counts: Record<StatusFilter, number> = {
    all: articles.length,
    published: articles.filter(a => getArticleStatus(a) === 'published').length,
    draft: articles.filter(a => getArticleStatus(a) === 'draft').length,
    scheduled: articles.filter(a => getArticleStatus(a) === 'scheduled').length,
  };

  const filtered = articles.filter(a => {
    if (filter !== 'all' && getArticleStatus(a) !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || (a.excerpt || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Get unique categories for display
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

  // ─── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>News Articles</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading articles...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1><i className="fas fa-newspaper mr-2 text-blue"></i> News Articles</h1>
          <p>Manage news and announcements for lorainport.com</p>
        </div>
        <Link href="/admin/news/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> New Article
        </Link>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row mb-5">
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-newspaper"></i></div>
          <div className="rotr-stat-value">{counts.all}</div>
          <div className="rotr-stat-label">Total Articles</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-check-circle"></i></div>
          <div className="rotr-stat-value">{counts.published}</div>
          <div className="rotr-stat-label">Published</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-pencil-alt"></i></div>
          <div className="rotr-stat-value">{counts.draft}</div>
          <div className="rotr-stat-label">Drafts</div>
        </div>
        {counts.scheduled > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-clock"></i></div>
            <div className="rotr-stat-value">{counts.scheduled}</div>
            <div className="rotr-stat-label">Scheduled</div>
          </div>
        )}
        {categories.length > 0 && (
          <div className="rotr-stat-card">
            <div className="rotr-stat-icon bg-navy/10 text-navy dark:text-slate-300"><i className="fas fa-tags"></i></div>
            <div className="rotr-stat-value">{categories.length}</div>
            <div className="rotr-stat-label">Categories</div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '1.5rem' }}>
        {(['all', 'published', 'draft', 'scheduled'] as StatusFilter[]).map(s => (
          <button key={s} className={`admin-filter-tab shrink-0${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="admin-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="my-4 max-w-md relative">
        <i className="fas fa-search absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" style={{ left: '0.85rem' }}></i>
        <input type="text"
          className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue focus:ring-2 focus:ring-blue/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
          placeholder="Search by title, category, or excerpt..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Articles List */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-newspaper"></i>
          <p>{articles.length === 0 ? 'No articles yet. Create your first one!' : `No ${filter === 'all' ? '' : filter + ' '}articles found.`}</p>
          {articles.length === 0 && (
            <Link href="/admin/news/new" className="admin-btn admin-btn-primary">Create First Article</Link>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(article => {
                const status = getArticleStatus(article);
                return (
                  <tr key={article.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {article.image_url ? (
                          <img
                            src={article.image_url}
                            alt=""
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/news/${article.id}`} className="font-medium" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                            {article.title}
                          </Link>
                          {article.excerpt && (
                            <span className="text-xs text-slate-400 dark:text-slate-500" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                              {article.excerpt}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-badge">{article.category}</span></td>
                    <td>
                      <div>
                        <span className="whitespace-nowrap text-sm">{formatDate(article.published_date)}</span>
                        <span className="block text-xs text-slate-400 dark:text-slate-500">{timeAgo(article.published_date + 'T00:00:00')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${status}`}>
                        {status === 'draft' && 'Draft'}
                        {status === 'published' && 'Published'}
                        {status === 'scheduled' && (
                          <>
                            <i className="fas fa-clock" style={{ marginRight: '0.3rem' }}></i>
                            {new Date(article.published_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn-icon"
                          title={article.is_published ? 'Unpublish' : 'Publish'}
                          onClick={() => togglePublished(article.id, article.is_published)}
                        >
                          <i className={`fas fa-${article.is_published ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                        <Link href={`/admin/news/${article.id}`} className="admin-btn-icon" title="Edit">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button onClick={() => deleteArticle(article.id)} className="admin-btn-icon danger" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
