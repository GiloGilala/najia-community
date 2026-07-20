/**
 * Lawyer matching scoring and ranking.
 *
 * Matching is transparent and deterministic (architecture §5.4.3). A lawyer is
 * eligible only if verified, licensed in the intake jurisdiction, and listing the
 * requested practice area — those gates are enforced in the service; this module
 * purely scores and ranks already-eligible profiles.
 *
 * Score components:
 *  - base 100 for being a candidate
 *  - +50 practice-area match (the intake area is in the lawyer's practice areas)
 *  - +30 jurisdiction match (intake jurisdiction in licensed set)
 *  - +20 pro-bono boost
 *  - +1 per year practicing (capped at +30)
 *
 * Ties are broken deterministically by `barNumber` ascending so ordering is
 * stable and explainable.
 *
 * See .scratch/lawyer-marketplace/spec.md.
 */

export const DEFAULT_MATCH_LIMIT = 5;
export const MAX_MATCH_LIMIT = 5;

export interface MatchIntake {
  practiceArea: string;
  jurisdictionId: string;
}

export interface MatchableLawyer {
  barNumber: string;
  practiceAreas: string[];
  licensedJurisdictionIds: string[];
  yearsPracticing: number;
  proBono: boolean;
  verificationStatus: "pending" | "verified";
}

/** Published, transparent score for an eligible lawyer against an intake. */
export function scoreLawyer(
  lawyer: MatchableLawyer,
  intake: MatchIntake,
): number {
  let score = 100;
  if (lawyer.practiceAreas.includes(intake.practiceArea)) score += 50;
  if (lawyer.licensedJurisdictionIds.includes(intake.jurisdictionId)) score += 30;
  if (lawyer.proBono) score += 20;
  score += Math.min(lawyer.yearsPracticing, 30) * 1;
  return score;
}

/**
 * Rank already-eligible lawyers by score (desc), tie-breaking by barNumber
 * ascending. Returns at most `limit` (default 5, capped at 5).
 */
export function rankLawyers(
  lawyers: MatchableLawyer[],
  intake: MatchIntake,
  limit: number = DEFAULT_MATCH_LIMIT,
): MatchableLawyer[] {
  const capped = Math.min(Math.max(limit, 0), MAX_MATCH_LIMIT);
  return [...lawyers]
    .sort((a, b) => {
      const diff = scoreLawyer(b, intake) - scoreLawyer(a, intake);
      if (diff !== 0) return diff;
      return a.barNumber.localeCompare(b.barNumber);
    })
    .slice(0, capped);
}
