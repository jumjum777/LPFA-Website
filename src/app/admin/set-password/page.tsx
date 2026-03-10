'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Parse the recovery token from the URL hash and establish session
  useEffect(() => {
    const supabase = createClient();

    async function handleRecoveryToken() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          setReady(true);
          return;
        }
      }

      // Fallback: check if session already exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setReady(true);
    }

    handleRecoveryToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
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
          <h1>Set Your Password</h1>
          <p>Create a password to complete your account setup</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-alert admin-alert-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading || !ready}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Setting password...</>
            ) : !ready ? (
              <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
            ) : (
              'Set Password & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
