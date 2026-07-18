import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";

import * as schema from "./schema/index.ts";

/**
 * Database client factories.
 *
 * The evidence-integrity services accept a Drizzle client instance rather than
 * reaching for a global, so the underlying driver can be swapped freely:
 *
 *  - {@link createPostgresClient} — production / real test Postgres via postgres-js.
 *  - {@link createPgliteClient}   — embedded in-memory Postgres for fast, zero-setup tests.
 *
 * Both return the same {@link DbClient} shape so callers are driver-agnostic.
 * See docs/adr/0001-evidence-integrity-stack.md.
 */

export interface DbConnection {
  db: DbClient;
  /** Execute raw SQL (used by the test harness for reset). */
  execRaw(query: string): Promise<void>;
  /** List base table names in the public schema. */
  listTables(): Promise<string[]>;
  close(): Promise<void>;
}

export function createPostgresClient(connectionString: string): DbConnection {
  const sql = postgres(connectionString, { max: 10 });
  const db = drizzlePostgres(sql, { schema });
  return {
    db: db as unknown as DbClient,
    async execRaw(query: string) {
      await sql.unsafe(query);
    },
    async listTables() {
      const rows = await sql<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      return rows.map((r) => r.tablename);
    },
    async close() {
      await sql.end({ timeout: 5 });
    },
  };
}

export function createPgliteClient(dataDir?: string): DbConnection {
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  return {
    db: db as unknown as DbClient,
    async execRaw(query: string) {
      await client.exec(query);
    },
    async listTables() {
      const result = await client.query<{ tablename: string }>(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      );
      return result.rows.map((r) => r.tablename);
    },
    async close() {
      await client.close();
    },
  };
}

// A structural type that both driver adapters satisfy for the query methods the
// services use. Kept intentionally loose at the skeleton stage; ticket 02
// narrows usage to the concrete Drizzle query builder for the evidence tables.
export type DbClient = ReturnType<typeof drizzlePglite<typeof schema>>;
