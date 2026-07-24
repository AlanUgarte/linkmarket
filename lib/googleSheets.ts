import { Product, ProductRaw } from './types';
import { normalizeProduct } from './utils';
import { syncWithMeli } from './meli';
import { REVALIDATE_SECONDS, SHEET_GID } from './constants';
import linkMap from './linkMap.json';
import preciosJson from './precios.json';
import catalogoBackup from './catalogo-backup.json';
import { computeDiscount } from './utils';

// Snapshot completo del catálogo (548 productos con todos sus campos). Se usa
// solo como red de seguridad si la planilla viene rota. Regenerar con:
// scripts/snapshot-catalogo (o guardando /api/products cuando esté sano).
const CATALOGO_BACKUP = catalogoBackup as unknown as Product[];

// Los `meli.la` abren el PERFIL en la web (forceInApp de ML), no el producto.
// Este mapa (armado offline) traduce cada `meli.la` a su link directo de
// producto con el mismo matt_tool de afiliado. La planilla no se toca.
const LINK_MAP = linkMap as Record<string, string>;

// Precios frescos escritos por `scripts/revisar-precios.mjs` (comando "Revisa
// los precios"): { link: [precio, precioAnterior, descuento] }. Se usan como
// precio base en lugar del de la planilla (que puede quedar viejo). La sync en
// vivo con ML los pisa arriba cuando alcanza a resolverlos.
// Tipado como number[] (no tupla): el JSON importado se infiere como number[],
// y castear directo a [number, number, number] rompe el build de tipos.
const PRECIOS = preciosJson as Record<string, number[]>;

function withPrecioFresco(p: Product): Product {
  const fresco = PRECIOS[p.linkAfiliado];
  if (!fresco) return p;
  const [precio, precioAnterior, descuento] = fresco;
  if (!precio) return p;
  return {
    ...p,
    precio,
    precioAnterior: precioAnterior || null,
    descuento: descuento || computeDiscount(precio, precioAnterior || null),
  };
}

/**
 * Resuelve el link del botón al producto y, si es una página de catálogo
 * (`/p/MLA...`), deriva el CatalogId. Así la sincronización de precios usa la
 * API de catálogo (precio del ganador del buy-box = el que ve el comprador),
 * en vez de la tarjeta destacada del afiliado, que suele traer un precio viejo.
 */
function withResolvedLink(p: Product): Product {
  const resolved = LINK_MAP[p.linkAfiliado];
  if (!resolved) return p;
  const catMatch = resolved.match(/\/p\/(MLA\d+)/);
  return {
    ...p,
    linkProducto: resolved,
    catalogId: p.catalogId || (catMatch ? catMatch[1] : p.catalogId),
  };
}

// El orden real de columnas en la hoja de cálculo (deben coincidir con el README).
const SHEET_COLUMN_ORDER: (keyof ProductRaw)[] = [
  'Categoria',
  'Nombre',
  'Descripcion',
  'Precio',
  'PrecioAnterior',
  'Descuento',
  'Imagen',
  'LinkAfiliado',
  'Activo',
  'Orden',
  'Destacado',
  'MasVendido',
  'FechaAgregado',
  'EnvioGratis',
  'ItemId',
  'CatalogId',
  'Etiqueta',
];

// Catálogo editado a mano: se usa mientras no haya Google Sheet configurada.
// Cuando se carguen las credenciales de Google (GOOGLE_SHEET_ID etc.), el sitio
// pasa solo a leer la planilla; ahí estas filas se migran al Sheet y esto se borra.
const LOCAL_CATALOG: ProductRaw[] = [
  {
    Categoria: 'Gaming',
    Nombre: 'Mando Inalámbrico Sony DualSense 1 Para PlayStation 5 Blanco',
    Descripcion: 'Control original PS5 con retroalimentación háptica y gatillos adaptativos. Tienda oficial Mercado Libre.',
    Precio: '129397',
    PrecioAnterior: '177999',
    Descuento: '',
    Imagen: 'https://http2.mlstatic.com/D_NQ_NP_954223-MLA96146757619_102025-O.webp',
    LinkAfiliado: 'https://meli.la/1DStkuw',
    Activo: 'TRUE',
    Orden: '1',
    Destacado: 'TRUE',
    MasVendido: 'TRUE',
    FechaAgregado: '2026-07-10',
    EnvioGratis: 'TRUE',
  },
];

/** Parser de CSV mínimo pero correcto: maneja comillas, comas y saltos de línea dentro de campos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToProducts(rows: string[][]): Product[] {
  return rows
    .filter((row) => row && row.some((cell) => cell !== '' && cell !== undefined))
    .map((row, index) => {
      const raw: Partial<ProductRaw> = {};
      SHEET_COLUMN_ORDER.forEach((col, colIndex) => {
        const cell = row[colIndex];
        (raw as Record<string, string>)[col] = cell === undefined || cell === null ? '' : String(cell);
      });
      return normalizeProduct(raw as ProductRaw, index);
    })
    .filter((p) => p.activo && p.nombre)
    .sort((a, b) => a.orden - b.orden);
}

/**
 * Lee la hoja pública ("cualquiera con el enlace puede ver") como CSV.
 * No requiere credenciales ni Google Cloud: usa el export CSV de Google Sheets.
 * Se usa /export (no /gviz) porque gviz infiere tipos por columna y vacía las
 * celdas que no coinciden (ej. "TRUE" texto vs booleano) — export devuelve
 * siempre el valor visible. El fetch nativo de Next.js cachea con ISR.
 */
export async function fetchProductsFromSheet(): Promise<Product[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${SHEET_GID}`;

  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) {
    throw new Error(`La planilla respondió ${response.status}. ¿Sigue compartida como "cualquiera con el enlace"?`);
  }

  const rows = parseCsv(await response.text());
  // La fila 1 son los encabezados: se salta. gviz a veces la omite si la marca como header.
  const dataRows = rows.length > 0 && rows[0][0]?.trim().toLowerCase() === 'categoria' ? rows.slice(1) : rows;
  return rowsToProducts(dataRows);
}

// Cantidad mínima de productos con link válido para confiar en la planilla.
// Si devuelve menos (planilla vaciada, pestaña equivocada, estructura rota),
// se usa el backup del catálogo para que el sitio NUNCA se rompa.
const MIN_PRODUCTOS = 200;

/** Punto único de acceso a los productos, cacheado por Next.js con ISR. */
export async function getProducts(): Promise<Product[]> {
  let products: Product[];
  // Sin planilla configurada, el catálogo local de arriba es la fuente de datos.
  if (!process.env.GOOGLE_SHEET_ID) {
    products = rowsToProducts(LOCAL_CATALOG.map((r) => SHEET_COLUMN_ORDER.map((c) => r[c] ?? '')));
  } else {
    try {
      products = await fetchProductsFromSheet();
    } catch (error) {
      console.error('[googleSheets] Error obteniendo productos, usando backup:', error);
      products = [];
    }
    // Red de seguridad: si la planilla vino rota/vacía/con otra estructura, usar
    // el backup del catálogo (snapshot de los 548 productos completos).
    const validos = products.filter((p) => /meli\.la\//.test(p.linkAfiliado)).length;
    if (validos < MIN_PRODUCTOS) {
      console.error(`[googleSheets] Planilla con ${validos} productos válidos (<${MIN_PRODUCTOS}). Usando backup.`);
      products = CATALOGO_BACKUP;
    }
  }
  // 1) Precio base fresco (de la última "Revisa los precios") en vez del de la
  //    planilla. 2) Resolver link del botón + CatalogId. 3) Sync en vivo arriba.
  const resolved = products.map(withPrecioFresco).map(withResolvedLink);
  return syncWithMeli(resolved);
}

export const SHEETS_REVALIDATE = REVALIDATE_SECONDS;
