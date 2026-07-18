'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, ChevronRight, X } from 'lucide-react';
import { NAV_CATEGORIES, FEATURED_CATEGORIES } from '@/lib/categories';
import { Category } from '@/lib/types';

/**
 * Menú de categorías estilo Mercado Libre: dos paneles.
 * Izquierda: lista de rubros (grupos) + categorías sueltas.
 * Derecha (desktop): al pasar el mouse / clickear un rubro, se muestran SOLO
 * sus subcategorías. En mobile el rubro se despliega como acordeón debajo.
 */
export default function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // Un tick después para que el mismo click que abre no lo cierre.
    const id = window.setTimeout(() => document.addEventListener('click', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // Rubros (grupos) en orden + categorías sueltas.
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
  const activeGroup = groups[active] ?? groups[0];

  const chip =
    'inline-flex items-center gap-1.5 rounded-full border border-line bg-base-900 px-3.5 py-2 text-[13px] sm:text-sm font-medium text-ink whitespace-nowrap transition-colors hover:bg-base-800 hover:border-line-strong active:scale-95';

  return (
    <div ref={ref} className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-2 py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:flex sm:gap-6 sm:min-h-[400px] max-h-[75vh] overflow-y-auto">
            {/* Izquierda: rubros + sueltas */}
            <ul className="sm:w-64 sm:shrink-0 sm:border-r sm:border-line sm:pr-3 flex flex-col">
              {groups.map((g, i) => (
                <li key={g.name}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-expanded={active === i}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                      active === i ? 'bg-base-800 text-ink' : 'text-ink-dim hover:bg-base-800 hover:text-ink'
                    }`}
                  >
                    <span aria-hidden="true">{g.emoji}</span>
                    <span className="flex-1">{g.name}</span>
                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform sm:rotate-0 ${active === i ? 'rotate-90 text-ink' : 'text-ink-faint'}`}
                    />
                  </button>

                  {/* Acordeón mobile: subcategorías del rubro activo */}
                  {active === i && (
                    <ul className="sm:hidden flex flex-col pl-9 pb-2">
                      {g.items.map((it) => (
                        <li key={it.slug}>
                          <Link
                            href={`/${it.slug}`}
                            onClick={() => setOpen(false)}
                            className="block py-1.5 text-[13px] text-ink-dim transition-colors hover:text-ml-blue"
                          >
                            {it.nombre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}

              {/* Categorías sueltas: links directos */}
              {standalone.length > 0 && (
                <li className="mt-1 pt-1 border-t border-line flex flex-col">
                  {standalone.map((it) => (
                    <Link
                      key={it.slug}
                      href={`/${it.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-dim transition-colors hover:bg-base-800 hover:text-ink"
                    >
                      <span aria-hidden="true">{it.emoji}</span>
                      {it.nombre}
                    </Link>
                  ))}
                </li>
              )}
            </ul>

            {/* Derecha (desktop): subcategorías del rubro activo */}
            <div className="hidden sm:block flex-1 pt-1">
              <p className="flex items-center gap-2 text-base font-bold text-ink mb-3">
                <span aria-hidden="true">{activeGroup.emoji}</span>
                {activeGroup.name}
              </p>
              <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
                {activeGroup.items.map((it) => (
                  <li key={it.slug}>
                    <Link
                      href={`/${it.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-ink-dim transition-colors hover:text-ml-blue hover:bg-base-800"
                    >
                      <span aria-hidden="true">{it.emoji}</span>
                      {it.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
