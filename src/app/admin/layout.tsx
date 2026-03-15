'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isSetPasswordPage = pathname === '/admin/set-password';

  useEffect(() => {
    if (isLoginPage || isSetPasswordPage) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Skip client-side Supabase entirely — just ask the API (reads cookies server-side)
    fetch('/api/admin/check', { signal: controller.signal, credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(result => {
        if (!result.isAdmin) {
          window.location.href = '/admin/login';
          return;
        }
        setUser({
          email: result.email,
          role: result.role,
          display_name: result.display_name,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        window.location.href = '/admin/login';
      })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, [isLoginPage, isSetPasswordPage]);

  // Don't wrap the login/set-password page in the admin layout
  if (isLoginPage || isSetPasswordPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <Suspense><AdminSidebar user={user} /></Suspense>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
