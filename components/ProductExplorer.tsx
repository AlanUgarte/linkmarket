'use client';

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
}: {
  products: Product[];
  initialSort?: SortOption;
  initialQuery?: string;
}) {
  const { query, setQuery, sort, setSort, products: filtered, resultCount } = useProducts(products, {
    initialSort,
    initialQuery,
  });

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
