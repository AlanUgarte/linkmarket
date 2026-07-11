import Link from 'next/link';
import { SITE } from '@/lib/constants';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label={`${SITE.name}, ir al inicio`}>
      <span
        className={`${sizes[size]} rounded-xl bg-ml-yellow text-base-950 font-extrabold flex items-center justify-center transition-transform duration-300 ease-smooth group-hover:scale-105 group-active:scale-95`}
      >
        {SITE.name.charAt(0)}
      </span>
      <span className="font-bold tracking-tight text-ink text-lg">{SITE.name}</span>
    </Link>
  );
}
