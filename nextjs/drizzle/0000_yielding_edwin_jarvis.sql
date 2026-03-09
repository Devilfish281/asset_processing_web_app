-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "checkpoint_migrations" (
	"v" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_processing_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"user_id" text NOT NULL,
	"todo_kind" text DEFAULT 'personal' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_heartbeat" timestamp with time zone,
	"error_message" text,
	"size" bigint NOT NULL,
	"message" text,
	"last_msg_type" text,
	"last_msg_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_migrations" (
	"v" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkpoint_blobs" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"channel" text NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"blob" "bytea",
	CONSTRAINT "checkpoint_blobs_pkey" PRIMARY KEY("thread_id","checkpoint_ns","channel","version")
);
--> statement-breakpoint
CREATE TABLE "checkpoints" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"checkpoint_id" text NOT NULL,
	"parent_checkpoint_id" text,
	"type" text,
	"checkpoint" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "checkpoints_pkey" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id")
);
--> statement-breakpoint
CREATE TABLE "store" (
	"prefix" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp with time zone,
	"ttl_minutes" integer,
	CONSTRAINT "store_pkey" PRIMARY KEY("prefix","key")
);
--> statement-breakpoint
CREATE TABLE "checkpoint_writes" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"checkpoint_id" text NOT NULL,
	"task_id" text NOT NULL,
	"idx" integer NOT NULL,
	"channel" text NOT NULL,
	"type" text,
	"blob" "bytea" NOT NULL,
	"task_path" text DEFAULT '' NOT NULL,
	CONSTRAINT "checkpoint_writes_pkey" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id","task_id","idx")
);
--> statement-breakpoint
CREATE INDEX "idx_apj_status" ON "asset_processing_jobs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_apj_thread_id" ON "asset_processing_jobs" USING btree ("thread_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_apj_todo_kind" ON "asset_processing_jobs" USING btree ("todo_kind" text_ops);--> statement-breakpoint
CREATE INDEX "idx_apj_user_id" ON "asset_processing_jobs" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "checkpoint_blobs_thread_id_idx" ON "checkpoint_blobs" USING btree ("thread_id" text_ops);--> statement-breakpoint
CREATE INDEX "checkpoints_thread_id_idx" ON "checkpoints" USING btree ("thread_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_store_expires_at" ON "store" USING btree ("expires_at" timestamptz_ops) WHERE (expires_at IS NOT NULL);--> statement-breakpoint
CREATE INDEX "store_prefix_idx" ON "store" USING btree ("prefix" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "checkpoint_writes_thread_id_idx" ON "checkpoint_writes" USING btree ("thread_id" text_ops);
*/