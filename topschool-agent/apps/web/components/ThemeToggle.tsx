'use client';

import { useTheme } from './ThemeProvider';

/**
 * ThemeToggle — 主題切換按鈕
 *
 * 循環切換：亮色 → 暗色 → 跟隨系統 → 亮色
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  // 圖示與標籤
  const config = {
    light: { icon: '☀️', label: '亮色' },
    dark: { icon: '🌙', label: '暗色' },
    system: { icon: '💻', label: '系統' },
  }[theme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast"
      aria-label={`目前主題：${config.label}，點擊切換`}
      title={`主題：${config.label}（點擊切換）`}
    >
      <span className="text-base" aria-hidden="true">
        {config.icon}
      </span>
    </button>
  );
}
