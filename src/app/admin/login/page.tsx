'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Check admin access via API to avoid RLS issues
    const res = await fetch('/api/admin/check', {
      headers: { 'Authorization': `Bearer ${authData.session?.access_token}` },
    });
    const result = await res.json();

    if (!result.isAdmin) {
      await supabase.auth.signOut();
      setError('You do not have admin access.');
      setLoading(false);
      return;
    }

    router.push('/admin');
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <i className="fas fa-anchor"></i>
          <h1>LPFA Admin</h1>
          <p>Sign in to manage your website</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-alert admin-alert-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lorainport.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/">Back to website</a>
        </div>
      </div>
    </div>
  );
}
