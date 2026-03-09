//nextjs/src/server/db/index.ts
import "server-only";

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error("POSTGRES_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: POSTGRES_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle({ client: pool, schema });
export { pool };
