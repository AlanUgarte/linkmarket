'use client';

import { useEffect } from 'react';
import { Product, SortOption } from '@/lib/types';
import { useProducts } from '@/hooks/useProducts';
import SearchBar from './SearchBar';
import FiltersBar from './FiltersBar';
import ProductGrid from './ProductGrid';
import EmptyState from './EmptyState';

export default function ProductExplorer({
  products,
  initialSort = 'relevancia',
  initialQuery = '',
  readQueryFromUrl = false,
}: {
  products: Product[];
  initialSort?: SortOption;
  initialQuery?: string;
  /** Lee el término `?q=` de la URL al montar (para /buscar estática). */
  readQueryFromUrl?: boolean;
}) {
  const { query, setQuery, sort, setSort, products: filtered, resultCount } = useProducts(products, {
    initialSort,
    initialQuery,
  });

  // /buscar es estática (cacheada); el término se toma del `?q=` en el cliente
  // para que la búsqueda sea instantánea en vez de re-renderizar en el server.
  useEffect(() => {
    if (!readQueryFromUrl) return;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, [readQueryFromUrl, setQuery]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={query} onChange={setQuery} />
        <FiltersBar sort={sort} onChange={setSort} />
      </div>

      {query.trim() && (
        <p className="text-sm text-ink-faint -mt-2">
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'} para &ldquo;{query}&rdquo;
        </p>
      )}

      {filtered.length > 0 ? (
        <ProductGrid products={filtered} />
      ) : (
        <EmptyState
          title="No encontramos productos"
          description="Probá con otras palabras o revisá otra categoría desde el menú de arriba."
        />
      )}
    </div>
  );
}
