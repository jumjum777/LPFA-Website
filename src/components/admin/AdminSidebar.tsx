'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminSidebarProps {
  user: { email: string; role: string; display_name: string };
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { href: '/admin/news', label: 'News', icon: 'fas fa-newspaper' },
  { href: '/admin/events', label: 'Events', icon: 'fas fa-calendar-alt' },
  { href: '/admin/tours', label: 'Tours', icon: 'fas fa-ship' },
  { href: '/admin/documents', label: 'Meeting Minutes', icon: 'fas fa-file-pdf' },
  { href: '/admin/photos', label: 'Photos', icon: 'fas fa-images' },
  { href: '/admin/staff', label: 'Staff', icon: 'fas fa-id-badge' },
  { href: '/admin/board', label: 'Board', icon: 'fas fa-users' },
  { href: '/admin/vessels', label: 'Vessel Traffic', icon: 'fas fa-anchor' },
];

const superAdminItems = [
  { href: '/admin/users', label: 'Admin Users', icon: 'fas fa-users-cog' },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
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

  const allItems = user.role === 'super_admin'
    ? [...navItems, ...superAdminItems]
    : navItems;

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <Link href="/admin">
          <i className="fas fa-anchor"></i>
          <span>LPFA Admin</span>
        </Link>
      </div>

      <nav className="admin-sidebar-nav">
        <button onClick={toggleTheme} className="admin-nav-item admin-theme-btn" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        {allItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </Link>
        ))}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-nav-item admin-nav-view-site"
        >
          <i className="fas fa-external-link-alt"></i>
          <span>View Site</span>
        </a>
      </nav>

      <div className="admin-sidebar-footer">
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
