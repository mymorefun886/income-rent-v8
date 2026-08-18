'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

/**
 * MultiSelectDropdown — 多選下拉選單（支援分組）
 */
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  grouped,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  grouped?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-dropdown="${label}"]`)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, label]);

  // 分組選項
  const groupedOptions = grouped
    ? options.reduce<{ group: string; items: { value: string; label: string }[] }[]>((acc, opt) => {
        const groupMatch = opt.label.match(/^【(.+?)】$/);
        if (groupMatch) {
          acc.push({ group: groupMatch[1], items: [] });
        } else if (acc.length > 0) {
          acc[acc.length - 1].items.push(opt);
        }
        return acc;
      }, [])
    : [];

  return (
    <div className="relative flex-1 min-w-[120px] sm:min-w-[140px]" data-dropdown={label}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`filter-btn ${selected.length > 0 ? 'filter-btn--active' : ''}`}
        title={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        id={`filter-btn-${label}`}
      >
        <span className="block truncate font-sans">
          {selected.length > 0
            ? `${label} (${selected.length})`
            : label}
        </span>
      </button>

      {open && (
        <div
          className="filter-dropdown min-w-[200px]"
          role="listbox"
          aria-labelledby={`filter-btn-${label}`}
          aria-multiselectable="true"
        >
          {grouped ? (
            groupedOptions.map((group) => (
              <div key={group.group}>
                <div className="px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] border-b border-[var(--color-border-default)]">
                  {group.group}
                </div>
                {group.items.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--color-bg-hover)] text-sm ${
                      selected.includes(opt.value) ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.value)}
                      onChange={() => toggle(opt.value)}
                      className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                      role="option"
                      aria-selected={selected.includes(opt.value)}
                    />
                    <span className="flex-1">{opt.label}</span>
                  </label>
                ))}
              </div>
            ))
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--color-bg-hover)] text-sm ${
                  selected.includes(opt.value) ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  role="option"
                  aria-selected={selected.includes(opt.value)}
                />
                <span className="flex-1">{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FilterSection — 水平篩選器（Topschool 風格）
 */

// 地區按區域分組
const DISTRICTS = [
  { value: '港島區', label: '【港島區】' },
  { value: '中西區', label: '中西區' },
  { value: '灣仔區', label: '灣仔區' },
  { value: '東區', label: '東區' },
  { value: '南區', label: '南區' },
  { value: '九龍區', label: '【九龍區】' },
  { value: '油尖旺區', label: '油尖旺區' },
  { value: '九龍城區', label: '九龍城區' },
  { value: '深水埗區', label: '深水埗區' },
  { value: '黃大仙區', label: '黃大仙區' },
  { value: '觀塘區', label: '觀塘區' },
  { value: '新界區', label: '【新界區】' },
  { value: '北區', label: '北區' },
  { value: '大埔區', label: '大埔區' },
  { value: '沙田區', label: '沙田區' },
  { value: '西貢區', label: '西貢區' },
  { value: '荃灣區', label: '荃灣區' },
  { value: '葵青區', label: '葵青區' },
  { value: '屯門區', label: '屯門區' },
  { value: '元朗區', label: '元朗區' },
  { value: '離島區', label: '離島區' },
];

const LANGUAGES = [
  { value: '英中', label: '英中' },
  { value: '中英文', label: '中英文' },
  { value: '中中', label: '中中' },
];

const SCHOOL_TYPES = [
  { value: '官立', label: '官立' },
  { value: '資助', label: '資助' },
  { value: '直資', label: '直資' },
  { value: '私立', label: '私立' },
];

const RELIGIONS = [
  { value: '基督教', label: '基督教' },
  { value: '天主教', label: '天主教' },
  { value: '佛教', label: '佛教' },
  { value: '道教', label: '道教' },
  { value: '伊斯蘭教', label: '伊斯蘭教' },
];

const GENDERS = [
  { value: 'coed', label: '男女校' },
  { value: 'boys', label: '男校' },
  { value: 'girls', label: '女校' },
];

const BANDINGS = [
  { value: '1A', label: 'Band 1A' },
  { value: '1B', label: 'Band 1B' },
  { value: '1C', label: 'Band 1C' },
  { value: '2A', label: 'Band 2A' },
  { value: '2B', label: 'Band 2B' },
  { value: '2C', label: 'Band 2C' },
  { value: '3A', label: 'Band 3A' },
  { value: '3B', label: 'Band 3B' },
  { value: '3C', label: 'Band 3C' },
];

const CURRICULUMS = [
  { value: 'IBDP', label: 'IBDP' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'IAL', label: 'IAL' },
  { value: 'GCE A-Level', label: 'GCE A-Level' },
];

const LEVEL_NAMES: Record<string, string> = {
  secondary: '中學',
  primary: '小學',
  kindergarten: '幼稚園',
  international: '國際學校',
};

const LEVEL_BACKGROUNDS: Record<string, string> = {
  secondary: 'bg-level-secondary',
  primary: 'bg-level-primary',
  kindergarten: 'bg-level-kindergarten',
  international: 'bg-level-international',
};

export function FilterSidebar({
  level,
  total,
}: {
  level: string;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [districts, setDistricts] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<string[]>([]);
  const [religions, setReligions] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [bandings, setBandings] = useState<string[]>([]);
  const [curriculums, setCurriculums] = useState<string[]>([]);

  // 從 URL params 初始化
  useEffect(() => {
    setDistricts(searchParams.get('districts')?.split(',').filter(Boolean) || []);
    setLanguages(searchParams.get('languages')?.split(',').filter(Boolean) || []);
    setSchoolTypes(searchParams.get('types')?.split(',').filter(Boolean) || []);
    setReligions(searchParams.get('religions')?.split(',').filter(Boolean) || []);
    setGenders(searchParams.get('genders')?.split(',').filter(Boolean) || []);
    setBandings(searchParams.get('bandings')?.split(',').filter(Boolean) || []);
    setCurriculums(searchParams.get('curriculums')?.split(',').filter(Boolean) || []);
  }, [searchParams]);

  const updateFilters = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const hasActiveFilters =
    districts.length > 0 ||
    languages.length > 0 ||
    schoolTypes.length > 0 ||
    religions.length > 0 ||
    genders.length > 0 ||
    bandings.length > 0 ||
    curriculums.length > 0;

  const resetAll = () => {
    router.push('?', { scroll: false });
  };

  const showBanding = level === 'secondary' || level === 'primary';
  const showLanguage = level === 'secondary';
  const showCurriculum = level === 'international';

  return (
    <div className="sticky top-[56px] sm:top-[168px] z-filter -mx-4 sm:-mx-6 lg:-mx-8">
      {/* 篩選器容器 */}
      <div className="rounded-none bg-[var(--color-bg-card)] p-3 shadow-container sm:rounded-xl sm:p-4">
        {/* 水平篩選器區域 — mobile 可橫向滾動 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap sm:overflow-visible sm:pb-0">
          <MultiSelectDropdown
            label="地區"
            options={DISTRICTS}
            selected={districts}
            onChange={(v) => updateFilters('districts', v)}
            grouped
          />
          {showLanguage && (
            <MultiSelectDropdown
              label="語言"
              options={LANGUAGES}
              selected={languages}
              onChange={(v) => updateFilters('languages', v)}
            />
          )}
          <MultiSelectDropdown
            label="類別"
            options={SCHOOL_TYPES}
            selected={schoolTypes}
            onChange={(v) => updateFilters('types', v)}
          />
          <MultiSelectDropdown
            label="宗教"
            options={RELIGIONS}
            selected={religions}
            onChange={(v) => updateFilters('religions', v)}
          />
          <MultiSelectDropdown
            label="性別"
            options={GENDERS}
            selected={genders}
            onChange={(v) => updateFilters('genders', v)}
          />
          {showBanding && (
            <MultiSelectDropdown
              label="組別"
              options={BANDINGS}
              selected={bandings}
              onChange={(v) => updateFilters('bandings', v)}
            />
          )}
          {showCurriculum && (
            <MultiSelectDropdown
              label="國際課程"
              options={CURRICULUMS}
              selected={curriculums}
              onChange={(v) => updateFilters('curriculums', v)}
            />
          )}
        </div>
      </div>

      {/* 結果區（層級專屬背景） */}
      <div className={`mt-4 rounded-b-lg ${LEVEL_BACKGROUNDS[level]} px-4 py-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] sm:text-[36px] sm:leading-[40px]">
            {LEVEL_NAMES[level]}
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
              搜尋結果共 <span className="font-semibold">{total}</span> 個
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetAll}
                className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:opacity-75 transition-fast sm:text-sm"
              >
                重設所有
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
