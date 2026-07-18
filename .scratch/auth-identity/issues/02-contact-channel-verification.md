# 02 — Contact channel verification (one-time code)

**What to build:** A registered user can prove they control their contact channel. The service issues a one-time code (stored only as a hash, with an expiry derived from the injected clock) and hands it to a notifier collaborator. Confirming the correct code before it expires advances the account to `email_verified`; a wrong or expired code is rejected. Demoable: issue a code (captured via the fake notifier), confirm it → `email_verified`; a wrong code and an expired code are both refused.

**Blocked by:** 01 — User registration & password hashing

**Status:** resolved

- [x] `contact_verifications` table exists: id, user_id, code_hash, expires_at, consumed_at (nullable), created_at
- [x] `issueContactVerification({ userId })` creates a code, stores only its hash, sets an expiry via the injected clock, and emits the code through the notifier seam
- [x] The notifier is an injected collaborator, faked in tests to capture the emitted code
- [x] `confirmContactVerification({ userId, code })` with the correct, unexpired code advances the account to `email_verified`
- [x] A wrong code is rejected and does not advance status
- [x] An expired code is rejected and does not advance status
- [x] A consumed code cannot be reused

## Comments

- `db/schema/contact-verifications.ts` + migration `0002`. Append-style rows; `consumedAt` marks use.
- `lib/notify/notifier.ts`: `Notifier` interface + `CapturingNotifier` (test fake).
- `lib/crypto/code.ts`: 6-digit numeric code generation + sha-256 hashing (`hashCode`).
- `services/auth.service.ts`: added `notifier` dep, `ContactVerificationError`, `CONTACT_CODE_TTL_MS` (15 min), `issueContactVerification`, `confirmContactVerification`. Confirm picks the most-recent valid (unconsumed, unexpired) code.
- Verified: `bun run typecheck` clean; `bun test` → 47 pass, 0 fail.
