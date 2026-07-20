'use client';

import { Product } from './types';
import { META_PIXEL_ID } from './constants';

/**
 * Capa de eventos del Meta Pixel. Cada evento se emite por DOS canales con el
 * mismo event_id para que Meta los deduplique:
 *   1. Pixel del navegador (fbq) — inmediato, con datos del cliente.
 *   2. Conversions API (server-side, vía /api/track) — resistente a ad-blockers,
 *      iOS/ITP y extensiones de privacidad, que suelen tumbar el pixel.
 * Todas las funciones son no-op seguras si el pixel no está cargado (SSR,
 * ad-blocker o META_PIXEL_ID vacío): nunca rompen la UI.
 */

const CURRENCY = 'ARS';

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (!META_PIXEL_ID || typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? (window.fbq as Fbq) : null;
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** _fbc a partir del fbclid de la URL, si Meta todavía no seteó la cookie. */
function fbcFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

/**
 * Espeja el evento a la Conversions API (server-side). Fire-and-forget: usa
 * keepalive para que sobreviva a la navegación y jamás bloquea la UI.
 */
function sendToCapi(eventName: string, eventId: string, customData: Record<string, unknown>) {
  if (!META_PIXEL_ID || typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      custom_data: customData,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc') || fbcFromUrl(),
    });
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca romper la UI por analytics */
  }
}

/** Emite el evento por pixel + CAPI con un event_id compartido (deduplicación). */
function emit(kind: 'track' | 'trackCustom', eventName: string, customData: Record<string, unknown> = {}) {
  if (!META_PIXEL_ID) return;
  const eventId = newEventId();
  const q = fbq();
  if (q) q(kind, eventName, customData, { eventID: eventId });
  sendToCapi(eventName, eventId, customData);
}

/** ID de contenido: preferimos el itemId de ML (MLA...) para que matchee con el catálogo. */
function contentId(p: Product): string {
  return p.itemId || p.id;
}

/** Parámetros de contenido estándar de Meta para un producto. */
function contentParams(p: Product) {
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

// Evita disparar ViewContent repetido para el mismo producto en la misma vista.
const viewed = new Set<string>();

/** Se llama al cambiar de ruta para volver a contar impresiones en la página nueva. */
export function resetViewContentDedup() {
  viewed.clear();
}

/** El producto entró en viewport (impresión real de catálogo). */
export function trackViewContent(p: Product) {
  if (!META_PIXEL_ID) return;
  const id = contentId(p);
  if (viewed.has(id)) return;
  viewed.add(id);
  emit('track', 'ViewContent', contentParams(p));
}

/** El usuario guardó el producto en favoritos (solo al agregar, no al quitar). */
export function trackAddToWishlist(p: Product) {
  emit('track', 'AddToWishlist', contentParams(p));
}

/** Búsqueda dentro del sitio. */
export function trackSearch(query: string) {
  if (!query.trim()) return;
  emit('track', 'Search', { search_string: query.trim() });
}

/** Vista de una categoría (evento custom para reporting). */
export function trackViewCategory(name: string) {
  emit('trackCustom', 'ViewCategory', { category: name });
}

/**
 * Click en "Ver en Mercado Libre": es la conversión más fuerte que este sitio
 * puede medir (la compra real ocurre en ML y no la vemos). Disparamos el
 * estándar InitiateCheckout —optimizable como intención de compra— más un
 * custom OutboundClick para reportes granulares.
 */
export function trackOutboundClick(p: Product) {
  const params = contentParams(p);
  emit('track', 'InitiateCheckout', params);
  emit('trackCustom', 'OutboundClick', { ...params, destination: 'mercadolibre' });
}
