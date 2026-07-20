import { eq, and, count, sql } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  validateRegisterOfficial,
  validateCastConfidenceVote,
  ConfidenceValidationError,
} from "../lib/validation/confidence.ts";
import { quarterOf, isTermActive } from "../lib/confidence.ts";
import { wilsonInterval } from "../lib/confidence-stats.ts";
import { descendantLeafIds } from "../lib/jurisdiction.ts";
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
import { jurisdictions } from "../db/schema/jurisdictions.ts";
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

/** A regional (per-LGA) result row, shown only when statistically significant. */
export interface RegionalResult {
  jurisdictionId: string;
  jurisdictionName: string;
  options: ConfidenceResultOption[];
  totalVotes: number;
  yesPercentage: number;
  yesConfidenceInterval: { low: number; high: number };
}

/** A single quarter's index in the trend view. */
export interface TrendPoint {
  quarter: string;
  options: ConfidenceResultOption[];
  totalVotes: number;
}

export interface ConfidenceResults {
  officialId: string;
  name: string;
  title: string;
  quarter: string;
  options: ConfidenceResultOption[];
  totalVotes: number;
  yesPercentage: number;
  yesConfidenceInterval: { low: number; high: number };
  disclaimer: string;
}

/** Minimum votes for an LGA to appear in the regional breakdown. */
export const MIN_SAMPLE = 30;

export const CONFIDENCE_DISCLAIMER =
  "This is citizen sentiment only. It has no legal or electoral weight.";

export interface ConfidenceService {
  registerOfficial(input: RegisterOfficialInput): Promise<OfficialRow>;
  castVote(args: { officialId: string; voter: ResolvedVoter; option: ConfidenceOption }): Promise<void>;
  getResults(args: { officialId: string; quarter?: string }): Promise<ConfidenceResults>;
  getRegionalBreakdown(args: { officialId: string; quarter?: string }): Promise<RegionalResult[]>;
  getTrend(args: { officialId: string }): Promise<TrendPoint[]>;
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

  function buildOptions(tallies: { option: string; count: number }[]): ConfidenceResultOption[] {
    const total = tallies.reduce((sum, t) => sum + Number(t.count), 0);
    return (["yes", "no", "uncertain"] as ConfidenceOption[]).map((option) => {
      const tally = tallies.find((t) => t.option === option);
      const countVal = tally ? Number(tally.count) : 0;
      const percentage = total === 0 ? 0 : (countVal / total) * 100;
      return { option, count: countVal, percentage };
    });
  }

  function yesStats(tallies: { option: string; count: number }[]): { total: number; yesPercentage: number; yesConfidenceInterval: { low: number; high: number }; } {
    const total = tallies.reduce((sum, t) => sum + Number(t.count), 0);
    const yesTally = tallies.find((t) => t.option === "yes");
    const yesCount = yesTally ? Number(yesTally.count) : 0;
    const yesPercentage = total === 0 ? 0 : (yesCount / total) * 100;
    const yesConfidenceInterval = wilsonInterval(yesCount, total);
    return { total, yesPercentage, yesConfidenceInterval };
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

      const options = buildOptions(tallies);
      const { total, yesPercentage, yesConfidenceInterval } = yesStats(tallies);

      return {
        officialId: official.id,
        name: official.name,
        title: official.title,
        quarter: targetQuarter,
        options,
        totalVotes: total,
        yesPercentage,
        yesConfidenceInterval,
        disclaimer: CONFIDENCE_DISCLAIMER,
      };
    },

    async getRegionalBreakdown({ officialId, quarter }) {
      const official = await requireOfficial(officialId);
      const targetQuarter = quarter ?? quarterOf(clock.now());
      const leafIds = await descendantLeafIds(db, official.jurisdictionId);
      if (leafIds.length === 0) return [];

      const rows = await db
        .select({
          jurisdictionId: users.jurisdictionId,
          option: confidenceVotes.option,
          count: count(),
        })
        .from(confidenceVotes)
        .leftJoin(users, eq(confidenceVotes.voterId, users.id))
        .where(
          and(
            eq(confidenceVotes.officialId, official.id),
            eq(confidenceVotes.quarter, targetQuarter),
          ),
        )
        .groupBy(users.jurisdictionId, confidenceVotes.option);

      // Bucket by LGA (votes carry no jurisdiction; derive from voter).
      const byLga = new Map<string, { option: string; count: number }[]>();
      for (const r of rows) {
        if (!r.jurisdictionId) continue;
        const list = byLga.get(r.jurisdictionId) ?? [];
        list.push({ option: r.option, count: Number(r.count) });
        byLga.set(r.jurisdictionId, list);
      }

      const names = new Map(
        (await db.select({ id: jurisdictions.id, name: jurisdictions.name }).from(jurisdictions)).map(
          (r) => [r.id, r.name],
        ),
      );

      const result: RegionalResult[] = [];
      for (const lgaId of leafIds) {
        const tallies = byLga.get(lgaId);
        if (!tallies) continue;
        const total = tallies.reduce((s, t) => s + t.count, 0);
        if (total < MIN_SAMPLE) continue;
        const options = buildOptions(tallies);
        const { yesPercentage, yesConfidenceInterval } = yesStats(tallies);
        result.push({
          jurisdictionId: lgaId,
          jurisdictionName: names.get(lgaId) ?? lgaId,
          options,
          totalVotes: total,
          yesPercentage,
          yesConfidenceInterval,
        });
      }
      return result;
    },

    async getTrend({ officialId }) {
      const official = await requireOfficial(officialId);
      const rows = await db
        .select({
          quarter: confidenceVotes.quarter,
          option: confidenceVotes.option,
          count: count(),
        })
        .from(confidenceVotes)
        .where(eq(confidenceVotes.officialId, official.id))
        .groupBy(confidenceVotes.quarter, confidenceVotes.option);

      const byQuarter = new Map<string, { option: string; count: number }[]>();
      for (const r of rows) {
        const list = byQuarter.get(r.quarter) ?? [];
        list.push({ option: r.option, count: Number(r.count) });
        byQuarter.set(r.quarter, list);
      }

      return [...byQuarter.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([quarter, tallies]) => ({
          quarter,
          options: buildOptions(tallies),
          totalVotes: tallies.reduce((s, t) => s + t.count, 0),
        }));
    },
  };
}


