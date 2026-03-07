'use client';

import { useEffect, useRef } from 'react';

export default function ProgressBar() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fill.classList.add('animate');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(fill);

    return () => obs.disconnect();
  }, []);

  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" ref={fillRef}></div>
    </div>
  );
}
