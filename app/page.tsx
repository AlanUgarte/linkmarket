import { ArrowRight, Check, Star, TrendingUp, BadgePercent, Sparkles } from 'lucide-react';
import { getProducts } from '@/lib/googleSheets';
import { Product } from '@/lib/types';
import V2ProductCard from '@/components/v2/V2ProductCard';
import CategoryExplorer from '@/components/v2/CategoryExplorer';

// Ver nota sobre este literal en otras rutas.
export const revalidate = 60;
export const maxDuration = 60;

function Section({
  id, icon, kicker, title, subtitle, products,
}: { id?: string; icon: React.ReactNode; kicker: string; title: string; subtitle?: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section id={id} className="mx-auto max-w-[1200px] px-3 py-3 sm:px-4 scroll-mt-24">
      <div className="rounded-md border border-line bg-white p-4 sm:p-5">
        <div className="mb-4">
          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ml-blue">
            {icon}{kicker}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p, i) => <V2ProductCard key={p.id} product={p} priority={i < 5} />)}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const all = await getProducts();
  const withDisc = [...all].filter((p) => p.descuento > 0).sort((a, b) => b.descuento - a.descuento);
  const bestsellers = all.filter((p) => p.masVendido);
  const destacados = all.filter((p) => p.destacado);
  const recientes = [...all].sort((a, b) => {
    const da = a.fechaAgregado ? Date.parse(a.fechaAgregado) : 0;
    const db = b.fechaAgregado ? Date.parse(b.fechaAgregado) : 0;
    return db - da;
  });

  const ofertas = withDisc.slice(0, 10);
  const tendencia = (bestsellers.length ? bestsellers : withDisc).slice(0, 10);
  const masVendidos = (bestsellers.length ? bestsellers : withDisc.slice(10, 30)).slice(0, 10);
  const recomendados = (destacados.length ? destacados : recientes).slice(0, 10);

  return (
    <div className="bg-base-950 text-ink antialiased">
      {/* HERO compacto */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h1 className="text-balance text-base font-semibold tracking-tight text-ink sm:text-lg">
              Los productos más recomendados de Mercado Libre
            </h1>
            <p className="mt-0.5 text-xs text-ink-dim sm:text-sm">
              Ofertas, productos virales y la mejor relación precio-calidad, ya seleccionados.
            </p>
          </div>
          <a
            href="#ofertas"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ml-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2968c8]"
          >
            Ver ofertas <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section id="categorias" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 scroll-mt-24">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Explorá por categoría</h2>
          <p className="mt-1 text-sm text-ink-dim">Descubrí lo mejor de cada rubro, ya seleccionado.</p>
        </div>
        <CategoryExplorer />
      </section>

      {/* BANDA DE OFERTAS */}
      <div className="bg-ml-yellow">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 px-4 py-3 text-center">
          <p className="text-base font-bold tracking-tight text-ink sm:text-lg">
            Las mejores oportunidades encontradas hoy
          </p>
        </div>
      </div>

      <Section id="ofertas" icon={<BadgePercent size={14} />} kicker="Ofertas del día" title="Mejores descuentos" subtitle="Los mayores ahorros que encontramos ahora." products={ofertas} />
      <Section id="tendencia" icon={<TrendingUp size={14} />} kicker="Tendencia" title="Productos tendencia" subtitle="Lo que más se está comprando." products={tendencia} />
      <Section icon={<Star size={14} />} kicker="Elegidos por la gente" title="Más vendidos" products={masVendidos} />
      <Section id="descuentos" icon={<Sparkles size={14} />} kicker="Selección de hoy" title="Recomendados de hoy" products={recomendados} />

      {/* CONFIANZA */}
      <section className="mx-auto max-w-[1200px] px-3 py-3 sm:px-4">
        <div className="rounded-md border border-line bg-white p-6 sm:p-8">
          <h2 className="text-center text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            ¿Por qué elegir nuestras recomendaciones?
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Seleccionamos productos con excelente reputación',
              'Priorizamos vendedores confiables',
              'Buscamos las ofertas más destacadas',
              'Actualizamos las recomendaciones constantemente',
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-md border border-line bg-base-800 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ml-green/15 text-ml-green">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-ink">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
