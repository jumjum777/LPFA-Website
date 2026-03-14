'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { isValidDisplayName } from '@/lib/profanity';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/account');
    }
  }, [user, authLoading, router]);

  function validateDisplayName(name: string) {
    if (!name.trim()) {
      setNameError('');
      return;
    }
    const result = isValidDisplayName(name);
    setNameError(result.valid ? '' : (result.error || 'Invalid display name.'));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const nameResult = isValidDisplayName(displayName);
    if (!nameResult.valid) {
      setNameError(nameResult.error || 'Invalid display name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A]">
        <i className="fas fa-spinner fa-spin text-2xl text-[#1B8BEB]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A] px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <img
            src="/images/logo.png"
            alt="LPFA"
            className="h-12 mx-auto mb-6"
          />

          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-envelope text-2xl text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-3">
            Check Your Email
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            We sent a verification link to{' '}
            <span className="font-semibold text-gray-700 dark:text-slate-300">{email}</span>.
            Click the link in the email to activate your account.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#1B8BEB] hover:underline font-medium text-sm"
          >
            <i className="fas fa-arrow-left" />
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <img
          src="/images/logo.png"
          alt="LPFA"
          className="h-12 mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold text-center text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-1">
          Create Account
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-8">
          Sign up for an LPFA account
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (nameError) setNameError('');
              }}
              onBlur={(e) => validateDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
            />
            {nameError && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B8BEB] hover:bg-[#1577cc] text-white font-semibold rounded-lg font-[var(--font-heading)] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin" />
            ) : (
              <>
                <i className="fas fa-user-plus" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1B8BEB] hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
