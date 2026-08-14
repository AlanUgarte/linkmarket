'use client';

import { Product } from '@/lib/types';
import { ensureAffiliateLink } from '@/lib/utils';
import { trackOutboundClick } from '@/lib/pixel';

/**
 * Botón "Ver en Mercado Libre" en azul de acción ML. Client component para
 * disparar el evento de conversión (ClickMercadoLibre) sin frenar la apertura.
 */
export default function V2BuyButton({ product }: { product: Product }) {
  const href = ensureAffiliateLink(product.linkProducto || product.linkAfiliado);

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      onClick={() => trackOutboundClick(product)}
      className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-ml-blue px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#2968c8] active:scale-[0.99]"
    >
      Ver en Mercado Libre
    </a>
  );
}
