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
  tags?: string[];
  official_store_id?: number | null;
}

/**
 * Precio en vivo de un producto de catálogo: el primer resultado de
 * /products/{id}/items es el ganador actual del buy box, que es la
 * publicación a la que ML manda al comprador cuando abre el link.
 * (Los /items individuales están vedados para apps de afiliados; el
 * catálogo es el único camino autorizado, y además es el correcto.)
 */
async function fetchOffer(catalogId: string, token: string): Promise<MeliOffer | null> {
  // 5 min de cache: una vez resuelto, el precio no se re-pide en cada
  // regeneración, así el presupuesto alcanza para cubrir TODOS los productos.
  const auth = { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } };
  // 1) Ganador del buy-box = EXACTAMENTE el precio que muestra la página del
  // producto al comprador (no siempre es el item más barato del catálogo).
  const prod = await fetch(`${PRODUCTS_URL}/${catalogId}`, auth);
  if (prod.ok) {
    const d = await prod.json();
    const w = d?.buy_box_winner;
    if (w && typeof w.price === 'number') return w;
  }
  // 2) Fallback: sin buy_box_winner, /items no viene ordenado por relevancia.
  //   a) Se descartan las publicaciones SIN STOCK (tag
  //      `meli_facilities_out_of_stock`) — pueden traer un precio fantasma
  //      que el comprador nunca ve.
  //   b) Entre las disponibles, ML suele mostrar como ganadora la de tienda
  //      oficial aunque haya un particular más barato — PERO solo cuando el
  //      premio es razonable (~35%): un salto mayor casi siempre es una
  //      variante/pack distinto agrupado bajo el mismo catálogo, no la misma
  //      publicación a mayor precio. En ese caso se descarta y se usa la más
  //      barata disponible, sea o no de tienda oficial.
  const res = await fetch(`${PRODUCTS_URL}/${catalogId}/items`, auth);
  if (!res.ok) return null;
  const data = await res.json();
  const items: MeliOffer[] = (data?.results ?? []).filter((it: MeliOffer) => typeof it.price === 'number');
  const conStock = items.filter((it) => !it.tags?.includes('meli_facilities_out_of_stock'));
  const pool = conStock.length > 0 ? conStock : items;
  const min = pool.reduce<MeliOffer | null>((m, it) => (!m || it.price! < m.price!) ? it : m, null);
  const oficialesRazonables = pool.filter(
    (it) => it.official_store_id != null && min && it.price! <= min.price! * 1.35
  );
  const oficialMasBarata = oficialesRazonables.reduce<MeliOffer | null>(
    (m, it) => (!m || it.price! < m.price!) ? it : m,
    null
  );
  const winner = oficialMasBarata ?? min;
  return winner && typeof winner.price === 'number' ? winner : null;
}

/**
 * Precio en vivo para productos SIN catálogo (perfumes, maquillaje, etc.),
 * resolviendo el link de afiliado y leyendo la tarjeta destacada de la tienda
 * — que es exactamente el producto que ve el comprador al abrir el link.
 * Así el precio coincide siempre con el listado real, no con el ganador de un
 * catálogo (que suele ser otro vendedor).
 */
/**
 * Extrae precio/anterior/envío de la tarjeta destacada de una página de tienda
 * de afiliado. Función pura (sin red) para poder testearla — ver demo() abajo.
 * Las aria-label "Ahora:"/"Antes:" son inequívocas (locale es_AR): con
 * descuento vienen ambas; sin descuento no hay ninguna y se toma el primer
 * precio de la tarjeta (antes de las cuotas, que también tienen aria-label).
 */
export function parseFeaturedOffer(html: string): MeliOffer | null {
  const idx = html.indexOf('rl-card-featured');
  if (idx < 0) return null;
  // Acotar a la PRIMERA tarjeta (el producto destacado): hasta el título del
  // 2do producto. Cada card tiene un solo `poly-component__title` (a diferencia
  // de "poly-card", que matchea sub-elementos). Así ningún precio de una
  // recomendación de abajo se cuela como el del destacado.
  const after = html.slice(idx, idx + 40000);
  const t1 = after.indexOf('poly-component__title');
  const t2 = t1 >= 0 ? after.indexOf('poly-component__title', t1 + 10) : -1;
  const seg = t2 > 0 ? after.slice(0, t2) : after.slice(0, 20000);

  // Precio actual: en `poly-price__current` si hay descuento; si no, el primer
  // precio de la tarjeta, antes de las cuotas.
  let price: number;
  const curM = seg.match(/poly-price__current[\s\S]{0,400}?aria-label="(?:Ahora: )?(\d+) pesos/);
  if (curM) {
    price = parseInt(curM[1], 10);
  } else {
    const preCuotas = seg.split(/poly-price__installments|installments|cuotas/i)[0];
    const simple = preCuotas.match(/aria-label="(\d+) pesos/);
    if (!simple) return null;
    price = parseInt(simple[1], 10);
  }
  if (!Number.isFinite(price) || price <= 0) return null;

  // "Antes:" (tachado) dentro de la tarjeta destacada = precio anterior real.
  const antesM = seg.match(/aria-label="Antes: (\d+) pesos/);
  const original = antesM ? parseInt(antesM[1], 10) : null;
  const free = /poly-shipping--(free|full|same_day)|Llega gratis|Env[íi]o gratis/i.test(seg);

  return {
    price,
    original_price: original && original > price ? original : null,
    shipping: { free_shipping: free },
  };
}

async function fetchLinkOffer(link: string): Promise<MeliOffer | null> {
  try {
    const res = await fetch(link, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
      redirect: 'follow',
      // 1 hora (no 60s): con 200+ productos, refrescar todos los links en cada
      // regeneración excede el tiempo de la función y la página queda STALE.
      // Con 1h, la mayoría de las regeneraciones pegan en el data cache (rápido)
      // y los precios de link se renuevan gradualmente.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return parseFeaturedOffer(await res.text());
  } catch {
    return null;
  }
}

/**
 * Ejecuta tareas con concurrencia limitada y un presupuesto de tiempo global.
 * Lo que no llega a resolverse dentro del presupuesto queda como null (el
 * producto conserva el precio de la planilla) — el data cache de Next hace que
 * en la próxima regeneración esas mismas consultas sean instantáneas.
 */
async function resolveWithBudget<K>(
  keys: K[],
  task: (key: K) => Promise<MeliOffer | null>,
  { concurrency, budgetMs }: { concurrency: number; budgetMs: number }
): Promise<Map<K, MeliOffer | null>> {
  const results = new Map<K, MeliOffer | null>();
  let next = 0;
  const worker = async () => {
    while (next < keys.length) {
      const key = keys[next++];
      results.set(key, await task(key));
    }
  };
  const all = Promise.all(Array.from({ length: Math.min(concurrency, keys.length) }, worker));
  await Promise.race([all, new Promise((r) => setTimeout(r, budgetMs))]);
  return results;
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
 *  - con CatalogId → API oficial de catálogo (buy-box winner): es EXACTAMENTE
 *    el precio que se ve en `linkProducto` (la página /p/MLA... a la que el
 *    botón manda al visitante), sea cual sea el vendedor ganador — es la
 *    fuente en vivo más confiable porque refleja la página de destino real.
 *  - sin CatalogId (o si el catálogo no resolvió) → se lee la tarjeta
 *    destacada del link de afiliado. OJO: esa tarjeta la sirve una caché de
 *    recomendaciones de ML que puede quedar desactualizada por días —
 *    por eso NO es la fuente primaria cuando hay catálogo disponible.
 * Si algo falla, el producto conserva los valores de la planilla — nunca rompe.
 */
export async function syncWithMeli(products: Product[]): Promise<Product[]> {
  try {
    // 1) Catálogo (fuente primaria para productos con CatalogId).
    const token = await getAppToken();
    const catIds = token ? [...new Set(products.map((p) => p.catalogId).filter(Boolean))] : [];
    const catOffers = await resolveWithBudget(catIds, (cid) => fetchOffer(cid, token!), {
      concurrency: 15,
      budgetMs: 20000,
    });

    // 2) Tarjeta: para productos SIN catálogo, y de respaldo si el catálogo
    // no resolvió para alguno.
    const needCard = products.filter((p) => !p.catalogId || !catOffers.get(p.catalogId));
    const links = [...new Set(needCard.map((p) => p.linkAfiliado).filter((l) => /meli\.la\//.test(l)))];
    const linkOffers = await resolveWithBudget(links, fetchLinkOffer, {
      concurrency: 12,
      budgetMs: 20000,
    });

    return products.map((p) => {
      if (p.catalogId) {
        const cat = catOffers.get(p.catalogId);
        if (cat) return applyOffer(p, cat);
      }
      const card = linkOffers.get(p.linkAfiliado);
      if (card) return applyOffer(p, card);
      return p;
    });
  } catch (error) {
    console.error('[meli] Error sincronizando con Mercado Libre:', error);
    return products;
  }
}
