import {
  createPgliteClient,
  createPostgresClient,
  type DbClient,
  type DbConnection,
} from "../db/client.ts";
import { InMemoryFileStorage } from "../lib/storage/in-memory-file-storage.ts";
import { FixedClock } from "../lib/clock/clock.ts";

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
