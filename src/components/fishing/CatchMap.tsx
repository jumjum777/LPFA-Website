'use client';

import { useEffect, useState } from 'react';
import { FISHING_SPOTS, SPECIES, BITE_RATINGS } from '@/lib/fishing';
import type { FishingCatch } from '@/lib/fishing';

interface Props {
  catches: FishingCatch[];
  loaded: boolean;
}

function getSpeciesName(id: string): string {
  return SPECIES.find(s => s.id === id)?.name || id;
}

function getSpeciesColor(id: string): string {
  return SPECIES.find(s => s.id === id)?.color || '#64748b';
}

function getBiteLabel(rating: number | null | undefined): string {
  if (!rating) return '';
  return BITE_RATINGS.find(r => r.value === rating)?.label || '';
}

// Dynamically import Leaflet (not SSR-compatible)
function LeafletMap({ catches }: { catches: FishingCatch[] }) {
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    import('leaflet').then(mod => {
      setL(mod.default || mod);
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !L) return;
    const leaflet = L;

    const container = document.getElementById('fish-map');
    if (!container) return;

    // Clear existing map
    container.innerHTML = '';

    const map = leaflet.map(container).setView([41.48, -82.18], 11);

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    function circleIcon(color: string, size: number = 10) {
      return leaflet.divIcon({
        className: 'fish-map-marker',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    function spotIcon() {
      return leaflet.divIcon({
        className: 'fish-map-marker',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#0B1F3A;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><i class="fas fa-map-pin" style="color:#D97706;font-size:12px;"></i></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
    }

    // Add static fishing spots
    FISHING_SPOTS.forEach(spot => {
      leaflet.marker([spot.latitude, spot.longitude], { icon: spotIcon() })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px;">
            <strong style="font-size:0.9rem;">${spot.name}</strong>
            <div style="font-size:0.78rem;color:#64748b;margin-top:0.25rem;">${spot.description}</div>
          </div>
        `);
    });

    // Add catch markers
    catches.forEach(c => {
      if (c.latitude === null || c.longitude === null) return;
      const color = getSpeciesColor(c.species);
      const name = getSpeciesName(c.species);
      const date = new Date(c.catch_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const anglerName = c.display_name || c.angler_name || 'Angler';

      // Build structured data for popup
      const tagsHtml = [
        c.bait_used ? `<span style="display:inline-block;background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:0.72rem;margin-right:3px;">${c.bait_used}</span>` : '',
        c.fishing_method ? `<span style="display:inline-block;background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:0.72rem;margin-right:3px;">${c.fishing_method}</span>` : '',
      ].filter(Boolean).join('');

      const biteHtml = c.bite_rating
        ? `<div style="font-size:0.75rem;color:#D97706;margin-top:0.15rem;">${getBiteLabel(c.bite_rating)}</div>`
        : '';

      leaflet.marker([c.latitude, c.longitude], { icon: circleIcon(color, 14) })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px;max-width:220px;">
            <strong style="color:${color};">${name}</strong>
            ${c.weight_lbs ? ` &mdash; ${c.weight_lbs} lbs` : ''}
            ${c.length_inches ? ` / ${c.length_inches}"` : ''}
            ${tagsHtml ? `<div style="margin-top:0.25rem;">${tagsHtml}</div>` : ''}
            ${biteHtml}
            <div style="font-size:0.78rem;color:#64748b;margin-top:0.15rem;">
              ${c.location_name}<br/>${date} &mdash; ${anglerName}
            </div>
          </div>
        `);
    });

    return () => { map.remove(); };
  }, [mapReady, L, catches]);

  if (!mapReady) {
    return (
      <div className="fish-map-loading">
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--blue-accent)' }}></i>
        <p>Loading map...</p>
      </div>
    );
  }

  return null;
}

export default function CatchMap({ catches, loaded }: Props) {
  const catchesWithCoords = catches.filter(c => c.latitude !== null && c.longitude !== null);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="fish-map-container">
        <div id="fish-map" className="fish-map"></div>
        <LeafletMap catches={catches} />
      </div>

      {/* Legend */}
      <div className="fish-map-legend">
        <div className="fish-map-legend-title">
          <i className="fas fa-layer-group" style={{ marginRight: '0.35rem' }}></i> Legend
        </div>
        <div className="fish-map-legend-items">
          <div className="fish-map-legend-item">
            <span className="fish-map-legend-dot" style={{ background: '#0B1F3A', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-map-pin" style={{ color: '#D97706', fontSize: '7px' }}></i>
            </span>
            Fishing Spots
          </div>
          {SPECIES.slice(0, 5).map(sp => (
            <div key={sp.id} className="fish-map-legend-item">
              <span className="fish-map-legend-dot" style={{ background: sp.color }}></span>
              {sp.name}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="fish-map-stats">
        <span><i className="fas fa-map-pin" style={{ color: '#D97706', marginRight: '0.25rem' }}></i> {FISHING_SPOTS.length} fishing spots</span>
        <span><i className="fas fa-fish" style={{ color: 'var(--blue-accent)', marginRight: '0.25rem' }}></i> {catchesWithCoords.length} mapped catches</span>
        {!loaded && <span style={{ color: '#94a3b8' }}>Loading catches...</span>}
      </div>
    </div>
  );
}
