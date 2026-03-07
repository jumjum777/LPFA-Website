'use client';

import { Fragment, useRef, useState } from 'react';

interface HourlyPeriod {
  startTime: string;
  temperature: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  precipChance: number | null;
}

function formatHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HourlyForecastTable({ hourly }: { hourly: HourlyPeriod[] }) {
  const [showAll, setShowAll] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const visible = showAll ? hourly.slice(0, 24) : hourly.slice(0, 12);

  if (hourly.length === 0) return null;

  let lastDay = '';

  return (
    <div ref={tableRef}>
      <div style={{ overflowX: 'auto' }}>
        <table className="marine-hourly-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Temp</th>
              <th>Wind</th>
              <th>Precip</th>
              <th>Conditions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((h, i) => {
              const day = formatDay(h.startTime);
              const showDayRow = day !== lastDay;
              lastDay = day;
              return (
                <Fragment key={i}>
                  {showDayRow && (
                    <tr className="marine-hourly-day-row">
                      <td colSpan={5}><strong>{day}</strong></td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 600 }}>{formatHour(h.startTime)}</td>
                    <td>{h.temperature}&deg;F</td>
                    <td>{h.windDirection} {h.windSpeed}</td>
                    <td>{h.precipChance !== null ? `${h.precipChance}%` : '--'}</td>
                    <td>{h.shortForecast}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {hourly.length > 12 && (
        <button
          className="btn btn-outline btn-sm"
          style={{ marginTop: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          onClick={() => {
            if (showAll) {
              setShowAll(false);
              setTimeout(() => {
                tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            } else {
              setShowAll(true);
            }
          }}
        >
          {showAll ? 'Show Less' : 'Show 24 Hours'}
        </button>
      )}
    </div>
  );
}
