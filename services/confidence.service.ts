import { eq, and, count } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  validateRegisterOfficial,
  validateCastConfidenceVote,
  ConfidenceValidationError,
} from "../lib/validation/confidence.ts";
import { quarterOf, isTermActive } from "../lib/confidence.ts";
import {
  officials,
  type OfficialRow,
  type ConfidenceOption,
} from "../db/schema/officials.ts";
import {
  confidenceVotes,
  type ConfidenceVoteRow,
} from "../db/schema/confidence-votes.ts";
import { users } from "../db/schema/users.ts";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";
import { isResidentOf } from "../lib/jurisdiction.ts";

export interface RegisterOfficialInput {
  name: string;
  title: string;
  jurisdictionId: string;
  termStartsAt: Date;
  termEndsAt?: Date | null;
}

export interface ConfidenceServiceDeps {
  db: DbClient;
  clock: Clock;
}

export class OfficialNotFoundError extends Error {
  constructor(officialId: string) {
    super(`No official found with id: ${officialId}`);
    this.name = "OfficialNotFoundError";
  }
}

export class ConfidenceVoteNotActiveError extends Error {
  constructor() {
    super("Official is not in an active term");
    this.name = "ConfidenceVoteNotActiveError";
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
    super("Voter is outside the official's jurisdiction scope");
    this.name = "VoterOutsideJurisdictionError";
  }
}

export class InvalidConfidenceOptionError extends Error {
  constructor() {
    super("Invalid confidence option");
    this.name = "InvalidConfidenceOptionError";
  }
}

export class AlreadyVotedError extends Error {
  constructor() {
    super("Voter has already cast a confidence vote for this official this quarter");
    this.name = "AlreadyVotedError";
  }
}

export interface ConfidenceResultOption {
  option: ConfidenceOption;
  count: number;
  percentage: number;
}

export interface ConfidenceResults {
  officialId: string;
  name: string;
  title: string;
  quarter: string;
  options: ConfidenceResultOption[];
  totalVotes: number;
  disclaimer: string;
}

export const CONFIDENCE_DISCLAIMER =
  "This is citizen sentiment only. It has no legal or electoral weight.";

export interface ConfidenceService {
  registerOfficial(input: RegisterOfficialInput): Promise<OfficialRow>;
  castVote(args: { officialId: string; voter: ResolvedVoter; option: ConfidenceOption }): Promise<void>;
  getResults(args: { officialId: string; quarter?: string }): Promise<ConfidenceResults>;
}

export function createConfidenceService(deps: ConfidenceServiceDeps): ConfidenceService {
  const { db, clock } = deps;

  async function requireOfficial(officialId: string): Promise<OfficialRow> {
    const [row] = await db
      .select()
      .from(officials)
      .where(eq(officials.id, officialId))
      .limit(1);
    if (!row) {
      throw new OfficialNotFoundError(officialId);
    }
    return row;
  }

  return {
    async registerOfficial(input) {
      const validated = validateRegisterOfficial(input);
      const [row] = await db
        .insert(officials)
        .values({
          name: validated.name,
          title: validated.title,
          jurisdictionId: validated.jurisdictionId,
          termStartsAt: validated.termStartsAt,
          termEndsAt: validated.termEndsAt ?? null,
          createdAt: clock.now(),
        })
        .returning();
      if (!row) {
        throw new Error("Failed to insert official row");
      }
      return row;
    },

    async castVote({ officialId, voter, option }) {
      const validated = validateCastConfidenceVote({ officialId, option });
      const official = await requireOfficial(validated.officialId);

      if (
        !isTermActive(official.termStartsAt, official.termEndsAt, clock.now())
      ) {
        throw new ConfidenceVoteNotActiveError();
      }

      if (voter.verificationStatus !== "id_verified") {
        throw new VoterUnverifiedError();
      }

      if (!voter.jurisdictionId) {
        throw new VoterOutsideJurisdictionError();
      }
      const resident = await isResidentOf(db, voter.jurisdictionId, official.jurisdictionId);
      if (!resident) {
        throw new VoterOutsideJurisdictionError();
      }

      const quarter = quarterOf(clock.now());
      const [existing] = await db
        .select({ id: confidenceVotes.id })
        .from(confidenceVotes)
        .where(
          and(
            eq(confidenceVotes.officialId, official.id),
            eq(confidenceVotes.voterId, voter.id),
            eq(confidenceVotes.quarter, quarter),
          ),
        )
        .limit(1);
      if (existing) {
        throw new AlreadyVotedError();
      }

      await db.insert(confidenceVotes).values({
        officialId: official.id,
        voterId: voter.id,
        option: validated.option,
        quarter,
        createdAt: clock.now(),
      });
    },

    async getResults({ officialId, quarter }) {
      const official = await requireOfficial(officialId);
      const targetQuarter = quarter ?? quarterOf(clock.now());

      const tallies = await db
        .select({
          option: confidenceVotes.option,
          count: count(),
        })
        .from(confidenceVotes)
        .where(
          and(
            eq(confidenceVotes.officialId, official.id),
            eq(confidenceVotes.quarter, targetQuarter),
          ),
        )
        .groupBy(confidenceVotes.option);

      const total = tallies.reduce((sum, t) => sum + Number(t.count), 0);

      const options: ConfidenceResultOption[] = (["yes", "no", "uncertain"] as ConfidenceOption[]).map(
        (option) => {
          const tally = tallies.find((t) => t.option === option);
          const countVal = tally ? Number(tally.count) : 0;
          const percentage = total === 0 ? 0 : (countVal / total) * 100;
          return { option, count: countVal, percentage };
        },
      );

      return {
        officialId: official.id,
        name: official.name,
        title: official.title,
        quarter: targetQuarter,
        options,
        totalVotes: total,
        disclaimer: CONFIDENCE_DISCLAIMER,
      };
    },
  };
}
