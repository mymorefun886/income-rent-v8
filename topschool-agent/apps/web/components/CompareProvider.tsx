'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Compare context — localStorage-based, limited to 4 schools.
 */

export interface CompareItem {
  level: string;
  slug: string;
  nameZh: string;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (slug: string) => void;
  isInCompare: (slug: string) => boolean;
  clear: () => void;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);
const STORAGE_KEY = 'topschool_compare';
const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const save = useCallback((next: CompareItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addItem = useCallback(
    (item: CompareItem) => {
      if (items.length >= MAX_COMPARE || items.some((i) => i.slug === item.slug)) return;
      save([...items, item]);
    },
    [items, save]
  );

  const removeItem = useCallback(
    (slug: string) => {
      save(items.filter((i) => i.slug !== slug));
    },
    [items, save]
  );

  const isInCompare = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items]
  );

  const clear = useCallback(() => save([]), [save]);

  return (
    <CompareContext.Provider
      value={{ items, addItem, removeItem, isInCompare, clear, canAdd: items.length < MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
