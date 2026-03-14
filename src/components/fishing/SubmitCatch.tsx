'use client';

import { useState, useEffect } from 'react';
import { SPECIES, LOCATION_PRESETS, BAIT_OPTIONS, METHOD_OPTIONS, DEPTH_OPTIONS, BITE_RATINGS } from '@/lib/fishing';
import { useAuth } from '@/lib/auth/AuthContext';

interface Props {
  onSubmitted: () => void;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function get7DaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SubmitCatch({ onSubmitted }: Props) {
  const { user, profile } = useAuth();

  // Catch fields
  const [species, setSpecies] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [lengthInches, setLengthInches] = useState('');
  const [catchDate, setCatchDate] = useState(getTodayStr());
  const [locationName, setLocationName] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [quantityKept, setQuantityKept] = useState('');

  // Structured fields
  const [baitUsed, setBaitUsed] = useState('');
  const [fishingMethod, setFishingMethod] = useState('');
  const [depthRange, setDepthRange] = useState('');
  const [biteRating, setBiteRating] = useState('');

  // GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect GPS on mount
  useEffect(() => {
    if (user && navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Math.round(pos.coords.latitude * 1000000) / 1000000);
          setLongitude(Math.round(pos.coords.longitude * 1000000) / 1000000);
          setGeoLoading(false);
        },
        () => {
          setGeoError('Could not detect your location. Please enable GPS to submit a catch.');
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [user]);

  function handleRetryGPS() {
    setGeoError(null);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 1000000) / 1000000);
        setLongitude(Math.round(pos.coords.longitude * 1000000) / 1000000);
        setGeoLoading(false);
      },
      () => {
        setGeoError('Could not detect your location. Please enable GPS.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!species) {
      setError('Please select a fish species.');
      return;
    }
    if (!catchDate) {
      setError('Please enter the catch date.');
      return;
    }
    if (!locationName) {
      setError('Please select a location.');
      return;
    }
    if (latitude === null || longitude === null) {
      setError('GPS location is required. Please enable location services and try again.');
      return;
    }
    if (!biteRating) {
      setError('Please rate the bite conditions.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/fishing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species,
          weightLbs: weightLbs ? parseFloat(weightLbs) : null,
          lengthInches: lengthInches ? parseFloat(lengthInches) : null,
          catchDate,
          locationName,
          locationDescription: locationDesc.trim() || null,
          latitude,
          longitude,
          quantityKept: quantityKept ? parseInt(quantityKept, 10) : null,
          baitUsed: baitUsed || null,
          fishingMethod: fishingMethod || null,
          depthRange: depthRange || null,
          biteRating: biteRating ? parseInt(biteRating, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit catch.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      onSubmitted();
    } catch {
      setError('Failed to connect. Please try again.');
    }
    setSubmitting(false);
  }

  // Auth gate
  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="fish-auth-gate">
          <i className="fas fa-lock" style={{ fontSize: '2rem', color: 'var(--gray-300)', marginBottom: '1rem' }}></i>
          <h3>Log In to Report a Catch</h3>
          <p style={{ color: 'var(--gray-400)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            You need an account to submit catch reports. This helps us maintain data quality and lets you track your fishing history.
          </p>
          <a href="/login?redirect=/fishing#submit" className="fish-submit-btn" style={{ display: 'inline-flex', marginTop: '1rem', maxWidth: 250, textDecoration: 'none' }}>
            <i className="fas fa-sign-in-alt" style={{ marginRight: '0.4rem' }}></i> Log In
          </a>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
            Don&apos;t have an account? <a href="/signup" style={{ color: 'var(--blue-accent)' }}>Sign up</a> — it&apos;s free.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="fish-submit-success" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="fish-success-card">
          <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#059669', marginBottom: '1rem' }}></i>
          <h3>Catch Added to the Board!</h3>
          <p>Your catch has been added and is now visible on the Catch Board and Catch Map.</p>
          <button className="fish-submit-btn" onClick={() => {
            setSubmitted(false);
            setSpecies('');
            setWeightLbs('');
            setLengthInches('');
            setLocationName('');
            setLocationDesc('');
            setQuantityKept('');
            setBaitUsed('');
            setFishingMethod('');
            setDepthRange('');
            setBiteRating('');
          }} style={{ marginTop: '1rem', maxWidth: 300 }}>
            <i className="fas fa-plus-circle" style={{ marginRight: '0.4rem' }}></i> Submit Another Catch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 650, margin: '0 auto' }}>
      <form className="fish-submit-form" onSubmit={handleSubmit}>
        {/* Auth status */}
        <div className="fish-auth-badge">
          <i className="fas fa-check-circle" style={{ color: '#059669', marginRight: '0.35rem' }}></i>
          Submitting as <strong>{profile?.display_name || user.email}</strong>
        </div>

        {/* GPS Status */}
        <div className="fish-gps-status">
          {geoLoading && (
            <span style={{ color: 'var(--gray-400)' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.3rem' }}></i> Detecting your location...
            </span>
          )}
          {latitude !== null && longitude !== null && (
            <span style={{ color: '#059669' }}>
              <i className="fas fa-map-marker-alt" style={{ marginRight: '0.3rem' }}></i>
              Location detected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          )}
          {geoError && (
            <div>
              <span style={{ color: '#DC2626' }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.3rem' }}></i>
                {geoError}
              </span>
              <button type="button" onClick={handleRetryGPS} style={{ marginLeft: '0.5rem', color: 'var(--blue-accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Species */}
        <div className="fish-form-group">
          <label htmlFor="fish-species">Species *</label>
          <select id="fish-species" value={species} onChange={e => setSpecies(e.target.value)} required>
            <option value="">Select species...</option>
            {SPECIES.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
            <option value="other">Other</option>
          </select>
        </div>

        {/* Size & Date */}
        <div className="fish-form-row">
          <div className="fish-form-group">
            <label htmlFor="fish-weight">Weight (lbs)</label>
            <input id="fish-weight" type="number" step="0.1" min="0" max="200" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="e.g. 4.5" />
          </div>
          <div className="fish-form-group">
            <label htmlFor="fish-length">Length (inches)</label>
            <input id="fish-length" type="number" step="0.5" min="0" max="100" value={lengthInches} onChange={e => setLengthInches(e.target.value)} placeholder="e.g. 22" />
          </div>
          <div className="fish-form-group">
            <label htmlFor="fish-date">Catch Date *</label>
            <input id="fish-date" type="date" value={catchDate} onChange={e => setCatchDate(e.target.value)} min={get7DaysAgoStr()} max={getTodayStr()} required />
          </div>
        </div>

        {/* Quantity */}
        <div className="fish-form-group">
          <label htmlFor="fish-quantity">Quantity Kept</label>
          <input id="fish-quantity" type="number" min="0" max="100" value={quantityKept} onChange={e => setQuantityKept(e.target.value)} placeholder="How many did you keep?" />
        </div>

        {/* Location */}
        <div className="fish-form-group">
          <label htmlFor="fish-location">Location *</label>
          <select id="fish-location" value={locationName} onChange={e => setLocationName(e.target.value)} required>
            <option value="">Select location...</option>
            {LOCATION_PRESETS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {locationName === 'Other' && (
          <div className="fish-form-group">
            <label htmlFor="fish-location-desc">Describe Location</label>
            <input id="fish-location-desc" type="text" value={locationDesc} onChange={e => setLocationDesc(e.target.value)} placeholder="Where did you catch it?" />
          </div>
        )}

        {/* Structured Data */}
        <div className="fish-form-row">
          <div className="fish-form-group">
            <label htmlFor="fish-bait">Bait Used</label>
            <select id="fish-bait" value={baitUsed} onChange={e => setBaitUsed(e.target.value)}>
              <option value="">Select bait...</option>
              {BAIT_OPTIONS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="fish-form-group">
            <label htmlFor="fish-method">Fishing Method</label>
            <select id="fish-method" value={fishingMethod} onChange={e => setFishingMethod(e.target.value)}>
              <option value="">Select method...</option>
              {METHOD_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fish-form-group">
          <label htmlFor="fish-depth">Depth Range</label>
          <select id="fish-depth" value={depthRange} onChange={e => setDepthRange(e.target.value)}>
            <option value="">Select depth...</option>
            {DEPTH_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Bite Rating */}
        <div className="fish-form-group">
          <label>How Was the Bite? *</label>
          <div className="fish-bite-rating">
            {BITE_RATINGS.map(r => (
              <label key={r.value} className={`fish-bite-option${biteRating === String(r.value) ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="biteRating"
                  value={r.value}
                  checked={biteRating === String(r.value)}
                  onChange={e => setBiteRating(e.target.value)}
                  style={{ display: 'none' }}
                />
                <span className="fish-bite-value">{r.value}</span>
                <span className="fish-bite-label">{r.label.split(' — ')[1]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="fish-error">
            <i className="fas fa-exclamation-circle" style={{ marginRight: '0.35rem' }}></i> {error}
          </div>
        )}

        {/* Submit */}
        <button className="fish-submit-btn" type="submit" disabled={submitting || latitude === null}>
          {submitting ? (
            <><i className="fas fa-spinner fa-spin" style={{ marginRight: '0.4rem' }}></i> Submitting...</>
          ) : (
            <><i className="fas fa-paper-plane" style={{ marginRight: '0.4rem' }}></i> Submit Your Catch</>
          )}
        </button>

        <p className="fish-submit-note">
          <i className="fas fa-info-circle" style={{ marginRight: '0.25rem' }}></i>
          Your catch will appear on the Catch Board and Catch Map immediately. GPS location is required to verify your fishing area.
        </p>
      </form>
    </div>
  );
}
