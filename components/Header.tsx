import Link from 'next/link';
import Logo from './Logo';
import CategoryDropdown from './CategoryDropdown';
import HeaderSearch from './HeaderSearch';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';
import { Category } from '@/lib/types';

const chipClass =
  'shrink-0 inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-1.5 text-sm font-medium text-ink-dim transition-colors duration-200 ease-smooth hover:text-ink hover:border-line-strong hover:bg-base-800 active:scale-95';

export default function Header() {
  // Barra: destacadas (ofertas/más vendidos) + categorías. Las que tienen
  // `grupo` (perfumes, tecnología) se juntan en un desplegable por grupo,
  // renderizado en la posición de su primer miembro.
  const items: Category[] = [...FEATURED_CATEGORIES, ...NAV_CATEGORIES];
  const gruposRenderizados = new Set<string>();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-base-950/80 border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center gap-4">
          <Logo />
          <HeaderSearch />
        </div>

        <nav
          aria-label="Categorías"
          className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
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
