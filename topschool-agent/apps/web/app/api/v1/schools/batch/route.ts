import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/v1/schools/batch?slug=secondary-1&slug=secondary-2&level=secondary
 * Fetch multiple schools by slugs (for compare page).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slugs = searchParams.getAll('slug');
  const level = searchParams.get('level');

  if (slugs.length === 0) {
    return NextResponse.json({ schools: [] });
  }

  const conditions = [inArray(schema.schools.slug, slugs)];
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
      religion: schema.schools.religion,
      addressZh: schema.schools.addressZh,
      phone: schema.schools.phone,
      website: schema.schools.website,
      yearFounded: schema.schools.yearFounded,
      sponsoringBody: schema.schools.sponsoringBody,
      principalZh: schema.schools.principalZh,
      levelFields: schema.schools.levelFields,
    })
    .from(schema.schools)
    .where(and(...conditions));

  return NextResponse.json({ count: schools.length, schools });
}
