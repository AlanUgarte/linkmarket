import { Category } from './types';

/**
 * Fuente única de verdad para las categorías del sitio.
 * El "slug" debe coincidir (en minúsculas, sin tildes) con lo que se
 * escriba en la columna "Categoria" de Google Sheets, salvo las
 * categorías virtuales (ofertas del día / más vendidos) que se calculan
 * a partir de otras columnas.
 */
export const CATEGORIES: Category[] = [
  { slug: 'auto', nombre: 'Auto', emoji: '🚗', descripcion: 'Accesorios, repuestos y tecnología para tu vehículo.' },
  { slug: 'hogar', nombre: 'Hogar', emoji: '🏠', descripcion: 'Todo para que tu casa funcione mejor.' },
  { slug: 'tecnologia', nombre: 'Tecnología', emoji: '💡', descripcion: 'Lo último en tecnología, seleccionado a mano.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'televisores', nombre: 'Televisores', emoji: '📺', descripcion: 'Smart TVs y televisores al mejor precio.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'filmadoras-y-camaras-de-accion', nombre: 'Filmadoras y Cámaras de Acción', emoji: '📹', descripcion: 'Cámaras de acción, deportivas y filmadoras.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'auriculares', nombre: 'Auriculares', emoji: '🎧', descripcion: 'Auriculares inalámbricos, in-ear y gamer.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'celulares', nombre: 'Celulares', emoji: '📱', descripcion: 'Celulares y accesorios al mejor precio.' },
  { slug: 'computacion', nombre: 'Computación', emoji: '💻', descripcion: 'PC armadas, componentes, monitores y periféricos.' },
  { slug: 'gadgets', nombre: 'Gadgets', emoji: '🔌', descripcion: 'Accesorios y gadgets que se hacen virales.' },
  { slug: 'cocina', nombre: 'Cocina', emoji: '🍳', descripcion: 'Herramientas de cocina que sí valen la pena.' },
  { slug: 'mascotas', nombre: 'Mascotas', emoji: '🐶', descripcion: 'Todo para consentir a tu mejor amigo.' },
  { slug: 'herramientas', nombre: 'Herramientas', emoji: '🛠', descripcion: 'Herramientas profesionales al mejor precio.' },
  { slug: 'gaming', nombre: 'Gaming', emoji: '🎮', descripcion: 'Setup, periféricos y accesorios gamer.' },
  { slug: 'bebes', nombre: 'Bebés', emoji: '👶', descripcion: 'Todo lo esencial para los más chicos.' },
  { slug: 'deportes', nombre: 'Deportes', emoji: '🏃', descripcion: 'Equipamiento para moverte mejor.' },
  { slug: 'perfumes-hombre', nombre: 'Perfumes Hombre', emoji: '🧔', descripcion: 'Fragancias masculinas originales al mejor precio.', grupo: 'Perfumes', grupoEmoji: '🧴' },
  { slug: 'perfumes-mujer', nombre: 'Perfumes Mujer', emoji: '👩', descripcion: 'Fragancias femeninas originales al mejor precio.', grupo: 'Perfumes', grupoEmoji: '🧴' },
  { slug: 'maquillaje', nombre: 'Maquillaje', emoji: '💄', descripcion: 'Maquillaje y cosmética al mejor precio.' },
  {
    slug: 'ofertas-del-dia',
    nombre: 'Ofertas del día',
    emoji: '🔥',
    descripcion: 'Los descuentos más fuertes, elegidos hoy.',
    virtual: 'ofertas',
  },
  {
    slug: 'mas-vendidos',
    nombre: 'Más vendidos',
    emoji: '⭐',
    descripcion: 'Los productos que la gente más está comprando.',
    virtual: 'masVendidos',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const NAV_CATEGORIES = CATEGORIES.filter((c) => !c.virtual);
export const FEATURED_CATEGORIES = CATEGORIES.filter((c) => c.virtual);
