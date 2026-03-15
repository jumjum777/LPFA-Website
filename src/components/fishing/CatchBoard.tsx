'use client';

import { useState, useMemo } from 'react';
import { SPECIES, BITE_RATINGS } from '@/lib/fishing';
import type { FishingCatch } from '@/lib/fishing';

interface Props {
  catches: FishingCatch[];
  loaded: boolean;
  onSwitchToSubmit: () => void;
}

function getSpeciesColor(speciesId: string): string {
  return SPECIES.find(s => s.id === speciesId)?.color || '#64748b';
}

function getSpeciesName(speciesId: string): string {
  return SPECIES.find(s => s.id === speciesId)?.name || speciesId;
}

function getSpeciesIcon(speciesId: string): string {
  return SPECIES.find(s => s.id === speciesId)?.icon || 'fa-fish';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getBiteLabel(rating: number | null | undefined): string {
  if (!rating) return '';
  return BITE_RATINGS.find(r => r.value === rating)?.label.split(' — ')[1] || '';
}

export default function CatchBoard({ catches, loaded, onSwitchToSubmit }: Props) {
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'biggest'>('newest');
  const [showStats, setShowStats] = useState(false);

  const filtered = useMemo(() => {
    let items = [...catches];
    if (filterSpecies !== 'all') {
      items = items.filter(c => c.species === filterSpecies);
    }
    if (sortBy === 'biggest') {
      items.sort((a, b) => (b.weight_lbs || 0) - (a.weight_lbs || 0));
    }
    return items;
  }, [catches, filterSpecies, sortBy]);

  // Leaderboard — biggest catch per species this season
  const leaderboard = useMemo(() => {
    const year = new Date().getFullYear();
    const thisYear = catches.filter(c => c.catch_date.startsWith(String(year)));
    const leaders: Record<string, FishingCatch> = {};
    for (const c of thisYear) {
      if (c.weight_lbs && (!leaders[c.species] || c.weight_lbs > (leaders[c.species].weight_lbs || 0))) {
        leaders[c.species] = c;
      }
    }
    return Object.values(leaders).sort((a, b) => (b.weight_lbs || 0) - (a.weight_lbs || 0));
  }, [catches]);

  // Species that appear in catches (for filter dropdown)
  const speciesInCatches = useMemo(() => {
    const ids = new Set(catches.map(c => c.species));
    return SPECIES.filter(s => ids.has(s.id));
  }, [catches]);

  // Analytics: Popular spots
  const spotStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of catches) {
      const loc = c.location_name || 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [catches]);

  // Analytics: Species breakdown
  const speciesStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of catches) counts[c.species] = (counts[c.species] || 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [catches]);

  // Analytics: Bait popularity
  const baitStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of catches) {
      if (c.bait_used) counts[c.bait_used] = (counts[c.bait_used] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [catches]);

  // Analytics: Method breakdown
  const methodStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of catches) {
      if (c.fishing_method) counts[c.fishing_method] = (counts[c.fishing_method] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [catches]);

  if (!loaded) {
    return <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Loading catch reports...</p>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Filter Bar */}
      <div className="fish-filter-bar">
        <div className="fish-filter-group">
          <label htmlFor="fish-filter-species">Species</label>
          <select id="fish-filter-species" value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}>
            <option value="all">All Species</option>
            {speciesInCatches.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        </div>
        <div className="fish-filter-group">
          <label htmlFor="fish-filter-sort">Sort</label>
          <select id="fish-filter-sort" value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'biggest')}>
            <option value="newest">Newest First</option>
            <option value="biggest">Biggest First</option>
          </select>
        </div>
        <button className="fish-submit-link" onClick={onSwitchToSubmit}>
          <i className="fas fa-plus-circle" style={{ marginRight: '0.35rem' }}></i> Report Your Catch
        </button>
      </div>

      {/* Catch Cards */}
      {filtered.length === 0 ? (
        <div className="fish-empty-state">
          <i className="fas fa-fish" style={{ fontSize: '2.5rem', color: 'var(--gray-300)', marginBottom: '1rem' }}></i>
          <p style={{ fontWeight: 600 }}>No catches yet!</p>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Be the first to share your catch.
          </p>
          <button className="fish-submit-link" onClick={onSwitchToSubmit} style={{ marginTop: '1rem' }}>
            <i className="fas fa-plus-circle" style={{ marginRight: '0.35rem' }}></i> Report a Catch
          </button>
        </div>
      ) : (
        <div className="fish-catch-grid">
          {filtered.map(c => (
            <div key={c.id} className="fish-catch-card">
              {/* Species icon instead of photo */}
              <div className="fish-catch-icon-area" style={{ background: `${getSpeciesColor(c.species)}15` }}>
                <i className={`fas ${getSpeciesIcon(c.species)}`} style={{ fontSize: '1.8rem', color: getSpeciesColor(c.species) }}></i>
              </div>
              <div className="fish-catch-body">
                <div className="fish-catch-species">
                  <span className="fish-catch-species-dot" style={{ background: getSpeciesColor(c.species) }}></span>
                  {getSpeciesName(c.species)}
                </div>
                <div className="fish-catch-stats">
                  {c.weight_lbs && <span>{c.weight_lbs} lbs</span>}
                  {c.weight_lbs && c.length_inches && <span className="fish-catch-divider">/</span>}
                  {c.length_inches && <span>{c.length_inches}&quot;</span>}
                  {c.quantity_kept != null && c.quantity_kept > 0 && (
                    <span className="fish-catch-qty">x{c.quantity_kept} kept</span>
                  )}
                </div>

                {/* Structured data tags */}
                <div className="fish-catch-tags">
                  {c.bait_used && (
                    <span className="fish-catch-tag">
                      <i className="fas fa-worm" style={{ marginRight: '0.2rem' }}></i>{c.bait_used}
                    </span>
                  )}
                  {c.fishing_method && (
                    <span className="fish-catch-tag">
                      <i className="fas fa-anchor" style={{ marginRight: '0.2rem' }}></i>{c.fishing_method}
                    </span>
                  )}
                  {c.depth_range && (
                    <span className="fish-catch-tag">
                      <i className="fas fa-arrows-alt-v" style={{ marginRight: '0.2rem' }}></i>{c.depth_range}
                    </span>
                  )}
                </div>

                {/* Bite rating */}
                {c.bite_rating && (
                  <div className="fish-catch-bite">
                    <span className="fish-bite-stars">
                      {[1, 2, 3, 4, 5].map(n => (
                        <i key={n} className={`fas fa-circle${n <= c.bite_rating! ? '' : ' fish-bite-star-empty'}`} style={{ fontSize: '0.45rem', color: n <= c.bite_rating! ? '#D97706' : '#e2e8f0' }}></i>
                      ))}
                    </span>
                    <span className="fish-bite-text">{getBiteLabel(c.bite_rating)}</span>
                  </div>
                )}

                <div className="fish-catch-location">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem', fontSize: '0.7rem' }}></i>
                  {c.location_name}
                </div>
                <div className="fish-catch-meta">
                  <span>{formatDate(c.catch_date)}</span>
                  <span className="fish-catch-angler">&mdash; {c.display_name || c.angler_name || 'Angler'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="fish-leaderboard">
          <h3 className="fish-leaderboard-title">
            <i className="fas fa-trophy" style={{ color: '#D97706', marginRight: '0.4rem' }}></i>
            {new Date().getFullYear()} Season Leaderboard
          </h3>
          <div className="fish-leaderboard-table-wrap">
            <table className="fish-leaderboard-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Species</th>
                  <th>Angler</th>
                  <th>Weight</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, i) => (
                  <tr key={c.id}>
                    <td className="fish-lb-rank">{i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `#${i + 1}`}</td>
                    <td>
                      <span className="fish-catch-species-dot" style={{ background: getSpeciesColor(c.species), marginRight: '0.35rem' }}></span>
                      {getSpeciesName(c.species)}
                    </td>
                    <td>{c.display_name || c.angler_name || 'Angler'}</td>
                    <td style={{ fontWeight: 600 }}>{c.weight_lbs} lbs</td>
                    <td>{formatDate(c.catch_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Community Stats */}
      {catches.length > 0 && (
        <div className="fish-stats-section">
          <button className="fish-stats-toggle" onClick={() => setShowStats(!showStats)}>
            <span>
              <i className="fas fa-chart-bar" style={{ color: 'var(--gold)', marginRight: '0.4rem' }}></i>
              Community Fishing Stats
            </span>
            <i className={`fas fa-chevron-${showStats ? 'up' : 'down'}`} style={{ color: '#94a3b8', fontSize: '0.75rem' }}></i>
          </button>

          {showStats && (
            <div className="fish-stats-body">
              {/* Summary cards */}
              <div className="fish-stats-summary">
                <div className="fish-stat-card">
                  <div className="fish-stat-value">{catches.length}</div>
                  <div className="fish-stat-label">Total Catches</div>
                </div>
                <div className="fish-stat-card">
                  <div className="fish-stat-value">{new Set(catches.map(c => c.angler_name)).size}</div>
                  <div className="fish-stat-label">Anglers</div>
                </div>
                <div className="fish-stat-card">
                  <div className="fish-stat-value">{speciesInCatches.length}</div>
                  <div className="fish-stat-label">Species</div>
                </div>
                <div className="fish-stat-card">
                  <div className="fish-stat-value">
                    {catches.filter(c => c.bite_rating).length > 0
                      ? (catches.filter(c => c.bite_rating).reduce((sum, c) => sum + (c.bite_rating || 0), 0) / catches.filter(c => c.bite_rating).length).toFixed(1)
                      : '--'}
                  </div>
                  <div className="fish-stat-label">Avg Bite Rating</div>
                </div>
              </div>

              {/* Popular Spots */}
              {spotStats.length > 0 && (
                <div className="fish-chart-section">
                  <h4 className="fish-chart-title">
                    <i className="fas fa-map-marker-alt"></i> Popular Spots
                  </h4>
                  <div className="fish-chart-bars">
                    {spotStats.map(([name, count]) => (
                      <div key={name} className="fish-bar-row">
                        <span className="fish-bar-label">{name}</span>
                        <div className="fish-bar-track">
                          <div
                            className="fish-bar-fill"
                            style={{ width: `${(count / spotStats[0][1]) * 100}%`, background: 'var(--blue-accent)' }}
                          ></div>
                        </div>
                        <span className="fish-bar-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Species Breakdown */}
              {speciesStats.length > 0 && (
                <div className="fish-chart-section">
                  <h4 className="fish-chart-title">
                    <i className="fas fa-fish"></i> Species Breakdown
                  </h4>
                  <div className="fish-chart-bars">
                    {speciesStats.map(([id, count]) => (
                      <div key={id} className="fish-bar-row">
                        <span className="fish-bar-label">
                          <span className="fish-catch-species-dot" style={{ background: getSpeciesColor(id), marginRight: '0.35rem' }}></span>
                          {getSpeciesName(id)}
                        </span>
                        <div className="fish-bar-track">
                          <div
                            className="fish-bar-fill"
                            style={{ width: `${(count / speciesStats[0][1]) * 100}%`, background: getSpeciesColor(id) }}
                          ></div>
                        </div>
                        <span className="fish-bar-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bait & Method side by side */}
              <div className="fish-chart-row">
                {baitStats.length > 0 && (
                  <div className="fish-chart-section">
                    <h4 className="fish-chart-title">
                      <i className="fas fa-worm"></i> Top Baits
                    </h4>
                    <div className="fish-chart-bars">
                      {baitStats.map(([name, count]) => (
                        <div key={name} className="fish-bar-row">
                          <span className="fish-bar-label">{name}</span>
                          <div className="fish-bar-track">
                            <div
                              className="fish-bar-fill"
                              style={{ width: `${(count / baitStats[0][1]) * 100}%`, background: '#D97706' }}
                            ></div>
                          </div>
                          <span className="fish-bar-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {methodStats.length > 0 && (
                  <div className="fish-chart-section">
                    <h4 className="fish-chart-title">
                      <i className="fas fa-anchor"></i> Fishing Methods
                    </h4>
                    <div className="fish-chart-bars">
                      {methodStats.map(([name, count]) => (
                        <div key={name} className="fish-bar-row">
                          <span className="fish-bar-label">{name}</span>
                          <div className="fish-bar-track">
                            <div
                              className="fish-bar-fill"
                              style={{ width: `${(count / methodStats[0][1]) * 100}%`, background: '#059669' }}
                            ></div>
                          </div>
                          <span className="fish-bar-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
