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
  createLawyerService,
  LawyerNotFoundError,
  UserNotFoundError,
  DuplicateBarNumberError,
} from "../services/lawyer.service.ts";
import { LawyerValidationError } from "../lib/validation/lawyer.ts";
import { users } from "../db/schema/users.ts";
import { lawyers } from "../db/schema/lawyers.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { eq } from "drizzle-orm";

const USER_ID = "22222222-2222-4222-8222-222222222222";
const JURISDICTION_ID = "11111111-1111-4111-8111-111111111111";

function wellFormedLawyer(overrides: Partial<{
  userId: string;
  barNumber: string;
  practiceAreas: string[];
  licensedJurisdictionIds: string[];
  yearsPracticing: number;
  languages: string[];
}> = {}) {
  return {
    userId: USER_ID,
    barNumber: "B/1234",
    practiceAreas: ["family"],
    licensedJurisdictionIds: [JURISDICTION_ID],
    yearsPracticing: 5,
    languages: ["English"],
    ...overrides,
  };
}

describe("lawyer ticket 02 — onboarding & verification", () => {
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
    await harness.db.insert(jurisdictions).values({
      id: JURISDICTION_ID,
      name: "Lagos",
      level: "state",
      parentId: null,
    });
    await harness.db.insert(users).values({
      id: USER_ID,
      passwordHash: "x",
      verificationStatus: "id_verified",
      jurisdictionId: JURISDICTION_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    service = createLawyerService({ db: harness.db, clock: harness.clock });
  });

  test("onboardLawyer inserts a pending profile", async () => {
    const lawyer = await service.onboardLawyer(wellFormedLawyer());
    expect(lawyer.barNumber).toBe("B/1234");
    expect(lawyer.verificationStatus).toBe("pending");
    expect(lawyer.proBono).toBe(false);

    const [stored] = await harness.db
      .select()
      .from(lawyers)
      .where(eq(lawyers.userId, USER_ID));
    expect(stored).toBeDefined();
  });

  test("onboardLawyer defaults proBono to false", async () => {
    const lawyer = await service.onboardLawyer(wellFormedLawyer({ proBono: undefined as unknown as boolean }));
    expect(lawyer.proBono).toBe(false);
  });

  test("onboardLawyer rejects a missing user", async () => {
    await expect(
      service.onboardLawyer(wellFormedLawyer({ userId: "99999999-9999-4999-8999-999999999999" })),
    ).rejects.toThrow(UserNotFoundError);
  });

  test("onboardLawyer rejects a duplicate bar number", async () => {
    await service.onboardLawyer(wellFormedLawyer());
    // second user, same bar number
    await harness.db.insert(users).values({
      id: "33333333-3333-4333-8333-333333333333",
      passwordHash: "x",
      verificationStatus: "id_verified",
      jurisdictionId: JURISDICTION_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      service.onboardLawyer(wellFormedLawyer({ userId: "33333333-3333-4333-8333-333333333333" })),
    ).rejects.toThrow(DuplicateBarNumberError);
  });

  test("onboardLawyer rejects invalid input via validation", async () => {
    await expect(
      service.onboardLawyer(wellFormedLawyer({ barNumber: "" })),
    ).rejects.toThrow(LawyerValidationError);
  });

  test("verifyLawyer flips pending to verified", async () => {
    const lawyer = await service.onboardLawyer(wellFormedLawyer());
    const verified = await service.verifyLawyer({ lawyerId: lawyer.userId });
    expect(verified.verificationStatus).toBe("verified");
  });

  test("verifyLawyer rejects an unknown lawyer", async () => {
    await expect(
      service.verifyLawyer({ lawyerId: "99999999-9999-4999-8999-999999999999" }),
    ).rejects.toThrow(LawyerNotFoundError);
  });
});





