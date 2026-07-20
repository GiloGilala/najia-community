import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createLawyerService } from "../services/lawyer.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";

const STATE = "11111111-1111-4111-8111-111111111111";
const OTHER_STATE = "22222222-2222-4222-8222-222222222222";

function userRow(id: string) {
  return {
    id,
    passwordHash: "x",
    verificationStatus: "id_verified",
    jurisdictionId: STATE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function lawyerInput(id: string, barNumber: string, overrides: Partial<{
  practiceAreas: string[];
  licensedJurisdictionIds: string[];
  yearsPracticing: number;
  proBono: boolean;
}> = {}) {
  return {
    userId: id,
    barNumber,
    practiceAreas: ["family"],
    licensedJurisdictionIds: [STATE],
    yearsPracticing: 0,
    languages: ["English"],
    ...overrides,
  };
}

describe("lawyer ticket 03 — matching", () => {
  let harness: TestHarness;
  let service: ReturnType<typeof createLawyerService>;

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
      { id: STATE, name: "Lagos", level: "state", parentId: null },
      { id: OTHER_STATE, name: "Kano", level: "state", parentId: null },
    ]);
    await harness.db.insert(users).values([
      userRow("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
      userRow("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
      userRow("cccccccc-cccc-4ccc-8ccc-cccccccccccc"),
      userRow("dddddddd-dddd-4ddd-8ddd-dddddddddddd"),
      userRow("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
      userRow("ffffffff-ffff-4fff-8fff-ffffffffffff"),
      userRow("11111111-1111-4111-8111-111111111111"),
    ]);
    service = createLawyerService({ db: harness.db, clock: harness.clock });
  });

  async function onboardAndVerify(id: string, barNumber: string, overrides = {}) {
    const lawyer = await service.onboardLawyer(lawyerInput(id, barNumber, overrides));
    return service.verifyLawyer({ lawyerId: lawyer.userId });
  }

  test("matchLawyers returns verified, jurisdiction-licensed, practice-area lawyers", async () => {
    await onboardAndVerify("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", { practiceAreas: ["family"] });
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches).toHaveLength(1);
    expect(matches[0].barNumber).toBe("B/1");
  });

  test("matchLawyers excludes pending (unverified) lawyers", async () => {
    await service.onboardLawyer(lawyerInput("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", { practiceAreas: ["family"] }));
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches).toHaveLength(0);
  });

  test("matchLawyers excludes lawyers not licensed in the jurisdiction", async () => {
    await onboardAndVerify("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", {
      practiceAreas: ["family"],
      licensedJurisdictionIds: [OTHER_STATE],
    });
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches).toHaveLength(0);
  });

  test("matchLawyers excludes lawyers not listing the practice area", async () => {
    await onboardAndVerify("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", {
      practiceAreas: ["criminal"],
    });
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches).toHaveLength(0);
  });

  test("matchLawyers orders by score (pro-bono and experience boost)", async () => {
    await onboardAndVerify("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", { practiceAreas: ["family"], yearsPracticing: 1 });
    await onboardAndVerify("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "B/2", { practiceAreas: ["family"], yearsPracticing: 10, proBono: true });
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches.map((m) => m.barNumber)).toEqual(["B/2", "B/1"]);
  });

  test("matchLawyers caps at 5", async () => {
    for (let i = 0; i < 7; i++) {
      const id = ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","cccccccc-cccc-4ccc-8ccc-cccccccccccc","dddddddd-dddd-4ddd-8ddd-dddddddddddd","eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","ffffffff-ffff-4fff-8fff-ffffffffffff","11111111-1111-4111-8111-111111111111"][i];
      await onboardAndVerify(id, `B/${i}`, { practiceAreas: ["family"] });
    }
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    expect(matches).toHaveLength(5);
  });

  test("matchLawyers returns empty when none eligible", async () => {
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: OTHER_STATE });
    expect(matches).toHaveLength(0);
  });

  test("results expose only profile fields, not user credentials", async () => {
    await onboardAndVerify("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "B/1", { practiceAreas: ["family"] });
    const matches = await service.matchLawyers({ practiceArea: "family", jurisdictionId: STATE });
    const serialized = JSON.stringify(matches);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("governmentIdHash");
    expect(matches[0]).not.toHaveProperty("passwordHash");
  });
});
