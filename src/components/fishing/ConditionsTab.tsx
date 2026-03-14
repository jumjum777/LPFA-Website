'use client';

import { useState } from 'react';
import {
  getSpeciesActivity,
  getMayflyStatus,
  getFishingRating,
  type ActivityLevel,
  type FishingRating,
  type MayflyActivityLevel,
} from '@/lib/fishing';
import { useAuth } from '@/lib/auth/AuthContext';

interface ForecastPeriod {
  name: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  temperature: number;
}

interface BiteSummary {
  [speciesId: string]: { avgRating: number; catchCount: number };
}

interface Props {
  waterTemp: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: string;
  waveHeight: number | null;
  pressure: number | null;
  buoyOffline: boolean;
  nearshoreTemp: number | null;
  nearshoreSource: 'coops' | 'nws-text' | null;
  forecast: ForecastPeriod[];
  mayflyLevel: MayflyActivityLevel | null;
  mayflyReportCount: number;
  biteSummary: BiteSummary;
  onMayflyReported: () => void;
}

const ACTIVITY_ORDER: Record<ActivityLevel, number> = {
  active: 0,
  moderate: 1,
  slow: 2,
  inactive: 3,
};

const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
  active: '#059669',
  moderate: '#D97706',
  slow: '#EA580C',
  inactive: '#9CA3AF',
};

const RATING_STYLES: Record<FishingRating, { background: string; color: string }> = {
  Excellent: { background: '#dcfce7', color: '#059669' },
  Good: { background: '#dcfce7', color: '#16a34a' },
  Fair: { background: '#fef3c7', color: '#D97706' },
  Poor: { background: '#fee2e2', color: '#DC2626' },
};

const MAYFLY_ICONS: Record<string, string> = {
  'pre-hatch': 'fa-hourglass-start',
  'imminent': 'fa-hourglass-half',
  'hatching': 'fa-bug',
  'post-hatch': 'fa-check-circle',
  'off-season': 'fa-snowflake',
};

const NEARSHORE_SOURCE_LABELS: Record<string, string> = {
  'coops': 'NOAA Cleveland Station',
  'nws-text': 'NWS Nearshore Forecast',
};

export default function ConditionsTab({
  waterTemp,
  windSpeed,
  windGust,
  windDirection,
  waveHeight,
  pressure,
  buoyOffline,
  nearshoreTemp,
  nearshoreSource,
  forecast,
  mayflyLevel,
  mayflyReportCount,
  biteSummary,
  onMayflyReported,
}: Props) {
  const month = new Date().getMonth() + 1;

  // Species activity with new engine
  const speciesActivity = getSpeciesActivity({
    nearshoreTemp,
    offshoreTemp: waterTemp,
    windSpeed,
    month,
    mayflyLevel,
    communityBiteAvg: null,
  }).map(sa => {
    // Inject per-species community bite data if enough reports
    const bite = biteSummary[sa.species.id];
    if (bite && bite.catchCount >= 3) {
      const withBite = getSpeciesActivity({
        nearshoreTemp,
        offshoreTemp: waterTemp,
        windSpeed,
        month,
        mayflyLevel,
        communityBiteAvg: bite.avgRating,
      }).find(s => s.species.id === sa.species.id);
      if (withBite) return withBite;
    }
    return sa;
  }).sort((a, b) => ACTIVITY_ORDER[a.level] - ACTIVITY_ORDER[b.level]);

  // Mayfly status
  const mayfly = getMayflyStatus(nearshoreTemp, month, mayflyLevel);

  // Progress bar for mayfly
  const mayflyTemp = nearshoreTemp;
  const showMayflyProgress =
    mayflyTemp !== null &&
    (mayfly.phase === 'pre-hatch' || mayfly.phase === 'imminent');
  const mayflyProgress = mayflyTemp !== null
    ? Math.min(100, Math.max(0, ((mayflyTemp - 50) / (68 - 50)) * 100))
    : 0;

  return (
    <div>
      {/* ── Current Conditions Grid ── */}
      <div className="section-header center">
        <div className="section-label">Lake Erie / Lorain</div>
        <h2 className="section-title">Current Conditions</h2>
      </div>

      <div className="fish-conditions-grid">
        {/* Nearshore Water Temp */}
        <div className="fish-condition-card">
          <div className="condition-icon">
            <i className="fas fa-temperature-half"></i>
          </div>
          <div className="condition-value">
            {nearshoreTemp !== null ? nearshoreTemp : '--'}
            <span className="condition-unit">&deg;F</span>
          </div>
          <div className="condition-label">
            Nearshore Temp
            {nearshoreSource && (
              <span className="condition-source">{NEARSHORE_SOURCE_LABELS[nearshoreSource]}</span>
            )}
          </div>
        </div>

        {/* Offshore Water Temp */}
        <div className="fish-condition-card">
          <div className="condition-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
            <i className="fas fa-temperature-half"></i>
          </div>
          <div className="condition-value">
            {!buoyOffline && waterTemp !== null ? waterTemp : '--'}
            <span className="condition-unit">&deg;F</span>
          </div>
          <div className="condition-label">
            Offshore Temp
            <span className="condition-source">{buoyOffline ? 'Buoy offline (seasonal)' : 'NDBC Buoy 45005'}</span>
          </div>
        </div>

        {/* Wind */}
        <div className="fish-condition-card">
          <div className="condition-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>
            <i className="fas fa-wind"></i>
          </div>
          <div className="condition-value">
            {windSpeed !== null ? windSpeed : '--'}
            <span className="condition-unit"> kts</span>
            {windGust !== null && (
              <span className="condition-unit"> (G {windGust})</span>
            )}
          </div>
          <div className="condition-label">
            Wind {windDirection || ''}
          </div>
        </div>

        {/* Waves */}
        <div className="fish-condition-card">
          <div className="condition-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}>
            <i className="fas fa-water"></i>
          </div>
          <div className="condition-value">
            {!buoyOffline && waveHeight !== null ? waveHeight : '--'}
            <span className="condition-unit"> ft</span>
          </div>
          <div className="condition-label">Waves</div>
        </div>
      </div>

      {/* ── What's Biting ── */}
      <div className="section-header center" style={{ marginTop: '2.5rem' }}>
        <div className="section-label">Species Activity</div>
        <h2 className="section-title">What&apos;s Biting</h2>
      </div>

      <div className="fish-activity-list">
        {speciesActivity.map((sa) => {
          const bite = biteSummary[sa.species.id];
          return (
            <div key={sa.species.id} className="fish-activity-item">
              <span
                className="fish-activity-dot"
                style={{ background: ACTIVITY_COLORS[sa.level] }}
              ></span>
              <div className="fish-activity-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span className="fish-activity-name">{sa.species.name}</span>
                  <span
                    className="fish-activity-level"
                    style={{ color: ACTIVITY_COLORS[sa.level] }}
                  >
                    {sa.level.charAt(0).toUpperCase() + sa.level.slice(1)}
                  </span>
                  {bite && bite.catchCount >= 3 && (
                    <span className="fish-community-badge">
                      <i className="fas fa-users" style={{ fontSize: '0.65rem', marginRight: '0.2rem' }}></i>
                      {bite.avgRating.toFixed(1)}/5 ({bite.catchCount} reports)
                    </span>
                  )}
                </div>
                <div className="fish-activity-detail">{sa.reason}</div>
                <div className="fish-activity-tip">
                  {sa.season
                    ? `${sa.tip} Look for them: ${sa.season.bestSpots.split(',')[0].trim()}.`
                    : sa.tip
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mayfly Hatch Tracker ── */}
      <div className="section-header center" style={{ marginTop: '2.5rem' }}>
        <div className="section-label">Mayfly Watch</div>
        <h2 className="section-title">Mayfly Hatch Tracker</h2>
      </div>

      <div className="fish-mayfly-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <i
            className={`fas ${MAYFLY_ICONS[mayfly.phase]}`}
            style={{ fontSize: '1.5rem', color: mayfly.phase === 'hatching' ? '#059669' : 'var(--gold)' }}
          ></i>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }}>
              {mayfly.phase.replace('-', ' ')}
            </div>
            {mayflyReportCount > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                Based on {mayflyReportCount} community report{mayflyReportCount !== 1 ? 's' : ''} (48h)
              </div>
            )}
          </div>
        </div>

        <p style={{ marginBottom: showMayflyProgress ? '1rem' : 0 }}>
          {mayfly.message}
        </p>

        {showMayflyProgress && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '0.35rem' }}>
              <span>{mayflyTemp}&deg;F current</span>
              <span>68&deg;F hatch threshold</span>
            </div>
            <div className="fish-mayfly-progress">
              <div
                className="fish-mayfly-bar"
                style={{ width: `${mayflyProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mayfly Report Widget */}
        {month >= 5 && month <= 9 && (
          <MayflyReportWidget onReported={onMayflyReported} />
        )}
      </div>

      {/* ── Quick Forecast ── */}
      {forecast.length > 0 && (
        <>
          <div className="section-header center" style={{ marginTop: '2.5rem' }}>
            <div className="section-label">Fishing Outlook</div>
            <h2 className="section-title">Quick Forecast</h2>
          </div>

          <div className="fish-forecast-list">
            {forecast.slice(0, 3).map((period) => {
              const windMatch = period.windSpeed.match(/(\d+)/g);
              const parsedWind = windMatch
                ? Math.max(...windMatch.map(Number))
                : 0;
              const rating = getFishingRating(parsedWind, 0, period.shortForecast);
              const ratingStyle = RATING_STYLES[rating.rating];

              return (
                <div key={period.name} className="fish-forecast-item">
                  <div>
                    <strong>{period.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                      {period.shortForecast} &mdash; {period.windDirection} {period.windSpeed}, {period.temperature}&deg;F
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: '0.15rem' }}>
                      {rating.reason}
                    </div>
                  </div>
                  <span
                    className="fish-forecast-rating"
                    style={{
                      background: ratingStyle.background,
                      color: ratingStyle.color,
                    }}
                  >
                    {rating.rating}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mayfly Report Widget ─────────────────────────────────────────────────

function MayflyReportWidget({ onReported }: { onReported: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReport(level: MayflyActivityLevel) {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      setSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/fishing/mayfly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_level: level,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || 'Failed to submit report.');
          } else {
            setSubmitted(true);
            onReported();
          }
        } catch {
          setError('Failed to connect. Please try again.');
        }
        setSubmitting(false);
      },
      () => {
        setError('Could not get your location. Please enable GPS.');
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (!user) {
    return (
      <div className="fish-mayfly-report" style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          <a href="/login?redirect=/fishing#conditions" style={{ color: 'var(--blue-accent)' }}>Log in</a> to report mayfly activity in your area.
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fish-mayfly-report" style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#059669' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '0.3rem' }}></i>
          Thanks for your report! It helps other anglers know what to expect.
        </div>
      </div>
    );
  }

  return (
    <div className="fish-mayfly-report" style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>
        <i className="fas fa-bullhorn" style={{ marginRight: '0.3rem', color: 'var(--gold)' }}></i>
        Report mayfly activity near you:
      </div>
      <div className="fish-mayfly-btns">
        {(['none', 'low', 'medium', 'high'] as MayflyActivityLevel[]).map(level => (
          <button
            key={level}
            className="fish-mayfly-report-btn"
            onClick={() => submitReport(level)}
            disabled={submitting}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
      {error && (
        <div style={{ fontSize: '0.82rem', color: '#DC2626', marginTop: '0.35rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
