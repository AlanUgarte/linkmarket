import Link from 'next/link';
import Logo from './Logo';
import CategoryDropdown from './CategoryDropdown';
import HeaderSearch from './HeaderSearch';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';
import { Category } from '@/lib/types';

const chipClass =
  'w-full sm:w-auto shrink-0 inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-2 text-[13px] sm:text-sm font-medium text-ink whitespace-nowrap transition-colors duration-200 ease-smooth hover:border-line-strong hover:bg-base-800 active:scale-95';

export default function Header() {
  // Barra: destacadas (ofertas/más vendidos) + categorías. Las que tienen
  // `grupo` (perfumes, tecnología) se juntan en un desplegable por grupo,
  // renderizado en la posición de su primer miembro.
  const items: Category[] = [...FEATURED_CATEGORIES, ...NAV_CATEGORIES];
  const gruposRenderizados = new Set<string>();

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior amarilla estilo Mercado Libre */}
      <div className="bg-ml-yellow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center gap-3 sm:gap-5">
            <Logo />
            <HeaderSearch />
          </div>
        </div>
      </div>

      {/* Barra de categorías blanca: todas visibles, sin scroll horizontal */}
      <div className="bg-base-900 border-b border-line shadow-sm">
        <nav
          aria-label="Categorías"
          className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 py-3"
        >
          {items.map((c) => {
            if (!c.grupo) {
              return (
                <Link key={c.slug} href={`/${c.slug}`} className={chipClass}>
                  <span aria-hidden="true">{c.emoji}</span>
                  {c.nombre}
                </Link>
              );
            }
            if (gruposRenderizados.has(c.grupo)) return null;
            gruposRenderizados.add(c.grupo);
            const miembros = NAV_CATEGORIES.filter((x) => x.grupo === c.grupo);
            return (
              <CategoryDropdown
                key={c.grupo}
                label={c.grupo}
                emoji={c.grupoEmoji ?? c.emoji}
                items={miembros}
                chipClass={chipClass}
              />
            );
          })}
        </nav>
      </div>
    </header>
  );
}
