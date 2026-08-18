import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, sql, inArray, type SQL } from 'drizzle-orm';

/**
 * POST /api/v1/schools/compare
 * Body: { ids: string[] } — compare multiple schools side by side
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const ids: string[] = body.ids || [];

  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const schools = await db
    .select()
    .from(schema.schools)
    .where(
      inArray(
        schema.schools.id,
        ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
      )
    );

  return NextResponse.json({ count: schools.length, schools });
}
