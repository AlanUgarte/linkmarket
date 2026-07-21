'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { Product } from '@/lib/types';
import { trackAddToWishlist } from '@/lib/pixel';

export default function FavoriteButton({
  productId,
  product,
}: {
  productId: string;
  product?: Product;
}) {
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const active = hydrated && isFavorite(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Solo trackeamos el alta (cuando pasa de no-favorito a favorito).
        if (!isFavorite(productId) && product) trackAddToWishlist(product);
        toggleFavorite(productId);
      }}
      aria-pressed={active}
      aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`
        inline-flex items-center justify-center w-9 h-9 rounded-full border shadow-sm
        transition-all duration-200 ease-smooth active:scale-90
        ${active ? 'bg-ml-yellow border-ml-yellow' : 'bg-white/90 border-line hover:bg-white'}
      `}
    >
      <Heart
        size={17}
        strokeWidth={2.25}
        className={active ? 'fill-ink text-ink' : 'text-ink-dim'}
        aria-hidden="true"
      />
    </button>
  );
}
