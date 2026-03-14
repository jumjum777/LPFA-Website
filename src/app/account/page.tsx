'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { SPECIES, type FishingCatch } from '@/lib/fishing';

function getSpeciesName(id: string) {
  return SPECIES.find(s => s.id === id)?.name || id;
}

function getSpeciesColor(id: string) {
  return SPECIES.find(s => s.id === id)?.color || '#64748b';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${classes[status] || classes.pending}`}>
      {status}
    </span>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [catches, setCatches] = useState<FishingCatch[]>([]);
  const [catchesLoading, setCatchesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchCatches() {
      try {
        const res = await fetch('/api/fishing/my-catches');
        if (res.ok) {
          const data = await res.json();
          setCatches(data.catches || []);
        }
      } catch {
        // silently fail — catches section will show empty
      } finally {
        setCatchesLoading(false);
      }
    }

    fetchCatches();
  }, [user]);

  // Loading spinner
  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-[#1B8BEB]" />
      </div>
    );
  }

  // Stats
  const totalCatches = catches.length;
  const approvedCatches = catches.filter(c => c.status === 'approved').length;
  const pendingCatches = catches.filter(c => c.status === 'pending').length;
  const uniqueSpecies = new Set(
    catches.filter(c => c.status === 'approved').map(c => c.species)
  ).size;

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

      {/* Stats row */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center">
            <div className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)]">
              {catchesLoading ? <i className="fas fa-spinner fa-spin text-lg text-gray-300" /> : totalCatches}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">
              Total Catches
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center">
            <div className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)]">
              {catchesLoading ? <i className="fas fa-spinner fa-spin text-lg text-gray-300" /> : approvedCatches}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">
              Approved
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center">
            <div className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)]">
              {catchesLoading ? <i className="fas fa-spinner fa-spin text-lg text-gray-300" /> : pendingCatches}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">
              Pending Review
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 text-center">
            <div className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)]">
              {catchesLoading ? <i className="fas fa-spinner fa-spin text-lg text-gray-300" /> : uniqueSpecies}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">
              Species
            </div>
          </div>
        </div>
      </div>

      {/* My Catches section */}
      <div id="catches" className="max-w-5xl mx-auto px-4 mt-12 pb-16">
        <h2 className="text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 font-[var(--font-heading)] mb-2">
          My Catches
        </h2>

        {catchesLoading ? (
          <div className="flex items-center justify-center py-16">
            <i className="fas fa-spinner fa-spin text-2xl text-[#1B8BEB]" />
          </div>
        ) : catches.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center mt-4">
            <i className="fas fa-fish text-5xl text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-lg text-gray-500 dark:text-slate-400 font-medium">
              You haven&apos;t submitted any catches yet.
            </p>
            <Link
              href="/fishing#submit"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#1B8BEB] hover:bg-[#1577cc] text-white font-semibold rounded-lg font-[var(--font-heading)] transition"
            >
              <i className="fas fa-plus" />
              Submit Your First Catch
            </Link>
          </div>
        ) : (
          /* Catch list */
          <div className="space-y-3 mt-6">
            {catches.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4"
              >
                {/* Thumbnail */}
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={getSpeciesName(c.species)}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <i className="fas fa-fish text-lg text-gray-400 dark:text-slate-500" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: getSpeciesColor(c.species) }}
                    >
                      {getSpeciesName(c.species)}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
                    {(c.weight_lbs || c.length_inches) && (
                      <span>
                        <i className="fas fa-ruler mr-1" />
                        {c.weight_lbs ? `${c.weight_lbs} lbs` : ''}
                        {c.weight_lbs && c.length_inches ? ' / ' : ''}
                        {c.length_inches ? `${c.length_inches}"` : ''}
                      </span>
                    )}
                    <span>
                      <i className="fas fa-map-marker-alt mr-1" />
                      {c.location_name}
                    </span>
                    <span>
                      <i className="fas fa-calendar mr-1" />
                      {formatDate(c.catch_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
