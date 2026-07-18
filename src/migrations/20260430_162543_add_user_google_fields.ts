import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_award_entries_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_awards_result" AS ENUM('won', 'finalist', 'shortlisted');
  CREATE TABLE "users_sessions" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "created_at" timestamp(3) with time zone,
     "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
     "id" serial PRIMARY KEY NOT NULL,
     "name" varchar,
     "google_sub" varchar,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "email" varchar NOT NULL,
     "reset_password_token" varchar,
     "reset_password_expiration" timestamp(3) with time zone,
     "salt" varchar,
     "hash" varchar,
     "login_attempts" numeric DEFAULT 0,
     "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "award_entries" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "award_body" varchar,
     "category" varchar,
     "year" numeric,
     "theme" "enum_award_entries_theme" DEFAULT 'light',
     "layout" jsonb,
     "generate_slug" boolean DEFAULT true,
     "slug" varchar NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

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

  CREATE TABLE "media" (
     "id" serial PRIMARY KEY NOT NULL,
     "alt" varchar,
     "caption" jsonb,
     "uploadthing_key" varchar,
     "uploadthing_url" varchar,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "url" varchar,
     "thumbnail_u_r_l" varchar,
     "filename" varchar,
     "mime_type" varchar,
     "filesize" numeric,
     "width" numeric,
     "height" numeric,
     "focal_x" numeric,
     "focal_y" numeric,
     "sizes_thumbnail_url" varchar,
     "sizes_thumbnail_width" numeric,
     "sizes_thumbnail_height" numeric,
     "sizes_thumbnail_mime_type" varchar,
     "sizes_thumbnail_filesize" numeric,
     "sizes_thumbnail_filename" varchar
  );

  CREATE TABLE "videos" (
     "id" serial PRIMARY KEY NOT NULL,
     "source_uploadthing_key" varchar,
     "source_uploadthing_url" varchar,
     "mux_asset_id" varchar,
     "mux_playback_id" varchar,
     "mux_status" varchar,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "url" varchar,
     "thumbnail_u_r_l" varchar,
     "filename" varchar,
     "mime_type" varchar,
     "filesize" numeric,
     "width" numeric,
     "height" numeric,
     "focal_x" numeric,
     "focal_y" numeric
  );

  CREATE TABLE "payload_kv" (
     "id" serial PRIMARY KEY NOT NULL,
     "key" varchar NOT NULL,
     "data" jsonb NOT NULL
  );

  CREATE TABLE "payload_locked_documents" (
     "id" serial PRIMARY KEY NOT NULL,
     "global_slug" varchar,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
     "id" serial PRIMARY KEY NOT NULL,
     "order" integer,
     "parent_id" integer NOT NULL,
     "path" varchar NOT NULL,
     "users_id" integer,
     "award_entries_id" integer,
     "awards_id" integer,
     "media_id" integer,
     "videos_id" integer
  );

  CREATE TABLE "payload_preferences" (
     "id" serial PRIMARY KEY NOT NULL,
     "key" varchar,
     "value" jsonb,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
     "id" serial PRIMARY KEY NOT NULL,
     "order" integer,
     "parent_id" integer NOT NULL,
     "path" varchar NOT NULL,
     "users_id" integer
  );

  CREATE TABLE "payload_migrations" (
     "id" serial PRIMARY KEY NOT NULL,
     "name" varchar,
     "batch" numeric,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_award_entries_fk" FOREIGN KEY ("award_entries_id") REFERENCES "public"."award_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_google_sub_idx" ON "users" USING btree ("google_sub");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "award_entries_slug_idx" ON "award_entries" USING btree ("slug");
  CREATE INDEX "award_entries_updated_at_idx" ON "award_entries" USING btree ("updated_at");
  CREATE INDEX "award_entries_created_at_idx" ON "award_entries" USING btree ("created_at");
  CREATE INDEX "awards_updated_at_idx" ON "awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "awards" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "videos" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_award_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("award_entries_id");
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("awards_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "award_entries" CASCADE;
  DROP TABLE "awards" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_award_entries_theme";
  DROP TYPE "public"."enum_awards_result";`)
}
