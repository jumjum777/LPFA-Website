'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarineZoneAccordion from './MarineZoneAccordion';
import HourlyForecastTable from './HourlyForecastTable';
import AlertsCollapsible from './AlertsCollapsible';

interface Alert { id: string; event: string; headline: string; description: string; severity: string; onset: string; expires: string; }
interface MarineTextPeriod { title: string; body: string; }
interface HourlyPeriod { startTime: string; temperature: number; windSpeed: string; windDirection: string; shortForecast: string; precipChance: number | null; }
interface ForecastPeriod { number: number; name: string; temperature: number; temperatureUnit: string; windSpeed: string; windDirection: string; shortForecast: string; isDaytime: boolean; }
interface BuoyData { windSpeed: number | null; windGust: number | null; windDirection: number | null; waveHeight: number | null; wavePeriod: number | null; waterTemp: number | null; airTemp: number | null; pressure: number | null; isOffline: boolean; }

type TabId = 'alerts' | 'forecast' | 'conditions' | 'hourly' | '7day' | 'resources';

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
  const [active, setActive] = useState<TabId>(hasAlerts ? 'alerts' : 'forecast');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    ...(hasAlerts ? [{ id: 'alerts' as TabId, label: 'Alerts', icon: 'fa-exclamation-triangle' }] : []),
    { id: 'forecast', label: 'Marine Forecast', icon: 'fa-anchor' },
    { id: 'conditions', label: 'Offshore Conditions', icon: 'fa-water' },
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
        </div>
      </div>
    </section>
  );
}
