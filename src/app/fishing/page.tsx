import Link from 'next/link';
import ScrollAnimator from '@/components/ui/ScrollAnimator';
import FishingTabs from '@/components/fishing/FishingTabs';
import { fetchMarineData } from '@/lib/marine';

export const metadata = { title: 'Fishing — Lake Erie Fishing Hub' };

export const revalidate = 1800;

export default async function FishingPage() {
  const data = await fetchMarineData();
  const { buoy, forecast, nearshoreTemp } = data;

  // Extract conditions for the fishing tabs
  const conditions = {
    waterTemp: buoy?.waterTemp ?? null,
    windSpeed: buoy?.windSpeed ?? null,
    windGust: buoy?.windGust ?? null,
    windDirection: buoy?.windDirection !== null ? windDirLabel(buoy?.windDirection ?? null) : '--',
    waveHeight: buoy?.waveHeight ?? null,
    pressure: buoy?.pressure ?? null,
    buoyOffline: buoy?.isOffline ?? true,
    nearshoreTemp: nearshoreTemp?.value ?? null,
    nearshoreSource: nearshoreTemp?.source ?? null,
    forecast: forecast.slice(0, 6).map(f => ({
      name: f.name,
      windSpeed: f.windSpeed,
      windDirection: f.windDirection,
      shortForecast: f.shortForecast,
      temperature: f.temperature,
    })),
  };

  return (
    <main id="main-content">
      <ScrollAnimator />

      {/* HERO */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep"><i className="fas fa-chevron-right"></i></span>
            <span className="current">Fishing</span>
          </nav>
          <div className="page-hero-label">Lake Erie Fishing Hub</div>
          <h1>Fishing</h1>
          <p>Live conditions, community catch reports, species guides, and everything you need to plan your next fishing trip on Lake Erie.</p>
        </div>
      </section>

      {/* TABBED CONTENT */}
      <FishingTabs conditions={conditions} />
    </main>
  );
}

function windDirLabel(deg: number | null) {
  if (deg === null) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}
