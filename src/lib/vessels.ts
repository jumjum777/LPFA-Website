import WebSocket from 'ws';
import { createAdminClient } from '@/lib/supabase/admin';

// Lake Erie + St. Clair River approach bounding box
const BOUNDING_BOX = [[41.0, -84.0], [43.0, -78.5]];
const LISTEN_DURATION_MS = 45_000; // 45 seconds

export interface VesselRecord {
  id?: string;
  mmsi: string;
  vessel_name: string | null;
  destination: string | null;
  vessel_type: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  eta: string | null;
  status: string;
  first_detected_at?: string;
  last_seen_at?: string;
  is_active: boolean;
  created_at?: string;
}

export function isLorainDestination(dest: string | null | undefined): boolean {
  if (!dest) return false;
  return dest.toUpperCase().trim().includes('LORAIN');
}

/** Lorain Harbor area — vessels inside this box are considered "in port".
 *  Covers the breakwall/harbor entrance south along the Black River
 *  to capture vessels docked upriver (~1.5 mi from the lake). */
const LORAIN_PORT_BOX = {
  latMin: 41.435, latMax: 41.478,
  lonMin: -82.210, lonMax: -82.165,
};

export function isNearLorainPort(lat: number | null, lon: number | null): boolean {
  if (lat === null || lon === null) return false;
  return (
    lat >= LORAIN_PORT_BOX.latMin && lat <= LORAIN_PORT_BOX.latMax &&
    lon >= LORAIN_PORT_BOX.lonMin && lon <= LORAIN_PORT_BOX.lonMax
  );
}

/** Determine vessel status based on position relative to port */
export function determineVesselStatus(lat: number | null, lon: number | null, previousStatus?: string): string {
  if (isNearLorainPort(lat, lon)) return 'in_port';
  if (previousStatus === 'in_port') return 'departed';
  return 'en_route';
}

export function formatAisEta(eta: { Month?: number; Day?: number; Hour?: number; Minute?: number } | null): string | null {
  if (!eta || !eta.Month || !eta.Day) return null;
  const now = new Date();
  const year = now.getFullYear();
  // AIS ETA doesn't include year — assume current year, or next year if the date has passed
  let etaDate = new Date(year, (eta.Month || 1) - 1, eta.Day || 1, eta.Hour || 0, eta.Minute || 0);
  if (etaDate < now) {
    etaDate = new Date(year + 1, (eta.Month || 1) - 1, eta.Day || 1, eta.Hour || 0, eta.Minute || 0);
  }
  return etaDate.toISOString();
}

interface AisShipStaticData {
  MessageType: string;
  Message: {
    ShipStaticData: {
      Name: string;
      Destination: string;
      UserID: number;
      Type: number;
      Eta: { Month: number; Day: number; Hour: number; Minute: number };
    };
  };
  MetaData: {
    MMSI: number;
    latitude: number;
    longitude: number;
    ShipName: string;
  };
}

export async function syncVesselTraffic(): Promise<{ found: number; upserted: number }> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    throw new Error('AISSTREAM_API_KEY not configured');
  }

  const vessels: Map<string, {
    mmsi: string;
    vessel_name: string;
    destination: string;
    vessel_type: number;
    latitude: number;
    longitude: number;
    eta: string | null;
  }> = new Map();

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    const timeout = setTimeout(() => {
      ws.close();
      resolve();
    }, LISTEN_DURATION_MS);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        Apikey: apiKey,
        BoundingBoxes: [BOUNDING_BOX],
        FilterMessageTypes: ['ShipStaticData'],
      }));
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString()) as AisShipStaticData;
        if (msg.MessageType !== 'ShipStaticData') return;

        const ship = msg.Message.ShipStaticData;
        const meta = msg.MetaData;

        if (!isLorainDestination(ship.Destination)) return;

        const mmsi = String(meta.MMSI);
        vessels.set(mmsi, {
          mmsi,
          vessel_name: ship.Name?.trim() || meta.ShipName?.trim() || 'Unknown',
          destination: ship.Destination?.trim() || '',
          vessel_type: ship.Type || 0,
          latitude: meta.latitude,
          longitude: meta.longitude,
          eta: formatAisEta(ship.Eta),
        });
      } catch {
        // Skip malformed messages
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  // Upsert matched vessels into Supabase
  const supabase = createAdminClient();
  let upserted = 0;

  // Fetch existing records to check previous status
  const mmsiList = Array.from(vessels.keys());
  const { data: existing } = mmsiList.length > 0
    ? await supabase.from('vessel_traffic').select('mmsi, status').in('mmsi', mmsiList)
    : { data: [] };
  const prevStatusMap = new Map((existing || []).map(r => [r.mmsi, r.status]));

  for (const vessel of vessels.values()) {
    const prevStatus = prevStatusMap.get(vessel.mmsi);
    const status = determineVesselStatus(vessel.latitude, vessel.longitude, prevStatus);

    const { error } = await supabase
      .from('vessel_traffic')
      .upsert({
        mmsi: vessel.mmsi,
        vessel_name: vessel.vessel_name,
        destination: vessel.destination,
        vessel_type: vessel.vessel_type,
        latitude: vessel.latitude,
        longitude: vessel.longitude,
        eta: vessel.eta,
        status,
        last_seen_at: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'mmsi' });

    if (!error) upserted++;
  }

  return { found: vessels.size, upserted };
}

export async function fetchActiveVessels(): Promise<VesselRecord[]> {
  const supabase = createAdminClient();
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('vessel_traffic')
    .select('*')
    .or(`is_active.eq.true,and(status.eq.departed,last_seen_at.gte.${cutoff48h})`)
    .order('status', { ascending: true })
    .order('first_detected_at', { ascending: false });
  return (data || []) as VesselRecord[];
}

export async function expireStaleVessels(): Promise<number> {
  const supabase = createAdminClient();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  let total = 0;

  // In-port vessels not seen for 24h → mark as departed (visible 48h more)
  const { data: departedVessels } = await supabase
    .from('vessel_traffic')
    .update({ status: 'departed' })
    .eq('is_active', true)
    .eq('status', 'in_port')
    .lt('last_seen_at', cutoff24h)
    .select('id');
  total += departedVessels?.length || 0;

  // En-route vessels not seen for 24h → expire
  const { data: expiredEnRoute } = await supabase
    .from('vessel_traffic')
    .update({ is_active: false, status: 'expired' })
    .eq('is_active', true)
    .eq('status', 'en_route')
    .lt('last_seen_at', cutoff24h)
    .select('id');
  total += expiredEnRoute?.length || 0;

  // Departed vessels older than 48h → fully expire
  const { data: expiredDeparted } = await supabase
    .from('vessel_traffic')
    .update({ is_active: false, status: 'expired' })
    .eq('status', 'departed')
    .lt('last_seen_at', cutoff48h)
    .select('id');
  total += expiredDeparted?.length || 0;

  return total;
}
