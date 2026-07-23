import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Incremental migration (hand-written).
//
// `payload migrate:create` regenerated a full from-scratch baseline here because this
// project's schema has been maintained via dev `push` rather than a baseline migration
// file, so the auto-generated statements would have collided with the live schema (e.g.
// re-creating existing enums) and never dropped `awards`. The .json snapshot alongside
// this file is the correct desired end-state and is kept for future diffs; only these
// up/down bodies were rewritten to apply the real delta:
//   1. Add drafts (versions) support + `_status` to award_entries (Pages).
//   2. Add the `archived` flag to award_entries.
//   3. Drop the Awards collection (table, enum, and its locked-documents relation).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- 1 + 2: publish state + archive flag on Pages ---------------------------------------
  CREATE TYPE "public"."enum_award_entries_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__award_entries_v_version_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__award_entries_v_version_status" AS ENUM('draft', 'published');

  ALTER TABLE "award_entries" ADD COLUMN "archived" boolean DEFAULT false;
  ALTER TABLE "award_entries" ADD COLUMN "_status" "enum_award_entries_status" DEFAULT 'draft';
  -- Every row that existed before drafts was publicly live, so mark them all published.
  -- (The column default stays 'draft' so newly-created pages start unpublished.)
  UPDATE "award_entries" SET "_status" = 'published';
  CREATE INDEX "award_entries__status_idx" ON "award_entries" USING btree ("_status");

  -- Versions/drafts table for Pages.
  CREATE TABLE "_award_entries_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_award_body" varchar,
  	"version_category" varchar,
  	"version_year" numeric,
  	"version_archived" boolean DEFAULT false,
  	"version_theme" "enum__award_entries_v_version_theme" DEFAULT 'light',
  	"version_layout" jsonb,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__award_entries_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  ALTER TABLE "_award_entries_v" ADD CONSTRAINT "_award_entries_v_parent_id_award_entries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."award_entries"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_award_entries_v_parent_idx" ON "_award_entries_v" USING btree ("parent_id");
  CREATE INDEX "_award_entries_v_version_version_slug_idx" ON "_award_entries_v" USING btree ("version_slug");
  CREATE INDEX "_award_entries_v_version_version_updated_at_idx" ON "_award_entries_v" USING btree ("version_updated_at");
  CREATE INDEX "_award_entries_v_version_version_created_at_idx" ON "_award_entries_v" USING btree ("version_created_at");
  CREATE INDEX "_award_entries_v_version_version__status_idx" ON "_award_entries_v" USING btree ("version__status");
  CREATE INDEX "_award_entries_v_created_at_idx" ON "_award_entries_v" USING btree ("created_at");
  CREATE INDEX "_award_entries_v_updated_at_idx" ON "_award_entries_v" USING btree ("updated_at");
  CREATE INDEX "_award_entries_v_latest_idx" ON "_award_entries_v" USING btree ("latest");

  -- 3: remove the Awards collection -----------------------------------------------------
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_awards_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_awards_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "awards_id";
  DROP TABLE IF EXISTS "awards" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_awards_result";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Recreate the Awards collection ------------------------------------------------------
  CREATE TYPE "public"."enum_awards_result" AS ENUM('won', 'finalist', 'shortlisted');
  CREATE TABLE "awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"award_body" varchar NOT NULL,
  	"category" varchar,
  	"year" numeric NOT NULL,
  	"result" "enum_awards_result" DEFAULT 'won' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE INDEX "awards_updated_at_idx" ON "awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "awards" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "awards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("awards_id");

  -- Drop drafts + archive from Pages ----------------------------------------------------
  DROP TABLE IF EXISTS "_award_entries_v" CASCADE;
  DROP INDEX IF EXISTS "award_entries__status_idx";
  ALTER TABLE "award_entries" DROP COLUMN IF EXISTS "_status";
  ALTER TABLE "award_entries" DROP COLUMN IF EXISTS "archived";
  DROP TYPE IF EXISTS "public"."enum__award_entries_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__award_entries_v_version_theme";
  DROP TYPE IF EXISTS "public"."enum_award_entries_status";`)
}
