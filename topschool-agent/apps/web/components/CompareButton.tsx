'use client';

import { useCompare } from './CompareProvider';

/**
 * CompareButton — toggle school for comparison.
 */
export function CompareButton({
  level,
  slug,
  nameZh,
}: {
  level: string;
  slug: string;
  nameZh: string;
}) {
  const { items, addItem, removeItem, isInCompare, canAdd } = useCompare();
  const active = isInCompare(slug);

  return (
    <button
      type="button"
      onClick={() => {
        if (active) removeItem(slug);
        else addItem({ level, slug, nameZh });
      }}
      disabled={!active && !canAdd}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-600'
          : canAdd
            ? 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
            : 'border-[var(--color-border-default)] text-[var(--color-text-muted)] cursor-not-allowed'
      }`}
    >
      {active ? '✓ 已加入比較' : canAdd ? '📊 加入比較' : '比較已滿 (4)'}
    </button>
  );
}
