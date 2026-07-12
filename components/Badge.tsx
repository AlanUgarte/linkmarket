import { ReactNode } from 'react';

type Variant = 'discount' | 'featured' | 'limited' | 'bestseller' | 'neutral' | 'shipping' | 'promo';

const VARIANTS: Record<Variant, string> = {
  discount: 'bg-ml-yellow text-base-950',
  shipping: 'bg-emerald-600 text-white',
  promo: 'bg-red-600 text-white shadow-sm',
  featured: 'bg-base-800 text-ink border border-line-strong',
  limited: 'bg-red-500/15 text-red-400 border border-red-500/25',
  bestseller: 'bg-base-800 text-ml-yellow border border-ml-yellow/20',
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
