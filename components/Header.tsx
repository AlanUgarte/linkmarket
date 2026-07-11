import Link from 'next/link';
import Logo from './Logo';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';

export default function Header() {
  const chips = [...FEATURED_CATEGORIES, ...NAV_CATEGORIES];

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
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-1.5 text-sm font-medium text-ink-dim transition-colors duration-200 ease-smooth hover:text-ink hover:border-line-strong hover:bg-base-800 active:scale-95"
            >
              <span aria-hidden="true">{c.emoji}</span>
              {c.nombre}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
