// nextjs/drizzle.config.ts
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

// console.log("cwd:", process.cwd());
// console.log("POSTGRES_URL:", process.env.POSTGRES_URL);

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: POSTGRES_URL,
  },
});
