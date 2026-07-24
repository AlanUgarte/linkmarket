import Link from 'next/link';
import { ArrowRight, Check, Star, TrendingUp, BadgePercent, Sparkles } from 'lucide-react';
import { getProducts } from '@/lib/googleSheets';
import { Product } from '@/lib/types';
import V2ProductCard from '@/components/v2/V2ProductCard';

// Ver nota sobre este literal en otras rutas.
export const revalidate = 60;
export const maxDuration = 60;

const CATS = [
  { emoji: '🔨', label: 'Herramientas', slug: 'herramientas' },
  { emoji: '🏠', label: 'Hogar', slug: 'hogar' },
  { emoji: '💻', label: 'Tecnología', slug: 'computacion' },
  { emoji: '🎮', label: 'Gaming', slug: 'gaming' },
  { emoji: '🚗', label: 'Automotor', slug: 'accesorios-para-tu-auto' },
  { emoji: '👕', label: 'Moda', slug: 'ropa-deportiva' },
  { emoji: '💄', label: 'Belleza', slug: 'maquillaje' },
  { emoji: '🐶', label: 'Mascotas', slug: 'accesorios-para-mascotas' },
  { emoji: '🍳', label: 'Cocina', slug: 'cocina-y-bazar' },
  { emoji: '📱', label: 'Celulares', slug: 'celulares' },
];

function Section({
  id, icon, kicker, title, subtitle, products,
}: { id?: string; icon: React.ReactNode; kicker: string; title: string; subtitle?: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 scroll-mt-24">
      <div className="mb-5">
        <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-600">
          {icon}{kicker}
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p, i) => <V2ProductCard key={p.id} product={p} priority={i < 5} />)}
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
    <div className="bg-slate-50 text-slate-800 antialiased">
      {/* HERO compacto */}
      <section className="border-b border-slate-200/70 bg-gradient-to-br from-amber-50 via-white to-indigo-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:justify-between sm:py-4 sm:text-left">
          <div>
            <h1 className="text-balance text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
              🔥 Los productos más recomendados de Mercado Libre
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Ofertas, productos virales y la mejor relación precio-calidad, ya seleccionados.
            </p>
          </div>
          <a
            href="#ofertas"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
          >
            Ver ofertas <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section id="categorias" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 scroll-mt-24">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Explorá por categoría</h2>
          <p className="mt-1 text-sm text-slate-500">Descubrí lo mejor de cada rubro, ya seleccionado.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
          {CATS.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-3xl transition-transform group-hover:scale-110">
                {c.emoji}
              </span>
              <span className="text-sm font-bold text-slate-800">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BANDA DE OFERTAS */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-6 text-center sm:flex-row sm:gap-4 sm:py-7">
          <span className="text-2xl" aria-hidden="true">🔥</span>
          <p className="text-lg font-extrabold tracking-tight text-white sm:text-2xl">
            Las mejores oportunidades encontradas hoy
          </p>
        </div>
      </div>

      <Section id="ofertas" icon={<BadgePercent size={14} />} kicker="Ofertas del día" title="💰 Mejores descuentos" subtitle="Los mayores ahorros que encontramos ahora." products={ofertas} />
      <Section id="tendencia" icon={<TrendingUp size={14} />} kicker="Tendencia" title="🔥 Productos tendencia" subtitle="Lo que más se está comprando." products={tendencia} />
      <div className="bg-white"><Section icon={<Star size={14} />} kicker="Elegidos por la gente" title="⭐ Más vendidos" products={masVendidos} /></div>
      <Section id="descuentos" icon={<Sparkles size={14} />} kicker="Selección de hoy" title="🆕 Recomendados de hoy" products={recomendados} />

      {/* CONFIANZA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            ¿Por qué elegir nuestras recomendaciones?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              'Seleccionamos productos con excelente reputación',
              'Priorizamos vendedores confiables',
              'Buscamos las ofertas más destacadas',
              'Actualizamos las recomendaciones constantemente',
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </span>
                <p className="text-[15px] font-medium text-slate-100">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER (solo diseño) */}
      <section className="bg-gradient-to-br from-amber-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Recibí las mejores ofertas en tu correo
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Te avisamos cuando encontramos productos virales y descuentos que valen la pena.
          </p>
          <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row" aria-label="Suscribirse (solo demostración)">
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              aria-label="Tu correo electrónico"
              className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="button" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800">
              Suscribirme
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">Sin spam. Podés darte de baja cuando quieras.</p>
        </div>
      </section>
    </div>
  );
}
