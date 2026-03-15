'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Alert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  areaDesc?: string;
}

function getSeverityClass(severity: string) {
  switch (severity.toLowerCase()) {
    case 'extreme': return 'severity-extreme';
    case 'severe': return 'severity-severe';
    case 'moderate': return 'severity-moderate';
    default: return 'severity-minor';
  }
}

const MOCK_ALERTS: Alert[] = [
  { id: 'mock-1', event: 'Severe Thunderstorm Warning', headline: 'Severe Thunderstorm Warning in effect for Lorain County until 8:00 PM EDT', severity: 'Severe', areaDesc: 'Vermilion to Avon Point OH' },
  { id: 'mock-2', event: 'Small Craft Advisory', headline: 'Small Craft Advisory in effect for nearshore waters', severity: 'Moderate', areaDesc: 'Avon Point to Willowick OH' },
  { id: 'mock-3', event: 'Gale Warning', headline: 'Gale Warning in effect for Lake Erie nearshore waters', severity: 'Severe', areaDesc: 'The Islands to Vermilion OH' },
];

function MarineAlertBannerInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isPreview = searchParams.get('preview') === 'alerts';
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  // Only fetch alerts on marine-related pages (or preview mode) to avoid
  // blocking the dev server with slow external API calls on every page
  const shouldFetch = isPreview || pathname === '/' || pathname === '/marine';

  useEffect(() => {
    if (isPreview) {
      setAlerts(MOCK_ALERTS);
      setLoaded(true);
      return;
    }
    if (!shouldFetch) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const [marineData, beachData] = await Promise.all([
          fetch('/api/marine', { signal: controller.signal }).then(r => r.json()).catch(() => ({ alerts: [] })),
          fetch('/api/beach-quality', { signal: controller.signal }).then(r => r.json()).catch(() => ({ beaches: [] })),
        ]);
        if (cancelled) return;
        const allAlerts: Alert[] = [...(marineData.alerts || [])];
        if (!beachData.isOffSeason) {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const beaches = beachData.beaches || [];
          const advisoryBeaches = beaches.filter((b: { status: string; latestReading?: { date: string } }) =>
            b.status === 'advisory' && b.latestReading?.date && new Date(b.latestReading.date) >= threeDaysAgo
          );
          if (advisoryBeaches.length > 0) {
            const beachNames = advisoryBeaches.map((b: { name: string }) => b.name).join(', ');
            allAlerts.push({
              id: 'beach-advisory',
              event: 'Beach Water Quality Advisory',
              headline: `Elevated E. coli levels detected at ${beachNames}. Avoid swimming at affected beaches.`,
              severity: 'Moderate',
            });
          }
        }
        setAlerts(allAlerts);
      } catch {
        // Aborted or failed — just skip
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [isPreview, shouldFetch]);

  const active = alerts.filter(a => !dismissed.has(a.id));

  const rotate = useCallback(() => {
    if (active.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % active.length);
      setFading(false);
    }, 300);
  }, [active.length]);

  useEffect(() => {
    if (active.length <= 1) return;
    const interval = setInterval(rotate, 5000);
    return () => clearInterval(interval);
  }, [active.length, rotate]);

  useEffect(() => {
    if (currentIndex >= active.length) setCurrentIndex(0);
  }, [active.length, currentIndex]);

  // Update CSS variable for header height adjustment
  useEffect(() => {
    if (active.length > 0) {
      document.documentElement.style.setProperty('--alert-banner-h', '44px');
    } else {
      document.documentElement.style.setProperty('--alert-banner-h', '0px');
    }
    return () => {
      document.documentElement.style.setProperty('--alert-banner-h', '0px');
    };
  }, [active.length]);

  if (!loaded || active.length === 0) return null;

  const current = active[currentIndex] || active[0];

  return (
    <div className={`marine-alert-banner ${getSeverityClass(current.severity)}`} role="alert">
      <div className="container">
        <div className="marine-alert-inner">
          <i className="fas fa-exclamation-triangle marine-alert-icon"></i>
          <div className={`marine-alert-text${fading ? ' marine-alert-fade' : ''}`}>
            <strong>{current.event}</strong>
            {current.areaDesc && <span className="marine-alert-zone">{current.areaDesc}</span>}
          </div>
          {active.length > 1 && (
            <span className="marine-alert-counter">{currentIndex + 1}/{active.length}</span>
          )}
          <Link href={current.id === 'beach-advisory' ? '/marine#beach' : '/marine'} className="marine-alert-link">
            View Details <i className="fas fa-arrow-right"></i>
          </Link>
          <button
            className="marine-alert-close"
            onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(current.id)); }}
            aria-label="Dismiss alert"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarineAlertBanner() {
  return (
    <Suspense fallback={null}>
      <MarineAlertBannerInner />
    </Suspense>
  );
}
