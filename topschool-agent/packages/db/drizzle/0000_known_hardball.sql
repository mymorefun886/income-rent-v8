CREATE TYPE "public"."gender_type" AS ENUM('boys', 'girls', 'coed');--> statement-breakpoint
CREATE TYPE "public"."school_level" AS ENUM('secondary', 'primary', 'kindergarten', 'international');--> statement-breakpoint
CREATE TYPE "public"."scrape_status" AS ENUM('pending', 'done', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_schools" (
	"article_id" uuid,
	"school_id" uuid,
	CONSTRAINT "article_schools_article_id_school_id_pk" PRIMARY KEY("article_id","school_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_tags" (
	"article_id" uuid,
	"tag_id" integer,
	CONSTRAINT "article_tags_article_id_tag_id_pk" PRIMARY KEY("article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text,
	"cover_image" text,
	"author" text,
	"published_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text,
	"name_zh" text,
	"region" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favourites" (
	"user_id" uuid,
	"school_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "favourites_user_id_school_id_pk" PRIMARY KEY("user_id","school_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_tags" (
	"school_id" uuid,
	"tag_id" integer,
	CONSTRAINT "school_tags_school_id_tag_id_pk" PRIMARY KEY("school_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "school_level" NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_zh" text NOT NULL,
	"district_id" integer,
	"category" text,
	"religion" text,
	"gender" "gender_type",
	"address_en" text,
	"address_zh" text,
	"phone" text,
	"fax" text,
	"email" text,
	"website" text,
	"photo_url" text,
	"map_lat" double precision,
	"map_lng" double precision,
	"year_founded" integer,
	"sponsoring_body" text,
	"principal_en" text,
	"principal_zh" text,
	"mission_en" text,
	"mission_zh" text,
	"edb_url" text,
	"level_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrape_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"status" "scrape_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0,
	"error" text,
	"scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "scrape_queue_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrape_raw" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"raw_json" jsonb NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "scrape_raw_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_schools" ADD CONSTRAINT "article_schools_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_schools" ADD CONSTRAINT "article_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourites" ADD CONSTRAINT "favourites_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_tags" ADD CONSTRAINT "school_tags_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_tags" ADD CONSTRAINT "school_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schools" ADD CONSTRAINT "schools_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "schools_slug_idx" ON "schools" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schools_level_idx" ON "schools" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schools_district_idx" ON "schools" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schools_level_fields_idx" ON "schools" USING gin ("level_fields");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scrape_queue_status_idx" ON "scrape_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scrape_raw_type_idx" ON "scrape_raw" USING btree ("type");