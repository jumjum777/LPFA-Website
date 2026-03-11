'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  news: number;
  events: number;
  tours: number;
  documents: number;
  photos: number;
  staff: number;
  board: number;
  vessels: number;
  leads: number;
  rotrShows: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ news: 0, events: 0, tours: 0, documents: 0, photos: 0, staff: 0, board: 0, vessels: 0, leads: 0, rotrShows: 0 });

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const [newsRes, eventsRes, toursRes, docsRes, photosRes, staffRes, boardRes, vesselsRes, leadsRes] = await Promise.all([
        supabase.from('news_articles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('tours').select('id', { count: 'exact', head: true }),
        supabase.from('board_documents').select('id', { count: 'exact', head: true }),
        supabase.from('photos').select('id', { count: 'exact', head: true }),
        supabase.from('staff_members').select('id', { count: 'exact', head: true }),
        supabase.from('board_members').select('id', { count: 'exact', head: true }),
        supabase.from('vessel_traffic').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      // Fetch ROTR upcoming count separately (non-blocking)
      let rotrShows = 0;
      try {
        const rotrRes = await fetch('/api/admin/rotr');
        const rotrData = await rotrRes.json();
        rotrShows = rotrData.summary?.upcomingEvents || 0;
      } catch { /* ignore */ }

      setStats({
        news: newsRes.count || 0,
        events: eventsRes.count || 0,
        tours: toursRes.count || 0,
        documents: docsRes.count || 0,
        photos: photosRes.count || 0,
        staff: staffRes.count || 0,
        board: boardRes.count || 0,
        vessels: vesselsRes.count || 0,
        leads: leadsRes.count || 0,
        rotrShows,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { title: 'News Articles', count: stats.news, href: '/admin/news', icon: 'fas fa-newspaper', color: '#1B8BEB' },
    { title: 'Events', count: stats.events, href: '/admin/events', icon: 'fas fa-calendar-alt', color: '#D97706' },
    { title: 'Boat Tours', count: stats.tours, href: '/admin/tours', icon: 'fas fa-ship', color: '#059669' },
    { title: 'Meeting Minutes', count: stats.documents, href: '/admin/documents', icon: 'fas fa-file-pdf', color: '#7C3AED' },
    { title: 'Photos', count: stats.photos, href: '/admin/photos', icon: 'fas fa-images', color: '#06B6D4' },
    { title: 'Staff', count: stats.staff, href: '/admin/staff', icon: 'fas fa-id-badge', color: '#EC4899' },
    { title: 'Board Members', count: stats.board, href: '/admin/board', icon: 'fas fa-users', color: '#0D9488' },
    { title: 'Vessel Traffic', count: stats.vessels, href: '/admin/vessels', icon: 'fas fa-anchor', color: '#0B1F3A' },
    { title: 'Leads (New)', count: stats.leads, href: '/admin/leads', icon: 'fas fa-inbox', color: '#F59E0B' },
    { title: "Rockin' ROTR", count: stats.rotrShows, href: '/admin/rotr', icon: 'fas fa-guitar', color: '#EF4444' },
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
