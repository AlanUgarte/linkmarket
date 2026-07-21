'use client';

/**
 * Motor de analítica propia de LinkMarket.
 *
 * Cada evento se despacha SIMULTÁNEAMENTE a tres destinos, con un `event_id`
 * compartido para deduplicar en Meta:
 *   1. Meta Pixel (navegador)      → inmediato
 *   2. Meta Conversions API        → server-side, vía /api/track
 *   3. Google Sheets (Apps Script) → server-side, vía /api/track
 *
 * El cliente arma todo el contexto que sólo el navegador conoce (UTM, device,
 * sesión, scroll, tiempo, referrer); el servidor lo enriquece con geo/IP y lo
 * reparte. Todo es no-op seguro: si algo falla, nunca rompe la UI.
 */

import { Product } from './types';
import { META_PIXEL_ID } from './constants';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Nombres canónicos de evento (los que se guardan en la pestaña Eventos). */
export type EventName =
  | 'PageView'
  | 'ViewContent'
  | 'Scroll25'
  | 'Scroll50'
  | 'Scroll75'
  | 'Scroll100'
  | 'Tiempo30'
  | 'Tiempo60'
  | 'Tiempo120'
  | 'ClickCategoria'
  | 'Busqueda'
  | 'Filtro'
  | 'ClickMercadoLibre'
  | 'Favorito'
  | 'Error';

interface EventInput {
  product?: Product | null;
  category?: string;
  destinationUrl?: string;
  /** Datos extra para Meta custom_data y/o para la fila del Sheet. */
  search?: string;
  extra?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Mapeo evento canónico → evento de Meta
// ---------------------------------------------------------------------------

/** std=true usa `track` (evento estándar optimizable); std=false usa `trackCustom`. */
const META_MAP: Record<EventName, { name: string; std: boolean }> = {
  PageView: { name: 'PageView', std: true },
  ViewContent: { name: 'ViewContent', std: true },
  Busqueda: { name: 'Search', std: true },
  ClickCategoria: { name: 'ViewCategory', std: false },
  ClickMercadoLibre: { name: 'InitiateCheckout', std: true },
  Favorito: { name: 'AddToWishlist', std: true },
  Filtro: { name: 'Filtro', std: false },
  Scroll25: { name: 'Scroll25', std: false },
  Scroll50: { name: 'Scroll50', std: false },
  Scroll75: { name: 'Scroll75', std: false },
  Scroll100: { name: 'Scroll100', std: false },
  Tiempo30: { name: 'Tiempo30', std: false },
  Tiempo60: { name: 'Tiempo60', std: false },
  Tiempo120: { name: 'Tiempo120', std: false },
  Error: { name: 'Error', std: false },
};

// ---------------------------------------------------------------------------
// Helpers de bajo nivel
// ---------------------------------------------------------------------------

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (!META_PIXEL_ID || typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? (window.fbq as Fbq) : null;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Identidad anónima: usuario persistente + sesión (30 min de inactividad)
// ---------------------------------------------------------------------------

const UID_KEY = 'lm_uid';
const SID_KEY = 'lm_sid';
const SID_TS_KEY = 'lm_sid_ts';
const SESSION_MAX_IDLE = 30 * 60 * 1000; // 30 minutos

/** ID anónimo persistente del visitante (sin datos personales). */
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let uid = readCookie(UID_KEY) || window.localStorage.getItem(UID_KEY) || '';
  if (!uid) {
    uid = 'u_' + newId();
    try {
      window.localStorage.setItem(UID_KEY, uid);
    } catch {
      /* localStorage puede estar bloqueado */
    }
    writeCookie(UID_KEY, uid, 60 * 60 * 24 * 365 * 2); // 2 años
  }
  return uid;
}

/** ID de sesión: se renueva tras 30 min de inactividad. */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const now = Date.now();
  const last = Number(readCookie(SID_TS_KEY) || 0);
  let sid = readCookie(SID_KEY) || '';
  if (!sid || now - last > SESSION_MAX_IDLE) {
    sid = 's_' + newId();
  }
  writeCookie(SID_KEY, sid, SESSION_MAX_IDLE / 1000);
  writeCookie(SID_TS_KEY, String(now), SESSION_MAX_IDLE / 1000);
  return sid;
}

// ---------------------------------------------------------------------------
// Contexto del navegador: UTM, device, referrer
// ---------------------------------------------------------------------------

const UTM_KEY = 'lm_utm';

interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  gclid?: string;
}

/**
 * Lee UTMs (y fbclid/gclid) de la URL y los persiste por sesión, así se
 * atribuyen todos los eventos aunque el usuario navegue a URLs sin parámetros.
 */
function getAttribution(): Utm {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
    term: params.get('utm_term') || undefined,
    fbclid: params.get('fbclid') || undefined,
    gclid: params.get('gclid') || undefined,
  };
  const hasAny = Object.values(fromUrl).some(Boolean);
  if (hasAny) {
    try {
      window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  try {
    const stored = window.sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as Utm;
  } catch {
    /* ignore */
  }
  return {};
}

interface DeviceInfo {
  type: string;
  os: string;
  browser: string;
  screen: string;
  language: string;
}

/** Detección liviana de dispositivo/OS/navegador a partir del User-Agent. */
function getDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: '', os: '', browser: '', screen: '', language: '' };
  }
  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua);
  const type = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

  let os = 'Otro';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Otro';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  return {
    type,
    os,
    browser,
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || '',
  };
}

// ---------------------------------------------------------------------------
// Métricas de página: tiempo y scroll (las mantiene AnalyticsTracker)
// ---------------------------------------------------------------------------

let pageEnteredAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
let maxScrollPct = 0;

/** Reinicia las métricas al cambiar de ruta (SPA). */
export function resetPageMetrics() {
  pageEnteredAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  maxScrollPct = 0;
}

export function setScrollPct(pct: number) {
  if (pct > maxScrollPct) maxScrollPct = Math.min(100, Math.round(pct));
}

function timeOnPageSec(): number {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return Math.round((now - pageEnteredAt) / 1000);
}

// ---------------------------------------------------------------------------
// Núcleo: construir custom_data de Meta y despachar a los 3 destinos
// ---------------------------------------------------------------------------

const CURRENCY = 'ARS';

function contentId(p: Product): string {
  return p.itemId || p.id;
}

/** custom_data estándar de Meta para un producto. */
function metaProductData(p: Product) {
  const id = contentId(p);
  return {
    content_ids: [id],
    content_name: p.nombre,
    content_type: 'product',
    content_category: p.categoria,
    contents: [{ id, quantity: 1, item_price: p.precio }],
    value: p.precio,
    currency: CURRENCY,
  };
}

/** Envía el evento al backend, que lo reparte a CAPI + Google Sheets. */
function sendToBackend(eventName: EventName, eventId: string, metaEventName: string, metaData: Record<string, unknown>, input: EventInput) {
  if (typeof window === 'undefined') return;
  const device = getDevice();
  const utm = getAttribution();
  const p = input.product ?? null;

  const payload = {
    event: eventName,
    event_id: eventId,
    metaEventName,
    customData: metaData,
    // Datos para la fila de Google Sheets
    timestamp: Date.now(),
    producto: p ? p.nombre : input.extra?.producto ?? '',
    categoria: input.category ?? (p ? p.categoria : '') ?? '',
    precio: p ? p.precio : '',
    urlActual: window.location.href,
    urlDestino: input.destinationUrl ?? '',
    usuario: getUserId(),
    sessionId: getSessionId(),
    utm,
    referrer: document.referrer || '',
    device,
    tiempoEnPagina: timeOnPageSec(),
    scrollPct: maxScrollPct,
    clickML: eventName === 'ClickMercadoLibre' ? 'Sí' : 'No',
    extra: input.extra ?? {},
    // Cookies de Meta para el matching de la CAPI
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
  };

  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca romper por analytics */
  }
}

/**
 * Punto de entrada único: dispara el pixel del navegador y despacha a backend
 * (CAPI + Sheets) con el mismo event_id.
 */
export function logEvent(name: EventName, input: EventInput = {}) {
  if (!META_PIXEL_ID) return;
  const eventId = newId();
  const map = META_MAP[name];

  // custom_data de Meta: producto + búsqueda + extras
  let metaData: Record<string, unknown> = {};
  if (input.product) metaData = { ...metaProductData(input.product) };
  if (input.category) metaData.content_category = input.category;
  if (input.search) metaData.search_string = input.search;
  if (input.extra) metaData = { ...metaData, ...input.extra };

  // 1) Pixel del navegador
  const q = fbq();
  if (q) q(map.std ? 'track' : 'trackCustom', map.name, metaData, { eventID: eventId });

  // 2) + 3) CAPI y Google Sheets (server-side)
  sendToBackend(name, eventId, map.name, metaData, input);
}
