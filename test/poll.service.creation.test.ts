import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createPollService, PollNotFoundError, PollCreatorNotFoundError } from "../services/poll.service.ts";
import { derivePollStatus } from "../services/poll.service.ts";
import { validateCreatePoll, PollValidationError } from "../lib/validation/poll.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";
import { eq } from "drizzle-orm";

const JURISDICTION_ID = "11111111-1111-4111-8111-111111111111";
const CREATOR_ID = "22222222-2222-4222-8222-222222222222";

function wellFormedPoll(overrides: Partial<{
  title: string;
  question: string;
  options: string[];
  jurisdictionId: string;
  opensAt: Date;
  closesAt: Date;
  createdBy: string;
}> = {}) {
  return {
    title: "Should we build a new road?",
    question: "Do you support the new road?",
    options: ["Yes", "No"],
    jurisdictionId: JURISDICTION_ID,
    opensAt: new Date("2025-02-01T00:00:00.000Z"),
    closesAt: new Date("2025-02-08T00:00:00.000Z"),
    createdBy: CREATOR_ID,
    ...overrides,
  };
}

describe("poll ticket 02 — creation & status", () => {
  let harness: TestHarness;
  let service: ReturnType<typeof createPollService>;

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
      name: "Nigeria",
      level: "national",
    });
    await harness.db.insert(users).values({
      id: CREATOR_ID,
      passwordHash: "x",
      verificationStatus: "id_verified",
      jurisdictionId: JURISDICTION_ID,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    service = createPollService({ db: harness.db, clock: harness.clock });
  });

  test("createPoll inserts a scheduled poll after validation", async () => {
    const poll = await service.createPoll(wellFormedPoll());
    expect(poll.status).toBe("scheduled");
    expect(poll.options).toEqual(["Yes", "No"]);

    const [stored] = await harness.db
      .select()
      .from(jurisdictions)
      .where(eq(jurisdictions.id, JURISDICTION_ID));
    expect(stored).toBeDefined();
  });

  test("createPoll rejects fewer than 2 options", async () => {
    expect(() =>
      validateCreatePoll(wellFormedPoll({ options: ["only one"] })),
    ).toThrow(PollValidationError);
  });

  test("createPoll rejects more than 5 options", async () => {
    expect(() =>
      validateCreatePoll(
        wellFormedPoll({ options: ["a", "b", "c", "d", "e", "f"] }),
      ),
    ).toThrow(PollValidationError);
  });

  test("createPoll rejects a window where closes is not after opens", async () => {
    expect(() =>
      validateCreatePoll(
        wellFormedPoll({
          opensAt: new Date("2025-02-08T00:00:00.000Z"),
          closesAt: new Date("2025-02-01T00:00:00.000Z"),
        }),
      ),
    ).toThrow(PollValidationError);
  });

  test("createPoll rejects a non-existent creator", async () => {
    await expect(
      service.createPoll(wellFormedPoll({ createdBy: "99999999-9999-4999-8999-999999999999" })),
    ).rejects.toThrow(PollCreatorNotFoundError);
  });

  test("statusOf returns scheduled before the window", async () => {
    const poll = await service.createPoll(wellFormedPoll());
    harness.clock.set(new Date("2025-01-15T00:00:00.000Z"));
    expect(await service.statusOf({ pollId: poll.id })).toBe("scheduled");
  });

  test("statusOf returns open during the window", async () => {
    const poll = await service.createPoll(wellFormedPoll());
    harness.clock.set(new Date("2025-02-04T00:00:00.000Z"));
    expect(await service.statusOf({ pollId: poll.id })).toBe("open");
  });

  test("statusOf returns closed after the window", async () => {
    const poll = await service.createPoll(wellFormedPoll());
    harness.clock.set(new Date("2025-03-01T00:00:00.000Z"));
    expect(await service.statusOf({ pollId: poll.id })).toBe("closed");
  });

  test("statusOf throws for an unknown poll", async () => {
    await expect(
      service.statusOf({ pollId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toThrow(PollNotFoundError);
  });

  test("derivePollStatus is pure across boundaries", () => {
    const opens = new Date("2025-02-01T00:00:00.000Z");
    const closes = new Date("2025-02-08T00:00:00.000Z");
    expect(derivePollStatus(new Date("2025-01-01T00:00:00.000Z"), opens, closes)).toBe("scheduled");
    expect(derivePollStatus(new Date("2025-02-04T00:00:00.000Z"), opens, closes)).toBe("open");
    expect(derivePollStatus(new Date("2025-03-01T00:00:00.000Z"), opens, closes)).toBe("closed");
  });
});
