import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  doublePrecision,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ============ Enums ============
export const schoolLevelEnum = pgEnum('school_level', [
  'secondary',
  'primary',
  'kindergarten',
  'international',
]);
export const genderTypeEnum = pgEnum('gender_type', ['boys', 'girls', 'coed']);
export const scrapeStatusEnum = pgEnum('scrape_status', [
  'pending',
  'done',
  'failed',
]);

// ============ Core: Schools ============
export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    level: schoolLevelEnum('level').notNull(),
    slug: text('slug').notNull(),
    nameEn: text('name_en').notNull(),
    nameZh: text('name_zh').notNull(),
    districtId: integer('district_id').references(() => districts.id),
    category: text('category'),
    religion: text('religion'),
    gender: genderTypeEnum('gender'),
    addressEn: text('address_en'),
    addressZh: text('address_zh'),
    phone: text('phone'),
    fax: text('fax'),
    email: text('email'),
    website: text('website'),
    photoUrl: text('photo_url'),
    mapLat: doublePrecision('map_lat'),
    mapLng: doublePrecision('map_lng'),
    yearFounded: integer('year_founded'),
    sponsoringBody: text('sponsoring_body'),
    principalEn: text('principal_en'),
    principalZh: text('principal_zh'),
    missionEn: text('mission_en'),
    missionZh: text('mission_zh'),
    edbUrl: text('edb_url'),
    levelFields: jsonb('level_fields').notNull().default({}),
    // NOTE: search_vector is added via raw SQL after migration (tsvector not in drizzle pg-core)
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('schools_slug_idx').on(t.slug),
    levelIdx: index('schools_level_idx').on(t.level),
    districtIdx: index('schools_district_idx').on(t.districtId),
    levelFieldsIdx: index('schools_level_fields_idx').using('gin', t.levelFields),
    // search_idx added via raw SQL after migration
  })
);

// ============ Articles ============
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    body: text('body'),
    coverImage: text('cover_image'),
    author: text('author'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    // NOTE: search_vector added via raw SQL after migration
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('articles_slug_idx').on(t.slug),
    // search_idx added via raw SQL after migration
  })
);

export const articleSchools = pgTable(
  'article_schools',
  {
    articleId: uuid('article_id').references(() => articles.id),
    schoolId: uuid('school_id').references(() => schools.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.schoolId] }),
  })
);

// ============ Taxonomy ============
export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en'),
  nameZh: text('name_zh'),
  region: text('region'),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const schoolTags = pgTable(
  'school_tags',
  {
    schoolId: uuid('school_id').references(() => schools.id),
    tagId: integer('tag_id').references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.schoolId, t.tagId] }),
  })
);

export const articleTags = pgTable(
  'article_tags',
  {
    articleId: uuid('article_id').references(() => articles.id),
    tagId: integer('tag_id').references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.tagId] }),
  })
);

// ============ Users & Favourites ============
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const favourites = pgTable(
  'favourites',
  {
    userId: uuid('user_id').references(() => users.id),
    schoolId: uuid('school_id').references(() => schools.id),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.schoolId] }),
  })
);

// ============ Scraper tables ============
export const scrapeQueue = pgTable(
  'scrape_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(),
    type: text('type').notNull(), // 'school' | 'article'
    status: scrapeStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').default(0),
    error: text('error'),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    statusIdx: index('scrape_queue_status_idx').on(t.status),
  })
);

export const scrapeRaw = pgTable(
  'scrape_raw',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(),
    type: text('type').notNull(),
    rawJson: jsonb('raw_json').notNull(),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    typeIdx: index('scrape_raw_type_idx').on(t.type),
  })
);

// ============ Types ============
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type District = typeof districts.$inferSelect;
export type ScrapeQueueItem = typeof scrapeQueue.$inferSelect;
export type ScrapeRawItem = typeof scrapeRaw.$inferSelect;
