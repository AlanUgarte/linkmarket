'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Product } from '@/lib/types';
import { SITE } from '@/lib/constants';

export default function ShareButton({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${SITE.url}/${product.categoriaSlug}#${product.id}`;
    const shareData = {
      title: product.nombre,
      text: `Mirá esto que encontré en ${SITE.name}: ${product.nombre}`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // el usuario canceló el share nativo, no hacemos nada más
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard no disponible, fallamos en silencio
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartir producto"
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-line bg-white/90 shadow-sm text-ink-dim transition-all duration-200 ease-smooth hover:bg-white active:scale-90"
    >
      {copied ? (
        <Check size={16} strokeWidth={2.5} className="text-ml-green" aria-hidden="true" />
      ) : (
        <Share2 size={16} strokeWidth={2.25} aria-hidden="true" />
      )}
    </button>
  );
}
