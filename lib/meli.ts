import { Product } from './types';
import { computeDiscount } from './utils';

const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const PRODUCTS_URL = 'https://api.mercadolibre.com/products';

// Token de aplicación cacheado en memoria (dura ~6hs; se renueva solo).
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string | null> {
  const id = process.env.ML_CLIENT_ID;
  const secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) return null; // sin credenciales, la sincronización se apaga sola

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${id}&client_secret=${encodeURIComponent(secret)}`,
    // Cacheado por Next: el token dura 6hs, renovarlo cada 1h alcanza y evita
    // marcar como dinámicas a las páginas estáticas (ISR) que lo usan.
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Token de ML respondió ${res.status}`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 21600) * 1000,
  };
  return cachedToken.token;
}

interface MeliOffer {
  price?: number;
  original_price?: number | null;
  shipping?: { free_shipping?: boolean };
}

/**
 * Precio en vivo de un producto de catálogo: el primer resultado de
 * /products/{id}/items es el ganador actual del buy box, que es la
 * publicación a la que ML manda al comprador cuando abre el link.
 * (Los /items individuales están vedados para apps de afiliados; el
 * catálogo es el único camino autorizado, y además es el correcto.)
 */
async function fetchOffer(catalogId: string, token: string): Promise<MeliOffer | null> {
  const res = await fetch(`${PRODUCTS_URL}/${catalogId}/items`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const winner = data?.results?.[0];
  return winner && typeof winner.price === 'number' ? winner : null;
}

/**
 * Pisa precio, precio anterior, descuento y envío gratis con los datos EN VIVO
 * de Mercado Libre, para cada producto que tenga CatalogId en la planilla.
 * Si algo falla (sin credenciales, API caída, producto sin catálogo), el
 * producto conserva los valores de la planilla — nunca rompe el sitio.
 */
export async function syncWithMeli(products: Product[]): Promise<Product[]> {
  try {
    const token = await getAppToken();
    if (!token) return products;

    const ids = [...new Set(products.map((p) => p.catalogId).filter(Boolean))];
    if (ids.length === 0) return products;

    const offers = new Map<string, MeliOffer | null>(
      await Promise.all(
        ids.map(async (cid): Promise<[string, MeliOffer | null]> => [cid, await fetchOffer(cid, token)])
      )
    );

    return products.map((p) => {
      const m = p.catalogId ? offers.get(p.catalogId) : null;
      if (!m || typeof m.price !== 'number') return p;
      const precio = m.price;
      const precioAnterior = m.original_price && m.original_price > precio ? m.original_price : null;
      return {
        ...p,
        precio,
        precioAnterior,
        descuento: computeDiscount(precio, precioAnterior),
        envioGratis: m.shipping?.free_shipping ?? p.envioGratis,
      };
    });
  } catch (error) {
    console.error('[meli] Error sincronizando con Mercado Libre:', error);
    return products;
  }
}
