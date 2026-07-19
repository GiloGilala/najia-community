import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createPollService, POLL_DISCLAIMER } from "../services/poll.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";

const NATIONAL = "11111111-1111-4111-8111-111111111111";
const CREATOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VOTER_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VOTER_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VOTER_C = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const POLL_WINDOW = {
  opensAt: new Date("2025-02-01T00:00:00.000Z"),
  closesAt: new Date("2025-02-08T00:00:00.000Z"),
};

describe("poll ticket 04 — results", () => {
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
      id: NATIONAL,
      name: "Nigeria",
      level: "national",
      parentId: null,
    });
    await harness.db.insert(users).values([
      { id: CREATOR_ID, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_A, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_B, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_C, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
    ]);
    service = createPollService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-02-04T00:00:00.000Z"));
  });

  async function createPoll() {
    return service.createPoll({
      title: "Road?",
      question: "Build the road?",
      options: ["Yes", "No", "Undecided"],
      jurisdictionId: NATIONAL,
      createdBy: CREATOR_ID,
      ...POLL_WINDOW,
    });
  }

  test("getResults returns per-option counts and percentages", async () => {
    const poll = await createPoll();
    await service.castVote({ pollId: poll.id, voter: { id: VOTER_A, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, optionIndex: 0 });
    await service.castVote({ pollId: poll.id, voter: { id: VOTER_B, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, optionIndex: 0 });
    await service.castVote({ pollId: poll.id, voter: { id: VOTER_C, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, optionIndex: 1 });

    const results = await service.getResults({ pollId: poll.id });
    expect(results.totalVotes).toBe(3);
    expect(results.options).toHaveLength(3);
    const yes = results.options.find((o) => o.label === "Yes")!;
    const no = results.options.find((o) => o.label === "No")!;
    const undecided = results.options.find((o) => o.label === "Undecided")!;
    expect(yes.count).toBe(2);
    expect(yes.percentage).toBeCloseTo(66.6667, 3);
    expect(no.count).toBe(1);
    expect(no.percentage).toBeCloseTo(33.3333, 3);
    expect(undecided.count).toBe(0);
    expect(undecided.percentage).toBe(0);
  });

  test("getResults includes the non-binding disclaimer", async () => {
    const poll = await createPoll();
    const results = await service.getResults({ pollId: poll.id });
    expect(results.disclaimer).toBe(POLL_DISCLAIMER);
  });

  test("results are aggregate-only — no voter identity is exposed", async () => {
    const poll = await createPoll();
    await service.castVote({ pollId: poll.id, voter: { id: VOTER_A, verificationStatus: "id_verified", jurisdictionId: NATIONAL }, optionIndex: 2 });
    const results = await service.getResults({ pollId: poll.id });
    const serialized = JSON.stringify(results);
    expect(serialized).not.toContain(VOTER_A);
    expect(serialized).not.toContain("voterId");
    expect(results.options.every((o) => !("voterId" in o))).toBe(true);
  });

  test("a poll with no votes reports zero totals", async () => {
    const poll = await createPoll();
    const results = await service.getResults({ pollId: poll.id });
    expect(results.totalVotes).toBe(0);
    expect(results.options.every((o) => o.count === 0 && o.percentage === 0)).toBe(true);
  });
});
