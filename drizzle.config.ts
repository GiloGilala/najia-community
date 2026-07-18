import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration for migrations.
 * See docs/adr/0001-evidence-integrity-stack.md.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
