'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarineZoneAccordion from './MarineZoneAccordion';
import HourlyForecastTable from './HourlyForecastTable';
import AlertsCollapsible from './AlertsCollapsible';
import TripPlannerTab from './TripPlannerTab';

interface Alert { id: string; event: string; headline: string; description: string; severity: string; onset: string; expires: string; }
interface MarineTextPeriod { title: string; body: string; }
interface HourlyPeriod { startTime: string; temperature: number; windSpeed: string; windDirection: string; shortForecast: string; precipChance: number | null; }
interface ForecastPeriod { number: number; name: string; temperature: number; temperatureUnit: string; windSpeed: string; windDirection: string; shortForecast: string; isDaytime: boolean; }
interface BuoyData { windSpeed: number | null; windGust: number | null; windDirection: number | null; waveHeight: number | null; wavePeriod: number | null; waterTemp: number | null; airTemp: number | null; pressure: number | null; isOffline: boolean; }
interface VesselRecord { mmsi: string; vessel_name: string | null; destination: string | null; vessel_type: number | null; latitude: number | null; longitude: number | null; speed: number | null; heading: number | null; eta: string | null; status: string; first_detected_at?: string; last_seen_at?: string; is_active: boolean; }

type TabId = 'alerts' | 'wind' | 'vessels' | 'forecast' | 'conditions' | 'hourly' | '7day' | 'resources' | 'beach' | 'trip';

interface BeachReading { date: string; value: number | null; }
interface BeachData {
  id: string; name: string;
  latestReading: BeachReading | null;
  status: 'safe' | 'advisory' | 'no-data';
  readings: BeachReading[];
  seasonStats: { totalSamples: number; advisoryCount: number; safePct: number; };
}
interface BeachQualityResponse {
  beaches: BeachData[];
  seasonYear: number;
  isOffSeason: boolean;
  fetchedAt: string;
}

const VESSEL_TYPE_LABELS: Record<number, string> = {
  70: 'Cargo', 71: 'Cargo', 72: 'Cargo', 73: 'Cargo', 74: 'Cargo', 79: 'Cargo',
  80: 'Tanker', 81: 'Tanker', 82: 'Tanker', 83: 'Tanker', 84: 'Tanker', 89: 'Tanker',
  60: 'Passenger', 69: 'Passenger', 30: 'Fishing', 31: 'Towing', 32: 'Towing (Large)',
  33: 'Dredger', 34: 'Diving Ops', 35: 'Military Ops', 36: 'Sailing', 37: 'Pleasure Craft', 52: 'Tug',
};

function getVesselTypeLabel(type: number | null): string {
  if (!type) return 'Vessel';
  return VESSEL_TYPE_LABELS[type] || 'Vessel';
}

function formatVesselEta(eta: string | null): string {
  if (!eta) return 'N/A';
  const date = new Date(eta);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
}

function formatLastSeen(ts: string | undefined): string {
  if (!ts) return '';
  const diffMin = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'en_route': return 'En Route';
    case 'in_port': return 'In Port';
    case 'departed': return 'Departed';
    default: return status;
  }
}

function windDirLabel(deg: number | null) {
  if (deg === null) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function MarineTabs({
  alerts, marineTextPeriods, marineText, lastUpdated, buoy, hourly, forecast,
}: {
  alerts: Alert[];
  marineTextPeriods: MarineTextPeriod[];
  marineText: string | null;
  lastUpdated: string;
  buoy: BuoyData | null;
  hourly: HourlyPeriod[];
  forecast: ForecastPeriod[];
}) {
  const hasAlerts = alerts.length > 0;
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [vesselsLoaded, setVesselsLoaded] = useState(false);
  const [beachData, setBeachData] = useState<BeachQualityResponse | null>(null);
  const [beachLoaded, setBeachLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/vessels')
      .then(res => res.json())
      .then(data => { setVessels(data.vessels || []); setVesselsLoaded(true); })
      .catch(() => setVesselsLoaded(true));
    fetch('/api/beach-quality')
      .then(res => res.json())
      .then((data: BeachQualityResponse) => { setBeachData(data); setBeachLoaded(true); })
      .catch(() => setBeachLoaded(true));
  }, []);

  // Check URL hash for direct tab navigation (e.g., /marine#beach)
  const hashTab = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const validHashTab = ['alerts', 'wind', 'vessels', 'forecast', 'conditions', 'hourly', '7day', 'resources', 'beach', 'trip'].includes(hashTab) ? hashTab as TabId : null;
  const defaultTab: TabId = validHashTab || (hasAlerts ? 'alerts' : 'forecast');
  const [active, setActive] = useState<TabId>(defaultTab);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    ...(hasAlerts ? [{ id: 'alerts' as TabId, label: 'Alerts', icon: 'fa-exclamation-triangle' }] : []),
    { id: 'forecast', label: 'Marine Forecast', icon: 'fa-anchor' },
    { id: 'trip', label: 'Plan Your Trip', icon: 'fa-route' },
    { id: 'wind', label: 'Wind & Radar', icon: 'fa-wind' },
    { id: 'conditions', label: 'Offshore Conditions', icon: 'fa-water' },
    { id: 'vessels', label: 'Vessel Traffic', icon: 'fa-ship' },
    { id: 'beach', label: 'Beach Water Quality', icon: 'fa-umbrella-beach' },
    { id: 'hourly', label: 'Hourly Weather', icon: 'fa-clock' },
    { id: '7day', label: '7-Day Weather', icon: 'fa-calendar-week' },
    { id: 'resources', label: 'Boater Resources', icon: 'fa-life-ring' },
  ];

  return (
    <section className="section">
      <div className="container">
        {/* Tab buttons (desktop) */}
        <div className="marine-tabs-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`marine-tab-btn${active === tab.id ? ' active' : ''}${tab.id === 'alerts' ? ' alert-tab' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab dropdown (mobile) */}
        <div className="marine-tabs-select-wrap">
          <select
            className="marine-tabs-select"
            value={active}
            onChange={(e) => setActive(e.target.value as TabId)}
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down marine-tabs-select-icon"></i>
        </div>

        {/* Tab content */}
        <div className="marine-tab-content">
          {/* ALERTS */}
          {active === 'alerts' && hasAlerts && (
            <div>
              <div className="section-header center">
                <div className="section-label">Active Advisories</div>
                <h2 className="section-title"><i className="fas fa-exclamation-triangle" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Weather Alerts</h2>
              </div>
              <AlertsCollapsible alerts={alerts} />
            </div>
          )}

          {/* WIND & RADAR */}
          {active === 'wind' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Real-Time Wind</div>
                <h2 className="section-title"><i className="fas fa-wind" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Wind &amp; Radar</h2>
                <p className="section-desc">Live interactive wind and radar maps for the Lorain / Lake Erie area, powered by Windy.com. Click a map to interact.</p>
              </div>

              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <i className="fas fa-wind"></i>
                    <span>Live Wind Map</span>
                    <span className="dashboard-source">Windy.com</span>
                  </div>
                  <div className="dashboard-panel-frame">
                    <iframe
                      src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=kt&zoom=8&overlay=wind&product=ecmwf&level=surface&lat=41.453&lon=-82.182"
                      title="Wind Map"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                </div>
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <i className="fas fa-satellite-dish"></i>
                    <span>Weather Radar</span>
                    <span className="dashboard-source">Windy.com</span>
                  </div>
                  <div className="dashboard-panel-frame">
                    <iframe
                      src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=kt&zoom=8&overlay=radar&product=radar&level=surface&lat=41.453&lon=-82.182"
                      title="Weather Radar"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VESSEL TRAFFIC */}
          {active === 'vessels' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Port Lorain</div>
                <h2 className="section-title"><i className="fas fa-ship" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Vessel Traffic</h2>
                <p className="section-desc">Commercial vessel traffic heading to, docked at, or recently departed from Port Lorain, tracked via AIS (Automatic Identification System).</p>
              </div>
              {/* Live vessel map */}
              <div className="dashboard-panel" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-panel-header">
                  <i className="fas fa-map-marked-alt"></i>
                  <span>Live Marine Traffic Map</span>
                  <span className="dashboard-source">VesselFinder</span>
                </div>
                <div className="dashboard-panel-frame">
                  <iframe
                    src="https://www.vesselfinder.com/aismap?lat=41.453&lon=-82.182&zoom=12&width=600&height=400&names=true&mmsi=0&track=0"
                    title="Marine Traffic Map — Lorain Harbor"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>

              {!vesselsLoaded ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Loading vessel data...</p>
              ) : vessels.length === 0 ? (
                <div className="vessel-traffic-empty">
                  <i className="fas fa-water"></i>
                  <p>No vessel traffic currently reported for Port Lorain.</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Check back later — this page updates automatically when vessels set their AIS destination to Lorain.</p>
                </div>
              ) : (
                <>
                  {/* Group vessels by status */}
                  {(['in_port', 'en_route', 'departed'] as const).map(statusGroup => {
                    const groupVessels = vessels.filter(v => v.status === statusGroup);
                    if (groupVessels.length === 0) return null;
                    const groupLabels = { in_port: 'In Port', en_route: 'En Route to Lorain', departed: 'Recently Departed' };
                    const groupIcons = { in_port: 'fa-anchor', en_route: 'fa-route', departed: 'fa-arrow-right-from-bracket' };
                    return (
                      <div key={statusGroup} className="vessel-status-group">
                        <h3 className="vessel-group-heading">
                          <i className={`fas ${groupIcons[statusGroup]}`}></i> {groupLabels[statusGroup]}
                          <span className="vessel-group-count">{groupVessels.length}</span>
                        </h3>
                        <div className="vessel-traffic-grid">
                          {groupVessels.map(vessel => (
                            <div key={vessel.mmsi} className="vessel-card">
                              <div className="vessel-card-header">
                                <div className="vessel-card-icon">
                                  <i className="fas fa-ship"></i>
                                </div>
                                <div>
                                  <h3 className="vessel-card-name">{vessel.vessel_name || 'Unknown'}</h3>
                                  <span className="vessel-card-type">{getVesselTypeLabel(vessel.vessel_type)}</span>
                                </div>
                                <span className={`vessel-card-status vessel-status-${vessel.status}`}>
                                  {getStatusLabel(vessel.status)}
                                </span>
                              </div>
                              <div className="vessel-card-details">
                                {statusGroup === 'en_route' && (
                                  <div className="vessel-detail">
                                    <span className="vessel-detail-label">ETA</span>
                                    <span className="vessel-detail-value">{formatVesselEta(vessel.eta)}</span>
                                  </div>
                                )}
                                {statusGroup === 'in_port' && vessel.first_detected_at && (
                                  <div className="vessel-detail">
                                    <span className="vessel-detail-label">Arrived</span>
                                    <span className="vessel-detail-value">{formatVesselEta(vessel.first_detected_at)}</span>
                                  </div>
                                )}
                                {vessel.speed != null && vessel.speed > 0 && (
                                  <div className="vessel-detail">
                                    <span className="vessel-detail-label">Speed</span>
                                    <span className="vessel-detail-value">{vessel.speed.toFixed(1)} kn</span>
                                  </div>
                                )}
                                {vessel.heading != null && vessel.heading > 0 && (
                                  <div className="vessel-detail">
                                    <span className="vessel-detail-label">Heading</span>
                                    <span className="vessel-detail-value">{vessel.heading}&deg;</span>
                                  </div>
                                )}
                                <div className="vessel-detail">
                                  <span className="vessel-detail-label">Last Updated</span>
                                  <span className="vessel-detail-value">{formatLastSeen(vessel.last_seen_at)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div className="beach-threshold-note" style={{ marginTop: '1.5rem' }}>
                <i className="fas fa-info-circle"></i>
                <span>AIS data relies on vessel captains manually entering their destination, ETA, and other details into their transponder. Arrival and departure information may not always be accurate or up to date.</span>
              </div>
            </div>
          )}

          {/* MARINE FORECAST */}
          {active === 'forecast' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Zone LEZ145</div>
                <h2 className="section-title">Marine Zone Forecast</h2>
                <p className="section-desc">NWS nearshore marine forecast for Vermilion to Avon Point, OH covering Lorain Harbor and surrounding waters. Click a period to expand.</p>
              </div>
              {(marineTextPeriods.length > 0 || marineText) ? (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="marine-update-notice">
                    <i className="fas fa-sync-alt"></i>
                    <span>Last updated: {lastUpdated} ET — Data refreshes every 30 minutes.</span>
                  </div>
                  {marineTextPeriods.length > 0 ? (
                    <MarineZoneAccordion periods={marineTextPeriods} />
                  ) : (
                    <div className="marine-text-block">{marineText}</div>
                  )}
                  <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                    <a href="https://www.weather.gov/cle/marine_forecast" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      <i className="fas fa-external-link-alt" style={{ marginRight: '0.4rem' }}></i> View Full Forecast on NWS
                    </a>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No marine forecast data available at this time.</p>
              )}
            </div>
          )}

          {/* CONDITIONS */}
          {active === 'conditions' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Real-Time Data</div>
                <h2 className="section-title">Current Conditions</h2>
                <p className="section-desc">Live readings from NDBC Buoy Station 45005, located approximately 18 miles northwest of Lorain in western Lake Erie. Updated hourly when the buoy is active.</p>
              </div>
              {buoy && !buoy.isOffline ? (
                <div className="marine-conditions-grid">
                  <div className="marine-condition-card">
                    <div className="condition-icon"><i className="fas fa-water"></i></div>
                    <div className="condition-value">{buoy.waveHeight !== null ? buoy.waveHeight : '--'}<span className="condition-unit"> ft</span></div>
                    <div className="condition-label">Wave Height</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-temperature-half"></i></div>
                    <div className="condition-value">{buoy.waterTemp !== null ? buoy.waterTemp : '--'}<span className="condition-unit">&deg;F</span></div>
                    <div className="condition-label">Water Temp</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}><i className="fas fa-wind"></i></div>
                    <div className="condition-value">{buoy.windSpeed !== null ? buoy.windSpeed : '--'}<span className="condition-unit"> kts</span></div>
                    <div className="condition-label">Wind Speed</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}><i className="fas fa-wind"></i></div>
                    <div className="condition-value">{buoy.windGust !== null ? buoy.windGust : '--'}<span className="condition-unit"> kts</span></div>
                    <div className="condition-label">Wind Gust</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899' }}><i className="fas fa-compass"></i></div>
                    <div className="condition-value">{windDirLabel(buoy.windDirection)}</div>
                    <div className="condition-label">Wind Direction</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}><i className="fas fa-thermometer-half"></i></div>
                    <div className="condition-value">{buoy.airTemp !== null ? buoy.airTemp : '--'}<span className="condition-unit">&deg;F</span></div>
                    <div className="condition-label">Air Temp</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}><i className="fas fa-gauge"></i></div>
                    <div className="condition-value">{buoy.pressure !== null ? buoy.pressure : '--'}<span className="condition-unit"> hPa</span></div>
                    <div className="condition-label">Pressure</div>
                  </div>
                  <div className="marine-condition-card">
                    <div className="condition-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}><i className="fas fa-clock"></i></div>
                    <div className="condition-value">{buoy.wavePeriod !== null ? buoy.wavePeriod : '--'}<span className="condition-unit"> sec</span></div>
                    <div className="condition-label">Wave Period</div>
                  </div>
                </div>
              ) : (
                <div className="marine-offline-notice">
                  <i className="fas fa-info-circle"></i>
                  <h3 style={{ marginBottom: '0.5rem' }}>Buoy Station Offline</h3>
                  <p>NDBC Buoy 45005 (West Erie) is seasonal and typically offline November through May. Real-time wave and water temperature data will return when the buoy is redeployed in spring.</p>
                </div>
              )}
            </div>
          )}

          {/* HOURLY */}
          {active === 'hourly' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Hour by Hour</div>
                <h2 className="section-title">Weather Forecast</h2>
                <p className="section-desc">Hourly weather data from the <a href="https://www.weather.gov/cle/" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>National Weather Service — Cleveland, OH</a>. This is a land-based forecast for the Lorain area and may differ from open-water conditions.</p>
              </div>
              {hourly.length > 0 ? (
                <HourlyForecastTable hourly={hourly} />
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No hourly data available at this time.</p>
              )}
            </div>
          )}

          {/* 7-DAY */}
          {active === '7day' && (
            <div>
              <div className="section-header center">
                <div className="section-label">7-Day Outlook</div>
                <h2 className="section-title">Extended Forecast</h2>
              </div>
              {forecast.length > 0 ? (
                <div className="marine-forecast-strip">
                  {forecast.map(p => (
                    <div key={p.number} className={`marine-forecast-card${!p.isDaytime ? ' night' : ''}`}>
                      <div className="fc-name">{p.name}</div>
                      <div className="fc-temp">{p.temperature}&deg;{p.temperatureUnit}</div>
                      <div className="fc-wind"><i className="fas fa-wind" style={{ marginRight: '0.3rem' }}></i>{p.windDirection} {p.windSpeed}</div>
                      <div className="fc-condition">{p.shortForecast}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No forecast data available at this time.</p>
              )}
            </div>
          )}

          {/* RESOURCES */}
          {active === 'resources' && (
            <div>
              <div className="section-header center">
                <div className="section-label">For Boaters</div>
                <h2 className="section-title">Boating Resources</h2>
              </div>
              <div className="marine-resources-grid">
                <a href="https://www.weather.gov/cle/marine_forecast" target="_blank" rel="noopener noreferrer" className="marine-resource-card">
                  <div className="mr-icon" style={{ background: 'rgba(27,139,235,0.1)', color: 'var(--blue-accent)' }}><i className="fas fa-cloud-sun"></i></div>
                  <h3>NWS Cleveland Marine</h3>
                  <p>Official marine forecasts from the Cleveland NWS office</p>
                </a>
                <a href="https://www.ndbc.noaa.gov/station_page.php?station=45005" target="_blank" rel="noopener noreferrer" className="marine-resource-card">
                  <div className="mr-icon" style={{ background: 'rgba(217,119,6,0.1)', color: 'var(--gold)' }}><i className="fas fa-satellite-dish"></i></div>
                  <h3>NDBC Buoy 45005</h3>
                  <p>Real-time buoy data and historical observations</p>
                </a>
                <Link href="/facilities#boat-launch" className="marine-resource-card">
                  <div className="mr-icon" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}><i className="fas fa-ship"></i></div>
                  <h3>Boat Launch</h3>
                  <p>Public boat launch at Lorain&apos;s waterfront facilities</p>
                </Link>
                <div className="marine-resource-card">
                  <div className="mr-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899' }}><i className="fas fa-broadcast-tower"></i></div>
                  <h3>VHF Channel 16</h3>
                  <p>Emergency &amp; distress channel — monitored by USCG</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray-400)', maxWidth: '600px', margin: '2rem auto 0' }}>
                <p>Data provided by the <a href="https://www.weather.gov" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>National Weather Service</a> and <a href="https://www.ndbc.noaa.gov" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>NOAA National Data Buoy Center</a>. Forecasts update approximately every 30 minutes. Always check official sources before heading out on the water.</p>
              </div>
            </div>
          )}

          {/* TRIP PLANNER */}
          {active === 'trip' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Trip Planning</div>
                <h2 className="section-title"><i className="fas fa-route" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Plan Your Boat Trip</h2>
                <p className="section-desc">Enter your trip details and we&apos;ll cross-reference weather forecasts, marine conditions, alerts, and vessel traffic for your specific trip window.</p>
              </div>
              <TripPlannerTab />
            </div>
          )}

          {/* BEACH WATER QUALITY */}
          {active === 'beach' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Water Safety</div>
                <h2 className="section-title"><i className="fas fa-umbrella-beach" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Beach Water Quality</h2>
                <p className="section-desc">E. coli monitoring data for Lorain County beaches. Advisories are issued when bacteria levels exceed 235 cfu/100mL, the Ohio single-sample maximum for recreational waters.</p>
              </div>

              {!beachLoaded ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Loading beach water quality data...</p>
              ) : !beachData || beachData.beaches.length === 0 ? (
                <div className="beach-empty-notice">
                  <i className="fas fa-water"></i>
                  <p>No beach water quality data available at this time.</p>
                </div>
              ) : (
                <>
                  {beachData.isOffSeason && (
                    <div className="beach-offseason-banner">
                      <i className="fas fa-snowflake"></i>
                      <div>
                        <strong>Off-Season</strong>
                        <p>Beach monitoring runs Memorial Day through Labor Day. Showing {beachData.seasonYear} season data. Monitoring resumes in May {beachData.seasonYear + 1}.</p>
                      </div>
                    </div>
                  )}

                  {/* Status Cards */}
                  <div className="beach-status-grid">
                    {beachData.beaches.map(beach => (
                      <div key={beach.id} className={`beach-status-card ${beach.status}`}>
                        <div className="beach-status-indicator">
                          <i className={`fas ${beach.status === 'safe' ? 'fa-check-circle' : beach.status === 'advisory' ? 'fa-exclamation-triangle' : 'fa-minus-circle'}`}></i>
                          <span className="beach-status-label">
                            {beach.status === 'safe' ? 'Safe' : beach.status === 'advisory' ? 'Advisory' : 'No Data'}
                          </span>
                        </div>
                        <h3 className="beach-card-name">{beach.name}</h3>
                        {beach.latestReading ? (
                          <>
                            <div className="beach-reading-value">
                              {beach.latestReading.value !== null ? beach.latestReading.value.toFixed(0) : '--'}
                              <span className="beach-reading-unit"> cfu/100mL</span>
                            </div>
                            <div className="beach-reading-date">
                              Sampled {new Date(beach.latestReading.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </>
                        ) : (
                          <div className="beach-reading-date">No samples recorded</div>
                        )}
                        <div className="beach-season-stat">
                          <span>{beach.seasonStats.safePct}% safe</span>
                          <span>{beach.seasonStats.totalSamples} samples</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Threshold Info */}
                  <div className="beach-threshold-note">
                    <i className="fas fa-info-circle"></i>
                    <span>Advisory threshold: <strong>235 cfu/100mL</strong> E. coli (Ohio single-sample maximum). Readings above this level indicate elevated bacteria that may pose a health risk for swimmers.</span>
                  </div>

                  {/* Season Summary */}
                  <div className="beach-season-summary">
                    <h3 className="beach-summary-title">{beachData.seasonYear} Season Summary</h3>
                    <div className="beach-summary-grid">
                      {beachData.beaches.map(beach => {
                        const validReadings = beach.readings.filter(r => r.value !== null);
                        const maxReading = validReadings.length > 0 ? Math.max(...validReadings.map(r => r.value!)) : 0;
                        const avgReading = validReadings.length > 0 ? validReadings.reduce((s, r) => s + r.value!, 0) / validReadings.length : 0;
                        return (
                          <div key={beach.id} className="beach-summary-row">
                            <div className="beach-summary-name">{beach.name}</div>
                            <div className="beach-summary-stats">
                              <div className="beach-stat">
                                <span className="beach-stat-value">{beach.seasonStats.totalSamples}</span>
                                <span className="beach-stat-label">Samples</span>
                              </div>
                              <div className="beach-stat">
                                <span className="beach-stat-value">{beach.seasonStats.advisoryCount}</span>
                                <span className="beach-stat-label">Advisories</span>
                              </div>
                              <div className="beach-stat">
                                <span className={`beach-stat-value ${beach.seasonStats.safePct >= 80 ? 'good' : 'warn'}`}>{beach.seasonStats.safePct}%</span>
                                <span className="beach-stat-label">Safe</span>
                              </div>
                              <div className="beach-stat">
                                <span className="beach-stat-value">{avgReading.toFixed(0)}</span>
                                <span className="beach-stat-label">Avg</span>
                              </div>
                              <div className="beach-stat">
                                <span className={`beach-stat-value ${maxReading >= 235 ? 'warn' : 'good'}`}>{maxReading.toFixed(0)}</span>
                                <span className="beach-stat-label">Peak</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Readings Table */}
                  <div className="beach-history-section">
                    <h3 className="beach-summary-title">Recent Readings</h3>
                    <div className="beach-history-table-wrap">
                      <table className="beach-history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            {beachData.beaches.map(b => (
                              <th key={b.id}>{b.name.replace(' Beach', '').replace(' Park', '')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Get unique dates across all beaches, sorted descending, last 20
                            const allDates = new Set<string>();
                            beachData.beaches.forEach(b => b.readings.forEach(r => allDates.add(r.date)));
                            const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a)).slice(0, 20);
                            return sortedDates.map(date => (
                              <tr key={date}>
                                <td>{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                {beachData.beaches.map(b => {
                                  const reading = b.readings.find(r => r.date === date);
                                  const val = reading?.value;
                                  return (
                                    <td key={b.id} className={val !== null && val !== undefined && val >= 235 ? 'beach-reading-high' : ''}>
                                      {val !== null && val !== undefined ? val.toFixed(0) : '--'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Attribution */}
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray-400)', maxWidth: '600px', margin: '2rem auto 0' }}>
                    <p>Data from the <a href="https://odh.ohio.gov/know-our-programs/bathing-beach-monitoring" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>Ohio Department of Health</a> via the <a href="https://www.waterqualitydata.us" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>Water Quality Portal</a>. For official advisories, visit <a href="https://publicapps.odh.ohio.gov/beachguardpublic/" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>Ohio BeachGuard</a>.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
