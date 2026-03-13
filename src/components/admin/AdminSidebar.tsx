'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminSidebarProps {
  user: { email: string; role: string; display_name: string };
}

type SidebarContext = 'lpfa' | 'rotr';

const lpfaItems = [
  { href: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { href: '/admin/news', label: 'News', icon: 'fas fa-newspaper' },
  { href: '/admin/events', label: 'Events', icon: 'fas fa-calendar-alt' },
  { href: '/admin/tours', label: 'Tours', icon: 'fas fa-ship' },
  { href: '/admin/documents', label: 'Meeting Minutes', icon: 'fas fa-file-pdf' },
  { href: '/admin/photos', label: 'Photos', icon: 'fas fa-images' },
  { href: '/admin/staff', label: 'Staff', icon: 'fas fa-id-badge' },
  { href: '/admin/board', label: 'Board', icon: 'fas fa-users' },
  { href: '/admin/vessels', label: 'Vessel Traffic', icon: 'fas fa-anchor' },
  { href: '/admin/rfps', label: 'RFPs & Bids', icon: 'fas fa-file-contract' },
  { href: '/admin/files', label: 'Files', icon: 'fas fa-folder-open' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
  { href: '/admin/leads', label: 'Inbox', icon: 'fas fa-inbox' },
];

const rotrItems = [
  { href: '/admin/rotr', label: 'Overview', icon: 'fas fa-chart-line' },
  { href: '/admin/rotr?tab=events', label: 'Events', icon: 'fas fa-calendar-alt' },
  { href: '/admin/rotr?tab=orders', label: 'Orders', icon: 'fas fa-receipt' },
  { href: '/admin/rotr?tab=customers', label: 'Customers', icon: 'fas fa-users' },
  { href: '/admin/rotr?tab=inbox', label: 'Inbox', icon: 'fas fa-inbox' },
  { href: '/admin/rotr?tab=finances', label: 'Finances', icon: 'fas fa-file-invoice-dollar' },
  { href: '/admin/rotr?tab=staff', label: 'Staff', icon: 'fas fa-hard-hat' },
  { href: '/admin/analytics?profile=rotr', label: 'Analytics', icon: 'fas fa-chart-bar' },
  { href: '/admin/rotr?tab=files', label: 'Files', icon: 'fas fa-folder-open' },
];

const superAdminItems = [
  { href: '/admin/users', label: 'Admin Users', icon: 'fas fa-users-cog' },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [inboxCounts, setInboxCounts] = useState<{ lpfa: number; rotr: number }>({ lpfa: 0, rotr: 0 });

  // Determine context based on current path
  const isOnRotr = pathname.startsWith('/admin/rotr');
  const [context, setContext] = useState<SidebarContext>(isOnRotr ? 'rotr' : 'lpfa');

  // Sync context when navigating
  useEffect(() => {
    if (pathname.startsWith('/admin/rotr')) {
      setContext('rotr');
    } else if (pathname === '/admin/analytics' && searchParams.get('profile') === 'rotr') {
      setContext('rotr');
    } else if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/rotr')) {
      setContext('lpfa');
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  // Fetch unread inbox counts
  useEffect(() => {
    fetch('/api/admin/inbox-counts')
      .then(res => res.json())
      .then(data => {
        // Filter out ROTR conversations marked as read locally
        let rotrCount = data.rotr ?? 0;
        try {
          const stored = localStorage.getItem('rotr-read-convos');
          if (stored && data.rotrUnreadIds) {
            const readIds = new Set<string>(JSON.parse(stored));
            rotrCount = (data.rotrUnreadIds as string[]).filter(id => !readIds.has(id)).length;
          }
        } catch { /* ignore */ }
        setInboxCounts({ lpfa: data.lpfa ?? 0, rotr: rotrCount });
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    if (newDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('lpfa-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('lpfa-theme', 'light');
    }
    setIsDark(newDark);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const switchContext = (ctx: SidebarContext) => {
    setContext(ctx);
    if (ctx === 'rotr') {
      router.push('/admin/rotr');
    } else {
      router.push('/admin');
    }
  };

  const navItems = context === 'rotr' ? rotrItems : [
    ...lpfaItems,
    ...(user.role === 'super_admin' ? superAdminItems : []),
  ];

  const viewSiteUrl = context === 'rotr' ? 'https://www.rockinontheriver.com' : '/';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <Link href={context === 'rotr' ? '/admin/rotr' : '/admin'}>
          <img
            src={context === 'rotr' ? '/images/rotr-logo.png' : (isDark ? '/images/logo-white.png' : '/images/logo.png')}
            alt={context === 'rotr' ? "Rockin' on the River" : 'LPFA'}
            className="admin-sidebar-logo"
          />
        </Link>
      </div>

      {/* Context Switcher */}
      <div className="admin-context-switcher">
        <button
          className={`admin-context-btn ${context === 'lpfa' ? 'active' : ''}`}
          onClick={() => switchContext('lpfa')}
        >
          LPFA
        </button>
        <button
          className={`admin-context-btn ${context === 'rotr' ? 'active' : ''}`}
          onClick={() => switchContext('rotr')}
        >
          ROTR
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        <button onClick={toggleTheme} className="admin-nav-item admin-theme-btn" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        {navItems.map((item) => {
          let isActive: boolean;
          if (item.href.includes('?tab=')) {
            // ROTR sub-nav: match by tab search param
            const itemTab = item.href.split('?tab=')[1];
            isActive = pathname === '/admin/rotr' && searchParams.get('tab') === itemTab;
          } else if (item.href === '/admin/rotr') {
            // ROTR overview: active when no tab param
            isActive = pathname === '/admin/rotr' && !searchParams.get('tab');
          } else {
            // Default: existing logic
            isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          }
          // Determine inbox badge count
          const badgeCount = item.label === 'Inbox' && context === 'lpfa'
            ? inboxCounts.lpfa
            : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <span className="admin-inbox-badge">{badgeCount}</span>
              )}
            </Link>
          );
        })}
        <a
          href={viewSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-nav-item admin-nav-view-site"
        >
          <i className="fas fa-external-link-alt"></i>
          <span>View Site</span>
        </a>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-powered-by">
          <img src="/images/pulse-logo-white.png" alt="Pulse" className="admin-powered-logo" />
          <span className="admin-powered-sub">by Crow&apos;s Nest Digital Media</span>
        </div>
        <div className="admin-user-info">
          <span className="admin-user-name">{user.display_name}</span>
          <span className="admin-user-role">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>
  );
}
