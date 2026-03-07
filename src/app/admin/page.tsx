'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  news: number;
  events: number;
  tours: number;
  documents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ news: 0, events: 0, tours: 0, documents: 0 });

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const [newsRes, eventsRes, toursRes, docsRes] = await Promise.all([
        supabase.from('news_articles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('tours').select('id', { count: 'exact', head: true }),
        supabase.from('board_documents').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        news: newsRes.count || 0,
        events: eventsRes.count || 0,
        tours: toursRes.count || 0,
        documents: docsRes.count || 0,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { title: 'News Articles', count: stats.news, href: '/admin/news', icon: 'fas fa-newspaper', color: '#1B8BEB' },
    { title: 'Events', count: stats.events, href: '/admin/events', icon: 'fas fa-calendar-alt', color: '#D97706' },
    { title: 'Boat Tours', count: stats.tours, href: '/admin/tours', icon: 'fas fa-ship', color: '#059669' },
    { title: 'Documents', count: stats.documents, href: '/admin/documents', icon: 'fas fa-file-pdf', color: '#7C3AED' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welcome to the LPFA website admin portal.</p>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
              <i className={card.icon}></i>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-count">{card.count}</span>
              <span className="admin-stat-label">{card.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
