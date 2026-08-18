import Link from 'next/link';

/**
 * ArticleCard — 文章卡片元件
 *
 * 兩種變體：
 * - default：垂直卡片（列表頁）
 * - horizontal：水平排列（側邊欄/相關文章）
 */
export function ArticleCard({
  article,
  variant = 'default',
}: {
  article: {
    slug: string;
    title: string | null;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: Date | null;
    author?: string | null;
  };
  variant?: 'default' | 'horizontal';
}) {
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="group flex gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
      >
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt=""
            className="h-16 w-20 shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-brand)]">
            {article.title}
          </h3>
          {article.publishedAt && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {new Date(article.publishedAt).toLocaleDateString('zh-HK')}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
    >
      {article.coverImage && (
        <div className="aspect-video w-full overflow-hidden bg-[var(--color-bg-subtle)]">
          <img
            src={article.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-brand)] transition-fast">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 flex-1 text-sm text-[var(--color-text-tertiary)] line-clamp-3">
            {article.excerpt}
          </p>
        )}
        {article.publishedAt && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            {new Date(article.publishedAt).toLocaleDateString('zh-HK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Pagination — 分頁導航
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string | undefined>;
}) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (queryParams) {
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const visiblePages: number[] = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    visiblePages.push(i);
  }

  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="分頁導航">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast"
        >
          ← 上一頁
        </Link>
      )}

      {visiblePages[0] > 1 && (
        <>
          <Link href={buildUrl(1)} className="rounded-md px-3 py-2 text-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]">
            1
          </Link>
          {visiblePages[0] > 2 && <span className="px-1 text-[var(--color-text-muted)]">…</span>}
        </>
      )}

      {visiblePages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`rounded-md px-3 py-2 text-sm transition-fast ${
            p === currentPage
              ? 'bg-[var(--color-brand)] font-medium text-[var(--color-text-inverse)]'
              : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          {p}
        </Link>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-[var(--color-text-muted)]">…</span>
          )}
          <Link href={buildUrl(totalPages)} className="rounded-md px-3 py-2 text-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]">
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast"
        >
          下一頁 →
        </Link>
      )}
    </nav>
  );
}
