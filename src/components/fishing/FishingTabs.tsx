'use client';

import { useState, useEffect } from 'react';
import ConditionsTab from './ConditionsTab';
import CatchBoard from './CatchBoard';
import SubmitCatch from './SubmitCatch';
import SpeciesGuide from './SpeciesGuide';
import RegulationsTab from './RegulationsTab';
import CatchMap from './CatchMap';
import type { FishingCatch, MayflyActivityLevel } from '@/lib/fishing';

type TabId = 'conditions' | 'catches' | 'submit' | 'species' | 'regulations' | 'map';

interface ConditionsData {
  waterTemp: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: string;
  waveHeight: number | null;
  pressure: number | null;
  buoyOffline: boolean;
  nearshoreTemp: number | null;
  nearshoreSource: 'coops' | 'nws-text' | null;
  forecast: { name: string; windSpeed: string; windDirection: string; shortForecast: string; temperature: number; }[];
}

interface MayflyStatusData {
  level: MayflyActivityLevel | null;
  reportCount: number;
  lastReported: string | null;
}

interface BiteSummary {
  [speciesId: string]: { avgRating: number; catchCount: number };
}

export default function FishingTabs({ conditions }: { conditions: ConditionsData }) {
  const hashTab = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
  const validHashTab = ['conditions', 'catches', 'submit', 'species', 'regulations', 'map'].includes(hashTab) ? hashTab as TabId : null;
  const [active, setActive] = useState<TabId>(validHashTab || 'conditions');

  const [catches, setCatches] = useState<FishingCatch[]>([]);
  const [catchesLoaded, setCatchesLoaded] = useState(false);

  const [mayflyStatus, setMayflyStatus] = useState<MayflyStatusData>({ level: null, reportCount: 0, lastReported: null });
  const [biteSummary, setBiteSummary] = useState<BiteSummary>({});

  useEffect(() => {
    // Fetch catches
    fetch('/api/fishing/catches?limit=100')
      .then(res => res.json())
      .then(data => { setCatches(data.catches || []); setCatchesLoaded(true); })
      .catch(() => setCatchesLoaded(true));

    // Fetch mayfly status
    fetch('/api/fishing/mayfly-status')
      .then(res => res.json())
      .then(data => setMayflyStatus(data))
      .catch(() => {});

    // Fetch bite summary
    fetch('/api/fishing/bite-summary')
      .then(res => res.json())
      .then(data => setBiteSummary(data))
      .catch(() => {});
  }, []);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'conditions', label: 'Fishing Conditions', icon: 'fa-water' },
    { id: 'catches', label: 'Catch Board', icon: 'fa-fish' },
    { id: 'submit', label: 'Report a Catch', icon: 'fa-plus-circle' },
    { id: 'map', label: 'Catch Map', icon: 'fa-map-marked-alt' },
    { id: 'species', label: 'Species Guide', icon: 'fa-book-open' },
    { id: 'regulations', label: 'Regulations', icon: 'fa-gavel' },
  ];

  function handleSwitchToSubmit() {
    setActive('submit');
  }

  function handleCatchSubmitted() {
    fetch('/api/fishing/catches?limit=100')
      .then(res => res.json())
      .then(data => { setCatches(data.catches || []); })
      .catch(() => {});
    // Also refresh bite summary
    fetch('/api/fishing/bite-summary')
      .then(res => res.json())
      .then(data => setBiteSummary(data))
      .catch(() => {});
  }

  function handleMayflyReported() {
    fetch('/api/fishing/mayfly-status')
      .then(res => res.json())
      .then(data => setMayflyStatus(data))
      .catch(() => {});
  }

  const currentMonth = new Date().getMonth() + 1;

  return (
    <section className="section">
      <div className="container">
        {/* Tab buttons (desktop) */}
        <div className="marine-tabs-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`marine-tab-btn${active === tab.id ? ' active' : ''}`}
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
          {active === 'conditions' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Live Conditions</div>
                <h2 className="section-title"><i className="fas fa-water" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Fishing Conditions</h2>
                <p className="section-desc">Current water conditions from NOAA stations and NWS forecasts, interpreted for anglers targeting Lake Erie species near Lorain.</p>
              </div>
              <ConditionsTab
                {...conditions}
                mayflyLevel={mayflyStatus.level}
                mayflyReportCount={mayflyStatus.reportCount}
                biteSummary={biteSummary}
                onMayflyReported={handleMayflyReported}
              />
            </div>
          )}

          {active === 'catches' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Community Reports</div>
                <h2 className="section-title"><i className="fas fa-fish" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Catch Board</h2>
                <p className="section-desc">See what anglers are catching around Lorain and Lake Erie. Submit your own catch to join the board!</p>
              </div>
              <CatchBoard
                catches={catches}
                loaded={catchesLoaded}
                onSwitchToSubmit={handleSwitchToSubmit}
              />
            </div>
          )}

          {active === 'submit' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Share Your Catch</div>
                <h2 className="section-title"><i className="fas fa-plus-circle" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Report a Catch</h2>
                <p className="section-desc">Caught something? Share your catch data with the community. Your report will appear on the Catch Board immediately.</p>
              </div>
              <SubmitCatch onSubmitted={handleCatchSubmitted} />
            </div>
          )}

          {active === 'map' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Fishing Map</div>
                <h2 className="section-title"><i className="fas fa-map-marked-alt" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Catch Map</h2>
                <p className="section-desc">Explore popular fishing spots and see where the community is catching fish around Lorain Harbor and Lake Erie.</p>
              </div>
              <CatchMap catches={catches} loaded={catchesLoaded} />
            </div>
          )}

          {active === 'species' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Know Your Fish</div>
                <h2 className="section-title"><i className="fas fa-book-open" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Species Guide</h2>
                <p className="section-desc">Lake Erie species near Lorain — month-by-month fishing intel with zones, techniques, and expert tips.</p>
              </div>
              <SpeciesGuide
                nearshoreTemp={conditions.nearshoreTemp}
                offshoreTemp={conditions.waterTemp}
                month={currentMonth}
              />
            </div>
          )}

          {active === 'regulations' && (
            <div>
              <div className="section-header center">
                <div className="section-label">Rules & Resources</div>
                <h2 className="section-title"><i className="fas fa-gavel" style={{ color: 'var(--gold)', marginRight: '0.5rem' }}></i> Regulations</h2>
                <p className="section-desc">Ohio fishing regulations, license requirements, and helpful resources for Lake Erie anglers.</p>
              </div>
              <RegulationsTab />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
