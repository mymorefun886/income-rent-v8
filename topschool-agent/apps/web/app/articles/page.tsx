import Link from 'next/link';
import { db, schema } from '@/db';
import { desc, sql, eq, type SQL, and } from 'drizzle-orm';
import { ArticleCard, Pagination } from '@/components/article/ArticleCard';

const PAGE_SIZE = 12;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tag?: string }>;
}) {
  const { q, page: pageStr, tag } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;
  const query = q?.trim() || '';

  // 構建查詢條件
  const conditions: SQL[] = [];
  if (query) {
    conditions.push(
      sql`(${schema.articles.title} ILIKE ${'%' + query + '%'} OR ${schema.articles.excerpt} ILIKE ${'%' + query + '%'})`
    );
  }
  if (tag) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${schema.articleTags}
        JOIN ${schema.tags} ON ${schema.tags.id} = ${schema.articleTags.tagId}
        WHERE ${schema.articleTags.articleId} = ${schema.articles.id}
        AND ${schema.tags.name} = ${tag}
      )`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 查詢
  let total = 0;
  let articles: {
    slug: string;
    title: string | null;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    author: string | null;
  }[] = [];
  let tags: { name: string; count: number }[] = [];
  let dbError = false;

  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.articles)
      .where(whereClause);
    total = Number(countResult[0]?.count ?? 0);

    articles = await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        excerpt: schema.articles.excerpt,
        coverImage: schema.articles.coverImage,
        publishedAt: schema.articles.publishedAt,
        author: schema.articles.author,
      })
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    // 熱門標籤
    tags = await db
      .select({
        name: schema.tags.name,
        count: sql<number>`count(*)`,
      })
      .from(schema.articleTags)
      .innerJoin(schema.tags, eq(schema.tags.id, schema.articleTags.tagId))
      .groupBy(schema.tags.name)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
  } catch {
    dbError = true;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-6 text-sm text-[var(--color-text-muted)]" aria-label="breadcrumb">
        <Link href="/" className="hover:text-[var(--color-brand)]">首頁</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-primary)]">文章</span>
      </nav>

      <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">升學文章</h1>

      {/* 搜尋列 */}
      <form method="GET" className="mb-6 flex gap-2" role="search">
        <label htmlFor="article-search" className="sr-only">搜尋文章</label>
        <input
          id="article-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="搜尋文章標題或內容..."
          className="flex-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-600)] transition-fast"
        >
          搜尋
        </button>
      </form>

      {/* 標籤 */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-xs text-[var(--color-text-muted)] self-center">熱門標籤：</span>
          {tags.map((t) => (
            <Link
              key={t.name}
              href={`?tag=${encodeURIComponent(t.name)}`}
              className={`rounded-full border px-3 py-1 text-xs transition-fast ${
                tag === t.name
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                  : 'border-[var(--color-border-strong)] text-[var(--color-text-tertiary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
              }`}
            >
              {t.name}
            </Link>
          ))}
          {tag && (
            <Link
              href="/articles"
              className="rounded-full border border-[var(--color-error)]/30 px-3 py-1 text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
            >
              清除標籤 ✕
            </Link>
          )}
        </div>
      )}

      {dbError ? (
        <div className="rounded bg-[var(--color-warning-light)] p-4 text-[var(--color-warning)]" role="alert">
          資料庫連線失敗。
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8 text-center text-[var(--color-text-muted)]">
          {query || tag ? '沒有符合條件的文章。' : '尚未有文章資料。'}
        </div>
      ) : (
        <>
          {/* 文章列表 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/articles"
              queryParams={{ q: query || undefined, tag }}
            />
          )}

          <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
            共 {total} 篇文章
          </p>
        </>
      )}
    </main>
  );
}
