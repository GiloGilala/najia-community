import { eq } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import { validateOnboardLawyer, LawyerValidationError } from "../lib/validation/lawyer.ts";
import { lawyers, type LawyerRow, type LawyerVerificationStatus } from "../db/schema/lawyers.ts";
import { users } from "../db/schema/users.ts";
import { rankLawyers, type MatchIntake } from "../lib/lawyer-match.ts";

export interface OnboardLawyerInput {
  userId: string;
  barNumber: string;
  practiceAreas: string[];
  licensedJurisdictionIds: string[];
  yearsPracticing: number;
  languages: string[];
  proBono?: boolean;
}

export interface MatchLawyersInput {
  practiceArea: string;
  jurisdictionId: string;
  limit?: number;
}

/** Profile fields returned to callers — never the underlying User credentials. */
export type LawyerProfile = Omit<LawyerRow, "userId"> & { userId: string };

export interface LawyerServiceDeps {
  db: DbClient;
  clock: Clock;
}

export class LawyerNotFoundError extends Error {
  constructor(lawyerId: string) {
    super(`No lawyer found with user id: ${lawyerId}`);
    this.name = "LawyerNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`No user found with id: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

export class DuplicateBarNumberError extends Error {
  constructor(barNumber: string) {
    super(`A lawyer with bar number ${barNumber} already exists`);
    this.name = "DuplicateBarNumberError";
  }
}

export interface LawyerService {
  onboardLawyer(input: OnboardLawyerInput): Promise<LawyerRow>;
  verifyLawyer(args: { lawyerId: string }): Promise<LawyerRow>;
  matchLawyers(input: MatchLawyersInput): Promise<LawyerRow[]>;
}

export function createLawyerService(deps: LawyerServiceDeps): LawyerService {
  const { db, clock } = deps;

  async function requireLawyer(userId: string): Promise<LawyerRow> {
    const [row] = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.userId, userId))
      .limit(1);
    if (!row) {
      throw new LawyerNotFoundError(userId);
    }
    return row;
  }

  return {
    async onboardLawyer(input) {
      const validated = validateOnboardLawyer(input);

      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validated.userId))
        .limit(1);
      if (!user) {
        throw new UserNotFoundError(validated.userId);
      }

      const [existingBar] = await db
        .select({ userId: lawyers.userId })
        .from(lawyers)
        .where(eq(lawyers.barNumber, validated.barNumber))
        .limit(1);
      if (existingBar) {
        throw new DuplicateBarNumberError(validated.barNumber);
      }

      const [row] = await db
        .insert(lawyers)
        .values({
          userId: validated.userId,
          barNumber: validated.barNumber,
          practiceAreas: validated.practiceAreas,
          licensedJurisdictionIds: validated.licensedJurisdictionIds,
          yearsPracticing: validated.yearsPracticing,
          languages: validated.languages,
          proBono: validated.proBono ?? false,
          verificationStatus: "pending",
          createdAt: clock.now(),
        })
        .returning();
      if (!row) {
        throw new Error("Failed to insert lawyer row");
      }
      return row;
    },

    async verifyLawyer({ lawyerId }) {
      const lawyer = await requireLawyer(lawyerId);
      const [row] = await db
        .update(lawyers)
        .set({ verificationStatus: "verified" as LawyerVerificationStatus })
        .where(eq(lawyers.userId, lawyer.userId))
        .returning();
      if (!row) {
        throw new Error("Failed to update lawyer row");
      }
      return row;
    },

    async matchLawyers({ practiceArea, jurisdictionId, limit }) {
      // Eligibility gates (verified + licensed in jurisdiction + lists practice
      // area) are enforced here; scoring/ranking is delegated to the pure
      // helper so it stays transparent and testable.
      const candidates = await db
        .select()
        .from(lawyers)
        .where(eq(lawyers.verificationStatus, "verified"));

      const intake: MatchIntake = { practiceArea, jurisdictionId };
      const eligible = candidates.filter(
        (l) =>
          l.practiceAreas.includes(practiceArea) &&
          l.licensedJurisdictionIds.includes(jurisdictionId),
      );

      const ranked = rankLawyers(eligible, intake, limit ?? 5);
      return ranked;
    },
  };
}




