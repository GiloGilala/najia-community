import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import {
  validateRegisterOfficial,
  validateCastConfidenceVote,
  ConfidenceValidationError,
} from "../lib/validation/confidence.ts";
import { quarterOf, isTermActive } from "../lib/confidence.ts";
import { officials } from "../db/schema/officials.ts";
import { users } from "../db/schema/users.ts";

describe("confidence ticket 01 — schema, validation, helpers", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  test("migration creates the confidence tables", async () => {
    const tables = await harness.listTables();
    for (const t of ["officials", "confidence_votes", "users", "jurisdictions"]) {
      expect(tables).toContain(t);
    }
  });

  test("validation accepts a well-formed official", () => {
    expect(() =>
      validateRegisterOfficial({
        name: "Ada",
        title: "Governor",
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
        termEndsAt: new Date("2025-12-31T00:00:00.000Z"),
      }),
    ).not.toThrow();
  });

  test("validation rejects an empty name", () => {
    expect(() =>
      validateRegisterOfficial({
        name: "",
        title: "Governor",
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
    ).toThrow(ConfidenceValidationError);
  });

  test("validation rejects an empty title", () => {
    expect(() =>
      validateRegisterOfficial({
        name: "Ada",
        title: "",
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
    ).toThrow(ConfidenceValidationError);
  });

  test("validation rejects a term where ends is not after starts", () => {
    expect(() =>
      validateRegisterOfficial({
        name: "Ada",
        title: "Governor",
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        termStartsAt: new Date("2025-12-31T00:00:00.000Z"),
        termEndsAt: new Date("2025-01-01T00:00:00.000Z"),
      }),
    ).toThrow(ConfidenceValidationError);
  });

  test("validation accepts a null term end", () => {
    expect(() =>
      validateRegisterOfficial({
        name: "Ada",
        title: "Governor",
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
        termEndsAt: null,
      }),
    ).not.toThrow();
  });

  test("validation accepts a valid vote option", () => {
    expect(() =>
      validateCastConfidenceVote({ officialId: "11111111-1111-4111-8111-111111111111", option: "yes" }),
    ).not.toThrow();
  });

  test("validation rejects an invalid vote option", () => {
    expect(() =>
      validateCastConfidenceVote({ officialId: "11111111-1111-4111-8111-111111111111", option: "maybe" }),
    ).toThrow(ConfidenceValidationError);
  });

  test("quarterOf renders calendar quarters", () => {
    expect(quarterOf(new Date("2025-01-01T00:00:00.000Z"))).toBe("2025-Q1");
    expect(quarterOf(new Date("2025-04-15T00:00:00.000Z"))).toBe("2025-Q2");
    expect(quarterOf(new Date("2025-07-20T00:00:00.000Z"))).toBe("2025-Q3");
    expect(quarterOf(new Date("2025-11-30T00:00:00.000Z"))).toBe("2025-Q4");
  });

  test("isTermActive respects the term window", () => {
    const start = new Date("2025-01-01T00:00:00.000Z");
    const end = new Date("2025-12-31T00:00:00.000Z");
    expect(isTermActive(start, end, new Date("2024-12-31T00:00:00.000Z"))).toBe(false);
    expect(isTermActive(start, end, new Date("2025-06-01T00:00:00.000Z"))).toBe(true);
    expect(isTermActive(start, end, new Date("2026-01-01T00:00:00.000Z"))).toBe(false);
  });

  test("isTermActive treats a null end as open-ended", () => {
    const start = new Date("2025-01-01T00:00:00.000Z");
    expect(isTermActive(start, null, new Date("2030-01-01T00:00:00.000Z"))).toBe(true);
    expect(isTermActive(start, null, new Date("2024-01-01T00:00:00.000Z"))).toBe(false);
  });
});
