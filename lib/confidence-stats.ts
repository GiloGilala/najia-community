/**
 * Statistics helpers for confidence-vote analytics.
 *
 * - `wilsonInterval` — the Wilson score confidence interval for a binomial
 *   proportion (used to show uncertainty around the "yes" percentage).
 * - `isLeafLga` — predicate for leaf (local) jurisdictions.
 *
 * All pure and deterministic so they can be unit-tested without a database.
 *
 * See .scratch/confidence-analytics/spec.md (architecture §3.2.6).
 */

export interface ConfidenceInterval {
  low: number;
  high: number;
}

/**
 * Wilson score interval for a proportion.
 * @param successes number of "yes" votes
 * @param n total votes
 * @param z z-score for the desired confidence level (1.96 ≈ 95%)
 * Returns { low, high } clamped to [0, 1]. For n = 0, returns {0, 1}.
 */
export function wilsonInterval(
  successes: number,
  n: number,
  z = 1.96,
): ConfidenceInterval {
  if (n <= 0) {
    return { low: 0, high: 1 };
  }
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return {
    low: Math.max(0, centre - margin),
    high: Math.min(1, centre + margin),
  };
}

/** A leaf jurisdiction is a local government area (no children in the roll-up). */
export function isLeafLga(level: string): boolean {
  return level === "local";
}
