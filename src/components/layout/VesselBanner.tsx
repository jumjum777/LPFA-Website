'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';

interface VesselRecord {
  mmsi: string;
  vessel_name: string | null;
  destination: string | null;
  vessel_type: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  eta: string | null;
  status: string;
  first_detected_at?: string;
  last_seen_at?: string;
  is_active: boolean;
}

function formatEta(eta: string | null): string {
  if (!eta) return '';
  const date = new Date(eta);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  // If ETA is in the past, skip it
  if (diffMs < 0) return '';

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });
}

function VesselBannerInner() {
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    fetch('/api/vessels')
      .then(res => res.json())
      .then(data => {
        setVessels(data.vessels || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const active = vessels.filter(v => !dismissed.has(v.mmsi));

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
    const interval = setInterval(rotate, 6000);
    return () => clearInterval(interval);
  }, [active.length, rotate]);

  useEffect(() => {
    if (currentIndex >= active.length) setCurrentIndex(0);
  }, [active.length, currentIndex]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--vessel-banner-h',
      active.length > 0 ? '44px' : '0px'
    );
    return () => {
      document.documentElement.style.setProperty('--vessel-banner-h', '0px');
    };
  }, [active.length]);

  if (!loaded || active.length === 0) return null;

  const current = active[currentIndex] || active[0];
  const eta = formatEta(current.eta);
  const statusLabel = current.status === 'in_port' ? 'at Port Lorain' : 'en route to Port Lorain';

  return (
    <div className="vessel-banner" role="status">
      <div className="container">
        <div className="vessel-banner-inner">
          <i className="fas fa-ship vessel-banner-icon"></i>
          <div className={`vessel-banner-text${fading ? ' vessel-banner-fade' : ''}`}>
            <strong>{current.vessel_name || 'Unknown Vessel'}</strong>
            <span className="vessel-banner-detail">
              {statusLabel}{eta ? ` \u2014 ETA ${eta}` : ''}
            </span>
          </div>
          {active.length > 1 && (
            <span className="vessel-banner-counter">{currentIndex + 1}/{active.length}</span>
          )}
          <button
            className="vessel-banner-close"
            onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(current.mmsi)); }}
            aria-label="Dismiss notification"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VesselBanner() {
  return (
    <Suspense fallback={null}>
      <VesselBannerInner />
    </Suspense>
  );
}
