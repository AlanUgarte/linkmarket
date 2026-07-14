/**
 * Tipos centrales de la plataforma.
 * Reflejan 1:1 las columnas de la hoja "Productos" en Google Sheets.
 */

export interface ProductRaw {
  Categoria: string;
  Nombre: string;
  Descripcion: string;
  Precio: string;
  PrecioAnterior: string;
  Descuento: string;
  Imagen: string;
  LinkAfiliado: string;
  Activo: string;
  Orden: string;
  Destacado?: string;
  MasVendido?: string;
  FechaAgregado?: string;
  EnvioGratis?: string;
  ItemId?: string;
  CatalogId?: string;
  Etiqueta?: string;
}

export interface Product {
  id: string;
  categoria: string;
  categoriaSlug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioAnterior: number | null;
  descuento: number;
  imagen: string;
  linkAfiliado: string;
  activo: boolean;
  orden: number;
  destacado: boolean;
  masVendido: boolean;
  fechaAgregado: string | null;
  envioGratis: boolean;
  /** ID del artículo en ML (ej MLA1234...). Informativo. */
  itemId: string;
  /** ID de producto de catálogo ML (página /p/MLAnnn). Habilita el precio en vivo. */
  catalogId: string;
  /** Etiqueta promocional libre (ej "Últimas unidades", "Oferta relámpago"). Badge rojo. */
  etiqueta: string;
}

export interface Category {
  slug: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Si es true, la categoría no filtra por columna "Categoria" sino que aplica una regla especial */
  virtual?: 'ofertas' | 'masVendidos';
  /** Si está, la categoría se agrupa en un desplegable con este nombre (ej "Perfumes", "Tecnología"). */
  grupo?: string;
  /** Emoji del desplegable del grupo. */
  grupoEmoji?: string;
}

export type SortOption =
  | 'relevancia'
  | 'precio-asc'
  | 'precio-desc'
  | 'mas-vendidos'
  | 'mayor-descuento'
  | 'mas-recientes';

export interface ProductFilters {
  query?: string;
  sort?: SortOption;
  categoria?: string;
}
