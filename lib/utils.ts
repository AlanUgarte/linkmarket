import { Product, ProductRaw } from './types';

/** Normaliza texto para comparar/generar slugs: minúsculas, sin tildes, sin espacios raros */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/** Parsea números que pueden venir con $, puntos de miles y comas decimales (formato AR) */
export function parseMoney(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value
    .toString()
    .replace(/\$/g, '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toString().trim().toLowerCase();
  return v === 'true' || v === 'si' || v === 'sí' || v === '1' || v === 'x' || v === 'yes';
}

export function parseIntSafe(value: string | undefined, fallback = 0): number {
  const n = parseInt((value || '').toString().replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? fallback : n;
}

/** Formatea un número como precio en pesos argentinos, sin decimales innecesarios */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Calcula el % de descuento real a partir de precio y precio anterior, si no vino seteado */
export function computeDiscount(precio: number, precioAnterior: number | null): number {
  if (!precioAnterior || precioAnterior <= precio) return 0;
  return Math.round(((precioAnterior - precio) / precioAnterior) * 100);
}

/**
 * Convierte una fila cruda de Google Sheets en un Product tipado y listo para usar.
 * Cualquier columna faltante cae en un default seguro en lugar de romper el build.
 */
export function normalizeProduct(raw: ProductRaw, index: number): Product {
  const precio = parseMoney(raw.Precio);
  const precioAnteriorNum = parseMoney(raw.PrecioAnterior);
  const precioAnterior = precioAnteriorNum > precio ? precioAnteriorNum : null;
  const descuentoSheet = parseIntSafe(raw.Descuento, 0);
  const descuento = descuentoSheet > 0 ? descuentoSheet : computeDiscount(precio, precioAnterior);
  const categoriaNombre = (raw.Categoria || '').trim();

  return {
    id: `${slugify(categoriaNombre)}-${slugify(raw.Nombre || 'producto')}-${index}`,
    categoria: categoriaNombre,
    categoriaSlug: slugify(categoriaNombre),
    nombre: (raw.Nombre || '').trim(),
    descripcion: (raw.Descripcion || '').trim(),
    precio,
    precioAnterior,
    descuento,
    imagen: (raw.Imagen || '').trim(),
    linkAfiliado: (raw.LinkAfiliado || '').trim(),
    activo: raw.Activo === undefined ? true : parseBool(raw.Activo),
    orden: parseIntSafe(raw.Orden, index),
    destacado: parseBool(raw.Destacado),
    masVendido: parseBool(raw.MasVendido),
    fechaAgregado: raw.FechaAgregado ? raw.FechaAgregado.trim() : null,
    envioGratis: parseBool(raw.EnvioGratis),
    itemId: (raw.ItemId || '').trim().toUpperCase(),
    catalogId: (raw.CatalogId || '').trim().toUpperCase(),
    etiqueta: (raw.Etiqueta || '').trim(),
  };
}

/**
 * Agrega (o preserva) el parámetro de afiliado en el link de Mercado Libre.
 * Nunca debe perderse: si el link ya trae query params, se concatena con "&".
 */
export function ensureAffiliateLink(link: string): string {
  if (!link) return '#';
  try {
    // Ya es una URL completa con o sin parámetros: se devuelve tal cual,
    // porque el link de afiliado completo ya viene armado desde el Sheet.
    new URL(link);
    return link;
  } catch {
    return '#';
  }
}
