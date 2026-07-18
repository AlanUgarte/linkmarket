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

// IMPORTANTE: esta página es ESTÁTICA (ISR, cacheada). NO lee `searchParams`
// en el server —hacerlo la volvía dinámica y re-corría la sync de precios en
// cada búsqueda (~13s). El término `?q=` lo lee el cliente y filtra al instante.
export default async function BuscarPage() {
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

      <ProductExplorer products={products} readQueryFromUrl />
    </div>
  );
}
