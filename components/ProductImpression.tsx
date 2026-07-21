'use client';

import { useEffect, useRef } from 'react';
import { Product } from '@/lib/types';
import { trackViewContent } from '@/lib/pixel';

/**
 * Dispara ViewContent del Meta Pixel cuando la tarjeta del producto entra en
 * viewport (impresión real de catálogo). Es un centinela invisible: observa a
 * su elemento padre (la <article> de la card) y se desconecta tras la primera
 * vez, así no repite ni consume recursos.
 */
export default function ProductImpression({ product }: { product: Product }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            trackViewContent(product);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [product]);

  return <span ref={ref} className="hidden" aria-hidden="true" />;
}
