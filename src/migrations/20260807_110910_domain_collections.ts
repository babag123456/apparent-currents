import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_evidence_records_lens" AS ENUM('demand', 'conversation', 'behaviour', 'people');
  CREATE TYPE "public"."enum_evidence_records_source" AS ENUM('semrush', 'brandwatch', 'ga4', 'gwi');
  CREATE TYPE "public"."enum_evidence_records_kind" AS ENUM('keyword', 'domain-keyword');
  CREATE TYPE "public"."enum_markers_kind" AS ENUM('demand-rising', 'demand-declining', 'high-demand');
  CREATE TYPE "public"."enum_markers_direction" AS ENUM('up', 'down', 'flat');
  CREATE TYPE "public"."enum_markers_confidence" AS ENUM('weak', 'moderate', 'strong');
  CREATE TYPE "public"."enum_data_syncs_lens" AS ENUM('demand', 'conversation', 'behaviour', 'people');
  CREATE TYPE "public"."enum_data_syncs_source" AS ENUM('semrush', 'brandwatch', 'ga4', 'gwi');
  CREATE TYPE "public"."enum_data_syncs_status" AS ENUM('running', 'succeeded', 'failed', 'quota-exceeded');
  CREATE TYPE "public"."enum_data_syncs_trigger" AS ENUM('manual');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'demand-sync');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'demand-sync');
  CREATE TABLE "contexts_competitors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "contexts_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phrase" varchar NOT NULL
  );
  
  CREATE TABLE "contexts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"brand" varchar NOT NULL,
  	"category" varchar,
  	"market" varchar NOT NULL,
  	"semrush_database" varchar DEFAULT 'au' NOT NULL,
  	"audience" varchar,
  	"period" varchar DEFAULT 'Last 90 days',
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evidence_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lens" "enum_evidence_records_lens" DEFAULT 'demand' NOT NULL,
  	"source" "enum_evidence_records_source" NOT NULL,
  	"kind" "enum_evidence_records_kind" NOT NULL,
  	"phrase" varchar NOT NULL,
  	"topic" varchar,
  	"domain" varchar,
  	"metrics_search_volume" numeric,
  	"metrics_cpc" numeric,
  	"metrics_competition" numeric,
  	"metrics_results_count" numeric,
  	"metrics_position" numeric,
  	"metrics_previous_position" numeric,
  	"trend" jsonb,
  	"intents" jsonb,
  	"provenance_source_report" varchar NOT NULL,
  	"provenance_retrieved_at" timestamp(3) with time zone NOT NULL,
  	"provenance_market" varchar NOT NULL,
  	"provenance_period" varchar,
  	"context_id" integer NOT NULL,
  	"sync_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "markers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_markers_kind" NOT NULL,
  	"direction" "enum_markers_direction" NOT NULL,
  	"confidence" "enum_markers_confidence" NOT NULL,
  	"statement" varchar NOT NULL,
  	"phrase" varchar NOT NULL,
  	"topic" varchar,
  	"market" varchar NOT NULL,
  	"magnitude" numeric NOT NULL,
  	"sources" jsonb,
  	"derived_at" timestamp(3) with time zone NOT NULL,
  	"context_id" integer NOT NULL,
  	"sync_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "markers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"evidence_records_id" integer
  );
  
  CREATE TABLE "data_syncs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"context_id" integer NOT NULL,
  	"lens" "enum_data_syncs_lens" DEFAULT 'demand' NOT NULL,
  	"source" "enum_data_syncs_source" DEFAULT 'semrush' NOT NULL,
  	"status" "enum_data_syncs_status" DEFAULT 'running' NOT NULL,
  	"trigger" "enum_data_syncs_trigger" DEFAULT 'manual' NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"finished_at" timestamp(3) with time zone,
  	"request_count" numeric DEFAULT 0,
  	"estimated_units" numeric DEFAULT 0,
  	"evidence_count" numeric DEFAULT 0,
  	"marker_count" numeric DEFAULT 0,
  	"reports" jsonb,
  	"error_message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contexts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "evidence_records_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "markers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "data_syncs_id" integer;
  ALTER TABLE "contexts_competitors" ADD CONSTRAINT "contexts_competitors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contexts_topics" ADD CONSTRAINT "contexts_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_sync_id_data_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."data_syncs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "markers" ADD CONSTRAINT "markers_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "markers" ADD CONSTRAINT "markers_sync_id_data_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."data_syncs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "markers_rels" ADD CONSTRAINT "markers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."markers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "markers_rels" ADD CONSTRAINT "markers_rels_evidence_records_fk" FOREIGN KEY ("evidence_records_id") REFERENCES "public"."evidence_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "data_syncs" ADD CONSTRAINT "data_syncs_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contexts_competitors_order_idx" ON "contexts_competitors" USING btree ("_order");
  CREATE INDEX "contexts_competitors_parent_id_idx" ON "contexts_competitors" USING btree ("_parent_id");
  CREATE INDEX "contexts_topics_order_idx" ON "contexts_topics" USING btree ("_order");
  CREATE INDEX "contexts_topics_parent_id_idx" ON "contexts_topics" USING btree ("_parent_id");
  CREATE INDEX "contexts_updated_at_idx" ON "contexts" USING btree ("updated_at");
  CREATE INDEX "contexts_created_at_idx" ON "contexts" USING btree ("created_at");
  CREATE INDEX "evidence_records_phrase_idx" ON "evidence_records" USING btree ("phrase");
  CREATE INDEX "evidence_records_context_idx" ON "evidence_records" USING btree ("context_id");
  CREATE INDEX "evidence_records_sync_idx" ON "evidence_records" USING btree ("sync_id");
  CREATE INDEX "evidence_records_updated_at_idx" ON "evidence_records" USING btree ("updated_at");
  CREATE INDEX "evidence_records_created_at_idx" ON "evidence_records" USING btree ("created_at");
  CREATE INDEX "markers_phrase_idx" ON "markers" USING btree ("phrase");
  CREATE INDEX "markers_context_idx" ON "markers" USING btree ("context_id");
  CREATE INDEX "markers_sync_idx" ON "markers" USING btree ("sync_id");
  CREATE INDEX "markers_updated_at_idx" ON "markers" USING btree ("updated_at");
  CREATE INDEX "markers_created_at_idx" ON "markers" USING btree ("created_at");
  CREATE INDEX "markers_rels_order_idx" ON "markers_rels" USING btree ("order");
  CREATE INDEX "markers_rels_parent_idx" ON "markers_rels" USING btree ("parent_id");
  CREATE INDEX "markers_rels_path_idx" ON "markers_rels" USING btree ("path");
  CREATE INDEX "markers_rels_evidence_records_id_idx" ON "markers_rels" USING btree ("evidence_records_id");
  CREATE INDEX "data_syncs_context_idx" ON "data_syncs" USING btree ("context_id");
  CREATE INDEX "data_syncs_status_idx" ON "data_syncs" USING btree ("status");
  CREATE INDEX "data_syncs_updated_at_idx" ON "data_syncs" USING btree ("updated_at");
  CREATE INDEX "data_syncs_created_at_idx" ON "data_syncs" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contexts_fk" FOREIGN KEY ("contexts_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_evidence_records_fk" FOREIGN KEY ("evidence_records_id") REFERENCES "public"."evidence_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_markers_fk" FOREIGN KEY ("markers_id") REFERENCES "public"."markers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_data_syncs_fk" FOREIGN KEY ("data_syncs_id") REFERENCES "public"."data_syncs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contexts_id_idx" ON "payload_locked_documents_rels" USING btree ("contexts_id");
  CREATE INDEX "payload_locked_documents_rels_evidence_records_id_idx" ON "payload_locked_documents_rels" USING btree ("evidence_records_id");
  CREATE INDEX "payload_locked_documents_rels_markers_id_idx" ON "payload_locked_documents_rels" USING btree ("markers_id");
  CREATE INDEX "payload_locked_documents_rels_data_syncs_id_idx" ON "payload_locked_documents_rels" USING btree ("data_syncs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contexts_competitors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contexts_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contexts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "evidence_records" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "markers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "markers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "data_syncs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contexts_competitors" CASCADE;
  DROP TABLE "contexts_topics" CASCADE;
  DROP TABLE "contexts" CASCADE;
  DROP TABLE "evidence_records" CASCADE;
  DROP TABLE "markers" CASCADE;
  DROP TABLE "markers_rels" CASCADE;
  DROP TABLE "data_syncs" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contexts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_evidence_records_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_markers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_data_syncs_fk";
  
  DROP INDEX "payload_locked_documents_rels_contexts_id_idx";
  DROP INDEX "payload_locked_documents_rels_evidence_records_id_idx";
  DROP INDEX "payload_locked_documents_rels_markers_id_idx";
  DROP INDEX "payload_locked_documents_rels_data_syncs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contexts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "evidence_records_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "markers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "data_syncs_id";
  DROP TYPE "public"."enum_evidence_records_lens";
  DROP TYPE "public"."enum_evidence_records_source";
  DROP TYPE "public"."enum_evidence_records_kind";
  DROP TYPE "public"."enum_markers_kind";
  DROP TYPE "public"."enum_markers_direction";
  DROP TYPE "public"."enum_markers_confidence";
  DROP TYPE "public"."enum_data_syncs_lens";
  DROP TYPE "public"."enum_data_syncs_source";
  DROP TYPE "public"."enum_data_syncs_status";
  DROP TYPE "public"."enum_data_syncs_trigger";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
