import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_presentations_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_presentations_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum__presentations_v_version_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__presentations_v_version_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TYPE "public"."enum_presentation_visits_block_metrics_display_mode" AS ENUM('scroll', 'slideshow');
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
  
  ALTER TABLE "presentations" ADD COLUMN "theme" "enum_presentations_theme" DEFAULT 'light';
  ALTER TABLE "presentations" ADD COLUMN "display_mode" "enum_presentations_display_mode" DEFAULT 'scroll';
  ALTER TABLE "presentations" ADD COLUMN "layout" jsonb;
  ALTER TABLE "_presentations_v" ADD COLUMN "version_theme" "enum__presentations_v_version_theme" DEFAULT 'light';
  ALTER TABLE "_presentations_v" ADD COLUMN "version_display_mode" "enum__presentations_v_version_display_mode" DEFAULT 'scroll';
  ALTER TABLE "_presentations_v" ADD COLUMN "version_layout" jsonb;
  ALTER TABLE "presentation_visits_block_metrics" ADD CONSTRAINT "presentation_visits_block_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "presentation_visits_block_metrics_order_idx" ON "presentation_visits_block_metrics" USING btree ("_order");
  CREATE INDEX "presentation_visits_block_metrics_parent_id_idx" ON "presentation_visits_block_metrics" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "presentation_visits_block_metrics" CASCADE;
  ALTER TABLE "presentations" DROP COLUMN "theme";
  ALTER TABLE "presentations" DROP COLUMN "display_mode";
  ALTER TABLE "presentations" DROP COLUMN "layout";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_theme";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_display_mode";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_layout";
  DROP TYPE "public"."enum_presentations_theme";
  DROP TYPE "public"."enum_presentations_display_mode";
  DROP TYPE "public"."enum__presentations_v_version_theme";
  DROP TYPE "public"."enum__presentations_v_version_display_mode";
  DROP TYPE "public"."enum_presentation_visits_block_metrics_display_mode";`)
}
