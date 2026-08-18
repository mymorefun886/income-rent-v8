import Link from 'next/link';
import { db, schema } from '@/db';
import { sql } from 'drizzle-orm';

const LEVELS = [
  {
    key: 'secondary',
    label: '中學',
    param: '中學',
    color: 'bg-level-secondary',
    textColor: 'text-level-secondary',
  },
  {
    key: 'primary',
    label: '小學',
    param: '小學',
    color: 'bg-level-primary',
    textColor: 'text-level-primary',
  },
  {
    key: 'kindergarten',
    label: '幼稚園',
    param: '幼稚園',
    color: 'bg-level-kindergarten',
    textColor: 'text-level-kindergarten',
  },
  {
    key: 'international',
    label: '國際學校',
    param: '國際學校',
    color: 'bg-level-international',
    textColor: 'text-level-international',
  },
];

export default async function HomePage() {
  let total = 0;
  let countMap: Record<string, number> = {};
  let dbError = false;

  try {
    const counts = await db
      .select({ level: schema.schools.level, count: sql<number>`count(*)` })
      .from(schema.schools)
      .groupBy(schema.schools.level);

    countMap = Object.fromEntries(counts.map((c) => [c.level, Number(c.count)]));
    total = Object.values(countMap).reduce((a, b) => a + b, 0);
  } catch {
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      {/* 首頁標題 */}
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-4xl">學校一覽</h1>
        <p className="mt-2 text-sm text-[var(--color-text-tertiary)] sm:text-base">
          匯集了全面的學校資訊，助您快速了解各校的特點和優勢
        </p>
      </div>

      {/* 層級卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {LEVELS.map((level) => (
          <Link
            key={level.key}
            href={`/schools/${level.key}`}
            className={`group rounded-xl ${level.color} p-6 text-center shadow-sm transition-normal hover:shadow-md hover:-translate-y-1`}
          >
            <div className={`text-4xl font-bold ${level.textColor} sm:text-5xl`}>
              {countMap[level.key] ?? 0}
            </div>
            <div className="mt-2 text-base font-medium text-[var(--color-text-secondary)] sm:text-lg">
              {level.label}
            </div>
            <div className="mt-3 text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] transition-fast">
              瀏覽所有 →
            </div>
          </Link>
        ))}
      </div>

      {/* 資料庫狀態 */}
      <div className="mt-8 rounded-xl bg-[var(--color-bg-card)] p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">系統狀態</h2>

        {dbError ? (
          <div className="rounded-lg bg-[var(--color-error-light)] p-4 text-[var(--color-error)]">
            <p className="font-medium">資料庫連線失敗</p>
            <p className="mt-1 text-sm">請確認 PostgreSQL 已啟動且 `.env` 的 `DATABASE_URL` 正確。</p>
          </div>
        ) : total === 0 ? (
          <div className="rounded-lg bg-[var(--color-warning-light)] p-4 text-[var(--color-warning)]">
            <p className="font-medium">資料庫尚未有資料</p>
            <p className="mt-1 text-sm">請先執行爬蟲與匯入程序。</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[var(--color-text-tertiary)]">
                資料庫共有 <span className="font-semibold text-[var(--color-brand)]">{total}</span> 所學校
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                資料來源：Topschool / 教育局
              </p>
            </div>
            <Link
              href="/agent"
              className="btn-primary"
            >
              開始使用 Agent 查詢 →
            </Link>
          </div>
        )}
      </div>

      {/* 功能介紹 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-[var(--color-bg-card)] p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
            <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">快速搜尋</h3>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            支援學校名稱、地區、類別等多維度搜尋
          </p>
        </div>

        <div className="rounded-xl bg-[var(--color-bg-card)] p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
            <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">收藏比較</h3>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            收藏心水學校，最多可比較 4 間學校
          </p>
        </div>

        <div className="rounded-xl bg-[var(--color-bg-card)] p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-light)]">
            <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Agent 對話</h3>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            自然語言查詢，AI 助你找到最適合的學校
          </p>
        </div>
      </div>
    </main>
  );
}
