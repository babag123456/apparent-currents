import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_presentation_visits_block_journey_display_mode" AS ENUM('scroll', 'slideshow');
  CREATE TABLE "presentation_visits_block_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_id" varchar NOT NULL,
  	"block_type" varchar NOT NULL,
  	"display_mode" "enum_presentation_visits_block_journey_display_mode" NOT NULL,
  	"viewed_at" timestamp(3) with time zone NOT NULL
  );
  
  ALTER TABLE "presentation_visits_block_journey" ADD CONSTRAINT "presentation_visits_block_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentation_visits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "presentation_visits_block_journey_order_idx" ON "presentation_visits_block_journey" USING btree ("_order");
  CREATE INDEX "presentation_visits_block_journey_parent_id_idx" ON "presentation_visits_block_journey" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "presentation_visits_block_journey" CASCADE;
  DROP TYPE "public"."enum_presentation_visits_block_journey_display_mode";`)
}
