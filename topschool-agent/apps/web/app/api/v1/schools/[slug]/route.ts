import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v1/schools/:slug
 * Full school profile
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const results = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.slug, slug))
    .limit(1);

  if (!results[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(results[0]);
}
