'use client';

import { SortOption } from '@/lib/types';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'mayor-descuento', label: 'Mayor descuento' },
  { value: 'mas-vendidos', label: 'Más vendidos' },
  { value: 'mas-recientes', label: 'Más recientes' },
];

export default function FiltersBar({
  sort,
  onChange,
}: {
  sort: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={sort}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="Ordenar productos"
        className="
          appearance-none rounded-xl border border-line bg-base-900 py-3 pl-4 pr-9 text-sm text-ink
          transition-colors duration-200 ease-smooth focus:border-ml-yellow/50 focus:outline-none
          cursor-pointer hover:border-line-strong
        "
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-base-900 text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
