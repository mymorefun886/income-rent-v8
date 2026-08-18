'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'topschool-theme';

/**
 * 偵測系統偏好主題
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 取得初始主題（從 localStorage 或系統偏好）
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * 亮色主題變數
 */
const lightThemeVars = {
  '--color-brand': '#0274c0',
  '--color-brand-50': '#e6f2f9',
  '--color-brand-100': '#bbeafc',
  '--color-brand-200': '#90d9f5',
  '--color-brand-300': '#65c8ee',
  '--color-brand-400': '#3ab7e7',
  '--color-brand-500': '#0274c0',
  '--color-brand-600': '#025a96',
  '--color-brand-700': '#023f6c',
  '--color-brand-800': '#012a4a',
  '--color-brand-900': '#011524',
  '--color-level-secondary': '#bbeafc',
  '--color-level-primary': '#c8ebdc',
  '--color-level-kindergarten': '#fce4e5',
  '--color-level-international': '#f6edc3',
  '--color-level-secondary-text': '#0274c0',
  '--color-level-primary-text': '#2d7a4f',
  '--color-level-kindergarten-text': '#c44569',
  '--color-level-international-text': '#b8860b',
  '--color-accent': '#10bec9',
  '--color-accent-light': '#e6f9fa',
  '--color-accent-dark': '#0a8a92',
  '--color-error': '#ef4136',
  '--color-error-light': '#fde8e7',
  '--color-success': '#4cd964',
  '--color-success-light': '#e8f8eb',
  '--color-warning': '#f1c40f',
  '--color-warning-light': '#fef9e7',
  '--color-info': '#3498db',
  '--color-info-light': '#e6f3fc',
  '--color-bg-page': '#deffff',
  '--color-bg-card': '#ffffff',
  '--color-bg-surface': '#fefefe',
  '--color-bg-subtle': '#f5f5f5',
  '--color-bg-hover': '#f0f0f0',
  '--color-gray-50': '#fafafa',
  '--color-gray-100': '#f5f5f5',
  '--color-gray-200': '#e9e9e9',
  '--color-gray-300': '#d2d5da',
  '--color-gray-400': '#b1b1b1',
  '--color-gray-500': '#999999',
  '--color-gray-600': '#616161',
  '--color-gray-700': '#333333',
  '--color-gray-800': '#1a1a1a',
  '--color-gray-900': '#000000',
  '--color-text-primary': '#000000',
  '--color-text-secondary': '#333333',
  '--color-text-tertiary': '#616161',
  '--color-text-muted': '#999999',
  '--color-text-disabled': '#b1b1b1',
  '--color-text-inverse': '#ffffff',
  '--color-text-link': '#10bec9',
  '--color-border-default': '#e9e9e9',
  '--color-border-strong': '#d2d5da',
  '--color-border-focus': '#10bec9',
  '--shadow-sm': '0 2px 2px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 6px 0 rgba(0, 0, 0, 0.1)',
  '--shadow-lg': '0 6px 12px 0 rgba(0, 0, 0, 0.175)',
  '--shadow-container': '0 0 15px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-button': '0 0 8px 0 rgba(0, 0, 0, 0.25)',
  '--bg-overlay': 'rgba(255, 255, 255, 0.85)',
  '--bg-scrim': 'rgba(0, 0, 0, 0.5)',
};

/**
 * 暗色主題變數
 */
const darkThemeVars = {
  '--color-brand': '#3ab7e7',
  '--color-brand-50': '#011524',
  '--color-brand-100': '#012a4a',
  '--color-brand-200': '#023f6c',
  '--color-brand-300': '#025a96',
  '--color-brand-400': '#0274c0',
  '--color-brand-500': '#3ab7e7',
  '--color-brand-600': '#65c8ee',
  '--color-brand-700': '#90d9f5',
  '--color-brand-800': '#bbeafc',
  '--color-brand-900': '#e6f2f9',
  '--color-level-secondary': '#1a3a4a',
  '--color-level-primary': '#1a3a2a',
  '--color-level-kindergarten': '#3a1a1f',
  '--color-level-international': '#3a351a',
  '--color-level-secondary-text': '#90d9f5',
  '--color-level-primary-text': '#7dd4a0',
  '--color-level-kindergarten-text': '#f5a0ab',
  '--color-level-international-text': '#f0d870',
  '--color-accent': '#3dd9e4',
  '--color-accent-light': '#1a3a3d',
  '--color-accent-dark': '#6ee7f0',
  '--color-error': '#f56b60',
  '--color-error-light': '#3a1a18',
  '--color-success': '#6ee085',
  '--color-success-light': '#1a3a1f',
  '--color-warning': '#f5d442',
  '--color-warning-light': '#3a351a',
  '--color-info': '#5aade0',
  '--color-info-light': '#1a2a3a',
  '--color-bg-page': '#0a1a2a',
  '--color-bg-card': '#142030',
  '--color-bg-surface': '#1a2535',
  '--color-bg-subtle': '#1f2a3a',
  '--color-bg-hover': '#253040',
  '--color-gray-50': '#1a1a1a',
  '--color-gray-100': '#1f1f1f',
  '--color-gray-200': '#2a2a2a',
  '--color-gray-300': '#3a3a3a',
  '--color-gray-400': '#5a5a5a',
  '--color-gray-500': '#808080',
  '--color-gray-600': '#a0a0a0',
  '--color-gray-700': '#c0c0c0',
  '--color-gray-800': '#e0e0e0',
  '--color-gray-900': '#ffffff',
  '--color-text-primary': '#ffffff',
  '--color-text-secondary': '#e0e0e0',
  '--color-text-tertiary': '#a0a0a0',
  '--color-text-muted': '#808080',
  '--color-text-disabled': '#5a5a5a',
  '--color-text-inverse': '#000000',
  '--color-text-link': '#3dd9e4',
  '--color-border-default': '#2a2a2a',
  '--color-border-strong': '#3a3a3a',
  '--color-border-focus': '#3dd9e4',
  '--shadow-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  '--shadow-md': '0 4px 8px 0 rgba(0, 0, 0, 0.3)',
  '--shadow-lg': '0 8px 16px 0 rgba(0, 0, 0, 0.4)',
  '--shadow-container': '0 0 20px 0 rgba(0, 0, 0, 0.5)',
  '--shadow-button': '0 0 10px 0 rgba(0, 0, 0, 0.4)',
  '--bg-overlay': 'rgba(20, 32, 48, 0.9)',
  '--bg-scrim': 'rgba(0, 0, 0, 0.7)',
};

function applyThemeVars(theme: 'light' | 'dark') {
  const root = document.documentElement;
  const body = document.body;
  const vars = theme === 'dark' ? darkThemeVars : lightThemeVars;

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;

  // 直接設定 body 背景（確保正確套用）
  if (body) {
    body.style.backgroundColor = theme === 'dark' ? darkThemeVars['--color-bg-page'] : lightThemeVars['--color-bg-page'];
    body.style.color = theme === 'dark' ? darkThemeVars['--color-text-primary'] : lightThemeVars['--color-text-primary'];
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化：從 localStorage 讀取
  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    const resolved = initial === 'system' ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyThemeVars(resolved);
    setMounted(true);
  }, []);

  // 監聽系統主題變化
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyThemeVars(newTheme);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // 套用主題（當 resolvedTheme 變化時）
  useEffect(() => {
    if (!mounted) return;
    applyThemeVars(resolvedTheme);
  }, [resolvedTheme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook 取得主題狀態
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
