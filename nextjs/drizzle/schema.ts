import { pgTable, integer, index, text, timestamp, bigint, primaryKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const checkpointMigrations = pgTable("checkpoint_migrations", {
	v: integer().primaryKey().notNull(),
});

export const assetProcessingJobs = pgTable("asset_processing_jobs", {
	id: text().primaryKey().notNull(),
	threadId: text("thread_id").notNull(),
	userId: text("user_id").notNull(),
	todoKind: text("todo_kind").default('personal').notNull(),
	status: text().default('created').notNull(),
	attempts: integer().default(0).notNull(),
	lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true, mode: 'string' }),
	errorMessage: text("error_message"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	size: bigint({ mode: "number" }).notNull(),
	message: text(),
	lastMsgType: text("last_msg_type"),
	lastMsgContent: text("last_msg_content"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_apj_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_apj_thread_id").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
	index("idx_apj_todo_kind").using("btree", table.todoKind.asc().nullsLast().op("text_ops")),
	index("idx_apj_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const storeMigrations = pgTable("store_migrations", {
	v: integer().primaryKey().notNull(),
});

export const checkpointBlobs = pgTable("checkpoint_blobs", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default(').notNull(),
	channel: text().notNull(),
	version: text().notNull(),
	type: text().notNull(),
	// TODO: failed to parse database type 'bytea'
	blob: unknown("blob"),
}, (table) => [
	index("checkpoint_blobs_thread_id_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.channel, table.version], name: "checkpoint_blobs_pkey"}),
]);

export const checkpoints = pgTable("checkpoints", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default(').notNull(),
	checkpointId: text("checkpoint_id").notNull(),
	parentCheckpointId: text("parent_checkpoint_id"),
	type: text(),
	checkpoint: jsonb().notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("checkpoints_thread_id_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.checkpointId], name: "checkpoints_pkey"}),
]);

export const store = pgTable("store", {
	prefix: text().notNull(),
	key: text().notNull(),
	value: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	ttlMinutes: integer("ttl_minutes"),
}, (table) => [
	index("idx_store_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(expires_at IS NOT NULL)`),
	index("store_prefix_idx").using("btree", table.prefix.asc().nullsLast().op("text_pattern_ops")),
	primaryKey({ columns: [table.prefix, table.key], name: "store_pkey"}),
]);

export const checkpointWrites = pgTable("checkpoint_writes", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default(').notNull(),
	checkpointId: text("checkpoint_id").notNull(),
	taskId: text("task_id").notNull(),
	idx: integer().notNull(),
	channel: text().notNull(),
	type: text(),
	// TODO: failed to parse database type 'bytea'
	blob: unknown("blob").notNull(),
	taskPath: text("task_path").default(').notNull(),
}, (table) => [
	index("checkpoint_writes_thread_id_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.checkpointId, table.taskId, table.idx], name: "checkpoint_writes_pkey"}),
]);
