'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirect || '/account');
    }
  }, [user, authLoading, router, redirect]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in.');
        } else {
          setError('Invalid email or password.');
        }
        setLoading(false);
        return;
      }

      router.push(redirect || '/account');
    } catch {
      setError('An unexpected error occurred. Please try again.');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <img
          src="/images/logo.png"
          alt="LPFA"
          className="h-12 mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold text-center text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-1">
          Welcome Back
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-8">
          Sign in to your account
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
            />
            <div className="text-right mt-1.5">
              <Link
                href="/forgot-password"
                className="text-sm text-[#1B8BEB] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
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
                <i className="fas fa-sign-in-alt" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#1B8BEB] hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A]">
        <i className="fas fa-spinner fa-spin text-2xl text-[#1B8BEB]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
