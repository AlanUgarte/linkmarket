'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Buscador global del header: navega a /buscar?q=... */
export default function HeaderSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        router.push(t ? `/buscar?q=${encodeURIComponent(t)}` : '/buscar');
      }}
      className="relative flex-1 min-w-0 max-w-md"
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        aria-hidden="true"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full rounded-full border border-line bg-base-900 py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-line-strong"
      />
    </form>
  );
}
