'use client';

import { useCompare } from '@/components/CompareProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Compare page — side-by-side comparison of selected schools.
 */

interface SchoolData {
  slug: string;
  nameZh: string;
  nameEn: string;
  level: string;
  gender: string | null;
  religion: string | null;
  addressZh: string | null;
  phone: string | null;
  website: string | null;
  yearFounded: number | null;
  sponsoringBody: string | null;
  principalZh: string | null;
  levelFields: Record<string, any> | null;
  metadata: Record<string, any> | null;
  photoUrl: string | null;
}

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

export default function ComparePage() {
  const { items, removeItem, clear } = useCompare();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    items.forEach((i) => params.append('slug', i.slug));
    params.set('level', items[0].level);

    fetch(`/api/v1/schools/batch?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSchools(data.schools || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">學校比較</h1>
        <div className="rounded-xl bg-[var(--color-bg-card)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-subtle)]">
            <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="mb-4 text-[var(--color-text-tertiary)]">尚未選擇任何學校進行比較。</p>
          <Link href="/schools/secondary" className="btn-primary">
            前往學校列表 →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
          學校比較 ({items.length})
        </h1>
        <button
          onClick={clear}
          className="rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/30 hover:text-[var(--color-error)] transition-fast"
        >
          清除全部
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border-default)] border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[var(--color-bg-card)] shadow-sm">
          <table className="w-full border-collapse">
            <tbody>
              {/* 學校名稱 + 頭像 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="w-32 bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  學校
                </th>
                {schools.map((s) => {
                  const badgeUrl = getBadgeUrl(s.level, s.metadata, s.photoUrl);
                  return (
                    <td key={s.slug} className="min-w-[200px] p-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar-circle h-12 w-12">
                          {badgeUrl ? (
                            <img src={badgeUrl} alt={s.nameZh} className="h-full w-full object-contain p-2" />
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)]">無</span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/schools/${items[0]?.level}/${s.slug}`}
                            className="font-semibold text-[var(--color-brand)] hover:underline"
                          >
                            {s.nameZh}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.nameEn}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(s.slug)}
                        className="mt-2 text-xs text-[var(--color-error)] hover:underline"
                      >
                        移除
                      </button>
                    </td>
                  );
                })}
              </tr>

              {/* 層級 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  層級
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {LEVEL_NAMES[s.level] || s.level}
                  </td>
                ))}
              </tr>

              {/* 地區 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  地區
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.metadata?.districtName || '—'}
                  </td>
                ))}
              </tr>

              {/* 性別 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  性別
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.gender === 'coed' ? '男女校' : s.gender === 'boys' ? '男校' : s.gender === 'girls' ? '女校' : '—'}
                  </td>
                ))}
              </tr>

              {/* Banding */}
              {schools.some((s) => s.levelFields?.banding) && (
                <tr className="border-b border-[var(--color-border-default)]">
                  <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                    Banding
                  </th>
                  {schools.map((s) => (
                    <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                      {s.levelFields?.banding ? `Band ${s.levelFields.banding}` : '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* 教學語言 */}
              {schools.some((s) => s.levelFields?.language) && (
                <tr className="border-b border-[var(--color-border-default)]">
                  <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                    教學語言
                  </th>
                  {schools.map((s) => (
                    <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                      {s.levelFields?.language || '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* 課程 */}
              {schools.some((s) => s.levelFields?.curriculum?.length) && (
                <tr className="border-b border-[var(--color-border-default)]">
                  <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                    課程
                  </th>
                  {schools.map((s) => (
                    <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                      {s.levelFields?.curriculum?.join(', ') || '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* 類別 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  類別
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.levelFields?.schoolType || '—'}
                  </td>
                ))}
              </tr>

              {/* 宗教 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  宗教
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.religion || '—'}
                  </td>
                ))}
              </tr>

              {/* 地址 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  地址
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.addressZh || '—'}
                  </td>
                ))}
              </tr>

              {/* 電話 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  電話
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.phone || '—'}
                  </td>
                ))}
              </tr>

              {/* 創校年份 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  創校年份
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.yearFounded ? `${s.yearFounded} 年` : '—'}
                  </td>
                ))}
              </tr>

              {/* 辦學團體 */}
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  辦學團體
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.sponsoringBody || '—'}
                  </td>
                ))}
              </tr>

              {/* 校長 */}
              <tr>
                <th className="bg-[var(--color-bg-subtle)] p-4 text-left text-sm font-medium text-[var(--color-text-tertiary)]">
                  校長
                </th>
                {schools.map((s) => (
                  <td key={s.slug} className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {s.principalZh || '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
