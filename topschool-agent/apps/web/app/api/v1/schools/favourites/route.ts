import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, or, sql, type SQL } from 'drizzle-orm';

/**
 * GET /api/v1/schools/favourites?slug=x&level=y&slug=a&level=b
 * Fetch multiple schools by slug+level pairs (for favourites page).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slugs = searchParams.getAll('slug');
  const levels = searchParams.getAll('level');

  if (slugs.length === 0) {
    return NextResponse.json({ schools: [] });
  }

  // Build OR conditions for each slug+level pair
  const pairConditions: SQL[] = [];
  for (let i = 0; i < slugs.length; i++) {
    const level = levels[i];
    if (!level) continue;
    pairConditions.push(
      and(
        eq(schema.schools.slug, slugs[i]),
        eq(schema.schools.level, level as typeof schema.schools.$inferSelect.level)
      ) as SQL
    );
  }

  if (pairConditions.length === 0) {
    return NextResponse.json({ schools: [] });
  }

  const schools = await db
    .select({
      slug: schema.schools.slug,
      nameEn: schema.schools.nameEn,
      nameZh: schema.schools.nameZh,
      level: schema.schools.level,
      addressZh: schema.schools.addressZh,
      levelFields: schema.schools.levelFields,
      metadata: schema.schools.metadata,
      photoUrl: schema.schools.photoUrl,
    })
    .from(schema.schools)
    .where(or(...pairConditions) || undefined);

  return NextResponse.json({ count: schools.length, schools });
}
