'use client';

/**
 * API pública de tracking usada por los componentes. Son wrappers finos sobre
 * el motor de analítica (lib/analytics.ts), que se encarga de despachar cada
 * evento a Meta Pixel + Conversions API + Google Sheets con un event_id
 * compartido (deduplicación). Mantener estas firmas estables: hay componentes
 * que las importan directamente.
 */

import { Product } from './types';
import { logEvent } from './analytics';

// Evita disparar ViewContent repetido para el mismo producto en la misma vista.
const viewed = new Set<string>();

/** Se llama al cambiar de ruta para volver a contar impresiones en la página nueva. */
export function resetViewContentDedup() {
  viewed.clear();
}

/** El producto entró en viewport (impresión real de catálogo). */
export function trackViewContent(p: Product) {
  const id = p.itemId || p.id;
  if (viewed.has(id)) return;
  viewed.add(id);
  logEvent('ViewContent', { product: p });
}

/** El usuario guardó el producto en favoritos (solo al agregar, no al quitar). */
export function trackAddToWishlist(p: Product) {
  logEvent('Favorito', { product: p });
}

/** Búsqueda dentro del sitio. */
export function trackSearch(query: string) {
  if (!query.trim()) return;
  logEvent('Busqueda', { search: query.trim(), extra: { query: query.trim() } });
}

/** Cambio de orden/filtro en el listado. */
export function trackFilter(value: string) {
  logEvent('Filtro', { extra: { filtro: value } });
}

/** Vista/entrada a una categoría. */
export function trackViewCategory(name: string) {
  logEvent('ClickCategoria', { category: name });
}

/**
 * Click en "Ver en Mercado Libre": la conversión más fuerte que este sitio
 * puede medir (la compra real ocurre en ML). Se mapea al estándar
 * InitiateCheckout de Meta, optimizable como intención de compra.
 */
export function trackOutboundClick(p: Product) {
  logEvent('ClickMercadoLibre', { product: p, destinationUrl: p.linkAfiliado });
}
