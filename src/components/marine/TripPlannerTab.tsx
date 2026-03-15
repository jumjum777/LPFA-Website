'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { DESTINATIONS, getTransitMinutes, formatTransitTime, getDestLabel } from '@/lib/trip-planner';
import type { TripAnalysis, MultiStopAnalysis, BoatingRating, BoatSize, BoatType, BoatActivity } from '@/lib/trip-planner';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getRatingColor(rating: BoatingRating): string {
  switch (rating) {
    case 'Excellent': return '#059669';
    case 'Good': return '#16a34a';
    case 'Fair': return '#D97706';
    case 'Poor': return '#DC2626';
    case 'Dangerous': return '#991B1B';
  }
}

function getRatingBg(rating: BoatingRating): string {
  switch (rating) {
    case 'Excellent': return '#dcfce7';
    case 'Good': return '#dcfce7';
    case 'Fair': return '#fef3c7';
    case 'Poor': return '#fee2e2';
    case 'Dangerous': return '#fee2e2';
  }
}

function getRatingIcon(rating: BoatingRating): string {
  switch (rating) {
    case 'Excellent': return 'fa-check-circle';
    case 'Good': return 'fa-thumbs-up';
    case 'Fair': return 'fa-exclamation-circle';
    case 'Poor': return 'fa-times-circle';
    case 'Dangerous': return 'fa-skull-crossbones';
  }
}

function formatTripDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatWindowTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}`).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDefaultTime(hoursFromNow: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow, 0, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface StopEntry {
  destination: string;
  departureDate: string;
  departureTime: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TripPlannerTab() {
  const resultsRef = useRef<HTMLDivElement>(null);

  // Form state
  const [boatSize, setBoatSize] = useState<BoatSize>('small');
  const [boatType, setBoatType] = useState<BoatType>('powerboat');
  const [activities, setActivities] = useState<BoatActivity[]>(['cruising']);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'experienced'>('intermediate');
  const [destination, setDestination] = useState('lorain');
  const [depDate, setDepDate] = useState(getTodayStr());
  const [depTime, setDepTime] = useState(getDefaultTime(1));
  const [retDate, setRetDate] = useState(getTodayStr());
  const [retTime, setRetTime] = useState(getDefaultTime(6));

  // Multi-stop state
  const [multiStop, setMultiStop] = useState(false);
  const [stops, setStops] = useState<StopEntry[]>([
    { destination: 'vermilion', departureDate: getTodayStr(), departureTime: getDefaultTime(4) },
  ]);

  // Results state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<TripAnalysis | null>(null);
  const [msResult, setMsResult] = useState<MultiStopAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dest = DESTINATIONS.find(d => d.value === destination);

  // Loading step animation
  const LOADING_STEPS = [
    { icon: 'fa-wind', text: 'Checking wind forecasts...' },
    { icon: 'fa-water', text: 'Analyzing wave conditions...' },
    { icon: 'fa-thermometer-half', text: 'Reading water temperatures...' },
    { icon: 'fa-cloud-rain', text: 'Checking precipitation outlook...' },
    { icon: 'fa-ship', text: 'Scanning vessel traffic...' },
    { icon: 'fa-exclamation-triangle', text: 'Reviewing active marine alerts...' },
    { icon: 'fa-route', text: 'Calculating your itinerary...' },
    { icon: 'fa-compass', text: 'Generating safety analysis...' },
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ─── Multi-stop helpers ──────────────────────────────────────────────

  function updateStop(index: number, field: keyof StopEntry, value: string) {
    setStops(prev => {
      const updated = prev.map((s, i) => i === index ? { ...s, [field]: value } : s);
      // Cascade: if date changed, push later stops forward if they're before this one
      if (field === 'departureDate') {
        for (let i = index + 1; i < updated.length; i++) {
          if (updated[i].departureDate < value) {
            updated[i] = { ...updated[i], departureDate: value };
          }
        }
      }
      // Cascade: if time changed on same date, push later same-date stops forward
      if (field === 'departureTime') {
        for (let i = index + 1; i < updated.length; i++) {
          if (updated[i].departureDate === updated[index].departureDate && updated[i].departureTime < value) {
            updated[i] = { ...updated[i], departureTime: value };
          }
        }
      }
      return updated;
    });
  }

  function addStop() {
    if (stops.length >= 4) return;
    const lastStop = stops[stops.length - 1];
    const lastHour = parseInt(lastStop.departureTime.split(':')[0]);
    const newHour = lastHour + 3;
    const newDate = newHour >= 24 ? (() => {
      const d = new Date(lastStop.departureDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })() : lastStop.departureDate;
    setStops(prev => [...prev, {
      destination: 'huron',
      departureDate: newDate,
      departureTime: `${String(newHour % 24).padStart(2, '0')}:00`,
    }]);
  }

  function removeStop(index: number) {
    if (stops.length <= 1) return;
    setStops(prev => prev.filter((_, i) => i !== index));
  }

  function toggleActivity(activity: BoatActivity) {
    setActivities(prev => {
      if (prev.includes(activity)) {
        // Don't allow deselecting the last activity
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== activity);
      }
      return [...prev, activity];
    });
  }

  function getPrevDest(index: number): string {
    if (index === 0) return 'lorain';
    return stops[index - 1].destination;
  }

  // ─── Submit ──────────────────────────────────────────────────────────

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    setMsResult(null);

    // Scroll up to show loading animation
    setTimeout(() => {
      const tabContent = document.querySelector('.marine-tab-content');
      if (tabContent) {
        const top = tabContent.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 50);

    try {
      if (multiStop) {
        // Build legs: Lorain → stop1, stop1 → stop2, ..., lastStop → Lorain
        const legs = [];
        // First leg: Lorain → first stop
        legs.push({
          from: 'lorain',
          to: stops[0].destination,
          departureTime: new Date(`${depDate}T${depTime}:00`).toISOString(),
        });
        // Middle legs
        for (let i = 0; i < stops.length - 1; i++) {
          legs.push({
            from: stops[i].destination,
            to: stops[i + 1].destination,
            departureTime: new Date(`${stops[i].departureDate}T${stops[i].departureTime}:00`).toISOString(),
          });
        }
        // Last leg: last stop → Lorain
        const lastStop = stops[stops.length - 1];
        legs.push({
          from: lastStop.destination,
          to: 'lorain',
          departureTime: new Date(`${lastStop.departureDate}T${lastStop.departureTime}:00`).toISOString(),
        });

        // Validate chronological order
        for (let i = 1; i < legs.length; i++) {
          if (new Date(legs[i].departureTime) <= new Date(legs[i - 1].departureTime)) {
            setError(`Each departure must be after the previous one. Check stop ${i} timing.`);
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/trip-planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boatSize, boatType, activities, experienceLevel: experience, legs }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to analyze trip conditions.');
          setLoading(false);
          return;
        }

        const data: MultiStopAnalysis = await res.json();
        setMsResult(data);
      } else {
        // Single destination
        const departureTime = new Date(`${depDate}T${depTime}:00`).toISOString();
        const returnTime = new Date(`${retDate}T${retTime}:00`).toISOString();

        if (new Date(returnTime) <= new Date(departureTime)) {
          setError('Return time must be after departure time.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/trip-planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boatSize,
            boatType,
            activities,
            experienceLevel: experience,
            departurePoint: 'Lorain Harbor',
            destination,
            departureTime,
            returnTime,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to analyze trip conditions.');
          setLoading(false);
          return;
        }

        const data: TripAnalysis = await res.json();
        setResult(data);
      }
    } catch {
      setError('Failed to connect. Please try again.');
    }
    setLoading(false);
    setTimeout(() => {
      const el = resultsRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 160;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 50);
  }

  function handleReset() {
    setResult(null);
    setMsResult(null);
    setError(null);
  }

  // ─── Multi-Stop Results View ─────────────────────────────────────────

  const [expandedLeg, setExpandedLeg] = useState(0);
  const [showHazards, setShowHazards] = useState(true);
  const [showRecs, setShowRecs] = useState(true);

  if (msResult) {
    const routeStr = msResult.legs.map(l => l.fromLabel).join(' → ') + ' → ' + msResult.legs[msResult.legs.length - 1].toLabel;

    return (
      <div ref={resultsRef} className="trip-planner-results" style={{ maxWidth: 800, margin: '0 auto' }}>
        <button onClick={handleReset} className="trip-back-btn">
          <i className="fas fa-arrow-left" style={{ marginRight: '0.35rem', fontSize: '0.75rem' }}></i> Plan Another Trip
        </button>

        <div className="trip-disclaimer-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span><strong>For informational purposes only.</strong> Lake Erie conditions can change rapidly. Always check official forecasts, monitor VHF Ch. 16, and use your own judgment.</span>
        </div>

        {/* Trip Overview */}
        <div className="trip-overview-card">
          <div className="trip-overview-header">
            <div>
              <div className="trip-overview-route">
                <i className="fas fa-route" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i>
                {routeStr}
              </div>
              <div className="trip-overview-meta">
                {formatTripDate(msResult.legs[0].departureTime)} – {formatTripDate(msResult.legs[msResult.legs.length - 1].estimatedArrival)}
                <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>|</span>
                {msResult.legs.length} legs
              </div>
            </div>
            <div className="trip-rating-badge" style={{ background: getRatingBg(msResult.overallRating), color: getRatingColor(msResult.overallRating) }}>
              <i className={`fas ${getRatingIcon(msResult.overallRating)}`} style={{ marginRight: '0.35rem' }}></i>
              {msResult.overallRating}
            </div>
          </div>
          <p className="trip-overview-summary">{msResult.summary}</p>
        </div>

        {/* Leg Accordion */}
        <div className="trip-results-label">
          <i className="fas fa-route"></i> Trip Legs
        </div>
        <div className="trip-legs-accordion">
          {msResult.legs.map((leg, i) => {
            const isOpen = expandedLeg === i;
            return (
              <div key={i} className={`trip-leg-accord${isOpen ? ' open' : ''}`}>
                <button
                  className="trip-leg-accord-trigger"
                  onClick={() => setExpandedLeg(i)}
                  type="button"
                >
                  <div className="trip-leg-accord-left">
                    <span className="trip-leg-number">Leg {i + 1}</span>
                    <span className="trip-leg-accord-route">
                      {leg.fromLabel}
                      <i className="fas fa-long-arrow-alt-right" style={{ margin: '0 0.4rem', color: '#94a3b8', fontSize: '0.7rem' }}></i>
                      {leg.toLabel}
                    </span>
                  </div>
                  <div className="trip-leg-accord-right">
                    <span className="trip-window-rating" style={{ background: getRatingBg(leg.conditions.rating), color: getRatingColor(leg.conditions.rating) }}>
                      <i className={`fas ${getRatingIcon(leg.conditions.rating)}`} style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}></i>
                      {leg.conditions.rating}
                    </span>
                    <i className={`fas fa-chevron-down trip-leg-accord-chevron${isOpen ? ' open' : ''}`}></i>
                  </div>
                </button>
                <div className={`trip-leg-accord-body${isOpen ? ' open' : ''}`}>
                  <div className="trip-leg-accord-content">
                    <div className="trip-leg-times">
                      <span>
                        <i className="fas fa-clock" style={{ marginRight: '0.3rem', color: '#94a3b8', fontSize: '0.7rem' }}></i>
                        Departing {formatTripDate(leg.departureTime)}
                      </span>
                      <span style={{ color: '#94a3b8' }}>&middot;</span>
                      <span>{formatTransitTime(leg.transitMinutes)} transit</span>
                      <span style={{ color: '#94a3b8' }}>&middot;</span>
                      <span>Arriving {formatTripDate(leg.estimatedArrival)}</span>
                    </div>
                    {leg.travelWarning && (
                      <div className="trip-travel-warning" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        <i className="fas fa-clock" style={{ color: '#D97706', marginRight: '0.4rem' }}></i>
                        {leg.travelWarning}
                      </div>
                    )}
                    <p className="trip-window-narrative">{leg.conditions.narrative}</p>
                    <div className="trip-window-stats">
                      {leg.conditions.wind && <span><i className="fas fa-wind"></i> {leg.conditions.wind}</span>}
                      {leg.conditions.waves && <span><i className="fas fa-water"></i> {leg.conditions.waves}</span>}
                      {leg.conditions.temp && <span><i className="fas fa-thermometer-half"></i> {leg.conditions.temp}</span>}
                      {leg.conditions.precip && <span><i className="fas fa-cloud-rain"></i> {leg.conditions.precip}</span>}
                    </div>
                    {i < msResult.legs.length - 1 && (
                      <button
                        className="trip-leg-next-btn"
                        onClick={() => setExpandedLeg(i + 1)}
                        type="button"
                      >
                        Next: Leg {i + 2} — {msResult.legs[i + 1].fromLabel} to {msResult.legs[i + 1].toLabel}
                        <i className="fas fa-chevron-right" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety & Guidance label */}
        <div className="trip-results-label" style={{ marginTop: '0.25rem' }}>
          <i className="fas fa-shield-alt"></i> Safety &amp; Guidance
        </div>

        {/* Hazards (collapsible) */}
        {msResult.hazards.length > 0 && (
          <div className="trip-collapsible-section trip-hazards-section">
            <button className="trip-collapsible-trigger" onClick={() => setShowHazards(v => !v)} type="button">
              <span>
                <i className="fas fa-exclamation-triangle" style={{ color: '#D97706', marginRight: '0.4rem' }}></i>
                Hazards
                <span className="trip-collapsible-count">{msResult.hazards.length}</span>
              </span>
              <i className={`fas fa-chevron-down trip-collapsible-chevron${showHazards ? ' open' : ''}`}></i>
            </button>
            <div className={`trip-collapsible-body${showHazards ? ' open' : ''}`}>
              <div className="trip-collapsible-content">
                {msResult.hazards.map((h, i) => (
                  <div key={i} className="trip-hazard-item">
                    <i className="fas fa-exclamation-circle" style={{ color: '#D97706', marginRight: '0.4rem', fontSize: '0.8rem', flexShrink: 0 }}></i>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations (collapsible) */}
        {msResult.recommendations.length > 0 && (
          <div className="trip-collapsible-section trip-recs-section">
            <button className="trip-collapsible-trigger" onClick={() => setShowRecs(v => !v)} type="button">
              <span>
                <i className="fas fa-lightbulb" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i>
                Recommendations
                <span className="trip-collapsible-count">{msResult.recommendations.length}</span>
              </span>
              <i className={`fas fa-chevron-down trip-collapsible-chevron${showRecs ? ' open' : ''}`}></i>
            </button>
            <div className={`trip-collapsible-body${showRecs ? ' open' : ''}`}>
              <div className="trip-collapsible-content">
                {msResult.recommendations.map((r, i) => (
                  <div key={i} className="trip-recommendation-item">
                    <i className="fas fa-arrow-right" style={{ color: '#1B8BEB', marginRight: '0.4rem', fontSize: '0.7rem', flexShrink: 0 }}></i>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Limitations (collapsible) */}
        {msResult.dataLimitations.length > 0 && (
          <div className="trip-collapsible-section trip-notes-section">
            <button className="trip-collapsible-trigger trip-collapsible-subtle" onClick={(e) => { const body = e.currentTarget.nextElementSibling; body?.classList.toggle('open'); e.currentTarget.querySelector('.trip-collapsible-chevron')?.classList.toggle('open'); }} type="button">
              <span>
                <i className="fas fa-info-circle" style={{ color: '#94a3b8', marginRight: '0.4rem' }}></i>
                Data Notes
                <span className="trip-collapsible-count">{msResult.dataLimitations.length}</span>
              </span>
              <i className="fas fa-chevron-down trip-collapsible-chevron"></i>
            </button>
            <div className="trip-collapsible-body">
              <div className="trip-collapsible-content">
                {msResult.dataLimitations.map((note, i) => (
                  <div key={i} className="trip-data-note">
                    <i className="fas fa-info-circle" style={{ color: '#94a3b8', marginRight: '0.35rem', fontSize: '0.75rem', flexShrink: 0 }}></i>
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="trip-disclaimer">
          <p>
            {msResult.isAiGenerated ? 'AI-generated analysis' : 'Rule-based analysis'} · Updated {new Date(msResult.generatedAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })} ET
          </p>
          <p style={{ marginTop: '0.35rem' }}>
            This analysis is for informational purposes only. Always check official marine forecasts, monitor VHF Channel 16, and use your own judgment before heading out on the water.
          </p>
        </div>
      </div>
    );
  }

  // ─── Single-Trip Results View ────────────────────────────────────────

  if (result) {
    const durationHrs = Math.round(
      (new Date(retDate + 'T' + retTime).getTime() - new Date(depDate + 'T' + depTime).getTime()) / 3600000 * 10
    ) / 10;
    const sizeLabels: Record<BoatSize, string> = {
      small: 'Small (<20ft)',
      medium: 'Medium (20-30ft)',
      large: 'Large (30+ft)',
      jetski: 'Jet Ski / PWC',
    };
    const typeLabel = boatSize === 'jetski' ? 'Jet Ski' : boatType === 'sailboat' ? 'Sailboat' : 'Powerboat';

    return (
      <div ref={resultsRef} className="trip-planner-results" style={{ maxWidth: 800, margin: '0 auto' }}>
        <button onClick={handleReset} className="trip-back-btn">
          <i className="fas fa-arrow-left" style={{ marginRight: '0.35rem', fontSize: '0.75rem' }}></i> Plan Another Trip
        </button>

        <div className="trip-disclaimer-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span><strong>For informational purposes only.</strong> Lake Erie conditions can change rapidly. Always check official forecasts, monitor VHF Ch. 16, and use your own judgment.</span>
        </div>

        {/* Trip Overview */}
        <div className="trip-overview-card">
          <div className="trip-overview-header">
            <div>
              <div className="trip-overview-route">
                <i className="fas fa-anchor" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i>
                Lorain Harbor
                <i className="fas fa-long-arrow-alt-right" style={{ margin: '0 0.5rem', color: '#94a3b8' }}></i>
                {dest?.label || destination}
              </div>
              <div className="trip-overview-meta">
                {formatWindowTime(depDate, depTime)} – {formatWindowTime(retDate, retTime)} ({durationHrs} hrs)
                <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>|</span>
                {sizeLabels[boatSize]} {typeLabel}
                <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>|</span>
                {experience.charAt(0).toUpperCase() + experience.slice(1)}
              </div>
            </div>
            <div className="trip-rating-badge" style={{ background: getRatingBg(result.overallRating), color: getRatingColor(result.overallRating) }}>
              <i className={`fas ${getRatingIcon(result.overallRating)}`} style={{ marginRight: '0.35rem' }}></i>
              {result.overallRating}
            </div>
          </div>
          <p className="trip-overview-summary">{result.summary}</p>
        </div>

        {/* Travel Warning */}
        {result.travelWarning && (
          <div className="trip-travel-warning">
            <i className="fas fa-clock" style={{ color: '#D97706', marginRight: '0.4rem' }}></i>
            {result.travelWarning}
          </div>
        )}

        {/* Departure + Return Windows */}
        <div className="trip-results-label">
          <i className="fas fa-water"></i> Conditions
        </div>
        <div className="trip-window-grid">
          {[
            { label: `Departing ${formatWindowTime(depDate, depTime)}`, data: result.departure, icon: 'fa-arrow-right' },
            { label: `Returning ${formatWindowTime(retDate, retTime)}`, data: result.returnWindow, icon: 'fa-arrow-left' },
          ].map(w => (
            <div key={w.label} className="trip-window-card">
              <div className="trip-window-header">
                <span><i className={`fas ${w.icon}`} style={{ marginRight: '0.35rem', fontSize: '0.75rem' }}></i> {w.label}</span>
                <span className="trip-window-rating" style={{ background: getRatingBg(w.data.rating), color: getRatingColor(w.data.rating) }}>
                  <i className={`fas ${getRatingIcon(w.data.rating)}`} style={{ marginRight: '0.25rem', fontSize: '0.65rem' }}></i>
                  {w.data.rating}
                </span>
              </div>
              <p className="trip-window-narrative">{w.data.narrative}</p>
              <div className="trip-window-stats">
                {w.data.wind && <span><i className="fas fa-wind"></i> {w.data.wind}</span>}
                {w.data.waves && <span><i className="fas fa-water"></i> {w.data.waves}</span>}
                {w.data.temp && <span><i className="fas fa-thermometer-half"></i> {w.data.temp}</span>}
                {w.data.precip && <span><i className="fas fa-cloud-rain"></i> {w.data.precip}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Safety & Guidance label */}
        <div className="trip-results-label" style={{ marginTop: '0.25rem' }}>
          <i className="fas fa-shield-alt"></i> Safety &amp; Guidance
        </div>

        {/* Hazards (collapsible) */}
        {result.hazards.length > 0 && (
          <div className="trip-collapsible-section trip-hazards-section">
            <button className="trip-collapsible-trigger" onClick={() => setShowHazards(v => !v)} type="button">
              <span>
                <i className="fas fa-exclamation-triangle" style={{ color: '#D97706', marginRight: '0.4rem' }}></i>
                Hazards
                <span className="trip-collapsible-count">{result.hazards.length}</span>
              </span>
              <i className={`fas fa-chevron-down trip-collapsible-chevron${showHazards ? ' open' : ''}`}></i>
            </button>
            <div className={`trip-collapsible-body${showHazards ? ' open' : ''}`}>
              <div className="trip-collapsible-content">
                {result.hazards.map((h, i) => (
                  <div key={i} className="trip-hazard-item">
                    <i className="fas fa-exclamation-circle" style={{ color: '#D97706', marginRight: '0.4rem', fontSize: '0.8rem', flexShrink: 0 }}></i>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations (collapsible) */}
        {result.recommendations.length > 0 && (
          <div className="trip-collapsible-section trip-recs-section">
            <button className="trip-collapsible-trigger" onClick={() => setShowRecs(v => !v)} type="button">
              <span>
                <i className="fas fa-lightbulb" style={{ color: '#1B8BEB', marginRight: '0.4rem' }}></i>
                Recommendations
                <span className="trip-collapsible-count">{result.recommendations.length}</span>
              </span>
              <i className={`fas fa-chevron-down trip-collapsible-chevron${showRecs ? ' open' : ''}`}></i>
            </button>
            <div className={`trip-collapsible-body${showRecs ? ' open' : ''}`}>
              <div className="trip-collapsible-content">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="trip-recommendation-item">
                    <i className="fas fa-arrow-right" style={{ color: '#1B8BEB', marginRight: '0.4rem', fontSize: '0.7rem', flexShrink: 0 }}></i>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alternative Times */}
        {result.alternativeTimes.length > 0 && (
          <div className="trip-section-card">
            <h4><i className="fas fa-clock" style={{ color: '#059669', marginRight: '0.4rem' }}></i> Better Alternative Times</h4>
            <div className="trip-alt-grid">
              {result.alternativeTimes.map((alt, i) => (
                <div key={i} className="trip-alt-card">
                  <div className="trip-alt-header">
                    <span className="trip-alt-label">{alt.label}</span>
                    <span className="trip-window-rating" style={{ background: getRatingBg(alt.rating), color: getRatingColor(alt.rating) }}>
                      {alt.rating}
                    </span>
                  </div>
                  <div className="trip-alt-times">
                    {formatTripDate(alt.departure)} – {formatTripDate(alt.returnBy)}
                  </div>
                  <p className="trip-alt-reason">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Notes (collapsible) */}
        {result.dataLimitations.length > 0 && (
          <div className="trip-collapsible-section trip-notes-section">
            <button className="trip-collapsible-trigger trip-collapsible-subtle" onClick={(e) => { const body = e.currentTarget.nextElementSibling; body?.classList.toggle('open'); e.currentTarget.querySelector('.trip-collapsible-chevron')?.classList.toggle('open'); }} type="button">
              <span>
                <i className="fas fa-info-circle" style={{ color: '#94a3b8', marginRight: '0.4rem' }}></i>
                Data Notes
                <span className="trip-collapsible-count">{result.dataLimitations.length}</span>
              </span>
              <i className="fas fa-chevron-down trip-collapsible-chevron"></i>
            </button>
            <div className="trip-collapsible-body">
              <div className="trip-collapsible-content">
                {result.dataLimitations.map((note, i) => (
                  <div key={i} className="trip-data-note">
                    <i className="fas fa-info-circle" style={{ color: '#94a3b8', marginRight: '0.35rem', fontSize: '0.75rem', flexShrink: 0 }}></i>
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="trip-disclaimer">
          <p>
            {result.isAiGenerated ? 'AI-generated analysis' : 'Rule-based analysis'} · Updated {new Date(result.generatedAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })} ET
          </p>
          <p style={{ marginTop: '0.35rem' }}>
            This analysis is for informational purposes only. Always check official marine forecasts, monitor VHF Channel 16, and use your own judgment before heading out on the water.
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading Screen ────────────────────────────────────────────────────

  if (loading) {
    const progress = Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95);
    return (
      <div className="trip-loading-screen" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="trip-loading-card">
          {/* Boat animation */}
          <div className="trip-loading-boat-wrapper">
            <div className="trip-loading-waves">
              <div className="trip-loading-wave trip-loading-wave-1"></div>
              <div className="trip-loading-wave trip-loading-wave-2"></div>
              <div className="trip-loading-wave trip-loading-wave-3"></div>
            </div>
            <div className="trip-loading-boat">
              <i className="fas fa-ship"></i>
            </div>
          </div>

          <h3 className="trip-loading-title">Planning Your Trip</h3>
          <p className="trip-loading-subtitle">
            Cross-referencing multiple data sources for your route
          </p>

          {/* Progress bar */}
          <div className="trip-loading-progress-track">
            <div className="trip-loading-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          {/* Current step */}
          <div className="trip-loading-step" key={loadingStep}>
            <i className={`fas ${LOADING_STEPS[loadingStep].icon}`}></i>
            <span>{LOADING_STEPS[loadingStep].text}</span>
          </div>

          {/* Completed steps */}
          <div className="trip-loading-steps-done">
            {LOADING_STEPS.slice(0, loadingStep).map((step, i) => (
              <div key={i} className="trip-loading-step-done">
                <i className="fas fa-check-circle"></i>
                <span>{step.text.replace('...', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Form View ─────────────────────────────────────────────────────────

  // Filter destinations for multi-stop (exclude open-water and current stop from options)
  const multiStopDests = DESTINATIONS.filter(d => d.value !== 'open-water' && d.value !== 'lorain');

  return (
    <div className="trip-planner-form" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="trip-disclaimer-banner">
        <i className="fas fa-exclamation-triangle"></i>
        <span><strong>For informational purposes only.</strong> Lake Erie conditions can change rapidly. Always check official forecasts, monitor VHF Ch. 16, and use your own judgment.</span>
      </div>

      <div className="trip-form-card">
        {/* Trip Mode Toggle */}
        <div className="trip-form-group">
          <label>Trip Type</label>
          <div className="trip-segment-group">
            <button
              className={`trip-segment-btn${!multiStop ? ' active' : ''}`}
              onClick={() => setMultiStop(false)}
              type="button"
            >
              <i className="fas fa-anchor" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i> Single Trip
            </button>
            <button
              className={`trip-segment-btn${multiStop ? ' active' : ''}`}
              onClick={() => setMultiStop(true)}
              type="button"
            >
              <i className="fas fa-route" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i> Multi-Stop
            </button>
          </div>
        </div>

        {/* Boat Size */}
        <div className="trip-form-group">
          <label>Vessel Size</label>
          <div className="trip-segment-group">
            {([
              { value: 'small' as BoatSize, label: 'Small', sub: '< 20ft' },
              { value: 'medium' as BoatSize, label: 'Medium', sub: '20-30ft' },
              { value: 'large' as BoatSize, label: 'Large', sub: '30ft+' },
              { value: 'jetski' as BoatSize, label: 'Jet Ski', sub: 'PWC' },
            ]).map(opt => (
              <button
                key={opt.value}
                className={`trip-segment-btn${boatSize === opt.value ? ' active' : ''}`}
                onClick={() => {
                  setBoatSize(opt.value);
                  if (opt.value === 'jetski') setBoatType('powerboat');
                }}
                type="button"
              >
                {opt.label} <span className="trip-segment-sub">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Boat Type (Powerboat vs Sailboat) — only for small/medium/large */}
        {boatSize !== 'jetski' && (
          <div className="trip-form-group">
            <label>Vessel Type</label>
            <div className="trip-segment-group trip-boat-type-toggle">
              <button
                className={`trip-segment-btn${boatType === 'powerboat' ? ' active' : ''}`}
                onClick={() => setBoatType('powerboat')}
                type="button"
              >
                <i className="fas fa-ship" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i> Powerboat
              </button>
              <button
                className={`trip-segment-btn${boatType === 'sailboat' ? ' active' : ''}`}
                onClick={() => setBoatType('sailboat')}
                type="button"
              >
                <i className="fas fa-wind" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }}></i> Sailboat
              </button>
            </div>
          </div>
        )}

        {/* Planned Activities */}
        <div className="trip-form-group">
          <label>Planned Activities</label>
          <div className="trip-activity-chips">
            {(boatSize === 'jetski' ? [
              { value: 'cruising' as BoatActivity, label: 'Cruising', icon: 'fa-compass' },
              { value: 'wave-jumping' as BoatActivity, label: 'Wave Jumping', icon: 'fa-water' },
              { value: 'fishing' as BoatActivity, label: 'Fishing', icon: 'fa-fish' },
              { value: 'swimming' as BoatActivity, label: 'Swimming', icon: 'fa-swimmer' },
            ] : [
              { value: 'cruising' as BoatActivity, label: 'Cruising', icon: 'fa-compass' },
              { value: 'fishing' as BoatActivity, label: 'Fishing', icon: 'fa-fish' },
              { value: 'swimming' as BoatActivity, label: 'Swimming', icon: 'fa-swimmer' },
              { value: 'watersports' as BoatActivity, label: 'Tubing / Water Sports', icon: 'fa-skiing' },
            ]).map(act => (
              <button
                key={act.value}
                className={`trip-activity-chip${activities.includes(act.value) ? ' active' : ''}`}
                onClick={() => toggleActivity(act.value)}
                type="button"
              >
                <i className={`fas ${act.icon}`}></i> {act.label}
              </button>
            ))}
          </div>
          <div className="trip-field-hint" style={{ marginTop: '0.3rem' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '0.3rem' }}></i>
            Select all that apply — conditions are analyzed for each activity
          </div>
        </div>

        <div className="trip-form-divider" />

        {/* Experience Level */}
        <div className="trip-form-group">
          <label>Experience Level</label>
          <div className="trip-segment-group">
            {([
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'experienced', label: 'Experienced' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                className={`trip-segment-btn${experience === opt.value ? ' active' : ''}`}
                onClick={() => setExperience(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="trip-form-divider" />

        {!multiStop ? (
          <>
            {/* Single Destination */}
            <div className="trip-form-group">
              <label htmlFor="trip-destination">Destination</label>
              <select id="trip-destination" value={destination} onChange={e => setDestination(e.target.value)}>
                {DESTINATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label} — {d.distance}</option>
                ))}
              </select>
              {dest && dest.value !== 'open-water' && (
                <div className="trip-field-hint">
                  <i className="fas fa-info-circle" style={{ marginRight: '0.3rem' }}></i>
                  {formatTransitTime(getTransitMinutes('lorain', dest.value, boatType))} transit at cruising speed ({boatType === 'sailboat' ? '~7 kts' : '~18 kts'})
                </div>
              )}
            </div>

            {/* Departure & Return */}
            <div className="trip-datetime-grid">
              <div className="trip-datetime-col">
                <div className="trip-datetime-label">
                  <i className="fas fa-arrow-right" style={{ color: '#059669', marginRight: '0.3rem', fontSize: '0.7rem' }}></i> Departure
                </div>
                <div className="trip-form-group">
                  <label htmlFor="trip-dep-date">Date</label>
                  <input type="date" id="trip-dep-date" value={depDate} onChange={e => {
                    const v = e.target.value;
                    setDepDate(v);
                    if (retDate < v) setRetDate(v);
                  }} min={getTodayStr()} />
                </div>
                <div className="trip-form-group">
                  <label htmlFor="trip-dep-time">Time</label>
                  <input type="time" id="trip-dep-time" value={depTime} onChange={e => {
                    const v = e.target.value;
                    setDepTime(v);
                    if (retDate === depDate && retTime <= v) setRetTime(v);
                  }} />
                </div>
              </div>
              <div className="trip-datetime-col">
                <div className="trip-datetime-label">
                  <i className="fas fa-arrow-left" style={{ color: '#DC2626', marginRight: '0.3rem', fontSize: '0.7rem' }}></i> Return
                </div>
                <div className="trip-form-group">
                  <label htmlFor="trip-ret-date">Date</label>
                  <input type="date" id="trip-ret-date" value={retDate} onChange={e => setRetDate(e.target.value)} min={depDate} />
                </div>
                <div className="trip-form-group">
                  <label htmlFor="trip-ret-time">Time</label>
                  <input type="time" id="trip-ret-time" value={retTime} onChange={e => setRetTime(e.target.value)} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stop-based route builder */}
            <div className="trip-route-chain">

              {/* Departure from Lorain */}
              <div className="trip-stop-card trip-stop-origin">
                <div className="trip-stop-header">
                  <div className="trip-stop-marker origin">
                    <i className="fas fa-anchor"></i>
                  </div>
                  <div className="trip-stop-title">Depart Lorain Harbor</div>
                </div>
                <div className="trip-datetime-grid">
                  <div className="trip-datetime-col">
                    <div className="trip-form-group">
                      <label>Date</label>
                      <input type="date" value={depDate} onChange={e => {
                        const v = e.target.value;
                        setDepDate(v);
                        setStops(prev => prev.map(s => s.departureDate < v ? { ...s, departureDate: v } : s));
                      }} min={getTodayStr()} />
                    </div>
                  </div>
                  <div className="trip-datetime-col">
                    <div className="trip-form-group">
                      <label>Time</label>
                      <input type="time" value={depTime} onChange={e => {
                        const v = e.target.value;
                        setDepTime(v);
                        setStops(prev => prev.map(s => s.departureDate === depDate && s.departureTime < v ? { ...s, departureTime: v } : s));
                      }} />
                    </div>
                  </div>
                </div>
                <div className="trip-chain-transit-hint">
                  <i className="fas fa-ship" style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}></i>
                  {formatTransitTime(getTransitMinutes('lorain', stops[0].destination, boatType))} to {getDestLabel(stops[0].destination)}
                </div>
              </div>

              {/* Stops */}
              {stops.map((stop, i) => {
                const nextDest = i < stops.length - 1 ? stops[i + 1].destination : 'lorain';
                const nextLabel = i < stops.length - 1 ? getDestLabel(nextDest) : 'Lorain Harbor';
                const transitOut = getTransitMinutes(stop.destination, nextDest, boatType);

                return (
                  <div key={i} className="trip-stop-card">
                    <div className="trip-stop-header">
                      <div className="trip-stop-marker stop">
                        <span>{i + 1}</span>
                      </div>
                      <div className="trip-stop-title">Stop {i + 1}</div>
                      {stops.length > 1 && (
                        <button className="trip-stop-remove" onClick={() => removeStop(i)} type="button" title="Remove stop">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    <div className="trip-form-group">
                      <label>Where are you stopping?</label>
                      <select value={stop.destination} onChange={e => updateStop(i, 'destination', e.target.value)}>
                        {multiStopDests.map(d => (
                          <option key={d.value} value={d.value}>{d.label} — {d.distance}</option>
                        ))}
                      </select>
                    </div>

                    <div className="trip-stop-depart-label">
                      When are you leaving {getDestLabel(stop.destination)}?
                    </div>
                    <div className="trip-datetime-grid">
                      <div className="trip-datetime-col">
                        <div className="trip-form-group">
                          <label>Date</label>
                          <input type="date" value={stop.departureDate} onChange={e => updateStop(i, 'departureDate', e.target.value)} min={i === 0 ? depDate : stops[i - 1].departureDate} />
                        </div>
                      </div>
                      <div className="trip-datetime-col">
                        <div className="trip-form-group">
                          <label>Time</label>
                          <input type="time" value={stop.departureTime} onChange={e => updateStop(i, 'departureTime', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="trip-chain-transit-hint">
                      <i className="fas fa-ship" style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}></i>
                      {formatTransitTime(transitOut)} to {nextLabel}
                    </div>
                  </div>
                );
              })}

              {/* Add Stop button */}
              {stops.length < 4 && (
                <button className="trip-add-stop-btn" onClick={addStop} type="button">
                  <i className="fas fa-plus-circle" style={{ marginRight: '0.35rem' }}></i> Add Stop
                </button>
              )}

              {/* Return to Lorain */}
              <div className="trip-stop-card trip-stop-return">
                <div className="trip-stop-header">
                  <div className="trip-stop-marker origin">
                    <i className="fas fa-flag-checkered"></i>
                  </div>
                  <div className="trip-stop-title">Return to Lorain Harbor</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="trip-error">
            <i className="fas fa-exclamation-circle" style={{ marginRight: '0.35rem' }}></i> {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="trip-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.4rem' }}></i>
              Analyzing conditions...
            </>
          ) : (
            <>
              <i className="fas fa-compass" style={{ marginRight: '0.4rem' }}></i>
              Analyze Trip Conditions
            </>
          )}
        </button>
      </div>
    </div>
  );
}
