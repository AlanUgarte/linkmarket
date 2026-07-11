import Link from 'next/link';
import { Category } from '@/lib/types';

export default function CategoryButton({ category, index }: { category: Category; index: number }) {
  const isFeatured = Boolean(category.virtual);

  return (
    <Link
      href={`/${category.slug}`}
      className={`
        group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5 sm:p-4
        transition-all duration-300 ease-smooth animate-fadeInUp
        hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        ${
          isFeatured
            ? 'border-ml-yellow/25 bg-gradient-to-br from-ml-yellow/[0.08] to-base-900 hover:border-ml-yellow/50 hover:shadow-glow'
            : 'border-line bg-base-900 hover:border-line-strong hover:bg-base-800 hover:shadow-soft'
        }
      `}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span
        className="text-2xl sm:text-3xl leading-none shrink-0 transition-transform duration-300 ease-smooth group-hover:scale-110"
        aria-hidden="true"
      >
        {category.emoji}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="font-semibold text-ink text-sm sm:text-base tracking-tight truncate">{category.nombre}</span>
        <span className="hidden sm:block text-xs text-ink-faint truncate">{category.descripcion}</span>
      </span>

      {/* Firma visual: filo inferior que se enciende en amarillo ML al pasar el mouse/tocar */}
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-smooth group-hover:scale-x-100 ${
          isFeatured ? 'bg-ml-yellow' : 'bg-ink-faint'
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}
