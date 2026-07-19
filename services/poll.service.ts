import { eq, and, count } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import { validateCreatePoll, PollValidationError } from "../lib/validation/poll.ts";
import {
  policyPolls,
  policyVotes,
  type PolicyPollRow,
  type PollStatus,
} from "../db/schema/policy-polls.ts";
import { users } from "../db/schema/users.ts";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";
import { isResidentOf } from "../lib/jurisdiction.ts";

export interface CreatePollInput {
  title: string;
  question: string;
  options: string[];
  jurisdictionId: string;
  opensAt: Date;
  closesAt: Date;
  createdBy: string;
}

export interface PollServiceDeps {
  db: DbClient;
  clock: Clock;
}

export class PollNotFoundError extends Error {
  constructor(pollId: string) {
    super(`No poll found with id: ${pollId}`);
    this.name = "PollNotFoundError";
  }
}

export class PollCreatorNotFoundError extends Error {
  constructor(createdBy: string) {
    super(`No user found with id: ${createdBy}`);
    this.name = "PollCreatorNotFoundError";
  }
}

export class PollNotOpenError extends Error {
  constructor(status: PollStatus) {
    super(`Poll is not open (status: ${status})`);
    this.name = "PollNotOpenError";
  }
}

export class VoterUnverifiedError extends Error {
  constructor() {
    super("Voter is not id_verified");
    this.name = "VoterUnverifiedError";
  }
}

export class VoterOutsideJurisdictionError extends Error {
  constructor() {
    super("Voter is outside the poll's jurisdiction scope");
    this.name = "VoterOutsideJurisdictionError";
  }
}

export class AlreadyVotedError extends Error {
  constructor() {
    super("Voter has already cast a vote on this poll");
    this.name = "AlreadyVotedError";
  }
}

/** Mandatory non-binding disclaimer carried by every results response. */
export const POLL_DISCLAIMER =
  "This is citizen sentiment only. It has no legal or electoral weight.";

export interface PollResultOption {
  optionIndex: number;
  label: string;
  count: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  title: string;
  question: string;
  options: PollResultOption[];
  totalVotes: number;
  disclaimer: string;
}

export interface PollService {
  createPoll(input: CreatePollInput): Promise<PolicyPollRow>;
  statusOf(args: { pollId: string }): Promise<PollStatus>;
  castVote(args: { pollId: string; voter: ResolvedVoter; optionIndex: number }): Promise<void>;
  getResults(args: { pollId: string }): Promise<PollResults>;
}

/** Derive the lifecycle status from the clock and the poll's time window. */
export function derivePollStatus(
  now: Date,
  opensAt: Date,
  closesAt: Date,
): PollStatus {
  const t = now.getTime();
  if (t < opensAt.getTime()) return "scheduled";
  if (t > closesAt.getTime()) return "closed";
  return "open";
}

export function createPollService(deps: PollServiceDeps): PollService {
  const { db, clock } = deps;

  async function requirePoll(pollId: string): Promise<PolicyPollRow> {
    const [row] = await db
      .select()
      .from(policyPolls)
      .where(eq(policyPolls.id, pollId))
      .limit(1);
    if (!row) {
      throw new PollNotFoundError(pollId);
    }
    return row;
  }

  return {
    async createPoll(input) {
      const validated = validateCreatePoll(input);

      const [creator] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validated.createdBy))
        .limit(1);
      if (!creator) {
        throw new PollCreatorNotFoundError(validated.createdBy);
      }

      const [row] = await db
        .insert(policyPolls)
        .values({
          title: validated.title,
          question: validated.question,
          options: validated.options,
          jurisdictionId: validated.jurisdictionId,
          status: "scheduled",
          opensAt: validated.opensAt,
          closesAt: validated.closesAt,
          createdBy: validated.createdBy,
          createdAt: clock.now(),
        })
        .returning();

      if (!row) {
        throw new Error("Failed to insert poll row");
      }
      return row;
    },

    async statusOf({ pollId }) {
      const poll = await requirePoll(pollId);
      return derivePollStatus(clock.now(), poll.opensAt, poll.closesAt);
    },

    async castVote({ pollId, voter, optionIndex }) {
      const poll = await requirePoll(pollId);

      const status = derivePollStatus(clock.now(), poll.opensAt, poll.closesAt);
      if (status !== "open") {
        throw new PollNotOpenError(status);
      }

      if (voter.verificationStatus !== "id_verified") {
        throw new VoterUnverifiedError();
      }

      if (!voter.jurisdictionId) {
        throw new VoterOutsideJurisdictionError();
      }
      const resident = await isResidentOf(db, voter.jurisdictionId, poll.jurisdictionId);
      if (!resident) {
        throw new VoterOutsideJurisdictionError();
      }

      const [existing] = await db
        .select({ id: policyVotes.id })
        .from(policyVotes)
        .where(
          and(
            eq(policyVotes.pollId, poll.id),
            eq(policyVotes.voterId, voter.id),
          ),
        )
        .limit(1);
      if (existing) {
        throw new AlreadyVotedError();
      }

      await db.insert(policyVotes).values({
        pollId: poll.id,
        voterId: voter.id,
        optionIndex,
        createdAt: clock.now(),
      });
    },

    async getResults({ pollId }) {
      const poll = await requirePoll(pollId);

      const tallies = await db
        .select({
          optionIndex: policyVotes.optionIndex,
          count: count(),
        })
        .from(policyVotes)
        .where(eq(policyVotes.pollId, poll.id))
        .groupBy(policyVotes.optionIndex);

      const total = tallies.reduce((sum, t) => sum + Number(t.count), 0);

      const options: PollResultOption[] = poll.options.map(
        (label, optionIndex) => {
          const tally = tallies.find((t) => t.optionIndex === optionIndex);
          const countVal = tally ? Number(tally.count) : 0;
          const percentage = total === 0 ? 0 : (countVal / total) * 100;
          return { optionIndex, label, count: countVal, percentage };
        },
      );

      return {
        pollId: poll.id,
        title: poll.title,
        question: poll.question,
        options,
        totalVotes: total,
        disclaimer: POLL_DISCLAIMER,
      };
    },
  };
}
