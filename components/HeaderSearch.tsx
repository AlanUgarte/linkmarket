import { Search } from 'lucide-react';

/** Buscador global del header: form GET nativo a /buscar?q=... (funciona sin JS). */
export default function HeaderSearch() {
  return (
    <form
      action="/buscar"
      method="get"
      role="search"
      className="relative flex-1 min-w-0 max-w-2xl"
    >
      <input
        type="text"
        name="q"
        inputMode="search"
        enterKeyHint="search"
        placeholder="Buscar productos, marcas y más..."
        aria-label="Buscar productos"
        className="w-full rounded-sm bg-white py-2.5 pl-4 pr-11 text-sm text-ink placeholder:text-ink-faint shadow-sm outline-none"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-0 top-0 flex h-full items-center border-l border-line px-3 text-ink-faint transition-colors hover:text-ink"
      >
        <Search size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
