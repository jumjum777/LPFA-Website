'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
// Fishing section hidden — keeping imports commented for future use
// import { SPECIES, type FishingCatch } from '@/lib/fishing';

// Fishing helpers hidden — keeping for future use
// function getSpeciesName(id: string) {
//   return SPECIES.find(s => s.id === id)?.name || id;
// }
// function getSpeciesColor(id: string) {
//   return SPECIES.find(s => s.id === id)?.color || '#64748b';
// }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Fishing StatusBadge hidden — keeping for future use
// function StatusBadge({ status }: { status: string }) { ... }

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  // Fishing section hidden — no API calls when section is disabled
  // const [catches, setCatches] = useState<FishingCatch[]>([]);
  // const [catchesLoading, setCatchesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  // Fishing catches fetch hidden
  // useEffect(() => {
  //   if (!user) return;
  //   async function fetchCatches() { ... }
  //   fetchCatches();
  // }, [user]);

  // Loading spinner
  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-[#1B8BEB]" />
      </div>
    );
  }

  // Fishing stats hidden
  // const totalCatches = catches.length;
  // const approvedCatches = catches.filter(c => c.status === 'approved').length;
  // const pendingCatches = catches.filter(c => c.status === 'pending').length;
  // const uniqueSpecies = new Set(catches.filter(c => c.status === 'approved').map(c => c.species)).size;

  const memberSince = user.created_at
    ? formatDate(user.created_at)
    : '';

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Page header banner */}
      <section className="bg-[#0B1F3A] dark:bg-slate-900 py-12 text-white">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)]">
            My Account
          </h1>
        </div>
      </section>

      {/* Profile card */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#1B8BEB] text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {initial}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)]">
                {displayName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {user.email}
              </p>
              {memberSince && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  <i className="fas fa-calendar-alt mr-1" />
                  Member since {memberSince}
                </p>
              )}
            </div>

            {/* Edit link */}
            <Link
              href="/account/edit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              <i className="fas fa-pen text-xs" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Fishing stats row and My Catches section hidden — keeping code for future use */}
      <div className="pb-16" />

    </>
  );
}
