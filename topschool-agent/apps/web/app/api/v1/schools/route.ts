import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, sql, type SQL } from 'drizzle-orm';

/**
 * GET /api/v1/schools?level=&district=&q=&limit=50
 * Filter + keyword search schools
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const district = searchParams.get('district');
  const q = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

  const conditions: SQL[] = [];
  if (level) {
    conditions.push(eq(schema.schools.level, level as typeof schema.schools.$inferSelect.level));
  }
  if (district) {
    const districtResult = await db
      .select()
      .from(schema.districts)
      .where(eq(schema.districts.nameZh, district))
      .limit(1);
    if (districtResult[0]) {
      conditions.push(eq(schema.schools.districtId, districtResult[0].id));
    }
  }
  if (q) {
    conditions.push(
      sql`(${schema.schools.nameEn} ILIKE ${'%' + q + '%'} OR ${schema.schools.nameZh} LIKE ${'%' + q + '%'})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const schools = await db
    .select({
      slug: schema.schools.slug,
      nameEn: schema.schools.nameEn,
      nameZh: schema.schools.nameZh,
      level: schema.schools.level,
      addressZh: schema.schools.addressZh,
      phone: schema.schools.phone,
    })
    .from(schema.schools)
    .where(whereClause)
    .limit(limit);

  return NextResponse.json({ count: schools.length, schools });
}
