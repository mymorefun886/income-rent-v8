import { eq } from 'drizzle-orm';
import { db, schema } from './db';

/**
 * Phase 2: Import raw scraped JSON into structured schools/articles tables.
 * Extracts fields from window.__NEXT_DATA__.props.pageProps.schoolData
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function detectLevel(url: string): 'secondary' | 'primary' | 'kindergarten' | 'international' | null {
  if (url.includes('/secondary-school/')) return 'secondary';
  if (url.includes('/primary-school/')) return 'primary';
  if (url.includes('/kindergarten/')) return 'kindergarten';
  if (url.includes('/international-school/')) return 'international';
  return null;
}

function mapGender(g: string | null | undefined): 'boys' | 'girls' | 'coed' | null {
  if (!g) return null;
  if (g.includes('男女') || g === 'coed') return 'coed';
  if (g === '男' || g.toLowerCase().includes('boy')) return 'boys';
  if (g === '女' || g.toLowerCase().includes('girl')) return 'girls';
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function extractSchoolFromRaw(url: string, raw: any) {
  const level = detectLevel(url);
  if (!level) return null;

  const sd = raw.schoolData;
  if (!sd || !sd.schoolName) return null;

  const segments = url.split('/').filter(Boolean);
  const idPart = segments[segments.length - 1] || '';
  // Slug includes level prefix to avoid cross-level collisions (e.g., primary-1 vs international-1)
  const slug = `${level}-${idPart}` || slugify(sd.schoolEnglishName || sd.schoolName);

  const nameZh = sd.schoolName || '';
  const nameEn = sd.schoolEnglishName || '';
  const addressZh = sd.address || '';

  // Common fields
  const school: any = {
    level,
    slug,
    nameEn,
    nameZh,
    addressZh,
    phone: sd.phone || null,
    fax: sd.fax || null,
    email: sd.email || null,
    website: sd.website || null,
    photoUrl: sd.exteriorPhoto ? `https://static06.hket.com/res/v3/image/school/${sd.exteriorPhoto}` : null,
    yearFounded: sd.yearOfCommencement ? parseInt(String(sd.yearOfCommencement)) : null,
    sponsoringBody: sd.sponsoringBody ? stripHtml(sd.sponsoringBody) : null,
    principalEn: sd.principalName || null,
    principalZh: sd.principalTitle ? `${sd.principalTitle} ${sd.principalName || ''}`.trim() : (sd.principalName || null),
    missionZh: sd.mission ? stripHtml(sd.mission) : null,
    gender: mapGender(sd.gender),
    religion: sd.religion || null,
    metadata: { sourceUrl: url, schoolId: sd.id, importedAt: new Date().toISOString() },
    levelFields: {} as Record<string, any>,
  };

  // Level-specific fields
  const lf = school.levelFields;

  if (level === 'secondary') {
    lf.banding = sd.banding || null;
    lf.language = sd.language || null;
    lf.schoolType = sd.schoolType || null;
    lf.classCount = sd.classCount || null;
    lf.teacherCount = sd.teacherCount || null;
    lf.offerCourseIbdp = sd.offerCourseIbdp || null;
    lf.offerCourseIgcse = sd.offerCourseIgcse || null;
    lf.offerCourseIal = sd.offerCourseIal || null;
    lf.offerCourseGceAlevel = sd.offerCourseGceAlevel || null;
    lf.secondarySubject = sd.secondarySubject || null;
    lf.feederSchool = sd.feederSchool || null;
    lf.throughTrainSchool = sd.throughTrainSchool || null;
    lf.nominatedSchool = sd.nominatedSchool || null;
    lf.registrationInfo = sd.registrationInfo || null;
  } else if (level === 'primary') {
    lf.schoolType = sd.schoolType || null;
    lf.classCount = sd.classCount || null;
    lf.teacherCount = sd.teacherCount || null;
    lf.linkedSecondary = sd.throughTrainSchool || null;
    lf.admission = sd.admission ? stripHtml(sd.admission) : null;
  } else if (level === 'kindergarten') {
    lf.schoolType = sd.schoolType || null;
    lf.classCount = sd.classCount || null;
    lf.teacherCount = sd.teacherCount || null;
    lf.monthlyFee = sd.secondarySchoolFee || null; // reuse field or add specific
    lf.feeRemission = sd.feeRemission ? stripHtml(sd.feeRemission) : null;
  } else if (level === 'international') {
    // Parse curriculum from raw text description
    const rawCurriculum = sd.curriculum || '';
    const curriculumArr: string[] = [];
    if (/IBDP|IB Diploma|International Baccalaureate.*Diploma/i.test(rawCurriculum)) curriculumArr.push('IBDP');
    if (/IGCSE/i.test(rawCurriculum)) curriculumArr.push('IGCSE');
    if (/IAL|International.*Level/i.test(rawCurriculum)) curriculumArr.push('IAL');
    if (/GCE A-Level|A-Level/i.test(rawCurriculum)) curriculumArr.push('GCE A-Level');
    lf.curriculum = curriculumArr;
    lf.schoolType = sd.schoolType || null;
    lf.classCount = sd.classCount || null;
    lf.teacherCount = sd.teacherCount || null;
    lf.fees = sd.secondarySchoolFee || null;
  }

  // District - look up or create
  if (sd.district) {
    school.metadata = { ...school.metadata, districtName: sd.district };
  }

  return school;
}

function extractArticleFromRaw(url: string, raw: any) {
  const segments = url.split('/').filter(Boolean);
  let slug = segments[segments.length - 1] || '';

  // Clean slug: remove query strings, fragments
  slug = slug.split('?')[0].split('#')[0];

  // Skip bot-protected / WAF-blocked pages
  if (raw.title === '我们需要确认您是人类' || raw.title === 'Please confirm you are human') {
    return null;
  }

  // Two structures: root-level {title, fullText} OR {data: {headline, content}}
  let title = '';
  let body = '';
  let publishedAt: Date | null = null;
  let coverImage: string | null = null;

  if (raw.data) {
    // Primary structure: data.headline.main + data.content.html
    const d = raw.data;
    title = typeof d.headline === 'object' ? d.headline.main : d.headline || '';
    if (d.content?.html) {
      body = stripHtml(d.content.html);
    } else if (typeof d.content === 'string') {
      body = stripHtml(d.content);
    }
    if (d.displayStart) {
      publishedAt = new Date(d.displayStart);
    }
    if (d.thumbnail?.url) {
      coverImage = d.thumbnail.url;
    }
  } else {
    // Legacy structure: root title + fullText
    title = raw.title || '';
    body = raw.fullText || raw.textPreview || '';
  }

  return {
    slug: slug || slugify(title),
    title,
    body,
    publishedAt,
    coverImage,
    metadata: { sourceUrl: url, importedAt: new Date().toISOString() },
  };
}

async function importSchools() {
  console.log('Importing schools...');
  const rawItems = await db
    .select()
    .from(schema.scrapeRaw)
    .where(eq(schema.scrapeRaw.type, 'school'));

  let imported = 0;
  let skipped = 0;

  for (const item of rawItems) {
    const school = extractSchoolFromRaw(item.url, item.rawJson);
    if (!school) {
      skipped++;
      continue;
    }

    try {
      await db
        .insert(schema.schools)
        .values(school as any)
        .onConflictDoUpdate({
          target: schema.schools.slug,
          set: {
            nameEn: school.nameEn,
            nameZh: school.nameZh,
            addressZh: school.addressZh,
            phone: school.phone,
            fax: school.fax,
            email: school.email,
            website: school.website,
            photoUrl: school.photoUrl,
            yearFounded: school.yearFounded,
            sponsoringBody: school.sponsoringBody,
            principalEn: school.principalEn,
            principalZh: school.principalZh,
            missionZh: school.missionZh,
            gender: school.gender,
            religion: school.religion,
            metadata: school.metadata,
            levelFields: school.levelFields,
            updatedAt: new Date(),
          },
        });
      imported++;
    } catch (err) {
      console.error(`Failed to import ${item.url}:`, err);
      skipped++;
    }
  }

  console.log(`Schools: ${imported} imported, ${skipped} skipped`);
}

async function importArticles() {
  console.log('Importing articles...');
  const rawItems = await db
    .select()
    .from(schema.scrapeRaw)
    .where(eq(schema.scrapeRaw.type, 'article'));

  let imported = 0;
  let skipped = 0;

  for (const item of rawItems) {
    const article = extractArticleFromRaw(item.url, item.rawJson);
    if (!article || !article.title) {
      skipped++;
      continue;
    }

    try {
      await db
        .insert(schema.articles)
        .values(article as any)
        .onConflictDoUpdate({
          target: schema.articles.slug,
          set: {
            title: article.title,
            body: article.body,
            publishedAt: article.publishedAt,
            coverImage: article.coverImage,
            metadata: article.metadata,
          },
        });
      imported++;
    } catch (err) {
      console.error(`Failed to import ${item.url}:`, err);
      skipped++;
    }
  }

  console.log(`Articles: ${imported} imported, ${skipped} skipped`);
}

async function main() {
  console.log('=== Phase 2: Import ===');
  await importSchools();
  await importArticles();
  console.log('Import complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
