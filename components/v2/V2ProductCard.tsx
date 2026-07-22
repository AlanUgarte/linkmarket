import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, ensureAffiliateLink } from '@/lib/utils';

/**
 * Tarjeta de producto del rediseño /v2. Estilo "medio de ofertas" premium.
 * Badges 100% reales (más vendido, % off, envío gratis). Sin ratings inventados.
 */
export default function V2ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const href = ensureAffiliateLink(product.linkProducto || product.linkAfiliado);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] hover:border-slate-300">
      {/* Imagen */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
        {product.imagen ? (
          <Image
            src={product.imagen}
            alt={product.nombre}
            fill
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">Sin imagen</div>
        )}

        {/* Badges arriba-izquierda */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.descuento > 0 && (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold tracking-tight text-white shadow-sm">
              -{product.descuento}% OFF
            </span>
          )}
          {product.masVendido && (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold tracking-tight text-amber-300 shadow-sm">
              🔥 Más vendido
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-slate-800">
          {product.nombre}
        </h3>

        <div className="mt-auto flex flex-col gap-0.5 pt-1">
          {product.precioAnterior && product.precioAnterior > product.precio && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.precioAnterior)}</span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">{formatPrice(product.precio)}</span>
            {product.descuento > 0 && (
              <span className="text-sm font-bold text-emerald-600">{product.descuento}%</span>
            )}
          </div>
          {product.envioGratis && (
            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
              Envío gratis
            </span>
          )}
        </div>

        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-3 text-sm font-bold text-slate-900 shadow-[0_2px_0_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-amber-300 hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Ver oferta en Mercado Libre
          <ArrowUpRight size={16} strokeWidth={2.75} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
