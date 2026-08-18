'use client';

import { useFavourites } from './FavouritesProvider';

/**
 * FavouriteButton — toggle favourite with heart icon.
 */
export function FavouriteButton({
  level,
  slug,
  nameZh,
}: {
  level: string;
  slug: string;
  nameZh: string;
}) {
  const { isFavourite, addFavourite, removeFavourite } = useFavourites();
  const active = isFavourite(level, slug);

  return (
    <button
      type="button"
      onClick={() =>
        active ? removeFavourite(level, slug) : addFavourite(level, slug)
      }
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]'
          : 'border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)]/5'
      }`}
    >
      {active ? '❤️ 已收藏' : '❤️ 加入收藏'}
    </button>
  );
}

/**
 * CompareToggleButton — toggle school in compare list.
 */
export function CompareToggleButton({
  level,
  slug,
  nameZh,
}: {
  level: string;
  slug: string;
  nameZh: string;
}) {
  const { favourites, addFavourite, removeFavourite } = useFavourites();
  const key = `${level}:${slug}`;
  const active = favourites.includes(key);

  return (
    <button
      type="button"
      onClick={() =>
        active ? removeFavourite(level, slug) : addFavourite(level, slug)
      }
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-600'
          : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
      }`}
    >
      {active ? '✓ 已加入比較' : '📊 加入比較'}
    </button>
  );
}
