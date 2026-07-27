'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown, LayoutGrid, Car, Home as HomeIcon, Refrigerator, Tv, PawPrint,
  Wrench, Baby, Dumbbell, SprayCan, Sparkles, Stethoscope, Tag,
} from 'lucide-react';
import { NAV_CATEGORIES } from '@/lib/categories';
import type { Category } from '@/lib/types';

// Ícono profesional (lucide) por rubro. Reemplaza a los emojis.
const GROUP_ICONS: Record<string, LucideIcon> = {
  'Auto y Moto': Car,
  Hogar: HomeIcon,
  Electrodomésticos: Refrigerator,
  Tecnología: Tv,
  Mascotas: PawPrint,
  Herramientas: Wrench,
  Bebés: Baby,
  'Deportes y Fitness': Dumbbell,
  Perfumes: SprayCan,
  'Belleza y Cuidado Personal': Sparkles,
  Salud: Stethoscope,
};

type Rubro = { name: string; icon: LucideIcon; items: Category[] };

// Agrupa las categorías por rubro (estático). Las sueltas van en "Otras categorías".
const RUBROS: Rubro[] = (() => {
  const out: Rubro[] = [];
  const standalone: Category[] = [];
  const seen = new Set<string>();
  for (const c of NAV_CATEGORIES) {
    if (!c.grupo) {
      standalone.push(c);
      continue;
    }
    if (seen.has(c.grupo)) continue;
    seen.add(c.grupo);
    out.push({ name: c.grupo, icon: GROUP_ICONS[c.grupo] ?? Tag, items: NAV_CATEGORIES.filter((x) => x.grupo === c.grupo) });
  }
  if (standalone.length) out.push({ name: 'Otras categorías', icon: Tag, items: standalone });
  return out;
})();

/**
 * Explorador de categorías colapsable. Por defecto muestra solo el botón
 * "Ver todas las categorías"; al abrirlo despliega un acordeón de rubros, y
 * cada rubro abre sus subcategorías (chips) que llevan a su página.
 */
export default function CategoryExplorer() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [openRubro, setOpenRubro] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        className="mx-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-amber-300 hover:shadow-md active:scale-95"
      >
        <LayoutGrid size={18} className="text-amber-500" aria-hidden="true" />
        Ver todas las categorías
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
      </button>

      {panelOpen && (
        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fadeIn">
          {RUBROS.map((r) => {
            const Icon = r.icon;
            const isOpen = openRubro === r.name;
            return (
              <div key={r.name}>
                <button
                  type="button"
                  onClick={() => setOpenRubro(isOpen ? null : r.name)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-amber-400">
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[15px] font-semibold tracking-tight text-slate-800">{r.name}</span>
                  <span className="text-xs font-medium text-slate-400">{r.items.length}</span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-4 pl-16">
                    {r.items.map((it) => (
                      <Link
                        key={it.slug}
                        href={`/${it.slug}`}
                        className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-slate-900"
                      >
                        {it.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
