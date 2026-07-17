import { Search } from 'lucide-react';

/** Buscador global del header: form GET nativo a /buscar?q=... (funciona sin JS). */
export default function HeaderSearch() {
  return (
    <form
      action="/buscar"
      method="get"
      role="search"
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
        name="q"
        inputMode="search"
        enterKeyHint="search"
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full rounded-full border border-line bg-base-900 py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-line-strong"
      />
    </form>
  );
}
