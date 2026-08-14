import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import ProductImpression from '@/components/ProductImpression';
import V2BuyButton from './V2BuyButton';

/**
 * Tarjeta de producto estilo Mercado Libre: imagen sobre blanco, título en gris
 * oscuro (azul ML al pasar el mouse), precio grande y liviano, % de descuento en
 * verde, cuotas y "Envío gratis". Solo datos reales (sin ratings inventados).
 */
export default function V2ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cuota = product.precio >= 6000 ? Math.round(product.precio / 6) : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-white transition-shadow duration-200 hover:shadow-[0_8px_16px_rgba(0,0,0,0.14)]">
      <ProductImpression product={product} />

      {/* Imagen */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {product.imagen ? (
          <Image
            src={product.imagen}
            alt={product.nombre}
            fill
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
            className="object-contain p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint text-sm">Sin imagen</div>
        )}

        {product.masVendido && (
          <span className="absolute left-3 top-3 rounded-sm bg-[#FFF159] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
            Más vendido
          </span>
        )}
        {product.descuento > 0 && (
          <span className="absolute bottom-0 left-0 bg-ml-blue px-2.5 py-1 text-[11px] font-semibold text-white">
            OFERTA DEL DÍA
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="mb-2 line-clamp-2 text-sm leading-snug text-ink transition-colors group-hover:text-ml-blue">
          {product.nombre}
        </h3>

        <div className="mt-auto flex flex-col gap-0.5">
          {product.precioAnterior && product.precioAnterior > product.precio && (
            <span className="text-xs text-ink-faint line-through">{formatPrice(product.precioAnterior)}</span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light tracking-tight text-ink">{formatPrice(product.precio)}</span>
            {product.descuento > 0 && (
              <span className="text-sm font-semibold text-ml-green">{product.descuento}% OFF</span>
            )}
          </div>
          {cuota > 0 && (
            <span className="text-xs text-ml-green">
              en 6 cuotas de {formatPrice(cuota)}
            </span>
          )}
          {product.envioGratis && (
            <span className="mt-0.5 text-xs font-semibold text-ml-green">Envío gratis</span>
          )}
        </div>

        <V2BuyButton product={product} />
      </div>
    </article>
  );
}
