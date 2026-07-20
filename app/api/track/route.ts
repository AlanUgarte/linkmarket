import { NextRequest } from 'next/server';
import { META_PIXEL_ID } from '@/lib/constants';

// Recibe eventos del cliente y los reenvía a la Conversions API de Meta
// (server-side). Depende de headers de request → siempre dinámico, nunca cacheado.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';

interface TrackPayload {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
  fbp?: string;
  fbc?: string;
}

/** IP real del visitante detrás del proxy de Vercel. */
function clientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || undefined;
}

export async function POST(req: NextRequest) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  // Sin token o sin pixel, la CAPI está apagada: respondemos 204 y no rompemos nada.
  // El pixel del navegador sigue funcionando igual.
  if (!token || !META_PIXEL_ID) {
    return new Response(null, { status: 204 });
  }

  let body: TrackPayload;
  try {
    body = (await req.json()) as TrackPayload;
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!body.event_name || !body.event_id) {
    return new Response(null, { status: 204 });
  }

  const userData: Record<string, unknown> = {
    client_user_agent: req.headers.get('user-agent') || undefined,
    client_ip_address: clientIp(req),
  };
  if (body.fbp) userData.fbp = body.fbp;
  if (body.fbc) userData.fbc = body.fbc;

  const event = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id, // mismo id que el pixel → Meta deduplica
    action_source: 'website',
    event_source_url: body.event_source_url,
    user_data: userData,
    custom_data: body.custom_data ?? {},
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error('[capi] Meta respondió', res.status, detail.slice(0, 300));
      return new Response(null, { status: 202 });
    }
  } catch (error) {
    console.error('[capi] Error enviando a Meta:', error);
    return new Response(null, { status: 202 });
  }

  return new Response(null, { status: 204 });
}
