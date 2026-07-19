import type { DbClient } from "../db/client.ts";
import { jurisdictions, type JurisdictionRow } from "../db/schema/jurisdictions.ts";
import { eq, or } from "drizzle-orm";

/**
 * Residency resolution for poll eligibility.
 *
 * A User may vote in a poll when their jurisdiction equals the poll's
 * jurisdiction or is a descendant of it in the jurisdiction hierarchy. A
 * national poll therefore admits any resident; a state poll admits the state
 * and its local LGAs; a local poll admits only that LGA.
 *
 * See .scratch/policy-polls/spec.md.
 */

/** Load the full path of ancestor ids from a jurisdiction up to the root. */
async function ancestorIds(
  db: DbClient,
  jurisdictionId: string,
): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = jurisdictionId;

  // The hierarchy depth is small and bounded (national → state → local), so a
  // looped walk is safe and avoids recursive SQL portability concerns.
  while (currentId) {
    const [row] = await db
      .select({ id: jurisdictions.id, parentId: jurisdictions.parentId })
      .from(jurisdictions)
      .where(eq(jurisdictions.id, currentId))
      .limit(1);
    if (!row) break;
    chain.push(row.id);
    currentId = row.parentId;
  }
  return chain;
}

/**
 * Whether `voterJurisdictionId` is within the scope of `pollJurisdictionId`
 * (equal or a descendant). Loads the voter's ancestor chain and checks
 * containment. Returns false if either jurisdiction is missing.
 */
export async function isResidentOf(
  db: DbClient,
  voterJurisdictionId: string,
  pollJurisdictionId: string,
): Promise<boolean> {
  const chain = await ancestorIds(db, voterJurisdictionId);
  return chain.includes(pollJurisdictionId);
}

export type { JurisdictionRow };
