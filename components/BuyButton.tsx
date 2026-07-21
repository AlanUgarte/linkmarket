'use client';

import { ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { ensureAffiliateLink } from '@/lib/utils';
import { trackOutboundClick } from '@/lib/pixel';

/**
 * Botón "Ver en Mercado Libre". Client component para poder disparar el evento
 * de conversión del Meta Pixel (InitiateCheckout + OutboundClick) en el click,
 * sin bloquear ni retrasar la apertura del link de afiliado.
 */
export default function BuyButton({ product }: { product: Product }) {
  // Preferimos el link directo al producto (linkProducto); si falta, el de afiliado.
  const href = ensureAffiliateLink(product.linkProducto || product.linkAfiliado);

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={() => trackOutboundClick(product)}
      className="
        mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ml-yellow
        px-2 py-3 text-xs sm:text-sm font-bold text-ink text-center transition-all duration-200 ease-smooth
        hover:brightness-95 active:scale-[0.97]
      "
    >
      VER EN MERCADO LIBRE
      <ArrowUpRight size={16} strokeWidth={2.75} aria-hidden="true" />
    </a>
  );
}
