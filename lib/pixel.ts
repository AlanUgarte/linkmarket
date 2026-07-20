'use client';

import { Product } from './types';
import { META_PIXEL_ID } from './constants';

/**
 * Capa de eventos del Meta Pixel. Todas las funciones son no-op seguras si el
 * pixel no está cargado (SSR, ad-blocker, o META_PIXEL_ID vacío), así nunca
 * rompen la UI. Los eventos estándar (ViewContent, Search, AddToWishlist,
 * InitiateCheckout) son los que Meta puede usar para optimizar campañas; los
 * custom (OutboundClick, ViewCategory) sirven para reportes finos en Ads Manager.
 */

const CURRENCY = 'ARS';

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (!META_PIXEL_ID || typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? (window.fbq as Fbq) : null;
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
  const q = fbq();
  if (!q) return;
  const id = contentId(p);
  if (viewed.has(id)) return;
  viewed.add(id);
  q('track', 'ViewContent', contentParams(p));
}

/** El usuario guardó el producto en favoritos (solo al agregar, no al quitar). */
export function trackAddToWishlist(p: Product) {
  const q = fbq();
  if (!q) return;
  q('track', 'AddToWishlist', contentParams(p));
}

/** Búsqueda dentro del sitio. */
export function trackSearch(query: string) {
  const q = fbq();
  if (!q || !query.trim()) return;
  q('track', 'Search', { search_string: query.trim() });
}

/** Vista de una categoría (evento custom para reporting). */
export function trackViewCategory(name: string) {
  const q = fbq();
  if (!q) return;
  q('trackCustom', 'ViewCategory', { category: name });
}

/**
 * Click en "Ver en Mercado Libre": es la conversión más fuerte que este sitio
 * puede medir (la compra real ocurre en ML y no la vemos). Disparamos el
 * estándar InitiateCheckout —optimizable como intención de compra— más un
 * custom OutboundClick para reportes granulares.
 */
export function trackOutboundClick(p: Product) {
  const q = fbq();
  if (!q) return;
  const params = contentParams(p);
  q('track', 'InitiateCheckout', params);
  q('trackCustom', 'OutboundClick', {
    ...params,
    destination: 'mercadolibre',
  });
}
