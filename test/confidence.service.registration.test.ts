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
  OfficialNotFoundError,
} from "../services/confidence.service.ts";
import { ConfidenceValidationError } from "../lib/validation/confidence.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { officials } from "../db/schema/officials.ts";
import { eq } from "drizzle-orm";

const JURISDICTION_ID = "11111111-1111-4111-8111-111111111111";

function wellFormedOfficial(overrides: Partial<{
  name: string;
  title: string;
  jurisdictionId: string;
  termStartsAt: Date;
  termEndsAt: Date | null;
}> = {}) {
  return {
    name: "Ada Okafor",
    title: "Governor",
    jurisdictionId: JURISDICTION_ID,
    termStartsAt: new Date("2025-01-01T00:00:00.000Z"),
    termEndsAt: new Date("2028-12-31T00:00:00.000Z"),
    ...overrides,
  };
}

describe("confidence ticket 02 — official registration", () => {
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
      id: JURISDICTION_ID,
      name: "Lagos",
      level: "state",
      parentId: null,
    });
    service = createConfidenceService({ db: harness.db, clock: harness.clock });
  });

  test("registerOfficial inserts an official after validation", async () => {
    const official = await service.registerOfficial(wellFormedOfficial());
    expect(official.name).toBe("Ada Okafor");
    expect(official.title).toBe("Governor");
    expect(official.termEndsAt).not.toBeNull();

    const [stored] = await harness.db
      .select()
      .from(officials)
      .where(eq(officials.id, official.id));
    expect(stored).toBeDefined();
  });

  test("registerOfficial accepts a null term end", async () => {
    const official = await service.registerOfficial(wellFormedOfficial({ termEndsAt: null }));
    expect(official.termEndsAt).toBeNull();
  });

  test("registerOfficial rejects an empty name", async () => {
    await expect(
      service.registerOfficial(wellFormedOfficial({ name: "" })),
    ).rejects.toThrow(ConfidenceValidationError);
  });

  test("registerOfficial rejects an empty title", async () => {
    await expect(
      service.registerOfficial(wellFormedOfficial({ title: "" })),
    ).rejects.toThrow(ConfidenceValidationError);
  });

  test("registerOfficial rejects a term where ends is not after starts", async () => {
    await expect(
      service.registerOfficial(
        wellFormedOfficial({
          termStartsAt: new Date("2028-12-31T00:00:00.000Z"),
          termEndsAt: new Date("2025-01-01T00:00:00.000Z"),
        }),
      ),
    ).rejects.toThrow(ConfidenceValidationError);
  });
});
