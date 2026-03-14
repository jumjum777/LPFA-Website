'use client';

import { SPECIES, getCurrentSeason } from '@/lib/fishing';

interface Props {
  nearshoreTemp: number | null;
  offshoreTemp: number | null;
  month: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ZONE_LABELS: Record<string, { label: string; icon: string }> = {
  nearshore: { label: 'Nearshore', icon: 'fa-water' },
  offshore: { label: 'Offshore', icon: 'fa-ship' },
  tributary: { label: 'Tributaries', icon: 'fa-stream' },
  pier: { label: 'Pier', icon: 'fa-anchor' },
  harbor: { label: 'Harbor', icon: 'fa-anchor' },
  'river-mouth': { label: 'River Mouth', icon: 'fa-water' },
};

export default function SpeciesGuide({ nearshoreTemp, offshoreTemp, month }: Props) {
  return (
    <div>
      <div className="section-header center">
        <div className="section-label">Lake Erie / Lorain &mdash; {MONTH_NAMES[month - 1]}</div>
        <h2 className="section-title">Species Guide</h2>
      </div>

      <div className="sg-grid">
        {SPECIES.map((species) => {
          const season = getCurrentSeason(species, month);
          const waterTemp = season?.tempSource === 'offshore' ? offshoreTemp : nearshoreTemp;
          const zoneInfo = season ? ZONE_LABELS[season.zone] : null;
          const isInSeason = !!season;

          // Collect all active months for this species (deduplicated, sorted)
          const allMonths = new Set<number>();
          species.seasonalProfiles.forEach(p => p.months.forEach(m => allMonths.add(m)));
          const sortedMonths = Array.from(allMonths).sort((a, b) => a - b);

          return (
            <div key={species.id} className={`sg-card${isInSeason ? '' : ' sg-card-off'}`}>
              {/* Header */}
              <div className="sg-header">
                <div className="sg-icon" style={{ background: `rgba(${hexToRgb(species.color)}, 0.12)`, color: species.color }}>
                  <i className={`fas ${species.icon}`}></i>
                </div>
                <div>
                  <h3 className="sg-name">{species.name}</h3>
                  {isInSeason && zoneInfo ? (
                    <span className="sg-zone" style={{ color: species.color, borderColor: `rgba(${hexToRgb(species.color)}, 0.3)` }}>
                      <i className={`fas ${zoneInfo.icon}`} style={{ marginRight: '0.3rem', fontSize: '0.65rem' }}></i>
                      {zoneInfo.label}
                    </span>
                  ) : (
                    <span className="sg-off-badge">
                      <i className="fas fa-snowflake" style={{ marginRight: '0.25rem', fontSize: '0.6rem' }}></i>
                      Off Season
                    </span>
                  )}
                </div>
              </div>

              {isInSeason && season ? (
                <div className="sg-body">
                  {/* Where to fish */}
                  <div className="sg-section">
                    <div className="sg-section-label"><i className="fas fa-map-marker-alt"></i> Where</div>
                    <p className="sg-section-text">{season.bestSpots}</p>
                  </div>

                  {/* Bait & Technique side by side */}
                  <div className="sg-two-col">
                    <div className="sg-section">
                      <div className="sg-section-label"><i className="fas fa-worm"></i> Bait</div>
                      <p className="sg-section-text">{season.bestBait}</p>
                    </div>
                    <div className="sg-section">
                      <div className="sg-section-label"><i className="fas fa-anchor"></i> Technique</div>
                      <p className="sg-section-text">{season.technique}</p>
                    </div>
                  </div>

                  {/* Depth & Temp inline */}
                  <div className="sg-meta">
                    <span className="sg-meta-item">
                      <i className="fas fa-arrows-alt-v"></i> {season.depthRange}
                    </span>
                    <span className="sg-meta-item">
                      <i className="fas fa-thermometer-half"></i> {species.idealTempMin}-{species.idealTempMax}&deg;F
                      {waterTemp !== null && (
                        <span className={
                          waterTemp >= species.idealTempMin && waterTemp <= species.idealTempMax
                            ? 'sg-temp-ideal'
                            : waterTemp >= species.tolerableTempMin && waterTemp <= species.tolerableTempMax
                              ? 'sg-temp-ok'
                              : 'sg-temp-cold'
                        }>
                          &nbsp;({waterTemp}&deg;F)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Expert note */}
                  <div className="sg-note">
                    <i className="fas fa-lightbulb"></i>
                    {season.notes}
                  </div>
                </div>
              ) : (
                <div className="sg-body">
                  <p className="sg-winter-text">{species.winterNote}</p>
                  <div className="sg-months">
                    {sortedMonths.map(m => (
                      <span key={m} className={`sg-month${m === month ? ' sg-month-current' : ''}`}>
                        {MONTH_NAMES[m - 1]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
