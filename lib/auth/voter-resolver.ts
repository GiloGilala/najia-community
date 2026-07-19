/**
 * Voter resolution collaborator for polls.
 *
 * The poll service owns no auth. To cast a vote it needs the authenticated
 * User (with their Account Verification Status and residency). This seam
 * resolves a session token to that User; the real implementation delegates to
 * the auth service's `validateSession`, and tests inject a fake.
 *
 * See .scratch/policy-polls/spec.md.
 */
import type { AccountVerificationStatus } from "../../db/schema/users.ts";

export interface ResolvedVoter {
  id: string;
  verificationStatus: AccountVerificationStatus;
  jurisdictionId: string | null;
}

export interface VoterResolver {
  /** Resolve a session token to the authenticated voter, or reject. */
  resolve(token: string): Promise<ResolvedVoter>;
}

/** Test fake: returns a configurable voter, or throws on a given token. */
export class FakeVoterResolver implements VoterResolver {
  /** Voter returned for any token except those in `rejectTokens`. */
  public voter: ResolvedVoter;
  /** Tokens that should cause resolve() to reject (e.g. expired). */
  public rejectTokens = new Set<string>();

  constructor(voter: ResolvedVoter) {
    this.voter = voter;
  }

  async resolve(token: string): Promise<ResolvedVoter> {
    if (this.rejectTokens.has(token)) {
      throw new Error("Invalid or expired session");
    }
    return this.voter;
  }
}
