import Link from 'next/link';
import { db, schema } from '@/db';
import { eq, or, sql, and, ilike } from 'drizzle-orm';

const LEVEL_NAMES: Record<string, string> = {
  secondary: '中學',
  primary: '小學',
  kindergarten: '幼稚園',
  international: '國際學校',
};

const LEVEL_PATH: Record<string, string> = {
  secondary: 'secondary-school',
  primary: 'primary-school',
  kindergarten: 'kindergarten',
  international: 'international-school',
};

function getBadgeUrl(level: string, metadata: Record<string, any> | null, photoUrl: string | null): string | null {
  const schoolId = metadata?.schoolId;
  if (!schoolId) return null;
  let code = 'spcc';
  if (photoUrl) {
    const match = photoUrl.match(/school_(.+)\.jpg$/);
    if (match) code = match[1];
  }
  return `https://topschool.hket.com/store/school/${LEVEL_PATH[level]}/${schoolId}/badge_${code}.jpg`;
}

/**
 * Search results page — full-text search with trigram similarity.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const { q, level } = await searchParams;
  const query = q?.trim() || '';

  if (!query) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">搜尋學校</h1>
        <p className="text-[var(--color-text-muted)]">請輸入學校名稱進行搜尋。</p>
      </main>
    );
  }

  const conditions: any[] = [
    or(
      ilike(schema.schools.nameZh, `%${query}%`),
      ilike(schema.schools.nameEn, `%${query}%`),
      sql`${schema.schools.nameZh} % ${query}`,
      sql`${schema.schools.nameEn} % ${query}`
    ) as any,
  ];

  if (level) {
    conditions.push(eq(schema.schools.level, level as typeof schema.schools.$inferSelect.level));
  }

  const schools = await db
    .select({
      slug: schema.schools.slug,
      nameEn: schema.schools.nameEn,
      nameZh: schema.schools.nameZh,
      level: schema.schools.level,
      gender: schema.schools.gender,
      levelFields: schema.schools.levelFields,
      metadata: schema.schools.metadata,
      photoUrl: schema.schools.photoUrl,
    })
    .from(schema.schools)
    .where(and(...conditions))
    .orderBy(sql`GREATEST(similarity(${schema.schools.nameZh}, ${query}), similarity(${schema.schools.nameEn}, ${query})) DESC`)
    .limit(30);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">搜尋結果</h1>
      <p className="mb-6 text-[var(--color-text-tertiary)]">
        {schools.length} 個結果符合「{query}」
        {level && `（${LEVEL_NAMES[level]}）`}
      </p>

      {schools.length === 0 ? (
        <div className="rounded-xl bg-[var(--color-bg-card)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-subtle)]">
            <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-4 text-[var(--color-text-tertiary)]">沒有找到符合的學校。</p>
          <Link href="/schools/secondary" className="btn-primary">
            瀏覽所有學校 →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-bg-card)] shadow-sm">
          <div className="divide-y divide-[var(--color-border-default)]">
            {schools.map((s) => {
              const lf = (s.levelFields as Record<string, any>) || {};
              const badgeUrl = getBadgeUrl(s.level, s.metadata as Record<string, any> | null, s.photoUrl);
              const district = (s.metadata as any)?.districtName || '';

              return (
                <div key={s.slug} className="school-card group">
                  {/* 圓形頭像 */}
                  <div className="avatar-circle shrink-0">
                    {badgeUrl ? (
                      <img src={badgeUrl} alt={s.nameZh} className="h-full w-full object-contain p-3" loading="lazy" />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">無相片</span>
                    )}
                  </div>

                  {/* 學校資訊 */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/schools/${s.level}/${s.slug}`}
                      className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-fast sm:text-lg"
                    >
                      {s.nameZh}
                    </Link>
                    {s.nameEn && (
                      <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{s.nameEn}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      <span className="tag tag-accent">{LEVEL_NAMES[s.level]}</span>
                      {district && <span className="text-[var(--color-text-tertiary)]">{district}</span>}
                      {lf.banding && <span className="text-[var(--color-text-tertiary)]">{lf.banding}</span>}
                      {lf.language && <span className="text-[var(--color-text-tertiary)]">{lf.language}</span>}
                      {s.gender && (
                        <span className="text-[var(--color-text-tertiary)]">
                          {s.gender === 'coed' ? '男女' : s.gender === 'boys' ? '男' : '女'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 整張卡片連結 */}
                  <Link
                    href={`/schools/${s.level}/${s.slug}`}
                    className="absolute inset-0 z-1"
                    aria-label={`查看 ${s.nameZh} 詳情`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
