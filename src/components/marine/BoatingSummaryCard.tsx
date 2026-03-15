'use client';

import { useState, useEffect } from 'react';

interface BoatingSummary {
  rating: string;
  summary: string;
  bestTimes: string;
  hazards: string[];
  isAiGenerated: boolean;
  generatedAt: string;
}

export default function BoatingSummaryCard() {
  const [data, setData] = useState<BoatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Auto-generate on mount
  useEffect(() => {
    fetch('/api/boating-summary')
      .then(r => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="boating-summary-card">
        <div className="boating-summary-toggle">
          <div className="boating-summary-header">
            <div className="boating-summary-title">
              <i className="fas fa-compass"></i>
              <h2>Today&apos;s Boating Conditions</h2>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.4rem' }}></i>
            Generating conditions report...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boating-summary-card">
        <div className="boating-summary-toggle">
          <div className="boating-summary-header">
            <div className="boating-summary-title">
              <i className="fas fa-compass"></i>
              <h2>Today&apos;s Boating Conditions</h2>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0 0' }}>
            Unable to load conditions report.
          </p>
        </div>
      </div>
    );
  }

  const updatedTime = new Date(data.generatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });

  return (
    <div className="boating-summary-card">
      <div className="boating-summary-toggle" style={{ cursor: 'default' }}>
        <div className="boating-summary-header">
          <div className="boating-summary-title">
            <i className="fas fa-compass"></i>
            <h2>Today&apos;s Boating Conditions</h2>
          </div>
          <div className="boating-summary-header-right">
            <span className={`boating-summary-rating rating-${data.rating.toLowerCase()}`}>
              {data.rating}
            </span>
          </div>
        </div>
        <p className="boating-summary-preview">
          {data.summary}
        </p>
        <button
          className="boating-summary-cta"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          {expanded ? 'View Less' : 'View More'}
        </button>
      </div>

      <div className={`boating-summary-body ${expanded ? 'expanded' : ''}`}>
        <div className="boating-summary-body-inner">
          {data.bestTimes && (
            <div className="boating-summary-best-time">
              <i className="fas fa-clock"></i>
              <span>{data.bestTimes}</span>
            </div>
          )}
          {data.hazards.length > 0 && (
            <div className="boating-summary-hazards">
              {data.hazards.map((hazard, i) => (
                <div key={i} className="boating-hazard-item">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{hazard}</span>
                </div>
              ))}
            </div>
          )}
          <p className="boating-summary-disclaimer">
            <i className="fas fa-info-circle"></i>
            Lake Erie conditions can change rapidly and without notice. This is an estimated summary based on available data and should not be used as a sole source for safety decisions. Always check official forecasts, monitor conditions, and plan accordingly before heading out on the water.
          </p>
          <div className="boating-summary-footer">
            <span>{data.isAiGenerated ? 'AI-generated summary' : 'Automated summary based on current data readings'}</span>
            <span>Updated {updatedTime} ET</span>
          </div>
        </div>
      </div>
    </div>
  );
}
