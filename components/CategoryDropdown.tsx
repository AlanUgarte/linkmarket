'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/types';

/**
 * Desplegable de una familia de categorías (ej "Perfumes" → Hombre/Mujer,
 * "Tecnología" → Tecnología/Televisores). El menú se renderiza con
 * `position: fixed` para escapar del recorte que impone el `overflow-x-auto`
 * de la barra de categorías (si no, quedaba tapado y no se podía elegir).
 */
export default function CategoryDropdown({
  label,
  emoji,
  items,
  chipClass,
}: {
  label: string;
  emoji: string;
  items: Category[];
  chipClass: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      if (b) setPos({ left: b.left, top: b.bottom + 8 });
    };
    place();
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('click', onDoc);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={chipClass}
      >
        <span aria-hidden="true">{emoji}</span>
        {label}
        <span aria-hidden="true" className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && pos && (
        <div
          style={{ position: 'fixed', left: pos.left, top: pos.top }}
          className="z-[100] flex min-w-[190px] flex-col gap-1 rounded-xl border border-line-strong bg-base-900 p-1.5 shadow-soft"
        >
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-dim transition-colors hover:bg-base-800 hover:text-ink"
            >
              <span aria-hidden="true">{c.emoji}</span>
              {c.nombre}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
