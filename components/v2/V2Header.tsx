import Link from 'next/link';
import { Search, ShoppingCart, MapPin } from 'lucide-react';

/** Header estilo Mercado Libre: barra amarilla con logo + buscador + carrito, y nav debajo. */
export default function V2Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Barra amarilla principal */}
      <div className="bg-ml-yellow">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-2.5">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Inicio">
            <span className="flex h-8 w-9 items-center justify-center rounded bg-white text-sm font-black text-ink shadow-sm">L</span>
            <span className="hidden text-lg font-bold tracking-tight text-ink sm:block">
              Link<span className="text-ink/70">Market</span>
            </span>
          </Link>

          {/* Buscador */}
          <form action="/buscar" method="get" role="search" className="relative flex-1">
            <input
              type="text"
              name="q"
              placeholder="Buscar productos, marcas y más..."
              aria-label="Buscar productos"
              className="w-full rounded-sm bg-white py-2.5 pl-4 pr-11 text-sm text-ink shadow-[0_1px_2px_rgba(0,0,0,0.2)] outline-none placeholder:text-ink-faint"
            />
            <button type="submit" aria-label="Buscar" className="absolute right-0 top-0 flex h-full w-11 items-center justify-center border-l border-line text-ink-dim hover:text-ink">
              <Search size={18} aria-hidden="true" />
            </button>
          </form>

          {/* Carrito */}
          <Link href="/#ofertas" aria-label="Ofertas" className="hidden shrink-0 items-center gap-1.5 text-ink hover:text-ink/70 sm:flex">
            <ShoppingCart size={22} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Nav secundaria (blanca) */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center gap-5 px-4 py-1.5 text-[13px] text-ink-dim">
          <span className="hidden items-center gap-1 text-ink-dim sm:flex">
            <MapPin size={15} aria-hidden="true" /> Enviar a todo el país
          </span>
          <nav className="flex items-center gap-5 overflow-x-auto whitespace-nowrap">
            <Link href="/#categorias" className="hover:text-ml-blue">Categorías</Link>
            <Link href="/#ofertas" className="hover:text-ml-blue">Ofertas</Link>
            <Link href="/#tendencia" className="hover:text-ml-blue">Tendencia</Link>
            <Link href="/#descuentos" className="hover:text-ml-blue">Más vendidos</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
