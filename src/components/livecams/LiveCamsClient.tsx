'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const CAMS = [
  {
    id: 'lake-erie',
    label: 'Lake Erie View',
    desc: 'Looking north over Lake Erie from Lorain\u2019s waterfront',
    src: 'https://www.youtube.com/embed/1MVB3fgg7kg',
    icon: 'fa-water',
  },
  {
    id: 'black-river',
    label: 'Black River Landing View',
    desc: 'A northward view from Black River Landing, featuring the permanent stage where Rockin\u2019 on the River concerts and community events take place, with the iconic Charles Berry Bascule Bridge in the background \u2014 the second largest bascule bridge in the world.',
    src: 'https://www.youtube.com/embed/ZZevIUr2cTk',
    icon: 'fa-ship',
  },
];

type ViewMode = 'lake-erie' | 'black-river' | 'auto' | 'side-by-side';

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'lake-erie', label: 'Lake Erie View', icon: 'fa-water' },
  { id: 'black-river', label: 'Black River Landing View', icon: 'fa-ship' },
  { id: 'auto', label: 'Auto Rotate', icon: 'fa-sync-alt' },
  { id: 'side-by-side', label: 'Side by Side', icon: 'fa-columns' },
];

/** Build iframe src with params that suppress all YouTube UI chrome */
function camSrc(base: string, autoplay = true) {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '1',
    rel: '0',
    controls: '0',
    modestbranding: '1',
    showinfo: '0',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    playsinline: '1',
  });
  return `${base}?${params}`;
}

export default function LiveCamsClient() {
  const [view, setView] = useState<ViewMode>('lake-erie');
  const [rotateIndex, setRotateIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Auto-rotate every 30s — swap iframe src without any visible transition overlay
  useEffect(() => {
    if (view !== 'auto') return;
    const interval = setInterval(() => {
      setRotateIndex(prev => (prev + 1) % CAMS.length);
    }, 30_000);
    return () => clearInterval(interval);
  }, [view]);

  // Reset rotate index when entering auto mode
  useEffect(() => {
    if (view === 'auto') setRotateIndex(0);
  }, [view]);

  const toggleFullscreen = useCallback(() => {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Determine which cam(s) to show
  const activeCamIndex = view === 'lake-erie' ? 0
    : view === 'black-river' ? 1
    : rotateIndex;
  const activeCam = CAMS[activeCamIndex];

  return (
    <div className="livecam-viewer">
      {/* View mode selector */}
      <div className="livecam-tabs">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`livecam-tab${view === opt.id ? ' active' : ''}`}
            onClick={() => setView(opt.id)}
          >
            <i className={`fas ${opt.icon}`}></i>
            <span>{opt.label}</span>
            {opt.id !== 'auto' && opt.id !== 'side-by-side' && (
              <span className="livecam-tab-dot"></span>
            )}
            {opt.id === 'auto' && view === 'auto' && (
              <span className="livecam-tab-dot"></span>
            )}
          </button>
        ))}
      </div>

      {/* Single cam view (Lake Erie, Black River, or Auto Rotate) */}
      {view !== 'side-by-side' && (
        <div className="livecam-main" ref={wrapRef}>
          <div className="livecam-frame-wrap">
            {/* Use key to swap iframes cleanly without transition overlays */}
            <iframe
              key={activeCam.id}
              src={camSrc(activeCam.src)}
              title={activeCam.label}
              className="livecam-frame"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="livecam-overlay-bar">
              <div className="livecam-overlay-left">
                <span className="livecam-live-badge"><span className="livecam-live-dot"></span> LIVE</span>
                <span className="livecam-cam-label">{activeCam.label}</span>
                {view === 'auto' && (
                  <span className="livecam-rotate-badge">
                    <i className="fas fa-sync-alt"></i> Auto
                  </span>
                )}
              </div>
              <button className="livecam-fs-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </button>
            </div>
          </div>
          <p className="livecam-desc">{activeCam.desc}</p>
        </div>
      )}

      {/* Side by side view */}
      {view === 'side-by-side' && (
        <div className="livecam-side-by-side">
          {CAMS.map((cam) => (
            <div key={cam.id} className="livecam-sbs-card">
              <div className="livecam-sbs-frame">
                <iframe
                  src={camSrc(cam.src)}
                  title={cam.label}
                  className="livecam-frame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="livecam-sbs-label">
                <span className="livecam-live-dot"></span>
                <i className={`fas ${cam.icon}`}></i>
                <span>{cam.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
