# 02 — Contact channel verification (one-time code)

**What to build:** A registered user can prove they control their contact channel. The service issues a one-time code (stored only as a hash, with an expiry derived from the injected clock) and hands it to a notifier collaborator. Confirming the correct code before it expires advances the account to `email_verified`; a wrong or expired code is rejected. Demoable: issue a code (captured via the fake notifier), confirm it → `email_verified`; a wrong code and an expired code are both refused.

**Blocked by:** 01 — User registration & password hashing

**Status:** ready-for-agent

- [ ] `contact_verifications` table exists: id, user_id, code_hash, expires_at, consumed_at (nullable), created_at
- [ ] `issueContactVerification({ userId })` creates a code, stores only its hash, sets an expiry via the injected clock, and emits the code through the notifier seam
- [ ] The notifier is an injected collaborator, faked in tests to capture the emitted code
- [ ] `confirmContactVerification({ userId, code })` with the correct, unexpired code advances the account to `email_verified`
- [ ] A wrong code is rejected and does not advance status
- [ ] An expired code is rejected and does not advance status
- [ ] A consumed code cannot be reused
