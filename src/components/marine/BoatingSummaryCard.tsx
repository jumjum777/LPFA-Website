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
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/boating-summary')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="boating-summary-card">
        <div className="boating-summary-toggle boating-summary-loading">
          <div className="boating-summary-header">
            <div className="boating-summary-title">
              <i className="fas fa-compass"></i>
              <h2>Today&apos;s Boating Conditions</h2>
            </div>
            <div className="boating-summary-header-right">
              <span className="boating-summary-rating-skeleton"></span>
            </div>
          </div>
          <p className="boating-summary-preview-skeleton">&nbsp;</p>
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
      <button
        className="boating-summary-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
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
        <p className={`boating-summary-preview ${expanded ? 'hidden' : ''}`}>
          {data.summary}
        </p>
        <span className="boating-summary-cta">
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          {expanded ? 'Hide Report' : 'View Full Report'}
        </span>
      </button>

      <div className={`boating-summary-body ${expanded ? 'expanded' : ''}`}>
        <div className="boating-summary-body-inner">
          <p className="boating-summary-text">{data.summary}</p>
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
