import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq, desc, sql, and } from 'drizzle-orm';

/**
 * 文章詳情頁
 *
 * 顯示：標題、作者、發布日期、封面圖、文章內容、相關學校、相關文章
 */
export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 讀取文章
  const results = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.slug, slug))
    .limit(1);

  const article = results[0];
  if (!article) notFound();

  // 相關學校（透過 article_schools）
  let relatedSchools: {
    slug: string;
    nameZh: string;
    nameEn: string | null;
    level: string;
  }[] = [];

  try {
    relatedSchools = await db
      .select({
        slug: schema.schools.slug,
        nameZh: schema.schools.nameZh,
        nameEn: schema.schools.nameEn,
        level: schema.schools.level,
      })
      .from(schema.articleSchools)
      .innerJoin(schema.schools, eq(schema.schools.id, schema.articleSchools.schoolId))
      .where(eq(schema.articleSchools.articleId, article.id))
      .limit(6);
  } catch {
    // 關聯表可能為空
  }

  // 相關文章（較早的文章）
  let relatedArticles: {
    slug: string;
    title: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
  }[] = [];

  try {
    relatedArticles = await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        coverImage: schema.articles.coverImage,
        publishedAt: schema.articles.publishedAt,
      })
      .from(schema.articles)
      .where(and(sql`${schema.articles.id} != ${article.id}`, sql`${schema.articles.slug} != ${slug}`))
      .orderBy(desc(schema.articles.publishedAt))
      .limit(4);
  } catch {
    // ignore
  }

  // 解析 body — 簡易 HTML/換行處理
  const bodyHtml = article.body ? stripHtml(article.body) : '';
  const paragraphs = bodyHtml.split('\n').filter((p) => p.trim());

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--color-text-muted)]" aria-label="breadcrumb">
        <Link href="/" className="hover:text-[var(--color-brand)]">首頁</Link>
        <span className="mx-2">/</span>
        <Link href="/articles" className="hover:text-[var(--color-brand)]">文章</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-primary)] line-clamp-1">{article.title}</span>
      </nav>

      <article className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6">
        {/* 封面圖 */}
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title || ''}
            className="mb-6 aspect-video w-full rounded-lg object-cover"
          />
        )}

        {/* 標題 */}
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight sm:text-2xl">
          {article.title}
        </h1>

        {/* 元資料 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          {article.author && (
            <span>作者：{article.author}</span>
          )}
          {article.publishedAt && (
            <time dateTime={new Date(article.publishedAt).toISOString()}>
              {new Date(article.publishedAt).toLocaleDateString('zh-HK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
        </div>

        {/* 摘要 */}
        {article.excerpt && (
          <p className="mt-4 rounded-lg bg-[var(--color-bg-subtle)] p-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* 文章內容 */}
        {paragraphs.length > 0 ? (
          <div className="mt-6 space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-[var(--color-text-muted)]">（文章內容擷取失敗）</p>
        )}
      </article>

      {/* 相關學校 */}
      {relatedSchools.length > 0 && (
        <section className="mt-8" aria-labelledby="related-schools-heading">
          <h2 id="related-schools-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            相關學校
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedSchools.map((school) => (
              <Link
                key={school.slug}
                href={`/schools/${school.level}/${school.slug}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                    {school.nameZh}
                  </h3>
                  {school.nameEn && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{school.nameEn}</p>
                  )}
                </div>
                <LevelBadge level={school.level} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 相關文章 */}
      {relatedArticles.length > 0 && (
        <section className="mt-8" aria-labelledby="related-articles-heading">
          <h2 id="related-articles-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            其他文章
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedArticles.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="group flex gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
              >
                {a.coverImage && (
                  <img
                    src={a.coverImage}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-brand)]">
                    {a.title}
                  </h3>
                  {a.publishedAt && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {new Date(a.publishedAt).toLocaleDateString('zh-HK')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 返回 */}
      <div className="mt-8">
        <Link
          href="/articles"
          className="text-sm text-[var(--color-brand)] hover:underline"
        >
          ← 返回文章列表
        </Link>
      </div>
    </main>
  );
}

const LEVEL_NAMES: Record<string, string> = {
  secondary: '中學',
  primary: '小學',
  kindergarten: '幼稚園',
  international: '國際學校',
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="shrink-0 rounded bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-brand)]">
      {LEVEL_NAMES[level] || level}
    </span>
  );
}

/** 簡易 HTML tag 移除 + entity 還原 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
