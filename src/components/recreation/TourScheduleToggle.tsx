'use client';

import { useState } from 'react';

interface TourScheduleToggleProps {
  label: string;
  children: React.ReactNode;
}

export default function TourScheduleToggle({ label, children }: TourScheduleToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`tour-schedule${isOpen ? ' open' : ''}`}>
      <button
        className="tour-schedule-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          <i className="fas fa-calendar-alt" style={{ marginRight: '0.4rem' }}></i> {label}
        </span>
        <i className="fas fa-chevron-down"></i>
      </button>
      <div className="tour-schedule-body">
        {children}
      </div>
    </div>
  );
}
