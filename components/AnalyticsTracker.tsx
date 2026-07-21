'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { META_PIXEL_ID } from '@/lib/constants';
import { logEvent, resetPageMetrics, setScrollPct } from '@/lib/analytics';
import { resetViewContentDedup } from '@/lib/pixel';

const SCROLL_STEPS = [
  { pct: 25, name: 'Scroll25' as const },
  { pct: 50, name: 'Scroll50' as const },
  { pct: 75, name: 'Scroll75' as const },
  { pct: 100, name: 'Scroll100' as const },
];

const TIME_STEPS = [
  { sec: 30, name: 'Tiempo30' as const },
  { sec: 60, name: 'Tiempo60' as const },
  { sec: 120, name: 'Tiempo120' as const },
];

/**
 * Tracker global montado una sola vez en el layout. Gestiona los eventos que
 * no dependen de un componente puntual:
 *   - PageView en la carga inicial y en cada cambio de ruta (SPA).
 *   - Profundidad de scroll (25/50/75/100), una vez por página.
 *   - Tiempo en página (30/60/120s), una vez por página.
 *   - Errores de JavaScript no controlados.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firedScroll = useRef<Set<number>>(new Set());

  // PageView + reseteo de métricas en cada cambio de ruta.
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    resetPageMetrics();
    resetViewContentDedup();
    firedScroll.current = new Set();
    logEvent('PageView');
  }, [pathname, searchParams]);

  // Scroll depth: escucha el scroll y dispara cada hito una sola vez por página.
  useEffect(() => {
    if (!META_PIXEL_ID) return;

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 100;
      setScrollPct(pct);
      for (const step of SCROLL_STEPS) {
        if (pct >= step.pct && !firedScroll.current.has(step.pct)) {
          firedScroll.current.add(step.pct);
          logEvent(step.name);
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // por si la página ya arranca sin scroll (pct 100)
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname, searchParams]);

  // Tiempo en página: timers que se limpian al cambiar de ruta.
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const timers = TIME_STEPS.map((step) =>
      setTimeout(() => logEvent(step.name), step.sec * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [pathname, searchParams]);

  // Errores JS no controlados (throttle simple para no inundar el Sheet).
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    let last = 0;
    function report(message: string, source?: string) {
      const now = Date.now();
      if (now - last < 5000) return; // máx 1 error cada 5s
      last = now;
      logEvent('Error', { extra: { message: message.slice(0, 300), source: source ?? '' } });
    }
    function onError(e: ErrorEvent) {
      report(e.message || 'Error', e.filename);
    }
    function onRejection(e: PromiseRejectionEvent) {
      report(String(e.reason).slice(0, 300), 'unhandledrejection');
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
