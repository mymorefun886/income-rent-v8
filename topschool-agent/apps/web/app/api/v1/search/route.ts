import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, or, sql, and, ilike } from 'drizzle-orm';

/**
 * GET /api/v1/search?q=拔萃&level=secondary
 * Full-text search across schools using trigram similarity + ILIKE fallback.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const level = searchParams.get('level');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  if (!q) {
    return NextResponse.json({ query: q, count: 0, schools: [] });
  }

  const conditions: any[] = [
    or(
      ilike(schema.schools.nameZh, `%${q}%`),
      ilike(schema.schools.nameEn, `%${q}%`),
      sql`${schema.schools.nameZh} % ${q}`,
      sql`${schema.schools.nameEn} % ${q}`
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
      similarity: sql<number>`GREATEST(similarity(${schema.schools.nameZh}, ${q}), similarity(${schema.schools.nameEn}, ${q}))`,
    })
    .from(schema.schools)
    .where(and(...conditions))
    .orderBy(sql`similarity DESC`)
    .limit(limit);

  return NextResponse.json({
    query: q,
    count: schools.length,
    schools: schools.map((s) => ({
      slug: s.slug,
      nameEn: s.nameEn,
      nameZh: s.nameZh,
      level: s.level,
      gender: s.gender,
      banding: (s.levelFields as any)?.banding || null,
      language: (s.levelFields as any)?.language || null,
      curriculum: (s.levelFields as any)?.curriculum || null,
    })),
  });
}
