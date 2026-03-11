'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  onset: string;
  expires: string;
}

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'extreme': return '#B91C1C';
    case 'severe': return '#B91C1C';
    case 'moderate': return '#D97706';
    default: return '#1B8BEB';
  }
}

function getSeverityClass(severity: string) {
  switch (severity.toLowerCase()) {
    case 'extreme': return 'severity-extreme';
    case 'severe': return 'severity-severe';
    case 'moderate': return 'severity-moderate';
    default: return 'severity-minor';
  }
}

function formatAlertTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AlertsCollapsible({ alerts }: { alerts: Alert[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (alerts.length === 0) return null;

  return (
    <div className="marine-alerts-accordion" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {alerts.map((alert, i) => (
        <div key={alert.id} className={`maa-item${openIndex === i ? ' open' : ''}`}>
          <button
            className="maa-header"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span
              className="maa-severity-dot"
              style={{ background: getSeverityColor(alert.severity) }}
            ></span>
            <span className={`marine-severity-badge ${getSeverityClass(alert.severity)}`}>{alert.severity}</span>
            <span className="maa-title">{alert.event}</span>
            <i className={`fas fa-chevron-down maa-icon${openIndex === i ? ' rotated' : ''}`}></i>
          </button>
          <div className="maa-body" style={{ display: openIndex === i ? 'block' : 'none' }}>
            <p className="maa-headline">{alert.headline}</p>
            <p className="maa-description">{alert.description}</p>
            <div className="maa-meta">
              {alert.onset && <span><i className="fas fa-clock" style={{ marginRight: '0.3rem' }}></i> Onset: {formatAlertTime(alert.onset)}</span>}
              {alert.expires && <span><i className="fas fa-hourglass-end" style={{ marginRight: '0.3rem' }}></i> Expires: {formatAlertTime(alert.expires)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
