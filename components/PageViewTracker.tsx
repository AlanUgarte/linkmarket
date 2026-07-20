'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { META_PIXEL_ID } from '@/lib/constants';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __mpFirstView?: boolean;
  }
}

/**
 * Dispara un PageView del Meta Pixel en cada cambio de ruta del App Router.
 * El script del pixel ya manda el primer PageView al cargar; este cubre las
 * navegaciones cliente (categorías, filtros) que en una SPA no recargan la
 * página. Debe ir envuelto en <Suspense> por el uso de useSearchParams.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    // Salteamos el primer render: ese PageView ya lo mandó el script del pixel.
    if (window.__mpFirstView === undefined) {
      window.__mpFirstView = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}
