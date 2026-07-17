'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Buscador global del header: navega a /buscar?q=... (Enter o clic en la lupa). */
export default function HeaderSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  const go = () => {
    const t = q.trim();
    router.push(t ? `/buscar?q=${encodeURIComponent(t)}` : '/buscar');
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="relative flex-1 min-w-0 max-w-md"
    >
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute left-0 top-0 flex h-full items-center px-3 text-ink-faint transition-colors hover:text-ink"
      >
        <Search size={16} aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full rounded-full border border-line bg-base-900 py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-line-strong"
      />
    </form>
  );
}
