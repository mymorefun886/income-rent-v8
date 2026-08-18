import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色（引用 CSS 變數以支援主題切換）
        brand: {
          DEFAULT: 'var(--color-brand)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        // 層級專屬顏色
        level: {
          secondary: 'var(--color-level-secondary)',
          primary: 'var(--color-level-primary)',
          kindergarten: 'var(--color-level-kindergarten)',
          international: 'var(--color-level-international)',
        },
        // 強調色
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          dark: 'var(--color-accent-dark)',
        },
        // 中性色（引用 CSS 變數）
        surface: {
          DEFAULT: 'var(--color-bg-surface)',
          50: 'var(--color-bg-card)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        // 語義色
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        // 繁體中文標準字體 stack
        sans: [
          '微軟正黑體',
          'Microsoft JhengHei',
          'Microsoft Yahei',
          'Helvetica Neue',
          'Verdana',
          'Arial',
          'LiHei Pro Medium',
          'Helvetica',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
        '4xl': '2.25rem', // 36px
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '0.25rem',   // 4px
        md: '0.375rem',  // 6px
        lg: '0.5rem',    // 8px
        xl: '0.625rem',  // 10px
        '2xl': '0.75rem', // 12px
        full: '3.125rem', // 50px（圓形頭像）
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        container: 'var(--shadow-container)',
        button: 'var(--shadow-button)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
      },
      zIndex: {
        navbar: '3',
        filter: '300',
        dropdown: '999',
        toast: '1000',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
