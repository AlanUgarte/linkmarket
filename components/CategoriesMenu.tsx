'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, X } from 'lucide-react';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';
import { Category } from '@/lib/types';

/**
 * Menú de categorías estilo Mercado Libre: un botón "Categorías" que abre un
 * panel con todos los grupos y sus subcategorías (columnas responsivas).
 * Al lado del botón quedan los accesos rápidos (Ofertas / Más vendidos).
 */
export default function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // Grupos en orden de aparición + categorías sueltas.
  const groups: { name: string; emoji: string; items: Category[] }[] = [];
  const standalone: Category[] = [];
  const seen = new Set<string>();
  for (const c of NAV_CATEGORIES) {
    if (!c.grupo) {
      standalone.push(c);
      continue;
    }
    if (seen.has(c.grupo)) continue;
    seen.add(c.grupo);
    groups.push({
      name: c.grupo,
      emoji: c.grupoEmoji ?? c.emoji,
      items: NAV_CATEGORIES.filter((x) => x.grupo === c.grupo),
    });
  }

  const chip =
    'inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-2 text-[13px] sm:text-sm font-medium text-ink whitespace-nowrap transition-colors hover:bg-base-800 hover:border-line-strong active:scale-95';

  return (
    <div ref={ref} className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Ver todas las categorías"
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-base-800 px-4 py-2 text-sm font-semibold text-ink whitespace-nowrap transition-colors hover:bg-base-700 active:scale-95"
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          Categorías
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {FEATURED_CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/${c.slug}`} className={chip}>
            <span aria-hidden="true">{c.emoji}</span>
            {c.nombre}
          </Link>
        ))}
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-line bg-base-900 shadow-soft animate-fadeIn">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 max-h-[72vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
            {groups.map((g) => (
              <div key={g.name} className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink mb-2">
                  <span aria-hidden="true">{g.emoji}</span>
                  {g.name}
                </p>
                <ul className="flex flex-col">
                  {g.items.map((it) => (
                    <li key={it.slug}>
                      <Link
                        href={`/${it.slug}`}
                        onClick={() => setOpen(false)}
                        className="block rounded px-1.5 py-1.5 text-[13px] text-ink-dim transition-colors hover:text-ml-blue hover:bg-base-800"
                      >
                        {it.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {standalone.length > 0 && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink mb-2">Más categorías</p>
                <ul className="flex flex-col">
                  {standalone.map((it) => (
                    <li key={it.slug}>
                      <Link
                        href={`/${it.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-1.5 rounded px-1.5 py-1.5 text-[13px] text-ink-dim transition-colors hover:text-ml-blue hover:bg-base-800"
                      >
                        <span aria-hidden="true">{it.emoji}</span>
                        {it.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
