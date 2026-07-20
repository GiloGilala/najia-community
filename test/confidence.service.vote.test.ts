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
  ConfidenceVoteNotActiveError,
  VoterUnverifiedError,
  VoterOutsideJurisdictionError,
  AlreadyVotedError,
} from "../services/confidence.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";
import { confidenceVotes } from "../db/schema/confidence-votes.ts";
import { eq } from "drizzle-orm";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";

const NATIONAL = "11111111-1111-4111-8111-111111111111";
const STATE = "22222222-2222-4222-8222-222222222222";
const LOCAL = "33333333-3333-4333-8333-333333333333";
const OTHER_STATE = "44444444-4444-4444-8444-444444444444";

const VOTER_NATIONAL = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VOTER_STATE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VOTER_LOCAL = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const VOTER_OTHER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const VOTER_UNVERIFIED = "ffffffff-ffff-4fff-8fff-ffffffffffff";

const TERM_START = new Date("2025-01-01T00:00:00.000Z");
const TERM_END = new Date("2025-12-31T00:00:00.000Z");

function voter(id: string, jurisdictionId: string, status: "id_verified" | "email_verified" = "id_verified"): ResolvedVoter {
  return { id, verificationStatus: status, jurisdictionId };
}

describe("confidence ticket 03 — casting a vote (eligibility)", () => {
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
    await harness.db.insert(jurisdictions).values([
      { id: NATIONAL, name: "Nigeria", level: "national", parentId: null },
      { id: STATE, name: "Lagos", level: "state", parentId: NATIONAL },
      { id: LOCAL, name: "Ikeja", level: "local", parentId: STATE },
      { id: OTHER_STATE, name: "Kano", level: "state", parentId: NATIONAL },
    ]);
    await harness.db.insert(users).values([
      { id: VOTER_NATIONAL, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: NATIONAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_STATE, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_LOCAL, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: LOCAL, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_OTHER, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: OTHER_STATE, createdAt: new Date(), updatedAt: new Date() },
      { id: VOTER_UNVERIFIED, passwordHash: "x", verificationStatus: "email_verified", jurisdictionId: LOCAL, createdAt: new Date(), updatedAt: new Date() },
    ]);
    service = createConfidenceService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-06-01T00:00:00.000Z")); // active term, Q2
  });

  async function registerOfficial(jurisdictionId: string) {
    return service.registerOfficial({
      name: "Ada",
      title: "Governor",
      jurisdictionId,
      termStartsAt: TERM_START,
      termEndsAt: TERM_END,
    });
  }

  test("an id_verified resident casts one vote while the term is active", async () => {
    const official = await registerOfficial(NATIONAL);
    await service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" });
    const [row] = await harness.db.select().from(confidenceVotes).where(eq(confidenceVotes.officialId, official.id));
    expect(row).toBeDefined();
    expect(row.voterId).toBe(VOTER_LOCAL);
    expect(row.option).toBe("yes");
  });

  test("a national official accepts a local-LGA resident", async () => {
    const official = await registerOfficial(NATIONAL);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "no" }),
    ).resolves.toBeUndefined();
  });

  test("a state official accepts an LGA within it", async () => {
    const official = await registerOfficial(STATE);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "uncertain" }),
    ).resolves.toBeUndefined();
  });

  test("a state official rejects a voter from another state", async () => {
    const official = await registerOfficial(STATE);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_OTHER, OTHER_STATE), option: "yes" }),
    ).rejects.toThrow(VoterOutsideJurisdictionError);
  });

  test("a local official accepts only that LGA", async () => {
    const official = await registerOfficial(LOCAL);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" }),
    ).resolves.toBeUndefined();
  });

  test("a local official rejects a state-level resident", async () => {
    const official = await registerOfficial(LOCAL);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_STATE, STATE), option: "yes" }),
    ).rejects.toThrow(VoterOutsideJurisdictionError);
  });

  test("rejects a vote when the term is not active (before start)", async () => {
    const official = await registerOfficial(NATIONAL);
    harness.clock.set(new Date("2024-06-01T00:00:00.000Z"));
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" }),
    ).rejects.toThrow(ConfidenceVoteNotActiveError);
  });

  test("rejects a vote when the term has ended", async () => {
    const official = await registerOfficial(NATIONAL);
    harness.clock.set(new Date("2026-06-01T00:00:00.000Z"));
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" }),
    ).rejects.toThrow(ConfidenceVoteNotActiveError);
  });

  test("rejects a vote from an unverified user", async () => {
    const official = await registerOfficial(NATIONAL);
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_UNVERIFIED, LOCAL, "email_verified"), option: "yes" }),
    ).rejects.toThrow(VoterUnverifiedError);
  });

  test("rejects an invalid option value", async () => {
    const official = await registerOfficial(NATIONAL);
    // @ts-expect-error exercising the runtime guard
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "maybe" }),
    ).rejects.toThrow();
  });

  test("rejects a second vote in the same quarter", async () => {
    const official = await registerOfficial(NATIONAL);
    await service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" });
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "no" }),
    ).rejects.toThrow(AlreadyVotedError);
  });

  test("allows a vote again in a later quarter", async () => {
    const official = await registerOfficial(NATIONAL);
    await service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "yes" });
    harness.clock.set(new Date("2025-10-01T00:00:00.000Z")); // Q4
    await expect(
      service.castVote({ officialId: official.id, voter: voter(VOTER_LOCAL, LOCAL), option: "no" }),
    ).resolves.toBeUndefined();
  });
});
