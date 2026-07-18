import { expect, test, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import { sql } from "drizzle-orm";

import { createTestHarness, type TestHarness } from "./harness.ts";

/**
 * Ticket 01 smoke test: proves the test harness connects to the test Postgres,
 * can reset between tests, and exposes the injected collaborators. No
 * evidence-integrity behaviour is exercised yet — that arrives in ticket 02.
 */
describe("test harness (skeleton smoke test)", () => {
  let harness: TestHarness;

  beforeAll(() => {
    harness = createTestHarness();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  test("connects to the database and can run a query", async () => {
    const result = await harness.db.execute(sql`SELECT 1 AS value`);
    // postgres-js returns an array of rows; pglite returns { rows: [...] }.
    const rows = (
      Array.isArray(result) ? result : (result as { rows: unknown[] }).rows
    ) as Array<{ value: number }>;
    expect(Number(rows[0]?.value)).toBe(1);
  });

  test("provides an in-memory file storage collaborator", async () => {
    await harness.storage.put("k", new Uint8Array([1, 2, 3]));
    expect(await harness.storage.exists("k")).toBe(true);
    expect(Array.from(await harness.storage.get("k"))).toEqual([1, 2, 3]);
  });

  test("provides a fixed clock collaborator", () => {
    const first = harness.clock.now();
    harness.clock.advance(1000);
    const second = harness.clock.now();
    expect(second.getTime() - first.getTime()).toBe(1000);
  });
});
