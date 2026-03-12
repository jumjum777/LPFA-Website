import { BetaAnalyticsDataClient } from '@google-analytics/data';

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;

function getClient(): BetaAnalyticsDataClient | null {
  if (!GA_PROPERTY_ID) return null;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) return null;

  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key: key },
  });
}

export function isGA4Configured(): boolean {
  return !!GA_PROPERTY_ID;
}

function parseGA4Date(dateStr: string): string {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function getMetricValue(row: { metricValues?: { value?: string | null }[] | null }, index: number): number {
  const val = row.metricValues?.[index]?.value;
  return val ? parseFloat(val) : 0;
}

function getDimensionValue(row: { dimensionValues?: { value?: string | null }[] | null }, index: number): string {
  return row.dimensionValues?.[index]?.value || '';
}

export interface GA4DailyRow {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
}

export interface GA4TopPage {
  path: string;
  title: string;
  pageviews: number;
  sessions: number;
}

export interface GA4TrafficSource {
  channel: string;
  sessions: number;
  users: number;
}

export async function getGA4DailyReport(startDate: string, endDate: string): Promise<GA4DailyRow[]> {
  const client = getClient();
  if (!client) return [];

  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'newUsers' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });

  return (response.rows || []).map(row => ({
    date: parseGA4Date(getDimensionValue(row, 0)),
    sessions: getMetricValue(row, 0),
    users: getMetricValue(row, 1),
    pageviews: getMetricValue(row, 2),
    bounceRate: getMetricValue(row, 3),
    avgSessionDuration: getMetricValue(row, 4),
    newUsers: getMetricValue(row, 5),
  }));
}

export async function getGA4Summary(startDate: string, endDate: string): Promise<Record<string, number>> {
  const client = getClient();
  if (!client) return {};

  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'newUsers' },
    ],
  });

  const row = response.rows?.[0];
  if (!row) return {};

  return {
    sessions: getMetricValue(row, 0),
    users: getMetricValue(row, 1),
    pageviews: getMetricValue(row, 2),
    bounceRate: getMetricValue(row, 3),
    avgSessionDuration: getMetricValue(row, 4),
    newUsers: getMetricValue(row, 5),
  };
}

export async function getGA4TopPages(startDate: string, endDate: string, limit = 20): Promise<GA4TopPage[]> {
  const client = getClient();
  if (!client) return [];

  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit,
  });

  return (response.rows || []).map(row => ({
    path: getDimensionValue(row, 0),
    title: getDimensionValue(row, 1),
    pageviews: getMetricValue(row, 0),
    sessions: getMetricValue(row, 1),
  }));
}

export async function getGA4TrafficSources(startDate: string, endDate: string): Promise<GA4TrafficSource[]> {
  const client = getClient();
  if (!client) return [];

  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  return (response.rows || []).map(row => ({
    channel: getDimensionValue(row, 0),
    sessions: getMetricValue(row, 0),
    users: getMetricValue(row, 1),
  }));
}
