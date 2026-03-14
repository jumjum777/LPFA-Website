'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1F3A] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <img
          src="/images/logo.png"
          alt="LPFA"
          className="h-12 mx-auto mb-6"
        />

        {!submitted ? (
          <>
            <h1 className="text-2xl font-bold text-center text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-2">
              Reset Password
            </h1>
            <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B8BEB] focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1B8BEB] hover:bg-[#1577cc] text-white font-semibold rounded-lg font-[var(--font-heading)] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-[#1B8BEB] hover:underline font-medium text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-700">
              <i className="fas fa-envelope text-2xl text-[#1B8BEB]"></i>
            </div>
            <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-2">
              Check Your Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
              If an account exists with{' '}
              <span className="font-semibold text-gray-700 dark:text-slate-200">
                {email}
              </span>
              , you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="text-[#1B8BEB] hover:underline font-medium text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
