import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc, and, sql, type SQL } from 'drizzle-orm';

/**
 * GET /api/v1/articles
 * 文章列表 — 支援分頁、搜尋、標籤過濾
 *
 * Query params:
 *   - page: 頁碼（預設 1）
 *   - limit: 每頁數量（預設 12，最大 50）
 *   - q: 關鍵字搜尋（title, excerpt）
 *   - tag: 標籤過濾
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(Number(searchParams.get('limit') || 12), 50);
  const offset = (page - 1) * limit;
  const q = searchParams.get('q')?.trim();
  const tag = searchParams.get('tag');

  const conditions: SQL[] = [];
  if (q) {
    conditions.push(
      sql`(${schema.articles.title} ILIKE ${'%' + q + '%'} OR ${schema.articles.excerpt} ILIKE ${'%' + q + '%'})`
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

  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.articles)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const articles = await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        excerpt: schema.articles.excerpt,
        coverImage: schema.articles.coverImage,
        author: schema.articles.author,
        publishedAt: schema.articles.publishedAt,
      })
      .from(schema.articles)
      .where(whereClause)
      .orderBy(desc(schema.articles.publishedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('[articles list] error:', error);
    return NextResponse.json(
      { error: 'Database error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
