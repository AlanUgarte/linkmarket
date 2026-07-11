'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'linkmarket:favoritos';

function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Favoritos persistidos en localStorage (por dispositivo, sin backend).
 * Se sincroniza entre pestañas/componentes vía CustomEvent.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setHydrated(true);

    function handleExternalChange() {
      setFavorites(readFavorites());
    }

    window.addEventListener('linkmarket:favorites-changed', handleExternalChange);
    window.addEventListener('storage', handleExternalChange);
    return () => {
      window.removeEventListener('linkmarket:favorites-changed', handleExternalChange);
      window.removeEventListener('storage', handleExternalChange);
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('linkmarket:favorites-changed'));
  }, []);

  const toggleFavorite = useCallback(
    (productId: string) => {
      const isFav = favorites.includes(productId);
      const next = isFav ? favorites.filter((id) => id !== productId) : [...favorites, productId];
      persist(next);
    },
    [favorites, persist]
  );

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  return { favorites, toggleFavorite, isFavorite, hydrated };
}
