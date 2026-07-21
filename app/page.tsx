import Link from 'next/link';
import { ArrowUpRight, Flame } from 'lucide-react';
import { getProducts } from '@/lib/googleSheets';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/constants';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';

// Nota: Next.js exige que `revalidate` sea un literal numérico (no puede
// importarse de otro archivo). Si cambiás este valor, actualizalo también
// en `lib/constants.ts`, `app/[category]/page.tsx` y `app/api/products/route.ts`.
export const revalidate = 60;
// Margen para la sincronizacion de precios con muchos productos (Vercel).
export const maxDuration = 60;

export default async function HomePage() {
  const products = await getProducts();

  const ofertasDelDia = [...products]
    .filter((p) => p.descuento > 0)
    .sort((a, b) => b.descuento - a.descuento);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      {/* Hero compacto: el protagonista es el catálogo */}
      <section className="pt-6 sm:pt-8 pb-6 text-center flex flex-col items-center gap-2 animate-fadeIn">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3 py-1 text-xs font-medium text-ink-dim">
          <Flame size={13} className="text-ml-green" aria-hidden="true" />
          Selección curada, actualizada todos los días
        </span>
        <h1 className="text-display-md text-ink text-balance max-w-2xl">{SITE.tagline}</h1>
      </section>

      {/* Ofertas del día: lo primero que ve el usuario al entrar */}
      {ofertasDelDia.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink flex items-center gap-1.5">
              🔥 Ofertas del día
            </h2>
            <Link
              href="/ofertas-del-dia"
              className="text-xs font-medium text-ink-faint hover:text-ink transition-colors inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <ProductGrid products={ofertasDelDia} />
        </section>
      )}

      {/* Categorías: todas visibles */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-3">Explorá por categoría</h2>
        <CategoryGrid categories={CATEGORIES} />
      </section>
    </div>
  );
}
