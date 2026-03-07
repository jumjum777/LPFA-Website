'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Alert {
  id: string;
  event: string;
  headline: string;
  severity: string;
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
  { id: 'mock-1', event: 'Small Craft Advisory', headline: 'Small Craft Advisory in effect for Vermilion to Avon Point OH nearshore waters', severity: 'Moderate' },
  { id: 'mock-2', event: 'Gale Warning', headline: 'Gale Warning in effect for Lorain and surrounding Lake Erie nearshore waters', severity: 'Severe' },
];

function MarineAlertBannerInner() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'alerts';
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (isPreview) {
      setAlerts(MOCK_ALERTS);
      setLoaded(true);
      return;
    }
    fetch('/api/marine')
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [isPreview]);

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
            <span className="marine-alert-headline">{current.headline}</span>
          </div>
          {active.length > 1 && (
            <span className="marine-alert-counter">{currentIndex + 1}/{active.length}</span>
          )}
          <Link href="/marine" className="marine-alert-link">
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
