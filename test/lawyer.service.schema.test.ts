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
  validateOnboardLawyer,
  LawyerValidationError,
} from "../lib/validation/lawyer.ts";
import {
  scoreLawyer,
  rankLawyers,
} from "../lib/lawyer-match.ts";
import { lawyers } from "../db/schema/lawyers.ts";
import { users } from "../db/schema/users.ts";

describe("lawyer ticket 01 — schema, validation, match helpers", () => {
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

  test("migration creates the lawyers table", async () => {
    const tables = await harness.listTables();
    expect(tables).toContain("lawyers");
  });

  test("validation accepts a well-formed lawyer", () => {
    expect(() =>
      validateOnboardLawyer({
        userId: "22222222-2222-4222-8222-222222222222",
        barNumber: "B/1234",
        practiceAreas: ["family"],
        licensedJurisdictionIds: ["11111111-1111-4111-8111-111111111111"],
        yearsPracticing: 5,
        languages: ["English"],
        proBono: true,
      }),
    ).not.toThrow();
  });

  test("validation rejects an empty bar number", () => {
    expect(() =>
      validateOnboardLawyer({
        userId: "22222222-2222-4222-8222-222222222222",
        barNumber: "",
        practiceAreas: ["family"],
        licensedJurisdictionIds: ["11111111-1111-4111-8111-111111111111"],
        yearsPracticing: 5,
        languages: ["English"],
      }),
    ).toThrow(LawyerValidationError);
  });

  test("validation rejects empty practice areas", () => {
    expect(() =>
      validateOnboardLawyer({
        userId: "22222222-2222-4222-8222-222222222222",
        barNumber: "B/1234",
        practiceAreas: [],
        licensedJurisdictionIds: ["11111111-1111-4111-8111-111111111111"],
        yearsPracticing: 5,
        languages: ["English"],
      }),
    ).toThrow(LawyerValidationError);
  });

  test("validation rejects empty licensed jurisdictions", () => {
    expect(() =>
      validateOnboardLawyer({
        userId: "22222222-2222-4222-8222-222222222222",
        barNumber: "B/1234",
        practiceAreas: ["family"],
        licensedJurisdictionIds: [],
        yearsPracticing: 5,
        languages: ["English"],
      }),
    ).toThrow(LawyerValidationError);
  });

  test("validation rejects negative years practicing", () => {
    expect(() =>
      validateOnboardLawyer({
        userId: "22222222-2222-4222-8222-222222222222",
        barNumber: "B/1234",
        practiceAreas: ["family"],
        licensedJurisdictionIds: ["11111111-1111-4111-8111-111111111111"],
        yearsPracticing: -1,
        languages: ["English"],
      }),
    ).toThrow(LawyerValidationError);
  });

  test("scoreLawyer rewards practice area, jurisdiction, pro-bono, experience", () => {
    const intake = { practiceArea: "family", jurisdictionId: "J1" };
    const base = scoreLawyer(
      { barNumber: "B1", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" },
      intake,
    );
    const better = scoreLawyer(
      { barNumber: "B2", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 10, proBono: true, verificationStatus: "verified" },
      intake,
    );
    expect(base).toBe(100 + 50 + 30); // 180
    expect(better).toBe(100 + 50 + 30 + 20 + 10); // 210
    expect(better).toBeGreaterThan(base);
  });

  test("rankLawyers orders by score and ties on barNumber, caps at 5", () => {
    const intake = { practiceArea: "family", jurisdictionId: "J1" };
    const pool = [
      { barNumber: "B3", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
      { barNumber: "B1", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
      { barNumber: "B2", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
      { barNumber: "B4", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
      { barNumber: "B5", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
      { barNumber: "B6", practiceAreas: ["family"], licensedJurisdictionIds: ["J1"], yearsPracticing: 0, proBono: false, verificationStatus: "verified" as const },
    ];
    const ranked = rankLawyers(pool, intake, 10);
    expect(ranked).toHaveLength(5);
    expect(ranked.map((l) => l.barNumber)).toEqual(["B1", "B2", "B3", "B4", "B5"]);
  });
});




