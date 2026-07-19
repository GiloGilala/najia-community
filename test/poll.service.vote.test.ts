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
  createPollService,
} from "../services/poll.service.ts";
import { PollNotOpenError, VoterUnverifiedError, VoterOutsideJurisdictionError, AlreadyVotedError } from "../services/poll.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";
import { policyVotes } from "../db/schema/policy-polls.ts";
import { eq } from "drizzle-orm";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";

const NATIONAL = "11111111-1111-4111-8111-111111111111";
const STATE = "22222222-2222-4222-8222-222222222222";
const LOCAL = "33333333-3333-4333-8333-333333333333";
const OTHER_STATE = "44444444-4444-4444-8444-444444444444";

const CREATOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VOTER_NATIONAL = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VOTER_STATE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VOTER_LOCAL = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const VOTER_OTHER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const VOTER_UNVERIFIED = "ffffffff-ffff-4fff-8fff-ffffffffffff";

const OPEN_START = new Date("2025-02-01T00:00:00.000Z");
const OPEN_END = new Date("2025-02-08T00:00:00.000Z");

const POLL_WINDOW = { opensAt: OPEN_START, closesAt: OPEN_END };

function voter(id: string, jurisdictionId: string, status: "id_verified" | "email_verified" | "unverified" = "id_verified"): ResolvedVoter {
  return { id, verificationStatus: status, jurisdictionId };
}

describe("poll ticket 03 — casting a vote (eligibility)", () => {
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
    await harness.db.insert(jurisdictions).values([
      { id: NATIONAL, name: "Nigeria", level: "national", parentId: null },
      { id: STATE, name: "Lagos", level: "state", parentId: NATIONAL },
      { id: LOCAL, name: "Ikeja", level: "local", parentId: STATE },
      { id: OTHER_STATE, name: "Kano", level: "state", parentId: NATIONAL },
    ]);
    await harness.db.insert(users).values([
      { id: CREATOR_ID, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_NATIONAL, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_STATE, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_LOCAL, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: LOCAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_OTHER, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: OTHER_STATE, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_UNVERIFIED, passwordHash: "x", verificationStatus: "email_verified", jurisdictionId: LOCAL, createdAt: new Date(), updatedAt: new Date() },
    ]);
    service = createPollService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-02-04T00:00:00.000Z")); // open
  });

  async function createPoll(jurisdictionId: string) {
    return service.createPoll({
      title: "T",
      question: "Q",
      options: ["Yes", "No"],
      jurisdictionId,
      createdBy: CREATOR_ID,
      ...POLL_WINDOW,
    });
  }

  test("an id_verified resident casts one vote while open", async () => {
    const poll = await createPoll(NATIONAL);
    await service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 });
    const [row] = await harness.db.select().from(policyVotes).where(eq(policyVotes.pollId, poll.id));
    expect(row).toBeDefined();
    expect(row.voterId).toBe(VOTER_LOCAL);
    expect(row.optionIndex).toBe(0);
  });

  test("a national poll accepts a local-LGA resident", async () => {
    const poll = await createPoll(NATIONAL);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 1 }),
    ).resolves.toBeUndefined();
  });

  test("a state poll accepts an LGA within it", async () => {
    const poll = await createPoll(STATE);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 }),
    ).resolves.toBeUndefined();
  });

  test("a state poll rejects a voter from another state", async () => {
    const poll = await createPoll(STATE);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_OTHER, OTHER_STATE), optionIndex: 0 }),
    ).rejects.toThrow(VoterOutsideJurisdictionError);
  });

  test("a local poll accepts only that LGA", async () => {
    const poll = await createPoll(LOCAL);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 }),
    ).resolves.toBeUndefined();
  });

  test("a local poll rejects a state-level resident", async () => {
    const poll = await createPoll(LOCAL);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_STATE, STATE), optionIndex: 0 }),
    ).rejects.toThrow(VoterOutsideJurisdictionError);
  });

  test("rejects a vote when the poll is scheduled", async () => {
    const poll = await createPoll(NATIONAL);
    harness.clock.set(new Date("2025-01-15T00:00:00.000Z"));
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 }),
    ).rejects.toThrow(PollNotOpenError);
  });

  test("rejects a vote when the poll is closed", async () => {
    const poll = await createPoll(NATIONAL);
    harness.clock.set(new Date("2025-03-01T00:00:00.000Z"));
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 }),
    ).rejects.toThrow(PollNotOpenError);
  });

  test("rejects a vote from an unverified user", async () => {
    const poll = await createPoll(NATIONAL);
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_UNVERIFIED, LOCAL, "email_verified"), optionIndex: 0 }),
    ).rejects.toThrow(VoterUnverifiedError);
  });

  test("rejects a second vote by the same user", async () => {
    const poll = await createPoll(NATIONAL);
    await service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 0 });
    await expect(
      service.castVote({ pollId: poll.id, voter: voter(VOTER_LOCAL, LOCAL), optionIndex: 1 }),
    ).rejects.toThrow(AlreadyVotedError);
  });
});
