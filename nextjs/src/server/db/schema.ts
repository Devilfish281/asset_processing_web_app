// nextjs/src/server/db/schema.ts
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const assetProcessingJobs = pgTable(
  "asset_processing_jobs",
  {
    id: text("id")
      .default(sql`gen_random_uuid()::text`)
      .primaryKey()
      .notNull(),
    threadId: text("thread_id").notNull(),
    userId: text("user_id").notNull(),
    todoKind: text("todo_kind").default("personal").notNull(),
    status: text().default("created").notNull(),
    attempts: integer().default(0).notNull(),
    lastHeartbeat: timestamp("last_heartbeat", {
      withTimezone: true,
      mode: "string",
    }),
    errorMessage: text("error_message"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: "number" }).notNull(),
    message: text(),
    lastMsgType: text("last_msg_type"),
    lastMsgContent: text("last_msg_content"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .$onUpdateFn(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index("idx_apj_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("idx_apj_thread_id").using(
      "btree",
      table.threadId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_apj_todo_kind").using(
      "btree",
      table.todoKind.asc().nullsLast().op("text_ops"),
    ),
    index("idx_apj_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
  ],
);

// Types
export type InsertJob = typeof assetProcessingJobs.$inferInsert;
export type Job = typeof assetProcessingJobs.$inferSelect;
