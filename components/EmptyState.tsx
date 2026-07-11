import { SearchX } from 'lucide-react';

export default function EmptyState({
  title = 'No encontramos productos',
  description = 'Probá con otra búsqueda o revisá otra categoría.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-20 text-center px-6 animate-fadeIn">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-800 text-ink-faint">
        <SearchX size={22} aria-hidden="true" />
      </div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-sm text-ink-faint max-w-xs">{description}</p>
    </div>
  );
}
