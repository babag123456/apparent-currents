import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_evidence_records_kind" ADD VALUE IF NOT EXISTS 'mention-volume';
  ALTER TYPE "public"."enum_evidence_records_kind" ADD VALUE IF NOT EXISTS 'page-engagement';
  ALTER TYPE "public"."enum_evidence_records_kind" ADD VALUE IF NOT EXISTS 'audience-attribute';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'conversation-rising';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'conversation-declining';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'sentiment-shifting';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'behaviour-rising';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'behaviour-declining';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'high-engagement';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'audience-over-index';
  ALTER TYPE "public"."enum_markers_kind" ADD VALUE IF NOT EXISTS 'audience-barrier';
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_mentions" numeric;
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_net_sentiment" numeric;
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_sessions" numeric;
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_engagement_rate" numeric;
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_audience_index" numeric;
  ALTER TABLE "evidence_records" ADD COLUMN IF NOT EXISTS "metrics_audience_pct" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "evidence_records" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_evidence_records_kind";
  CREATE TYPE "public"."enum_evidence_records_kind" AS ENUM('keyword', 'domain-keyword');
  ALTER TABLE "evidence_records" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_evidence_records_kind" USING "kind"::"public"."enum_evidence_records_kind";
  ALTER TABLE "markers" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_markers_kind";
  CREATE TYPE "public"."enum_markers_kind" AS ENUM('demand-rising', 'demand-declining', 'high-demand');
  ALTER TABLE "markers" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_markers_kind" USING "kind"::"public"."enum_markers_kind";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_mentions";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_net_sentiment";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_sessions";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_engagement_rate";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_audience_index";
  ALTER TABLE "evidence_records" DROP COLUMN "metrics_audience_pct";`)
}
