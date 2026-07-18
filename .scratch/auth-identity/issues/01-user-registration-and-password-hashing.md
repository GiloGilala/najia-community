# 01 — User registration & password hashing

**What to build:** A prospective user can register an account with an email or phone plus a password. The account is created in the `unverified` state, the password is stored only as a secure hash (never plaintext), and at least one contact channel is required. Attempting to register with an email or phone already in use is rejected. Demoable: call `register()` with valid details, get back an `unverified` user whose stored password is a hash; a duplicate email/phone is refused.

**Blocked by:** None — can start immediately (reuses the existing project skeleton, harness, and injected clock from the evidence slice)

**Status:** resolved

- [x] `users` table exists: id, email (nullable, unique), phone (nullable, unique), password_hash, verification_status, government_id_hash (nullable, unique), created_at, updated_at
- [x] `register({ email?, phone?, password })` creates a row with `verification_status = "unverified"`
- [x] At least one of email/phone is required; registration with neither is rejected
- [x] The password is stored only as a hash via a `lib/crypto` module — never plaintext
- [x] A duplicate email or phone is rejected with a clear validation error and no row is created
- [x] Shared registration validation lives in `lib/validation/`

## Comments

- `db/schema/users.ts`: users table + `AccountVerificationStatus` (renamed to avoid colliding with the evidence schema's `VerificationStatus`). Unique indexes on email/phone/government_id_hash; NULLs distinct per Postgres default, so multiple phone-only or unverified users are allowed.
- `lib/crypto/password-hasher.ts`: argon2id via Bun.password, behind a `PasswordHasher` interface.
- `lib/validation/registration.ts`: shared Zod schema (email optional, phone optional, password min 8, requires ≥1 channel) + `RegistrationValidationError`.
- `services/auth.service.ts`: `createAuthService` with `register()`; pre-checks existing contact channel then inserts (DB unique constraint is the ultimate race guard).
- SECURITY-AUDIT-REQUIRED recorded in `docs/adr/0002-custom-auth-security.md`.
- Verified: `bun run typecheck` clean; `bun test` → 42 pass, 0 fail.
