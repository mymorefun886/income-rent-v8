'use client';

import { useFavourites } from '@/components/FavouritesProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Favourites page — list of user's favourited schools.
 */

interface SchoolData {
  slug: string;
  nameZh: string;
  nameEn: string;
  level: string;
  addressZh: string | null;
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

export default function FavouritesPage() {
  const { favourites, removeFavourite } = useFavourites();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favourites.length === 0) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    favourites.forEach((k) => {
      const [level, slug] = k.split(':');
      params.append('slug', slug);
      params.append('level', level);
    });

    fetch(`/api/v1/schools/favourites?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSchools(data.schools || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [favourites]);

  if (favourites.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">我的心水</h1>
        <div className="rounded-xl bg-[var(--color-bg-card)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-subtle)]">
            <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="mb-4 text-[var(--color-text-tertiary)]">尚未收藏任何學校。</p>
          <Link href="/schools/secondary" className="btn-primary">
            前往學校列表 →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
        我的心水 ({schools.length})
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border-default)] border-t-[var(--color-brand)]" />
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-bg-card)] shadow-sm">
          <div className="divide-y divide-[var(--color-border-default)]">
            {schools.map((s) => {
              const lf = s.levelFields || {};
              const badgeUrl = getBadgeUrl(s.level, s.metadata, s.photoUrl);
              const district = s.metadata?.districtName || '';

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
                      <span className="tag tag-gray">{LEVEL_NAMES[s.level]}</span>
                      {district && <span className="text-[var(--color-text-tertiary)]">{district}</span>}
                      {lf.banding && <span className="text-[var(--color-text-tertiary)]">{lf.banding}</span>}
                      {lf.language && <span className="text-[var(--color-text-tertiary)]">{lf.language}</span>}
                    </div>
                  </div>

                  {/* 移除按鈕 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFavourite(s.level, s.slug);
                    }}
                    className="relative z-10 rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/30 hover:text-[var(--color-error)] transition-fast"
                  >
                    移除
                  </button>

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
