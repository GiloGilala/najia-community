import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { validateCreatePoll, PollValidationError } from "../lib/validation/poll.ts";
import { FakeVoterResolver } from "../lib/auth/voter-resolver.ts";
import { users } from "../db/schema/users.ts";

/**
 * Poll ticket 01 — Jurisdictions & poll schema + VoterResolver seam.
 * This ticket establishes layers; tests assert the validation + resolver seams
 * and that the schema migrates so the tables exist.
 */
describe("poll ticket 01 — schema, validation, resolver seam", () => {
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

  test("migration creates the poll tables", async () => {
    const tables = await harness.listTables();
    for (const t of ["jurisdictions", "policy_polls", "policy_votes", "users"]) {
      expect(tables).toContain(t);
    }
  });

  test("the users schema exposes jurisdictionId", async () => {
    // Selecting the column through the drizzle schema proves it exists post-migration.
    const rows = await harness.db
      .select({ j: users.jurisdictionId })
      .from(users)
      .limit(0);
    expect(Array.isArray(rows)).toBe(true);
  });

  test("validation rejects fewer than 2 options", () => {
    expect(() =>
      validateCreatePoll({
        title: "T",
        question: "Q",
        options: ["only one"],
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        opensAt: new Date("2025-01-01T00:00:00.000Z"),
        closesAt: new Date("2025-01-08T00:00:00.000Z"),
        createdBy: "22222222-2222-4222-8222-222222222222",
      }),
    ).toThrow(PollValidationError);
  });

  test("validation rejects more than 5 options", () => {
    expect(() =>
      validateCreatePoll({
        title: "T",
        question: "Q",
        options: ["a", "b", "c", "d", "e", "f"],
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        opensAt: new Date("2025-01-01T00:00:00.000Z"),
        closesAt: new Date("2025-01-08T00:00:00.000Z"),
        createdBy: "22222222-2222-4222-8222-222222222222",
      }),
    ).toThrow(PollValidationError);
  });

  test("validation rejects a window where closes is not after opens", () => {
    expect(() =>
      validateCreatePoll({
        title: "T",
        question: "Q",
        options: ["a", "b"],
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        opensAt: new Date("2025-01-08T00:00:00.000Z"),
        closesAt: new Date("2025-01-01T00:00:00.000Z"),
        createdBy: "22222222-2222-4222-8222-222222222222",
      }),
    ).toThrow(PollValidationError);
  });

  test("validation accepts a well-formed poll", () => {
    expect(() =>
      validateCreatePoll({
        title: "T",
        question: "Q",
        options: ["a", "b", "c"],
        jurisdictionId: "11111111-1111-4111-8111-111111111111",
        opensAt: new Date("2025-01-01T00:00:00.000Z"),
        closesAt: new Date("2025-01-08T00:00:00.000Z"),
        createdBy: "22222222-2222-4222-8222-222222222222",
      }),
    ).not.toThrow();
  });

  test("the VoterResolver fake resolves a configured voter", async () => {
    const resolver = new FakeVoterResolver({
      id: "22222222-2222-4222-8222-222222222222",
      verificationStatus: "id_verified",
      jurisdictionId: "11111111-1111-4111-8111-111111111111",
    });
    const voter = await resolver.resolve("any-token");
    expect(voter.verificationStatus).toBe("id_verified");
    expect(voter.jurisdictionId).toBe("11111111-1111-4111-8111-111111111111");
  });

  test("the VoterResolver fake rejects configured tokens", async () => {
    const resolver = new FakeVoterResolver({
      id: "22222222-2222-4222-8222-222222222222",
      verificationStatus: "id_verified",
      jurisdictionId: "11111111-1111-4111-8111-111111111111",
    });
    resolver.rejectTokens.add("expired");
    await expect(resolver.resolve("expired")).rejects.toThrow();
  });
});
