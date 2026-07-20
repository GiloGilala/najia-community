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
  MIN_SAMPLE,
  CONFIDENCE_DISCLAIMER,
} from "../services/confidence.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";

const NATIONAL = "11111111-1111-4111-8111-111111111111";
const STATE = "22222222-2222-4222-8222-222222222222";
const LGA_A = "33333333-3333-4333-8333-333333333333";
const LGA_B = "44444444-4444-4444-8444-444444444444";

function voter(userId: string, lgaId: string): ResolvedVoter {
  return { id: userId, verificationStatus: "id_verified", jurisdictionId: lgaId };
}

async function seedVoters(
  harness: TestHarness,
  count: number,
  lgaId: string,
  prefix: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    ids.push(id);
    await harness.db.insert(users).values({
      id,
      passwordHash: "x",
      verificationStatus: "id_verified",
      jurisdictionId: lgaId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return ids;
}

describe("confidence-analytics ticket 02 — regional, trend, interval", () => {
  let harness: TestHarness;
  let service: ReturnType<typeof createConfidenceService>;
  let officialId: string;

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
    await harness.db.insert(jurisdictions).values([
      { id: NATIONAL, name: "Nigeria", level: "national", parentId: null },
      { id: STATE, name: "Lagos", level: "state", parentId: NATIONAL },
      { id: LGA_A, name: "Ikeja", level: "local", parentId: STATE },
      { id: LGA_B, name: "Agege", level: "local", parentId: STATE },
    ]);
    service = createConfidenceService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-06-01T00:00:00.000Z")); // Q2
    const official = await service.registerOfficial({
      name: "Ada",
      title: "Governor",
      jurisdictionId: NATIONAL,
      termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
      termEndsAt: new Date("2025-12-31T00:00:00.000Z"),
    });
    officialId = official.id;
  });

  async function castMany(voterIds: string[], lgaId: string, option: "yes" | "no" | "uncertain") {
    for (const id of voterIds) {
      await service.castVote({ officialId, voter: voter(id, lgaId), option });
    }
  }

  test("getResults reports yesPercentage and a confidence interval", async () => {
    const ids = await seedVoters(harness, 40, LGA_A, "aaaaaaaa");
    await castMany(ids, LGA_A, "yes");
    const results = await service.getResults({ officialId });
    expect(results.yesPercentage).toBe(100);
    expect(results.yesConfidenceInterval.low).toBeGreaterThan(0);
    expect(results.yesConfidenceInterval.high).toBeLessThanOrEqual(1);
    expect(results.disclaimer).toBe(CONFIDENCE_DISCLAIMER);
  });

  test("getRegionalBreakdown omits LGAs below MIN_SAMPLE", async () => {
    const small = await seedVoters(harness, 5, LGA_A, "aaaaaaaa");
    await castMany(small, LGA_A, "yes");
    const big = await seedVoters(harness, MIN_SAMPLE + 5, LGA_B, "bbbbbbbb");
    await castMany(big, LGA_B, "no");

    const breakdown = await service.getRegionalBreakdown({ officialId });
    const ids = breakdown.map((r) => r.jurisdictionId);
    expect(ids).not.toContain(LGA_A); // below threshold
    expect(ids).toContain(LGA_B); // above threshold
    const lgaB = breakdown.find((r) => r.jurisdictionId === LGA_B)!;
    expect(lgaB.jurisdictionName).toBe("Agege");
    expect(lgaB.yesPercentage).toBe(0);
    expect(lgaB.yesConfidenceInterval.high).toBeLessThanOrEqual(1);
    expect(lgaB.yesConfidenceInterval.low).toBeGreaterThanOrEqual(0);
  });

  test("getRegionalBreakdown is empty for a local official (no descendant LGA)", async () => {
    const localOfficial = await service.registerOfficial({
      name: "Local",
      title: "Chair",
      jurisdictionId: LGA_A,
      termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
      termEndsAt: new Date("2025-12-31T00:00:00.000Z"),
    });
    const breakdown = await service.getRegionalBreakdown({ officialId: localOfficial.id });
    expect(breakdown).toHaveLength(0);
  });

  test("getTrend returns quarters in chronological order with per-quarter percentages", async () => {
    const idsQ2 = await seedVoters(harness, 10, LGA_A, "aaaaaaaa");
    await castMany(idsQ2, LGA_A, "yes");

    harness.clock.set(new Date("2025-10-01T00:00:00.000Z")); // Q4
    const idsQ4 = await seedVoters(harness, 10, LGA_A, "cccccccc");
    await castMany(idsQ4, LGA_A, "no");

    const trend = await service.getTrend({ officialId });
    expect(trend.map((t) => t.quarter)).toEqual(["2025-Q2", "2025-Q4"]);
    const q2 = trend.find((t) => t.quarter === "2025-Q2")!;
    expect(q2.options.find((o) => o.option === "yes")!.percentage).toBe(100);
    const q4 = trend.find((t) => t.quarter === "2025-Q4")!;
    expect(q4.options.find((o) => o.option === "no")!.percentage).toBe(100);
  });
});


