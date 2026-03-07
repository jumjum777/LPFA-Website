'use client';

import { useState } from 'react';

interface MarineTextPeriod {
  title: string;
  body: string;
}

export default function MarineZoneAccordion({ periods }: { periods: MarineTextPeriod[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (periods.length === 0) return null;

  return (
    <div className="marine-zone-accordion">
      {periods.map((p, i) => (
        <div key={i} className={`mza-item${openIndex === i ? ' open' : ''}`}>
          <button
            className="mza-header"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span className="mza-title">{p.title}</span>
            <i className={`fas fa-chevron-down mza-icon${openIndex === i ? ' rotated' : ''}`}></i>
          </button>
          <div className="mza-body" style={{ display: openIndex === i ? 'block' : 'none' }}>
            {p.body}
          </div>
        </div>
      ))}
    </div>
  );
}
