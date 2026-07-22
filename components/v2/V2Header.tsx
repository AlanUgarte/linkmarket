import Link from 'next/link';
import { Search, Zap } from 'lucide-react';

/** Header del rediseño /v2: barra de beneficios + header sticky con buscador. */
export default function V2Header() {
  return (
    <div className="sticky top-0 z-50">
      {/* Barra superior de beneficios: se desplaza sola (marquee) */}
      <div className="overflow-hidden bg-slate-900 py-1.5 text-slate-200">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {[
                '🚚 Envío rápido',
                '⭐ Recomendaciones seleccionadas',
                '🔥 Ofertas actualizadas a diario',
                '💲 Descuentos destacados',
                '🛡️ Vendedores confiables',
                '⚡ Productos virales del momento',
              ].map((b) => (
                <span key={b} className="mx-6 text-[12px] font-medium">{b}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <Link href="/v2" className="flex shrink-0 items-center gap-2" aria-label="Inicio">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 font-black text-slate-900">
              L
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 sm:block">
              Link<span className="text-amber-500">Market</span>
            </span>
          </Link>

          <form action="/buscar" method="get" role="search" className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              name="q"
              placeholder="Buscar productos, marcas y ofertas..."
              aria-label="Buscar productos"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-200"
            />
          </form>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <Link href="/#categorias" className="transition-colors hover:text-slate-900">Categorías</Link>
            <Link href="/#tendencia" className="transition-colors hover:text-slate-900">Tendencia</Link>
            <Link href="/#descuentos" className="transition-colors hover:text-slate-900">Descuentos</Link>
          </nav>

          <Link
            href="/#ofertas"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          >
            <Zap size={15} className="text-amber-400" aria-hidden="true" />
            <span className="hidden sm:inline">Ver ofertas</span>
          </Link>
        </div>
      </header>
    </div>
  );
}
