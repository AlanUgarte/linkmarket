import Link from 'next/link';
import Logo from './Logo';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';

const chipClass =
  'shrink-0 inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-1.5 text-sm font-medium text-ink-dim transition-colors duration-200 ease-smooth hover:text-ink hover:border-line-strong hover:bg-base-800 active:scale-95';

export default function Header() {
  // Las categorías de perfumes se agrupan en un desplegable "Perfumes".
  const perfumes = NAV_CATEGORIES.filter((c) => c.slug.startsWith('perfumes-'));
  const otras = NAV_CATEGORIES.filter((c) => !c.slug.startsWith('perfumes-'));
  const chips = [...FEATURED_CATEGORIES, ...otras];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-base-950/80 border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <Logo />
        </div>

        <nav
          aria-label="Categorías"
          className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {chips.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className={chipClass}>
              <span aria-hidden="true">{c.emoji}</span>
              {c.nombre}
            </Link>
          ))}

          {perfumes.length > 0 && (
            <details className="relative shrink-0 group">
              <summary className={`${chipClass} cursor-pointer list-none marker:hidden`}>
                <span aria-hidden="true">🧴</span>
                Perfumes
                <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="absolute left-0 z-50 mt-2 flex min-w-[190px] flex-col gap-1 rounded-xl border border-line bg-base-900 p-1.5 shadow-soft">
                {perfumes.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-dim transition-colors hover:bg-base-800 hover:text-ink"
                  >
                    <span aria-hidden="true">{c.emoji}</span>
                    {c.nombre}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>
      </div>
    </header>
  );
}
