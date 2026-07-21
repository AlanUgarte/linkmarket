'use client';

import { useEffect } from 'react';
import { trackViewCategory } from '@/lib/pixel';

/**
 * Dispara el evento custom ViewCategory del Meta Pixel al entrar a una categoría.
 * Se re-ejecuta si cambia el nombre (navegación cliente entre categorías).
 */
export default function CategoryViewTracker({ name }: { name: string }) {
  useEffect(() => {
    trackViewCategory(name);
  }, [name]);

  return null;
}
