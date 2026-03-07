'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    const supabase = createClient();

    async function checkAuth() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Use API route to check admin access and get user info (bypasses RLS)
      const res = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
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
      setLoading(false);
    }

    checkAuth();
  }, [router, isLoginPage]);

  // Don't wrap the login page in the admin layout
  if (isLoginPage) {
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
      <AdminSidebar user={user!} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
