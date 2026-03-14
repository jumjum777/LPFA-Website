'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { isValidDisplayName } from '@/lib/profanity';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill display name from profile
  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.display_name || '');
      setInitialized(true);
    }
  }, [profile, initialized]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account/edit');
    }
  }, [user, loading, router]);

  function validateName(value: string) {
    const result = isValidDisplayName(value);
    if (!result.valid) {
      setFieldError(result.error || 'Invalid name.');
    } else {
      setFieldError('');
    }
    return result.valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldError('');

    if (!validateName(name)) return;
    if (!user) return;

    setSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('public_profiles')
        .update({
          display_name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        setError('Failed to update profile. Please try again.');
        setSaving(false);
        return;
      }

      await refreshProfile();
      router.push('/account');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  }

  // Loading spinner
  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-[#1B8BEB]" />
      </div>
    );
  }

  return (
    <>
      {/* Page header banner */}
      <section className="bg-[#0B1F3A] dark:bg-slate-900 py-12 text-white">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)]">
            Edit Profile
          </h1>
        </div>
      </section>

      {/* Form card */}
      <div className="max-w-lg mx-auto px-4 -mt-8 relative z-10 pb-16">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                onBlur={() => {
                  if (name.trim()) validateName(name);
                }}
                placeholder="Your display name"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  fieldError
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                    : 'border-gray-200 dark:border-slate-600 focus:ring-[#1B8BEB]'
                } dark:bg-slate-900 dark:text-slate-100`}
              />
              {fieldError && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">
                  {fieldError}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                2-50 characters. Letters, numbers, spaces, periods, hyphens, and apostrophes.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-[#1B8BEB] hover:bg-[#1577cc] text-white font-semibold rounded-lg font-[var(--font-heading)] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  <>
                    <i className="fas fa-check" />
                    Save Changes
                  </>
                )}
              </button>

              <Link
                href="/account"
                className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
