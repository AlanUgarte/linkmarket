import { ReactNode } from 'react';

type Variant = 'discount' | 'featured' | 'limited' | 'bestseller' | 'neutral' | 'shipping' | 'promo';

const VARIANTS: Record<Variant, string> = {
  discount: 'bg-ml-yellow text-ink',
  shipping: 'bg-ml-green text-white',
  promo: 'bg-red-600 text-white shadow-sm',
  featured: 'bg-neutral-900 text-white',
  limited: 'bg-red-100 text-red-700 border border-red-200',
  bestseller: 'bg-neutral-900 text-ml-yellow',
  neutral: 'bg-base-800 text-ink-dim border border-line',
};

export default function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
