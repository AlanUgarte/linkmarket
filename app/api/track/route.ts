import { NextRequest } from 'next/server';
import { META_PIXEL_ID } from '@/lib/constants';

/**
 * Endpoint de tracking. Recibe un evento del cliente y lo reparte, server-side,
 * a DOS destinos en paralelo:
 *   1. Meta Conversions API  (resistente a ad-blockers, dedup por event_id)
 *   2. Google Sheets         (vía webhook de Apps Script — base de datos propia)
 *
 * Depende de headers de request → siempre dinámico, nunca cacheado. Cada destino
 * está protegido con try/catch: si uno falla, el otro igual se envía, y el
 * cliente nunca ve un error (respondemos 204).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';

interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  gclid?: string;
}

interface TrackPayload {
  event?: string;
  event_id?: string;
  metaEventName?: string;
  customData?: Record<string, unknown>;
  timestamp?: number;
  producto?: string;
  categoria?: string;
  precio?: number | string;
  urlActual?: string;
  urlDestino?: string;
  usuario?: string;
  sessionId?: string;
  utm?: Utm;
  referrer?: string;
  device?: { type?: string; os?: string; browser?: string; screen?: string; language?: string };
  tiempoEnPagina?: number;
  scrollPct?: number;
  clickML?: string;
  extra?: Record<string, unknown>;
  fbp?: string;
  fbc?: string;
}

/** IP real del visitante detrás del proxy de Vercel. */
function clientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || undefined;
}

/** Anonimiza la IP: pone en 0 el último octeto (IPv4) o trunca el sufijo (IPv6). */
function anonymizeIp(ip?: string): string {
  if (!ip) return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 3).join(':') + '::';
  }
  return ip;
}

function geo(req: NextRequest) {
  const decode = (v: string | null) => {
    if (!v) return '';
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  return {
    country: decode(req.headers.get('x-vercel-ip-country')),
    city: decode(req.headers.get('x-vercel-ip-city')),
    region: decode(req.headers.get('x-vercel-ip-country-region')),
  };
}

/** Envía el evento a la Conversions API de Meta. */
async function sendToMeta(body: TrackPayload, ip: string | undefined, userAgent: string) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token || !META_PIXEL_ID || !body.metaEventName || !body.event_id) return;

  const userData: Record<string, unknown> = {
    client_user_agent: userAgent || undefined,
    client_ip_address: ip,
  };
  if (body.fbp) userData.fbp = body.fbp;
  if (body.fbc) userData.fbc = body.fbc;

  const event = {
    event_name: body.metaEventName,
    event_time: Math.floor((body.timestamp ?? Date.now()) / 1000),
    event_id: body.event_id, // mismo id que el pixel → Meta deduplica
    action_source: 'website',
    event_source_url: body.urlActual,
    user_data: userData,
    custom_data: body.customData ?? {},
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${token}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  if (!res.ok) {
    console.error('[capi] Meta respondió', res.status, (await res.text()).slice(0, 300));
  }
}

/** Envía la fila del evento al webhook de Google Apps Script (Google Sheets). */
async function sendToSheets(body: TrackPayload, req: NextRequest, ipAnon: string) {
  const url = process.env.APPS_SCRIPT_WEBHOOK_URL;
  if (!url) return;

  const g = geo(req);
  const row = {
    token: process.env.APPS_SCRIPT_WEBHOOK_TOKEN || '',
    id: body.event_id || '',
    timestamp: body.timestamp ?? Date.now(),
    evento: body.event || '',
    producto: body.producto || '',
    categoria: body.categoria || '',
    precio: body.precio ?? '',
    urlActual: body.urlActual || '',
    urlDestino: body.urlDestino || '',
    usuario: body.usuario || '',
    sessionId: body.sessionId || '',
    utmSource: body.utm?.source || '',
    utmMedium: body.utm?.medium || '',
    utmCampaign: body.utm?.campaign || '',
    utmContent: body.utm?.content || '',
    utmTerm: body.utm?.term || '',
    fbclid: body.utm?.fbclid || '',
    gclid: body.utm?.gclid || '',
    referrer: body.referrer || '',
    dispositivo: body.device?.type || '',
    so: body.device?.os || '',
    navegador: body.device?.browser || '',
    resolucion: body.device?.screen || '',
    idioma: body.device?.language || '',
    pais: g.country,
    ciudad: g.city,
    region: g.region,
    ipAnon,
    tiempoEnPagina: body.tiempoEnPagina ?? '',
    scrollPct: body.scrollPct ?? '',
    clickML: body.clickML || 'No',
    extra: JSON.stringify(body.extra ?? {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
    redirect: 'follow', // Apps Script responde con un redirect a googleusercontent
  });
  if (!res.ok) {
    console.error('[sheets] Apps Script respondió', res.status);
  }
}

export async function POST(req: NextRequest) {
  let body: TrackPayload;
  try {
    body = (await req.json()) as TrackPayload;
  } catch {
    return new Response(null, { status: 204 });
  }

  const ipReal = clientIp(req);
  const ipAnon = anonymizeIp(ipReal);
  const userAgent = req.headers.get('user-agent') || '';

  // Ambos destinos en paralelo; si uno falla, el otro no se ve afectado.
  await Promise.allSettled([
    sendToMeta(body, ipReal, userAgent).catch((e) => console.error('[capi] error:', e)),
    sendToSheets(body, req, ipAnon).catch((e) => console.error('[sheets] error:', e)),
  ]);

  return new Response(null, { status: 204 });
}
