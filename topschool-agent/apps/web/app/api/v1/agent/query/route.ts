import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, sql, type SQL, or, ilike } from 'drizzle-orm';
import { translateQueryToFilter, summarizeFilter, SchoolFilter } from '@/lib/agent-query';

/**
 * POST /api/v1/agent/query
 * 自然語言學校查詢 — 支援多輪對話
 *
 * Body:
 *   - query: string (最新一則用戶訊息)
 *   - messages?: { role: 'user' | 'assistant'; content: string }[] (對話歷史)
 *
 * Returns JSON:
 *   - success, query, filter, summary, count, schools
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const query: string = body.query;
  const messages: { role: string; content: string }[] = body.messages || [];

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  try {
    // Step 1: 對話歷史摘要（如果有）
    // 隻關注最新 query，但可參考歷史做上下文理解
    const contextQuery = messages.length > 0
      ? buildContextQuery(query, messages)
      : query;

    // Step 2: Translate NL to structured filter
    const { filter } = await translateQueryToFilter(contextQuery);

    // Step 3: Build DB query from filter
    const conditions: SQL[] = [];

    if (filter.level) {
      conditions.push(eq(schema.schools.level, filter.level));
    }

    if (filter.district) {
      const districtPatterns: Record<string, string[]> = {
        '港島': ['中西區', '灣仔區', '東區', '南區'],
        '港島區': ['中西區', '灣仔區', '東區', '南區'],
        '九龍': ['九龍城區', '觀塘區', '深水埗區', '黃大仙區', '油尖旺區'],
        '九龍區': ['九龍城區', '觀塘區', '深水埗區', '黃大仙區', '油尖旺區'],
        '新界': ['離島區', '葵青區', '北區', '西貢區', '沙田區', '大埔區', '荃灣區', '屯門區', '元朗區'],
        '新界區': ['離島區', '葵青區', '北區', '西貢區', '沙田區', '大埔區', '荃灣區', '屯門區', '元朗區'],
      };

      const expandedDistricts = districtPatterns[filter.district] || [filter.district];

      const districtConditions: SQL[] = [];
      for (const d of expandedDistricts) {
        districtConditions.push(
          sql`(${schema.schools.metadata}->>'districtName' = ${d} OR ${schema.schools.addressZh} LIKE ${'%' + d + '%'})`
        );
      }
      conditions.push(or(...districtConditions) as SQL);
    }

    if (filter.banding) {
      conditions.push(sql`${schema.schools.levelFields}->>'banding' = ${filter.banding}`);
    }

    if (filter.gender) {
      conditions.push(eq(schema.schools.gender, filter.gender));
    }

    if (filter.religion) {
      conditions.push(sql`${schema.schools.religion} LIKE ${'%' + filter.religion + '%'}`);
    }

    if (filter.language) {
      conditions.push(sql`${schema.schools.levelFields}->>'language' = ${filter.language}`);
    }

    if (filter.schoolType) {
      conditions.push(
        or(
          sql`${schema.schools.levelFields}->>'schoolType' = ${filter.schoolType}`,
          sql`${schema.schools.levelFields}->>'schoolType' LIKE ${'%' + filter.schoolType + '%'}`
        ) as SQL
      );
    }

    if (filter.curriculum) {
      conditions.push(
        or(
          sql`${schema.schools.levelFields}->>'curriculum' ILIKE ${'%' + filter.curriculum + '%'}`,
          sql`${schema.schools.metadata}::text ILIKE ${'%' + filter.curriculum + '%'}`
        ) as SQL
      );
    }

    if (filter.keyword) {
      conditions.push(
        or(
          ilike(schema.schools.nameEn, `%${filter.keyword}%`),
          sql`${schema.schools.nameZh} LIKE ${'%' + filter.keyword + '%'}`
        ) as SQL
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Step 4: Execute query
    const schools = await db
      .select({
        slug: schema.schools.slug,
        nameEn: schema.schools.nameEn,
        nameZh: schema.schools.nameZh,
        level: schema.schools.level,
        addressZh: schema.schools.addressZh,
        phone: schema.schools.phone,
        website: schema.schools.website,
        gender: schema.schools.gender,
        religion: schema.schools.religion,
        levelFields: schema.schools.levelFields,
      })
      .from(schema.schools)
      .where(whereClause)
      .limit(filter.limit || 20);

    // Step 5: Build summary
    const summary = summarizeFilter(filter);

    return NextResponse.json({
      success: true,
      query,
      filter,
      summary,
      count: schools.length,
      schools: schools.map((s) => ({
        slug: s.slug,
        nameEn: s.nameEn,
        nameZh: s.nameZh,
        level: s.level,
        addressZh: s.addressZh,
        phone: s.phone,
        website: s.website,
        gender: s.gender,
        religion: s.religion,
        banding: (s.levelFields as any)?.banding || null,
        language: (s.levelFields as any)?.language || null,
        schoolType: (s.levelFields as any)?.schoolType || null,
        curriculum: (s.levelFields as any)?.curriculum || null,
      })),
    });
  } catch (err: any) {
    console.error('[agent/query] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal error',
        query,
      },
      { status: 500 }
    );
  }
}

/**
 * 從對話歷史建立上下文查詢
 *
 * 簡易實現：結合最近 2 輪對話 + 當前 query
 */
function buildContextQuery(currentQuery: string, messages: { role: string; content: string }[]): string {
  const recentMessages = messages.slice(-4); // 最近 2 輪
  const context = recentMessages
    .map((m) => `${m.role === 'user' ? '用戶' : 'Agent'}：${m.content}`)
    .join('\n');

  return `${context}\n用戶：${currentQuery}`;
}
