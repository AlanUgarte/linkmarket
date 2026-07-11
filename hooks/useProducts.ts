'use client';

import { useMemo, useState } from 'react';
import { Product, SortOption } from '@/lib/types';
import { useDebounce } from './useDebounce';

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];
  switch (sort) {
    case 'precio-asc':
      return list.sort((a, b) => a.precio - b.precio);
    case 'precio-desc':
      return list.sort((a, b) => b.precio - a.precio);
    case 'mayor-descuento':
      return list.sort((a, b) => b.descuento - a.descuento);
    case 'mas-vendidos':
      return list.sort((a, b) => Number(b.masVendido) - Number(a.masVendido) || a.orden - b.orden);
    case 'mas-recientes':
      return list.sort((a, b) => {
        const da = a.fechaAgregado ? new Date(a.fechaAgregado).getTime() : 0;
        const db = b.fechaAgregado ? new Date(b.fechaAgregado).getTime() : 0;
        return db - da;
      });
    case 'relevancia':
    default:
      return list.sort((a, b) => a.orden - b.orden);
  }
}

function matchesQuery(product: Product, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = `${product.nombre} ${product.descripcion} ${product.categoria}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

interface UseProductsOptions {
  initialSort?: SortOption;
}

export function useProducts(allProducts: Product[], options: UseProductsOptions = {}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>(options.initialSort || 'relevancia');
  const debouncedQuery = useDebounce(query, 150);

  const filtered = useMemo(() => {
    const byQuery = allProducts.filter((p) => matchesQuery(p, debouncedQuery));
    return sortProducts(byQuery, sort);
  }, [allProducts, debouncedQuery, sort]);

  return {
    query,
    setQuery,
    sort,
    setSort,
    products: filtered,
    totalCount: allProducts.length,
    resultCount: filtered.length,
    isFiltering: debouncedQuery.trim().length > 0,
  };
}
