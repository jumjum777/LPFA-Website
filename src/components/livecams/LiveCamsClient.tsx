'use client';

import { useState, useRef, useCallback } from 'react';

const CAMS = [
  {
    id: 'lake-erie',
    label: 'Lake Erie View',
    desc: 'Looking north over Lake Erie from Lorain\u2019s waterfront',
    src: 'https://www.youtube.com/embed/1MVB3fgg7kg?autoplay=1&mute=1&rel=0',
    icon: 'fa-water',
  },
  {
    id: 'black-river',
    label: 'Black River View',
    desc: 'Looking over the Black River and Lorain harbor',
    src: 'https://www.youtube.com/embed/ZZevIUr2cTk?autoplay=1&mute=1&rel=0',
    icon: 'fa-ship',
  },
];

export default function LiveCamsClient() {
  const [activeCam, setActiveCam] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <div className="livecam-viewer">
      {/* Cam selector tabs */}
      <div className="livecam-tabs">
        {CAMS.map((cam, i) => (
          <button
            key={cam.id}
            className={`livecam-tab${activeCam === i ? ' active' : ''}`}
            onClick={() => setActiveCam(i)}
          >
            <i className={`fas ${cam.icon}`}></i>
            <span>{cam.label}</span>
            <span className="livecam-tab-dot"></span>
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="livecam-main" ref={wrapRef}>
        <div className="livecam-frame-wrap">
          <iframe
            key={CAMS[activeCam].id}
            src={CAMS[activeCam].src}
            title={CAMS[activeCam].label}
            className="livecam-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="livecam-overlay-bar">
            <div className="livecam-overlay-left">
              <span className="livecam-live-badge"><span className="livecam-live-dot"></span> LIVE</span>
              <span className="livecam-cam-label">{CAMS[activeCam].label}</span>
            </div>
            <button className="livecam-fs-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
        </div>
        <p className="livecam-desc">{CAMS[activeCam].desc}</p>
      </div>

      {/* Thumbnail strip */}
      <div className="livecam-thumbs">
        {CAMS.map((cam, i) => (
          <button
            key={cam.id}
            className={`livecam-thumb${activeCam === i ? ' active' : ''}`}
            onClick={() => setActiveCam(i)}
          >
            <div className="livecam-thumb-preview">
              <iframe
                src={cam.src.replace('autoplay=1', 'autoplay=0')}
                title={cam.label}
                tabIndex={-1}
                loading="lazy"
              />
              <div className="livecam-thumb-overlay">
                {activeCam === i && <span className="livecam-live-dot"></span>}
              </div>
            </div>
            <span>{cam.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
