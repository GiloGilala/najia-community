# 03 — Government ID verification

**What to build:** A user can submit their government ID to become a verified citizen. The ID number is hashed and only the hash is persisted (never plaintext), the check is delegated to an injected identity-verification provider (Jumio/Onfido in production, faked in tests), and a successful check advances the account to `id_verified`. A failed check leaves the account unchanged with a clear reason. One government ID can map to at most one verified account. Demoable: submit an ID with a passing fake provider → `id_verified` and only a hash stored; a failing provider → status unchanged with a reason; a second account submitting the same ID is refused.

**Blocked by:** 01 — User registration & password hashing

**Status:** ready-for-agent

- [ ] `lib/verification/id-verification-provider.ts` defines a provider interface (`verify(...) -> { verified, reason? }`) with a fake for tests
- [ ] `submitIdentityVerification({ userId, governmentId })` hashes the ID and persists only the hash
- [ ] A passing provider result advances the account to `id_verified`
- [ ] A failing provider result leaves `verification_status` unchanged and returns a clear reason
- [ ] `government_id_hash` has a unique constraint; a second account with the same ID is rejected
- [ ] The raw government ID is never persisted or logged
