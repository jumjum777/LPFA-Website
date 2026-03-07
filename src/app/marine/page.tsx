import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import MarineTabs from '@/components/marine/MarineTabs';
import { fetchMarineData } from '@/lib/marine';

export const metadata = { title: 'Marine Forecast' };

export const revalidate = 1800;

const MOCK_ALERTS = [
  {
    id: 'mock-1',
    event: 'Small Craft Advisory',
    headline: 'Small Craft Advisory in effect for Vermilion to Avon Point OH nearshore waters',
    description: 'SMALL CRAFT ADVISORY IN EFFECT FROM THIS EVENING THROUGH SATURDAY AFTERNOON\n\n* WHAT...Southwest winds 20 to 30 knots with gusts up to 35 knots and waves 4 to 7 feet expected.\n\n* WHERE...Vermilion to Avon Point OH.\n\n* WHEN...From this evening through Saturday afternoon.\n\n* IMPACTS...Conditions will be hazardous to small craft.',
    severity: 'Moderate',
    onset: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
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
  const data = await fetchMarineData();
  const { forecast, hourly, marineText, marineTextPeriods, buoy, fetchedAt } = data;
  const alerts = params.preview === 'alerts' ? MOCK_ALERTS : data.alerts;
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
            <span className="current">Marine Forecast</span>
          </nav>
          <div className="page-hero-label">Lake Erie Conditions</div>
          <h1>Marine Forecast</h1>
          <p>Current conditions, wave forecasts, and advisories for Lorain Harbor and the Lake Erie nearshore zone. Data sourced from NOAA and the National Weather Service.</p>
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
