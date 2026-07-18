/**
 * Government-ID hashing for identity verification.
 *
 * The platform must never store a government ID in plaintext (doc 6.6.3). The
 * hash is deterministic (no salt) so that the same ID always produces the same
 * `government_id_hash`, which the unique constraint uses to enforce one
 * verified account per person (one-person-one-vote).
 */
import { createHash } from "node:crypto";

export function hashGovernmentId(governmentId: string): string {
  const normalized = governmentId.trim().toUpperCase();
  return createHash("sha256").update(`govid:${normalized}`).digest("hex");
}
