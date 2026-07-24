'use client';

import { ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { ensureAffiliateLink } from '@/lib/utils';
import { trackOutboundClick } from '@/lib/pixel';

/**
 * Botón "Ver oferta en Mercado Libre" del rediseño /v2. Client component para
 * disparar el evento de conversión (ClickMercadoLibre → InitiateCheckout) del
 * Pixel/CAPI/Sheets sin frenar la apertura del link.
 */
export default function V2BuyButton({ product }: { product: Product }) {
  const href = ensureAffiliateLink(product.linkProducto || product.linkAfiliado);

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={() => trackOutboundClick(product)}
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-3 text-sm font-bold text-slate-900 shadow-[0_2px_0_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-amber-300 hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      Ver oferta en Mercado Libre
      <ArrowUpRight size={16} strokeWidth={2.75} aria-hidden="true" />
    </a>
  );
}
