# 03 — Verify evidence & detect tampering

**What to build:** Anyone relying on a piece of evidence can re-verify its integrity on demand. `verifyEvidence` loads the stored bytes, re-computes the SHA-256 fingerprint, compares it to the original stored hash, and returns `verified` when they match or `altered` when they differ. It writes a `verified` audit event recording the outcome and never mutates the original hash. Demoable: verify a fresh upload → `verified`; overwrite the stored bytes in the fake storage, verify again → `altered`.

**Blocked by:** 02 — Upload & fingerprint evidence

**Status:** ready-for-agent

- [ ] `verifyEvidence({ evidenceId })` re-hashes the stored bytes and compares to the original hash
- [ ] Returns status `verified` when the re-hash matches the original
- [ ] Returns status `altered` when the stored bytes have changed
- [ ] Writes a `verified` audit event capturing the outcome (`verified` / `altered`)
- [ ] The original stored hash is never modified by verification
- [ ] Verification is idempotent: calling it twice yields identical results and does not corrupt state
