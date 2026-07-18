import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createPgliteClient,
  createPostgresClient,
  type DbClient,
  type DbConnection,
} from "../db/client.ts";
import { InMemoryFileStorage } from "../lib/storage/in-memory-file-storage.ts";
import { FixedClock } from "../lib/clock/clock.ts";

const MIGRATIONS_DIR = join(import.meta.dir, "..", "db", "migrations");

/**
 * A test-environment bundle: a live database client, an in-memory file storage,
 * and a fixed clock. Services under test receive these collaborators so
 * behaviour is deterministic and isolated.
 *
 * Driver selection:
 *  - If DATABASE_URL is set, use real Postgres (postgres-js) against it. That
 *    database MUST be dedicated to tests — reset() truncates its public schema.
 *  - Otherwise, fall back to an embedded in-memory PGlite database, so tests run
 *    with zero external setup. Switching back to real Postgres later is just a
 *    matter of setting DATABASE_URL.
 */
export interface TestHarness {
  db: DbClient;
  storage: InMemoryFileStorage;
  clock: FixedClock;
  /** Which driver backs this harness, for diagnostics. */
  driver: "postgres" | "pglite";
  /** Apply all generated SQL migrations so the schema exists. */
  migrate(): Promise<void>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

export function createTestHarness(): TestHarness {
  const connectionString = process.env.DATABASE_URL;

  let connection: DbConnection;
  let driver: "postgres" | "pglite";
  if (connectionString) {
    connection = createPostgresClient(connectionString);
    driver = "postgres";
  } else {
    connection = createPgliteClient();
    driver = "pglite";
  }

  const storage = new InMemoryFileStorage();
  const clock = new FixedClock(DEFAULT_CLOCK_START);

  return {
    db: connection.db,
    storage,
    clock,
    driver,
    async migrate() {
      const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();
      for (const file of files) {
        const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
        // Drizzle separates statements with a breakpoint marker.
        const statements = sqlText
          .split("--> statement-breakpoint")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const statement of statements) {
          await connection.execRaw(statement);
        }
      }
    },
    async reset() {
      // Truncate every base table in the public schema so each test starts from
      // a clean slate regardless of which tables exist yet.
      const tables = await connection.listTables();
      if (tables.length > 0) {
        const list = tables.map((t) => `"public"."${t}"`).join(", ");
        await connection.execRaw(
          `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
        );
      }
    },
    async close() {
      await connection.close();
    },
  };
}
