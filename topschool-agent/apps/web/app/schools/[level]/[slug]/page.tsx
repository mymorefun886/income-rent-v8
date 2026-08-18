import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, schema } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { FavouriteButton } from '@/components/FavouriteButton';
import { CompareButton } from '@/components/CompareButton';

/**
 * Enhanced School Profile Page — structured display by level.
 */

const LEVEL_NAMES: Record<string, string> = {
  secondary: '中學',
  primary: '小學',
  kindergarten: '幼稚園',
  international: '國際學校',
};

const GENDER_NAMES: Record<string, string> = {
  boys: '男校',
  girls: '女校',
  coed: '男女校',
};

export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ level: string; slug: string }>;
}) {
  const { level, slug } = await params;

  const results = await db
    .select()
    .from(schema.schools)
    .where(
      and(
        eq(schema.schools.slug, slug),
        eq(schema.schools.level, level as typeof schema.schools.$inferSelect.level)
      )
    )
    .limit(1);

  const school = results[0];
  if (!school) notFound();

  // 相關文章
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
      .from(schema.articleSchools)
      .innerJoin(schema.articles, eq(schema.articles.id, schema.articleSchools.articleId))
      .where(eq(schema.articleSchools.schoolId, school.id))
      .orderBy(desc(schema.articles.publishedAt))
      .limit(4);
  } catch {
    // ignore
  }

  const lf = (school.levelFields as Record<string, any>) || {};

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:text-[var(--color-brand)]">首頁</Link>
        <span className="mx-2">/</span>
        <Link href={`/schools/${level}`} className="hover:text-[var(--color-brand)]">
          {LEVEL_NAMES[level] || level}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-primary)]">{school.nameZh || school.nameEn}</span>
      </nav>

      {/* Header */}
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">{school.nameZh}</h1>
            {school.nameEn && (
              <p className="mt-1 text-base text-[var(--color-text-tertiary)] sm:text-lg">{school.nameEn}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-[var(--color-brand)]/10 px-3 py-1 text-sm font-medium text-[var(--color-brand)]">
              {LEVEL_NAMES[level] || level}
            </span>
            {school.gender && (
              <span className="rounded bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                {GENDER_NAMES[school.gender] || school.gender}
              </span>
            )}
            {lf.banding && (
              <span className="rounded bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                Band {lf.banding}
              </span>
            )}
          </div>
        </div>

        {/* Quick badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {lf.language && <Badge color="green">{lf.language}</Badge>}
          {lf.schoolType && <Badge color="orange">{lf.schoolType}</Badge>}
          {lf.curriculum && lf.curriculum.length > 0 && (
            <Badge color="red">{lf.curriculum.join(', ')}</Badge>
          )}
          {school.religion && school.religion !== '不適用' && (
            <Badge color="purple">{school.religion}</Badge>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">聯絡資料</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {school.addressZh && <Field label="地址" value={school.addressZh} icon="📍" />}
          {school.phone && <Field label="電話" value={school.phone} icon="📞" />}
          {school.fax && <Field label="傳真" value={school.fax} icon="📠" />}
          {school.email && <Field label="電郵" value={school.email} icon="✉️" />}
          {school.website && (
            <Field
              label="網址"
              value={
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-brand)] hover:underline"
                >
                  {school.website}
                </a>
              }
              icon="🌐"
            />
          )}
        </div>
      </section>

      {/* School Info */}
      <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="school-info-heading">
        <h2 id="school-info-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">辦學資料</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {school.yearFounded && <Field label="創校年份" value={`${school.yearFounded} 年`} />}
          {school.sponsoringBody && <Field label="辦學團體" value={school.sponsoringBody} />}
          {school.principalZh && <Field label="校長" value={school.principalZh} />}
          {lf.teacherCount && <Field label="教師人數" value={`${lf.teacherCount} 人`} />}
        </div>

        {school.missionZh && (
          <div className="mt-6">
            <h3 className="mb-2 font-medium text-[var(--color-text-secondary)]">辦學宗旨</h3>
            <p className="whitespace-pre-wrap text-[var(--color-text-tertiary)] leading-relaxed">
              {stripHtml(school.missionZh)}
            </p>
          </div>
        )}
      </section>

      {/* Level-specific sections */}
      {level === 'secondary' && <SecondarySection lf={lf} />}
      {level === 'primary' && <PrimarySection lf={lf} />}
      {level === 'kindergarten' && <KindergartenSection lf={lf} />}
      {level === 'international' && <InternationalSection lf={lf} />}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <FavouriteButton level={level} slug={slug} nameZh={school.nameZh || school.nameEn} />
        <CompareButton level={level} slug={slug} nameZh={school.nameZh || school.nameEn} />
        {lf.registrationInfo && (
          <a
            href={lf.registrationInfo}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] text-center"
          >
            📋 教育局資料
          </a>
        )}
      </div>

      {/* 相關文章 */}
      {relatedArticles.length > 0 && (
        <section className="mt-8" aria-labelledby="related-articles-heading">
          <h2 id="related-articles-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            相關文章
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
    </main>
  );
}

// ============ Level-Specific Sections ============

function SecondarySection({ lf }: { lf: Record<string, any> }) {
  const classCount = Array.isArray(lf.classCount) ? lf.classCount[0] : lf.classCount;
  const subjects = Array.isArray(lf.secondarySubject) ? lf.secondarySubject[0] : lf.secondarySubject;

  return (
    <>
      {/* Class Structure */}
      {classCount && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="class-structure-heading">
          <h2 id="class-structure-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">班級結構</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">學年：{classCount.schoolYear}</p>
          <div className="grid grid-cols-4 gap-1 text-center sm:grid-cols-7 sm:gap-2">
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中一</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y1}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中二</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y2}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中三</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y3}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中四</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y4}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中五</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y5}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">中六</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y6}</div>
            </div>
            <div className="rounded bg-[var(--color-brand)]/10 p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">總數</div>
              <div className="text-base font-semibold text-[var(--color-brand)] sm:text-lg">{classCount.total}</div>
            </div>
          </div>
        </section>
      )}

      {/* Subjects */}
      {subjects && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="subjects-heading">
          <h2 id="subjects-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">開設科目</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">學年：{subjects.schoolYear}</p>

          {subjects.flexibleS1ToS3 && subjects.flexibleS1ToS3.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">中一至中三（彈性課程）</h3>
              <div className="flex flex-wrap gap-1">
                {subjects.flexibleS1ToS3.map((s: string, i: number) => (
                  <Badge key={i} color="blue">{stripHtml(s)}</Badge>
                ))}
              </div>
            </div>
          )}

          {subjects.flexibleS4ToS6 && subjects.flexibleS4ToS6.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">中四中六（彈性課程）</h3>
              <div className="flex flex-wrap gap-1">
                {subjects.flexibleS4ToS6.map((s: string, i: number) => (
                  <Badge key={i} color="green">{stripHtml(s)}</Badge>
                ))}
              </div>
            </div>
          )}

          {subjects.byChineseS4ToS6 && subjects.byChineseS4ToS6.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">中四中六（中文組）</h3>
              <p className="text-sm text-[var(--color-text-tertiary)]">{stripHtml(subjects.byChineseS4ToS6.join(', '))}</p>
            </div>
          )}

          {subjects.byEnglishS4ToS6 && subjects.byEnglishS4ToS6.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">中四中六（英文組）</h3>
              <p className="text-sm text-[var(--color-text-tertiary)]">{stripHtml(subjects.byEnglishS4ToS6.join(', '))}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function PrimarySection({ lf }: { lf: Record<string, any> }) {
  const classCount = Array.isArray(lf.classCount) ? lf.classCount[0] : lf.classCount;

  return (
    <>
      {classCount && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="primary-class-heading">
          <h2 id="primary-class-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">班級結構</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">學年：{classCount.schoolYear}</p>
          <div className="grid grid-cols-4 gap-1 text-center sm:grid-cols-7 sm:gap-2">
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小一</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y1}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小二</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y2}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小三</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y3}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小四</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y4}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小五</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y5}</div>
            </div>
            <div className="rounded bg-[var(--color-bg-subtle)] p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">小六</div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{classCount.y6}</div>
            </div>
            <div className="rounded bg-[var(--color-brand)]/10 p-1 sm:p-2">
              <div className="text-[10px] text-[var(--color-text-muted)] sm:text-xs">總數</div>
              <div className="text-base font-semibold text-[var(--color-brand)] sm:text-lg">{classCount.total}</div>
            </div>
          </div>
        </section>
      )}

      {lf.admission && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="admission-heading">
          <h2 id="admission-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">入學資訊</h2>
          <p className="whitespace-pre-wrap text-[var(--color-text-tertiary)] leading-relaxed">
            {stripHtml(lf.admission)}
          </p>
        </section>
      )}
    </>
  );
}

function KindergartenSection({ lf }: { lf: Record<string, any> }) {
  return (
    <>
      {lf.monthlyFee && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="kg-fee-heading">
          <h2 id="kg-fee-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">學費資料</h2>
          <p className="text-[var(--color-text-tertiary)]">每月學費：${lf.monthlyFee}</p>
        </section>
      )}

      {lf.feeRemission && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="kg-fee-remission-heading">
          <h2 id="kg-fee-remission-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">學費減免</h2>
          <p className="whitespace-pre-wrap text-[var(--color-text-tertiary)] leading-relaxed">
            {stripHtml(lf.feeRemission)}
          </p>
        </section>
      )}
    </>
  );
}

function InternationalSection({ lf }: { lf: Record<string, any> }) {
  return (
    <>
      {lf.fees && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="intl-fee-heading">
          <h2 id="intl-fee-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">學費資料</h2>
          <div className="whitespace-pre-wrap text-[var(--color-text-tertiary)]">{stripHtml(String(lf.fees))}</div>
        </section>
      )}

      {lf.curriculum && lf.curriculum.length > 0 && (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 shadow-sm sm:p-6" aria-labelledby="intl-curriculum-heading">
          <h2 id="intl-curriculum-heading" className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">課程</h2>
          <div className="flex flex-wrap gap-2">
            {lf.curriculum.map((c: string, i: number) => (
              <Badge key={i} color="red">{c}</Badge>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ============ Utility Components ============

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-[var(--color-text-muted)]">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </dt>
      <dd className="mt-0.5 text-[var(--color-text-primary)]">{value}</dd>
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}
