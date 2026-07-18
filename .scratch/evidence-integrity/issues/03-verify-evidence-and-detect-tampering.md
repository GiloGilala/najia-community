# 03 — Verify evidence & detect tampering

**What to build:** Anyone relying on a piece of evidence can re-verify its integrity on demand. `verifyEvidence` loads the stored bytes, re-computes the SHA-256 fingerprint, compares it to the original stored hash, and returns `verified` when they match or `altered` when they differ. It writes a `verified` audit event recording the outcome and never mutates the original hash. Demoable: verify a fresh upload → `verified`; overwrite the stored bytes in the fake storage, verify again → `altered`.

**Blocked by:** 02 — Upload & fingerprint evidence

**Status:** resolved

- [x] `verifyEvidence({ evidenceId })` re-hashes the stored bytes and compares to the original hash
- [x] Returns status `verified` when the re-hash matches the original
- [x] Returns status `altered` when the stored bytes have changed
- [x] Writes a `verified` audit event capturing the outcome (`verified` / `altered`)
- [x] The original stored hash is never modified by verification
- [x] Verification is idempotent: calling it twice yields identical results and does not corrupt state

## Comments

- Added `verifyEvidence` to `services/evidence.service.ts`. Loads the row, and for supported types re-hashes the stored bytes and compares to the original `sha256Hash`. Unsupported types short-circuit to `not_applicable` without re-hashing.
- Returns `{ status, originalHash }`; a `verified` audit event records the outcome each call. The original hash is read-only during verification, so idempotency holds by construction.
- Added `EvidenceNotFoundError` for a missing id.
- Verified: `bun run typecheck` clean; `bun test` → 24 pass, 0 fail.
