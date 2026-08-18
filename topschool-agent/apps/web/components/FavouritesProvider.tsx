'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Favourites context — localStorage-based (no auth required).
 */

interface FavouritesContextType {
  favourites: string[]; // array of "level:slug" keys
  addFavourite: (level: string, slug: string) => void;
  removeFavourite: (level: string, slug: string) => void;
  isFavourite: (level: string, slug: string) => boolean;
  clearFavourites: () => void;
}

const FavouritesContext = createContext<FavouritesContextType | null>(null);

const STORAGE_KEY = 'topschool_favourites';

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavourites(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist to localStorage
  const save = useCallback((next: string[]) => {
    setFavourites(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const key = (level: string, slug: string) => `${level}:${slug}`;

  const addFavourite = useCallback(
    (level: string, slug: string) => {
      const k = key(level, slug);
      if (!favourites.includes(k)) save([...favourites, k]);
    },
    [favourites, save]
  );

  const removeFavourite = useCallback(
    (level: string, slug: string) => {
      save(favourites.filter((k) => k !== key(level, slug)));
    },
    [favourites, save]
  );

  const isFavourite = useCallback(
    (level: string, slug: string) => favourites.includes(key(level, slug)),
    [favourites]
  );

  const clearFavourites = useCallback(() => save([]), [save]);

  return (
    <FavouritesContext.Provider
      value={{ favourites, addFavourite, removeFavourite, isFavourite, clearFavourites }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
}
