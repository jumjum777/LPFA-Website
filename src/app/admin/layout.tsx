'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isSetPasswordPage = pathname === '/admin/set-password';

  useEffect(() => {
    if (isLoginPage || isSetPasswordPage) return;

    const supabase = createClient();

    async function checkAuth() {
      try {
        // Timeout the session check in case Supabase locks hang (browser extension issue)
        const session = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
        ]);

        if (!session) {
          console.warn('Supabase getSession timed out');
          router.push('/admin/login');
          return;
        }

        const token = session.data.session?.access_token;

        if (!token) {
          router.push('/admin/login');
          return;
        }

        // Use API route to check admin access and get user info (bypasses RLS)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch('/api/admin/check', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          router.push('/admin/login');
          return;
        }

        const result = await res.json();

        if (!result.isAdmin) {
          router.push('/admin/login');
          return;
        }

        setUser({
          email: result.email,
          role: result.role,
          display_name: result.display_name,
        });
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, isLoginPage, isSetPasswordPage]);

  // Don't wrap the login/set-password page in the admin layout
  if (isLoginPage || isSetPasswordPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <Suspense><AdminSidebar user={user!} /></Suspense>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
