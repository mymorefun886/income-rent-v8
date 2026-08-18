'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const LEVELS = [
  { key: 'secondary', label: '中學', path: '/schools/secondary' },
  { key: 'primary', label: '小學', path: '/schools/primary' },
  { key: 'kindergarten', label: '幼稚園', path: '/schools/kindergarten' },
  { key: 'international', label: '國際學校', path: '/schools/international' },
];

const NAV_LINKS = [
  { label: '學校一覽', path: '/schools/secondary' },
  { label: '選校攻略', path: '/articles' },
  { label: '最新專題', path: '/articles' },
  { label: 'Agent', path: '/agent' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 監聽滾動，調整導航列樣式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由變化時關閉手機選單
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSearch(false);
  }, [pathname]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setShowSearch(false);
        setMobileMenuOpen(false);
      }
    },
    [searchQuery, router]
  );

  // 判斷當前層級
  const currentLevel = LEVELS.find((l) => pathname.startsWith(l.path))?.key;

  return (
    <>
      {/* Skip link（無障礙） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-brand)] focus:px-4 focus:py-2 focus:text-[var(--color-text-inverse)]"
      >
        跳到主要內容
      </a>

      {/* 頂部 Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-navbar bg-navbar transition-fast ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex h-[56px] items-center justify-between sm:h-[80px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/topschool-logo.png"
                alt="Top School"
                className="h-[36px] w-auto sm:h-[52px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden text-base font-bold text-brand sm:text-xl sm:inline">升學數據庫</span>
            </Link>

            {/* 右側功能區 */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 搜尋按鈕 */}
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-fast sm:h-10 sm:w-10"
                aria-label="搜尋學校"
                aria-expanded={showSearch}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* 我的心水（收藏）— mobile 隱藏文字 */}
              <Link
                href="/favourites"
                className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast sm:px-3"
                aria-label="我的心水"
              >
                <svg className="h-5 w-5 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="hidden sm:inline">我的心水</span>
              </Link>

              {/* 主題切換 */}
              <ThemeToggle />

              {/* 手機版漢堡按鈕 */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast sm:hidden"
                aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 搜尋展開區 */}
        {showSearch && (
          <div className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-4">
            <div className="mx-auto max-w-[1200px] px-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <label htmlFor="navbar-search" className="sr-only">搜尋學校</label>
                <input
                  id="navbar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="學校名稱"
                  autoFocus
                  className="flex-1 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-2 text-base text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
                />
                <button
                  type="submit"
                  className="rounded-md bg-[var(--color-brand)] px-6 py-2 text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-600)] transition-fast"
                >
                  搜尋
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* 主導航列（層級切換）— desktop only */}
      <nav
        className="fixed left-0 right-0 z-navbar bg-navbar transition-fast sm:block hidden"
        style={{ top: '80px' }}
        aria-label="主要導覽"
      >
        <div className="mx-auto max-w-[1200px]">
          {/* 主導航連結 */}
          <div className="flex items-center justify-center gap-8 border-b border-[var(--color-border-default)] px-4 h-[42px]">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.path}
                className={`text-sm font-medium transition-fast hover:text-[var(--color-brand)] ${
                  pathname === link.path ? 'text-[var(--color-brand)] font-semibold' : 'text-[var(--color-text-secondary)]'
                }`}
                aria-current={pathname === link.path ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* 層級切換 Tab */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 sm:gap-8" role="tablist">
            {LEVELS.map((level) => {
              const isActive = currentLevel === level.key;
              return (
                <Link
                  key={level.key}
                  href={level.path}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative px-4 py-2 text-sm font-medium transition-fast sm:px-10 sm:text-base ${
                    isActive
                      ? 'text-[var(--color-error)] font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {level.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-error)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 手機版滑出選單 */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-navbar sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="手機選單"
        >
          <div className="absolute inset-0 bg-[var(--bg-scrim)]" onClick={() => setMobileMenuOpen(false)} />
          <nav
            className="absolute right-0 top-0 h-full w-72 bg-[var(--color-bg-card)] shadow-lg"
            aria-label="手機導覽"
          >
            <div className="flex h-[56px] items-center justify-between border-b border-[var(--color-border-default)] px-4">
              <span className="font-semibold text-[var(--color-text-primary)]">選單</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                aria-label="關閉選單"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.path}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium transition-fast ${
                    pathname === link.path
                      ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                  aria-current={pathname === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-3 border-t border-[var(--color-border-default)]" />
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                學校層級
              </div>
              {LEVELS.map((level) => {
                const isActive = currentLevel === level.key;
                return (
                  <Link
                    key={level.key}
                    href={level.path}
                    className={`block rounded-md px-3 py-2.5 text-base font-medium transition-fast ${
                      isActive
                        ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {level.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* 佔位高度（固定導航列） */}
      <div className="h-[56px] sm:h-[168px]" />
    </>
  );
}
