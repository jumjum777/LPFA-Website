'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const VIDEOS = [
  {
    id: '2025',
    year: '2025',
    view: 'Port Lorain & Black River Landing',
    src: 'https://www.youtube.com/embed/C95DZJIQ0tg',
    icon: 'fa-star',
  },
  {
    id: '2024-brl',
    year: '2024',
    view: 'Black River Landing',
    src: 'https://www.youtube.com/embed/1PVTT6nwkEE',
    icon: 'fa-water',
  },
  {
    id: '2024-port',
    year: '2024',
    view: 'Port Lorain',
    src: 'https://www.youtube.com/embed/w2myk92HTBQ',
    icon: 'fa-anchor',
  },
  {
    id: '2023',
    year: '2023',
    view: 'Port Lorain',
    src: 'https://www.youtube.com/embed/IcMqIG9nX8Q',
    icon: 'fa-star',
  },
  {
    id: '2022',
    year: '2022',
    view: 'Port Lorain',
    src: 'https://www.youtube.com/embed/a4UgePcxCeg',
    icon: 'fa-star',
  },
];

function videoSrc(base: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  return `${base}?${params}`;
}

export default function FireworksClient() {
  const [selected, setSelected] = useState(VIDEOS[0].id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = VIDEOS.find(v => v.id === selected) || VIDEOS[0];

  const toggleFullscreen = useCallback(() => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div className="livecam-viewer">
      {/* Tab buttons */}
      <div className="livecam-tabs">
        {VIDEOS.map((v) => (
          <button
            key={v.id}
            className={`livecam-tab fireworks-tab${selected === v.id ? ' active' : ''}`}
            onClick={() => setSelected(v.id)}
          >
            <span className="fireworks-tab-year">{v.year}</span>
            <span className="fireworks-tab-view">{v.view}</span>
          </button>
        ))}
      </div>

      {/* Video player */}
      <div className="livecam-main" ref={wrapRef}>
        <div className="livecam-frame-wrap">
          <iframe
            key={active.id}
            src={videoSrc(active.src)}
            title={`July 4th Fireworks ${active.year} — ${active.view}`}
            className="livecam-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="livecam-overlay-bar">
            <div className="livecam-overlay-left">
              <span className="fireworks-year-badge">
                <i className="fas fa-film"></i> {active.year} — {active.view}
              </span>
            </div>
            <button className="livecam-fs-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
