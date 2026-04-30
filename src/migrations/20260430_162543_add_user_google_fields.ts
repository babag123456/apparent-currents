import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_sub" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "users_google_sub_idx" ON "users" ("google_sub");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "users_google_sub_idx";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "google_sub";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "name";
  `)
}
