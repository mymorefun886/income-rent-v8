import Link from 'next/link';
import { db, schema } from '@/db';
import { eq, sql, and, type SQL, or, inArray } from 'drizzle-orm';
import { FilterSidebar } from '@/components/FilterSidebar';

const PAGE_SIZE = 24;

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

/**
 * 生成 badge URL
 * Pattern: https://topschool.hket.com/store/school/{level}/{schoolId}/badge_{code}.jpg
 */
function getBadgeUrl(
  level: string,
  metadata: Record<string, any> | null,
  photoUrl: string | null
): string | null {
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
 * 學校卡片組件（Topschool 風格：圓形頭像 + 清晰詳情）
 */
function SchoolCard({
  school,
  level,
}: {
  school: any;
  level: string;
}) {
  const lf = (school.levelFields as Record<string, any>) || {};
  const badgeUrl = getBadgeUrl(level, school.metadata, school.photoUrl);
  const district = (school.metadata as any)?.districtName || '';

  // 性別顯示
  const genderText =
    school.gender === 'coed'
      ? '男女校'
      : school.gender === 'boys'
        ? '男校'
        : school.gender === 'girls'
          ? '女校'
          : '—';

  // 詳情標籤
  const details = [
    { label: '地區', value: district },
    { label: '類別', value: lf.schoolType },
    { label: '宗教', value: school.religion && school.religion !== '不適用' ? school.religion : null },
    { label: '性別', value: genderText },
    { label: '組別', value: lf.banding },
    { label: '語言', value: lf.language },
  ].filter((d) => d.value && d.value !== '—');

  return (
    <div className="group relative flex flex-col items-start gap-3 border-b border-[var(--color-border-default)] p-3 transition-normal hover:bg-[var(--color-bg-hover)] sm:flex-row-reverse sm:gap-4 sm:p-4">
      {/* 學校頭像（圓形，Topschool 風格） */}
      <div className="avatar-circle avatar-circle--sm shrink-0 sm:h-[82px] sm:w-[82px]">
        {badgeUrl ? (
          <img
            src={badgeUrl}
            alt=""
            className="h-full w-full object-contain p-2 sm:p-3"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">無相片</span>
        )}
      </div>

      {/* 學校資訊 */}
      <div className="min-w-0 flex-1">
        {/* 學校名稱（可點擊） */}
        <Link
          href={`/schools/${level}/${school.slug}`}
          className="text-base font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-fast sm:text-lg"
        >
          {school.nameZh}
        </Link>

        {/* 英文名稱 */}
        {school.nameEn && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)] sm:text-sm">{school.nameEn}</p>
        )}

        {/* 詳情標籤（mobile 2列 / desktop 3列） */}
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:mt-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-1.5 sm:text-sm">
          {details.map((detail) => (
            <li key={detail.label} className="flex">
              <span className="w-10 shrink-0 text-[var(--color-text-muted)] sm:w-14">{detail.label}：</span>
              <span className="truncate font-medium text-[var(--color-text-primary)]">{detail.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 整張卡片連結（覆蓋層） */}
      <Link
        href={`/schools/${level}/${school.slug}`}
        className="absolute inset-0 z-1"
        aria-label={`查看 ${school.nameZh} 詳情`}
      />
    </div>
  );
}

export default async function SchoolsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{
    districts?: string;
    languages?: string;
    types?: string;
    religions?: string;
    genders?: string;
    bandings?: string;
    curriculums?: string;
    page?: string;
  }>;
}) {
  const { level } = await params;
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  // 篩選條件
  const conditions: SQL[] = [
    eq(schema.schools.level, level as typeof schema.schools.$inferSelect.level),
  ];

  // 解析地區（過濾掉分區名稱）
  const districts = sp.districts?.split(',').filter(Boolean).filter(d => !d.includes('區') || d.length <= 3) || [];
  const languages = sp.languages?.split(',').filter(Boolean) || [];
  const types = sp.types?.split(',').filter(Boolean) || [];
  const religions = sp.religions?.split(',').filter(Boolean) || [];
  const genders = sp.genders?.split(',').filter(Boolean) || [];
  const bandings = sp.bandings?.split(',').filter(Boolean) || [];
  const curriculums = sp.curriculums?.split(',').filter(Boolean) || [];

  if (districts.length > 0) {
    const districtConditions: SQL[] = [];
    for (const d of districts) {
      districtConditions.push(
        sql`(${schema.schools.metadata}->>'districtName' = ${d} OR ${schema.schools.addressZh} LIKE ${'%' + d + '%'})`
      );
    }
    conditions.push(or(...districtConditions) as SQL);
  }

  if (languages.length > 0) {
    conditions.push(
      or(...languages.map((l) => sql`${schema.schools.levelFields}->>'language' = ${l}`)) as SQL
    );
  }

  if (types.length > 0) {
    conditions.push(
      or(
        ...types.map((t) =>
          or(
            sql`${schema.schools.levelFields}->>'schoolType' = ${t}`,
            sql`${schema.schools.levelFields}->>'schoolType' LIKE ${'%' + t + '%'}`
          )
        )
      ) as SQL
    );
  }

  if (religions.length > 0) {
    conditions.push(
      or(...religions.map((r) => sql`${schema.schools.religion} LIKE ${'%' + r + '%'}`)) as SQL
    );
  }

  if (genders.length > 0) {
    conditions.push(inArray(schema.schools.gender, genders as ('boys' | 'girls' | 'coed')[]));
  }

  if (bandings.length > 0) {
    conditions.push(
      or(...bandings.map((b) => sql`${schema.schools.levelFields}->>'banding' = ${b}`)) as SQL
    );
  }

  if (curriculums.length > 0) {
    conditions.push(
      or(
        ...curriculums.map((c) => sql`${schema.schools.levelFields}->>'curriculum' ILIKE ${'%' + c + '%'}`)
      ) as SQL
    );
  }

  const whereClause = and(...conditions);

  // 查詢
  let total = 0;
  let schools: any[] = [];
  let dbError = false;

  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.schools)
      .where(whereClause);
    total = Number(countResult[0]?.count ?? 0);

    schools = await db
      .select({
        slug: schema.schools.slug,
        nameEn: schema.schools.nameEn,
        nameZh: schema.schools.nameZh,
        level: schema.schools.level,
        gender: schema.schools.gender,
        religion: schema.schools.religion,
        photoUrl: schema.schools.photoUrl,
        metadata: schema.schools.metadata,
        levelFields: schema.schools.levelFields,
      })
      .from(schema.schools)
      .where(whereClause)
      .orderBy(schema.schools.nameZh)
      .limit(PAGE_SIZE)
      .offset(offset);
  } catch (err) {
    console.error('[schools list] error:', err);
    dbError = true;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      {dbError ? (
        <div className="rounded-lg bg-[var(--color-error-light)] p-4 text-[var(--color-error)]">
          資料庫連線失敗，請確認 PostgreSQL 已啟動。
        </div>
      ) : (
        <>
          {/* 篩選器 */}
          <FilterSidebar level={level} total={total} />

          {/* 學校列表 */}
          {schools.length === 0 ? (
            <div className="mt-8 rounded-lg bg-[var(--color-bg-card)] p-8 text-center text-[var(--color-text-muted)]">
              沒有符合條件的學校。
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-[var(--color-bg-card)] shadow-sm">
              {/* 兩列佈局（desktop） */}
              <div className="divide-y divide-[var(--color-border-default)] sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-x-4">
                {schools.map((school, index) => (
                  <div
                    key={school.slug}
                    className={`relative ${
                      index % 2 === 0 ? 'sm:pr-4' : 'sm:pl-4'
                    } ${index % 2 === 0 && schools.length > 1 ? 'sm:border-r sm:border-[var(--color-border-default)]' : ''}`}
                  >
                    <SchoolCard school={school} level={level} />
                  </div>
                ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-[var(--color-border-default)] py-6">
                  {page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && k !== 'page')), page: String(page - 1) })}`}
                      className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast"
                    >
                      ← 上一頁
                    </Link>
                  )}
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    第 {page} / {totalPages} 頁
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && k !== 'page')), page: String(page + 1) })}`}
                      className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-fast"
                    >
                      下一頁 →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
