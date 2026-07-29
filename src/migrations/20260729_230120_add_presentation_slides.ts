import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "presentations_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"object_id" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "_presentations_v_version_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"object_id" varchar,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "presentations" ADD COLUMN "force_slides_sync" boolean;
  ALTER TABLE "presentations" ADD COLUMN "slides_synced_at" timestamp(3) with time zone;
  ALTER TABLE "presentations" ADD COLUMN "slides_sync_error" varchar;
  ALTER TABLE "_presentations_v" ADD COLUMN "version_force_slides_sync" boolean;
  ALTER TABLE "_presentations_v" ADD COLUMN "version_slides_synced_at" timestamp(3) with time zone;
  ALTER TABLE "_presentations_v" ADD COLUMN "version_slides_sync_error" varchar;
  ALTER TABLE "presentations_slides" ADD CONSTRAINT "presentations_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_presentations_v_version_slides" ADD CONSTRAINT "_presentations_v_version_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "presentations_slides_order_idx" ON "presentations_slides" USING btree ("_order");
  CREATE INDEX "presentations_slides_parent_id_idx" ON "presentations_slides" USING btree ("_parent_id");
  CREATE INDEX "_presentations_v_version_slides_order_idx" ON "_presentations_v_version_slides" USING btree ("_order");
  CREATE INDEX "_presentations_v_version_slides_parent_id_idx" ON "_presentations_v_version_slides" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "presentations_slides" CASCADE;
  DROP TABLE "_presentations_v_version_slides" CASCADE;
  ALTER TABLE "presentations" DROP COLUMN "force_slides_sync";
  ALTER TABLE "presentations" DROP COLUMN "slides_synced_at";
  ALTER TABLE "presentations" DROP COLUMN "slides_sync_error";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_force_slides_sync";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_slides_synced_at";
  ALTER TABLE "_presentations_v" DROP COLUMN "version_slides_sync_error";`)
}
