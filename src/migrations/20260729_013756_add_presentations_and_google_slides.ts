import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_presentations_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_presentations_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum_presentations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__presentations_v_version_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__presentations_v_version_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum__presentations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_presentation_visits_block_metrics_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum_presentation_visits_block_journey_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum_presentation_visits_device_category" AS ENUM('desktop', 'tablet', 'mobile', 'unknown');
  CREATE TABLE "presentations_supporting_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "presentations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"client_label" varchar,
  	"slides_url" varchar,
  	"embed_url" varchar,
  	"open_url" varchar,
  	"share_token" varchar,
  	"active" boolean DEFAULT true,
  	"cover_image_id" integer,
  	"introduction" varchar,
  	"theme" "enum_presentations_theme" DEFAULT 'light',
  	"display_mode" "enum_presentations_display_mode" DEFAULT 'scroll',
  	"layout" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_presentations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_presentations_v_version_supporting_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_presentations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_client_label" varchar,
  	"version_slides_url" varchar,
  	"version_embed_url" varchar,
  	"version_open_url" varchar,
  	"version_share_token" varchar,
  	"version_active" boolean DEFAULT true,
  	"version_cover_image_id" integer,
  	"version_introduction" varchar,
  	"version_theme" "enum__presentations_v_version_theme" DEFAULT 'light',
  	"version_display_mode" "enum__presentations_v_version_display_mode" DEFAULT 'scroll',
  	"version_layout" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__presentations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "presentation_visits_link_clicks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_id" varchar NOT NULL,
  	"count" numeric NOT NULL
  );
  
  CREATE TABLE "presentation_visits_block_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_id" varchar NOT NULL,
  	"block_type" varchar NOT NULL,
  	"display_mode" "enum_presentation_visits_block_metrics_display_mode" NOT NULL,
  	"viewed" boolean DEFAULT true,
  	"active_seconds" numeric DEFAULT 0 NOT NULL,
  	"navigation_count" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "presentation_visits_block_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_id" varchar NOT NULL,
  	"block_type" varchar NOT NULL,
  	"display_mode" "enum_presentation_visits_block_journey_display_mode" NOT NULL,
  	"viewed_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "presentation_visits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"presentation_id" integer NOT NULL,
  	"anonymous_session_id" varchar NOT NULL,
  	"first_seen_at" timestamp(3) with time zone NOT NULL,
  	"last_seen_at" timestamp(3) with time zone NOT NULL,
  	"visit_count" numeric DEFAULT 1 NOT NULL,
  	"active_seconds" numeric DEFAULT 0 NOT NULL,
  	"device_category" "enum_presentation_visits_device_category" DEFAULT 'unknown' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "presentations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "presentation_visits_id" integer;
  ALTER TABLE "presentations_supporting_links" ADD CONSTRAINT "presentations_supporting_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "presentations" ADD CONSTRAINT "presentations_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_presentations_v_version_supporting_links" ADD CONSTRAINT "_presentations_v_version_supporting_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_presentations_v" ADD CONSTRAINT "_presentations_v_parent_id_presentations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."presentations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_presentations_v" ADD CONSTRAINT "_presentations_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "presentation_visits_link_clicks" ADD CONSTRAINT "presentation_visits_link_clicks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "presentation_visits_block_metrics" ADD CONSTRAINT "presentation_visits_block_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "presentation_visits_block_journey" ADD CONSTRAINT "presentation_visits_block_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "presentation_visits" ADD CONSTRAINT "presentation_visits_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "presentations_supporting_links_order_idx" ON "presentations_supporting_links" USING btree ("_order");
  CREATE INDEX "presentations_supporting_links_parent_id_idx" ON "presentations_supporting_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "presentations_share_token_idx" ON "presentations" USING btree ("share_token");
  CREATE INDEX "presentations_cover_image_idx" ON "presentations" USING btree ("cover_image_id");
  CREATE INDEX "presentations_updated_at_idx" ON "presentations" USING btree ("updated_at");
  CREATE INDEX "presentations_created_at_idx" ON "presentations" USING btree ("created_at");
  CREATE INDEX "presentations__status_idx" ON "presentations" USING btree ("_status");
  CREATE INDEX "_presentations_v_version_supporting_links_order_idx" ON "_presentations_v_version_supporting_links" USING btree ("_order");
  CREATE INDEX "_presentations_v_version_supporting_links_parent_id_idx" ON "_presentations_v_version_supporting_links" USING btree ("_parent_id");
  CREATE INDEX "_presentations_v_parent_idx" ON "_presentations_v" USING btree ("parent_id");
  CREATE INDEX "_presentations_v_version_version_share_token_idx" ON "_presentations_v" USING btree ("version_share_token");
  CREATE INDEX "_presentations_v_version_version_cover_image_idx" ON "_presentations_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_presentations_v_version_version_updated_at_idx" ON "_presentations_v" USING btree ("version_updated_at");
  CREATE INDEX "_presentations_v_version_version_created_at_idx" ON "_presentations_v" USING btree ("version_created_at");
  CREATE INDEX "_presentations_v_version_version__status_idx" ON "_presentations_v" USING btree ("version__status");
  CREATE INDEX "_presentations_v_created_at_idx" ON "_presentations_v" USING btree ("created_at");
  CREATE INDEX "_presentations_v_updated_at_idx" ON "_presentations_v" USING btree ("updated_at");
  CREATE INDEX "_presentations_v_latest_idx" ON "_presentations_v" USING btree ("latest");
  CREATE INDEX "presentation_visits_link_clicks_order_idx" ON "presentation_visits_link_clicks" USING btree ("_order");
  CREATE INDEX "presentation_visits_link_clicks_parent_id_idx" ON "presentation_visits_link_clicks" USING btree ("_parent_id");
  CREATE INDEX "presentation_visits_block_metrics_order_idx" ON "presentation_visits_block_metrics" USING btree ("_order");
  CREATE INDEX "presentation_visits_block_metrics_parent_id_idx" ON "presentation_visits_block_metrics" USING btree ("_parent_id");
  CREATE INDEX "presentation_visits_block_journey_order_idx" ON "presentation_visits_block_journey" USING btree ("_order");
  CREATE INDEX "presentation_visits_block_journey_parent_id_idx" ON "presentation_visits_block_journey" USING btree ("_parent_id");
  CREATE INDEX "presentation_visits_presentation_idx" ON "presentation_visits" USING btree ("presentation_id");
  CREATE INDEX "presentation_visits_anonymous_session_id_idx" ON "presentation_visits" USING btree ("anonymous_session_id");
  CREATE INDEX "presentation_visits_updated_at_idx" ON "presentation_visits" USING btree ("updated_at");
  CREATE INDEX "presentation_visits_created_at_idx" ON "presentation_visits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_presentations_fk" FOREIGN KEY ("presentations_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_presentation_visits_fk" FOREIGN KEY ("presentation_visits_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_presentations_id_idx" ON "payload_locked_documents_rels" USING btree ("presentations_id");
  CREATE INDEX "payload_locked_documents_rels_presentation_visits_id_idx" ON "payload_locked_documents_rels" USING btree ("presentation_visits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "presentations_supporting_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_presentations_v_version_supporting_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_presentations_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentation_visits_link_clicks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentation_visits_block_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentation_visits_block_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentation_visits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "presentations_supporting_links" CASCADE;
  DROP TABLE "presentations" CASCADE;
  DROP TABLE "_presentations_v_version_supporting_links" CASCADE;
  DROP TABLE "_presentations_v" CASCADE;
  DROP TABLE "presentation_visits_link_clicks" CASCADE;
  DROP TABLE "presentation_visits_block_metrics" CASCADE;
  DROP TABLE "presentation_visits_block_journey" CASCADE;
  DROP TABLE "presentation_visits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_presentations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_presentation_visits_fk";
  
  DROP INDEX "payload_locked_documents_rels_presentations_id_idx";
  DROP INDEX "payload_locked_documents_rels_presentation_visits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "presentations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "presentation_visits_id";
  DROP TYPE "public"."enum_presentations_theme";
  DROP TYPE "public"."enum_presentations_display_mode";
  DROP TYPE "public"."enum_presentations_status";
  DROP TYPE "public"."enum__presentations_v_version_theme";
  DROP TYPE "public"."enum__presentations_v_version_display_mode";
  DROP TYPE "public"."enum__presentations_v_version_status";
  DROP TYPE "public"."enum_presentation_visits_block_metrics_display_mode";
  DROP TYPE "public"."enum_presentation_visits_block_journey_display_mode";
  DROP TYPE "public"."enum_presentation_visits_device_category";`)
}
