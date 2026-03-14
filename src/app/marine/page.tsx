import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import MarineTabs from '@/components/marine/MarineTabs';
import BoatingSummaryCard from '@/components/marine/BoatingSummaryCard';
import { fetchMarineData } from '@/lib/marine';
import { fetchBeachData } from '@/lib/beach';

export const metadata = { title: 'Marine & Alerts' };

export const dynamic = 'force-dynamic';

const MOCK_ALERTS = [
  {
    id: 'mock-1',
    event: 'Severe Thunderstorm Warning',
    headline: 'Severe Thunderstorm Warning in effect for Lorain County until 8:00 PM EDT',
    description: 'SEVERE THUNDERSTORM WARNING\n\n* WHAT...60 mph wind gusts and quarter size hail expected.\n\n* WHERE...Lorain, Elyria, Avon, Avon Lake, North Ridgeville and surrounding areas.\n\n* WHEN...Until 8:00 PM EDT.\n\n* IMPACTS...Damaging winds will cause some trees and large branches to fall. Hail damage to vehicles is expected. Wind damage to roofs, siding and windows is possible.',
    severity: 'Severe',
    onset: new Date().toISOString(),
    expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    event: 'Small Craft Advisory',
    headline: 'Small Craft Advisory in effect for Vermilion to Avon Point OH nearshore waters',
    description: 'SMALL CRAFT ADVISORY IN EFFECT FROM THIS EVENING THROUGH SATURDAY AFTERNOON\n\n* WHAT...Southwest winds 20 to 30 knots with gusts up to 35 knots and waves 4 to 7 feet expected.\n\n* WHERE...Vermilion to Avon Point OH.\n\n* WHEN...From this evening through Saturday afternoon.\n\n* IMPACTS...Conditions will be hazardous to small craft.',
    severity: 'Moderate',
    onset: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    event: 'Gale Warning',
    headline: 'Gale Warning in effect for Lorain and surrounding Lake Erie nearshore waters',
    description: 'GALE WARNING IN EFFECT FROM SATURDAY EVENING THROUGH SUNDAY AFTERNOON\n\n* WHAT...West winds 35 to 45 knots with gusts to 55 knots. Waves 8 to 13 feet.\n\n* WHERE...Open waters of Lake Erie.\n\n* WHEN...From Saturday evening through Sunday afternoon.\n\n* IMPACTS...Very rough conditions on the lake. All craft should remain in port.',
    severity: 'Severe',
    onset: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
];

export default async function MarinePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams;
  const emptyMarine = {
    alerts: [], forecast: [], hourly: [], marineText: null,
    marineTextPeriods: [], buoy: null, nearshoreTemp: { value: null, source: null, station: '', timestamp: '' },
    fetchedAt: new Date().toISOString(),
  };
  const emptyBeach = { beaches: [], seasonYear: new Date().getFullYear(), isOffSeason: true, fetchedAt: new Date().toISOString() };

  const [data, beachData] = await Promise.all([
    Promise.race([fetchMarineData(), new Promise<typeof emptyMarine>(r => setTimeout(() => r(emptyMarine), 12000))]),
    Promise.race([fetchBeachData(), new Promise<typeof emptyBeach>(r => setTimeout(() => r(emptyBeach), 12000))]),
  ]);
  const { forecast, hourly, marineText, marineTextPeriods, buoy, fetchedAt } = data;

  // Merge beach water quality advisories into alerts (only during swim season with recent data)
  const baseAlerts = params.preview === 'alerts' ? MOCK_ALERTS : data.alerts;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const advisoryBeaches = beachData.isOffSeason ? [] : beachData.beaches.filter(b =>
    b.status === 'advisory' && b.latestReading?.date && new Date(b.latestReading.date) >= threeDaysAgo
  );
  const beachAlerts = advisoryBeaches.map(b => ({
    id: `beach-${b.id}`,
    event: 'Beach Water Quality Advisory',
    headline: `Elevated E. coli levels at ${b.name} (${b.latestReading?.value?.toFixed(0)} cfu/100mL). Avoid swimming at this beach.`,
    description: `BEACH WATER QUALITY ADVISORY\n\n* WHAT...E. coli bacteria levels of ${b.latestReading?.value?.toFixed(0)} cfu/100mL were detected, exceeding the Ohio single-sample maximum of 235 cfu/100mL.\n\n* WHERE...${b.name}, Lorain County.\n\n* WHEN...Based on most recent sample collected ${b.latestReading?.date}.\n\n* IMPACTS...Elevated bacteria levels may pose health risks for swimmers. Avoid full-body contact with the water at this beach until levels return to safe range.\n\n* SOURCE...Ohio Department of Health via Water Quality Portal.`,
    severity: 'Moderate',
    onset: b.latestReading?.date ? new Date(b.latestReading.date + 'T12:00:00').toISOString() : '',
    expires: '',
  }));
  const alerts = [...baseAlerts, ...beachAlerts];
  const lastUpdated = new Date(fetchedAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });

  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Marine &amp; Alerts</span>
          </nav>
          <div className="page-hero-label">Lake Erie Conditions</div>
          <h1>Marine &amp; Alerts</h1>
          <p>Real-time weather alerts, marine forecasts, vessel traffic, beach water quality, and offshore conditions for Lorain Harbor and the Lake Erie nearshore zone.</p>
        </div>
      </section>

      {/* BOATING SUMMARY */}
      <section className="boating-summary-section">
        <div className="container">
          <BoatingSummaryCard />
        </div>
      </section>

      {/* TABBED CONTENT */}
      <MarineTabs
        alerts={alerts}
        marineTextPeriods={marineTextPeriods}
        marineText={marineText}
        lastUpdated={lastUpdated}
        buoy={buoy}
        hourly={hourly}
        forecast={forecast}
      />
    </main>
  );
}
