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
  createConfidenceService,
  CONFIDENCE_DISCLAIMER,
} from "../services/confidence.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";

const NATIONAL = "11111111-1111-4111-8111-111111111111";
const CREATOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VOTER_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VOTER_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VOTER_C = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const TERM_START = new Date("2025-01-01T00:00:00.000Z");
const TERM_END = new Date("2025-12-31T00:00:00.000Z");

describe("confidence ticket 04 — results", () => {
  let harness: TestHarness;
  let service: ReturnType<typeof createConfidenceService>;

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
    await harness.db.insert(jurisdictions).values({
      id: NATIONAL,
      name: "Nigeria",
      level: "national",
      parentId: null,
    });
    await harness.db.insert(users).values([
      { id: CREATOR, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_A, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_B, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_C, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
    ]);
    service = createConfidenceService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-06-01T00:00:00.000Z")); // Q2
  });

  async function registerOfficial() {
    return service.registerOfficial({
      name: "Ada",
      title: "Governor",
      jurisdictionId: NATIONAL,
      termStartsAt: TERM_START,
      termEndsAt: TERM_END,
    });
  }

  test("getResults returns per-option counts and percentages", async () => {
    const official = await registerOfficial();
    await service.castVote({ officialId: official.id, voter: { id: VOTER_A, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, option: "yes" });
    await service.castVote({ officialId: official.id, voter: { id: VOTER_B, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, option: "yes" });
    await service.castVote({ officialId: official.id, voter: { id: VOTER_C, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, option: "no" });

    const results = await service.getResults({ officialId: official.id });
    expect(results.totalVotes).toBe(3);
    expect(results.quarter).toBe("2025-Q2");
    const yes = results.options.find((o) => o.option === "yes")!;
    const no = results.options.find((o) => o.option === "no")!;
    const uncertain = results.options.find((o) => o.option === "uncertain")!;
    expect(yes.count).toBe(2);
    expect(yes.percentage).toBeCloseTo(66.6667, 3);
    expect(no.count).toBe(1);
    expect(no.percentage).toBeCloseTo(33.3333, 3);
    expect(uncertain.count).toBe(0);
    expect(uncertain.percentage).toBe(0);
  });

  test("getResults includes the non-binding disclaimer", async () => {
    const official = await registerOfficial();
    const results = await service.getResults({ officialId: official.id });
    expect(results.disclaimer).toBe(CONFIDENCE_DISCLAIMER);
  });

  test("results are aggregate-only — no voter identity is exposed", async () => {
    const official = await registerOfficial();
    await service.castVote({ officialId: official.id, voter: { id: VOTER_A, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, option: "uncertain" });
    const results = await service.getResults({ officialId: official.id });
    const serialized = JSON.stringify(results);
    expect(serialized).not.toContain(VOTER_A);
    expect(serialized).not.toContain("voterId");
    expect(results.options.every((o) => !("voterId" in o))).toBe(true);
  });

  test("a official with no votes reports zero totals", async () => {
    const official = await registerOfficial();
    const results = await service.getResults({ officialId: official.id });
    expect(results.totalVotes).toBe(0);
    expect(results.options.every((o) => o.count === 0 && o.percentage === 0)).toBe(true);
  });

  test("getResults defaults to the current quarter and can target another", async () => {
    const official = await registerOfficial();
    harness.clock.set(new Date("2025-10-01T00:00:00.000Z")); // Q4
    await service.castVote({ officialId: official.id, voter: { id: VOTER_A, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, option: "yes" });

    const q4 = await service.getResults({ officialId: official.id });
    expect(q4.quarter).toBe("2025-Q4");
    expect(q4.totalVotes).toBe(1);

    const q2 = await service.getResults({ officialId: official.id, quarter: "2025-Q2" });
    expect(q2.quarter).toBe("2025-Q2");
    expect(q2.totalVotes).toBe(0);
  });
});
