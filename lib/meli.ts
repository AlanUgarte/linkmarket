import { Product } from './types';
import { computeDiscount } from './utils';
import { REVALIDATE_SECONDS } from './constants';

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
 * Precio en vivo para productos SIN catálogo (perfumes, maquillaje, etc.),
 * resolviendo el link de afiliado y leyendo la tarjeta destacada de la tienda
 * — que es exactamente el producto que ve el comprador al abrir el link.
 * Así el precio coincide siempre con el listado real, no con el ganador de un
 * catálogo (que suele ser otro vendedor).
 */
async function fetchLinkOffer(link: string): Promise<MeliOffer | null> {
  try {
    const res = await fetch(link, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
      redirect: 'follow',
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const idx = html.indexOf('rl-card-featured');
    if (idx < 0) return null;
    const seg = html.slice(idx, idx + 15000);
    const toNum = (s?: string) => (s ? parseInt(s.replace(/\./g, ''), 10) : NaN);

    const prevM = seg.match(/andes-money-amount--previous[\s\S]{0,300}?money-amount__fraction[^>]*>([\d.]+)/);
    const curM =
      seg.match(/poly-price__current[\s\S]{0,400}?money-amount__fraction[^>]*>([\d.]+)/) ||
      seg.match(/money-amount__fraction[^>]*>([\d.]+)/);

    const price = toNum(curM?.[1]);
    if (!Number.isFinite(price) || price <= 0) return null;
    const original = toNum(prevM?.[1]);
    const free = /poly-shipping--(free|full|same_day)|Llega gratis|Env[íi]o gratis/i.test(seg);

    return {
      price,
      original_price: Number.isFinite(original) && original > price ? original : null,
      shipping: { free_shipping: free },
    };
  } catch {
    return null;
  }
}

function applyOffer(p: Product, m: MeliOffer | null): Product {
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
}

/**
 * Pisa precio, precio anterior, descuento y envío gratis con los datos EN VIVO
 * de Mercado Libre para TODOS los productos:
 *  - con CatalogId → API oficial de catálogo (electrónica, electro, etc.).
 *  - sin CatalogId pero con link → se resuelve el link y se lee su precio real
 *    (perfumes, maquillaje: catálogos con muchos revendedores).
 * Si algo falla, el producto conserva los valores de la planilla — nunca rompe.
 */
export async function syncWithMeli(products: Product[]): Promise<Product[]> {
  try {
    const token = await getAppToken();

    // Catálogo (requiere token): un fetch por CatalogId único.
    const catIds = token ? [...new Set(products.map((p) => p.catalogId).filter(Boolean))] : [];
    const catOffers = new Map<string, MeliOffer | null>(
      await Promise.all(
        catIds.map(async (cid): Promise<[string, MeliOffer | null]> => [cid, await fetchOffer(cid, token!)])
      )
    );

    // Link (no requiere token): un fetch por link de los productos sin catálogo.
    const linkProducts = products.filter((p) => !p.catalogId && /meli\.la\//.test(p.linkAfiliado));
    const linkOffers = new Map<string, MeliOffer | null>(
      await Promise.all(
        linkProducts.map(async (p): Promise<[string, MeliOffer | null]> => [p.linkAfiliado, await fetchLinkOffer(p.linkAfiliado)])
      )
    );

    return products.map((p) => {
      if (p.catalogId) return applyOffer(p, catOffers.get(p.catalogId) ?? null);
      return applyOffer(p, linkOffers.get(p.linkAfiliado) ?? null);
    });
  } catch (error) {
    console.error('[meli] Error sincronizando con Mercado Libre:', error);
    return products;
  }
}
