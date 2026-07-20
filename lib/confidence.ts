/**
 * Quarter and term helpers for confidence votes.
 *
 * The "quarter" is a calendar quarter (Jan–Mar = Q1, Apr–Jun = Q2, Jul–Sep =
 * Q3, Oct–Dec = Q4) rendered as `"YYYY-Qn"`. One vote per official per quarter
 * is the slice's uniqueness rule; the stored `quarter` column plus the unique
 * constraint enforce it.
 *
 * An official's term is "active" when the clock is on or after `termStartsAt`
 * and (if set) on or before `termEndsAt`. Votes are only accepted while active.
 *
 * See .scratch/confidence-votes/spec.md (architecture §3.2.5, §3.2.7).
 */

/** Render a date as its calendar quarter key, e.g. "2025-Q1". */
export function quarterOf(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-based
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

/**
 * Whether an official's term is active at `now`.
 * Active when `now >= termStartsAt` and (`termEndsAt` is null or `now <= termEndsAt`).
 */
export function isTermActive(
  termStartsAt: Date,
  termEndsAt: Date | null,
  now: Date,
): boolean {
  const t = now.getTime();
  if (t < termStartsAt.getTime()) return false;
  if (termEndsAt != null && t > termEndsAt.getTime()) return false;
  return true;
}
