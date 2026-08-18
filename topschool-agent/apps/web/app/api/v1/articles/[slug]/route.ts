import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc, and, sql } from 'drizzle-orm';

/**
 * GET /api/v1/articles/:slug
 * 文章詳情 — 包含完整 body、相關學校、相關文章
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const results = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug))
      .limit(1);

    const article = results[0];
    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 相關學校
    const relatedSchools = await db
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

    // 相關文章
    const relatedArticles = await db
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

    return NextResponse.json({
      article,
      relatedSchools,
      relatedArticles,
    });
  } catch (error) {
    console.error('[article detail] error:', error);
    return NextResponse.json(
      { error: 'Database error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
