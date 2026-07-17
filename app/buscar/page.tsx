import { Metadata } from 'next';
import { getProducts } from '@/lib/googleSheets';
import ProductExplorer from '@/components/ProductExplorer';

// Ver nota sobre este literal en app/page.tsx
export const revalidate = 60;
// Margen para la sincronizacion de precios con muchos productos (Vercel).
export const maxDuration = 60;

export const metadata: Metadata = {
  title: 'Buscar productos',
  robots: { index: false, follow: true },
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || '').trim();
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <header className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-display-md text-ink flex items-center gap-2.5">
          <span aria-hidden="true">🔎</span>
          Buscar
        </h1>
        <p className="text-ink-faint text-sm">Encontrá lo que buscás en todo el catálogo.</p>
      </header>

      <ProductExplorer products={products} initialQuery={query} />
    </div>
  );
}
