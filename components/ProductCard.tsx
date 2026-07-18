import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, ensureAffiliateLink } from '@/lib/utils';
import Badge from './Badge';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const href = ensureAffiliateLink(product.linkProducto || product.linkAfiliado);

  return (
    <article
      id={product.id}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-base-900 shadow-card transition-all duration-300 ease-smooth hover:border-line-strong hover:-translate-y-1 hover:shadow-soft animate-fadeInUp scroll-mt-24"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
        {product.imagen ? (
          <Image
            src={product.imagen}
            alt={product.nombre}
            fill
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint text-sm">
            Sin imagen
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 right-12 flex flex-wrap gap-1.5">
          {product.descuento > 0 && <Badge variant="discount">-{product.descuento}%</Badge>}
          {product.etiqueta && <Badge variant="promo">⚡ {product.etiqueta}</Badge>}
        </div>

        <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
          <FavoriteButton productId={product.id} />
          <ShareButton product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {(product.destacado || product.masVendido) && (
          <div className="flex flex-wrap gap-1.5">
            {product.destacado && <Badge variant="featured">⭐ Destacado</Badge>}
            {product.masVendido && <Badge variant="bestseller">🔥 Más vendido</Badge>}
          </div>
        )}
        <h3 className="font-semibold text-ink text-[15px] leading-snug line-clamp-2 tracking-tight">
          {product.nombre}
        </h3>

        {product.descripcion && (
          <p className="text-xs text-ink-faint line-clamp-2 leading-relaxed">{product.descripcion}</p>
        )}

        {product.precioAnterior && (
          <span className="mt-1 text-xs text-ink-faint line-through">{formatPrice(product.precioAnterior)}</span>
        )}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xl font-bold text-ink tracking-tight">{formatPrice(product.precio)}</span>
          {product.descuento > 0 && (
            <span className="text-sm font-bold text-ml-green">{product.descuento}% OFF</span>
          )}
        </div>
        {product.envioGratis && (
          <span className="text-sm font-bold text-ml-green">Envío gratis 🚚</span>
        )}

        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="
            mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ml-yellow
            px-2 py-3 text-xs sm:text-sm font-bold text-ink text-center transition-all duration-200 ease-smooth
            hover:brightness-95 active:scale-[0.97]
          "
        >
          VER EN MERCADO LIBRE
          <ArrowUpRight size={16} strokeWidth={2.75} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
