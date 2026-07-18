# Spec: Authentication & Identity Verification

Status: ready-for-agent

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Sections 6.3.3, 6.6.1, 6.6.3). Establishes the account lifecycle from registration through a verified, authenticated session. This is a foundational slice: policy polls, confidence votes, evidence ownership, and lawyer onboarding all depend on an ID-verified user.

## Problem Statement

The platform's integrity guarantees — one-person-one-vote, evidence ownership, restricted legal data — all rest on knowing that a user is a real, unique, ID-verified Nigerian citizen. Right now there is no way to register an account, prove control of a contact channel, verify a government ID, or hold an authenticated session. Without this, no gated feature can be built safely.

## Solution

A single `auth.service.ts` handles the account lifecycle:

1. **Register** with email/phone + password. The account starts `unverified`; the password is never stored in plaintext.
2. **Verify contact channel** — a one-time code is issued and confirmed, moving the account to `email_verified`.
3. **Verify identity** — the user submits a government ID; the ID number is hashed (never stored as plaintext, per 6.6.3) and checked against an identity-verification provider (Jumio/Onfido) behind an injected seam. On success the account becomes `id_verified`.
4. **Log in** — on correct credentials the service issues a session (a signed token plus a session-store row).
5. **Validate a session** — a token resolves to the current user, or is rejected if expired/unknown.

Government ID uniqueness is enforced at the database level so one person cannot hold two verified accounts.

## User Stories

1. As a prospective user, I want to register with my email or phone and a password, so that I can create an account.
2. As a user, I want my password stored only as a secure hash, so that a breach does not expose my credentials.
3. As the platform, I want a newly registered account to start `unverified`, so that no gated action is possible before verification.
4. As a user, I want to receive a one-time verification code for my contact channel, so that I can prove I control it.
5. As a user, I want to confirm the code to become `email_verified`, so that I can proceed to identity verification.
6. As a user, I want an incorrect or expired code to be rejected, so that the channel check is meaningful.
7. As a user, I want to submit my government ID for verification, so that I can become a verified citizen.
8. As the platform, I want the government ID number stored only as a hash, so that sensitive identity data is never held in plaintext (6.6.3).
9. As the platform, I want identity verification delegated to a provider (Jumio/Onfido) behind a swappable seam, so that the provider can be faked in tests and changed later.
10. As a user, I want a successful ID check to move my account to `id_verified`, so that I unlock gated features.
11. As a user, I want a failed ID check to leave my account unverified with a clear reason, so that I can retry.
12. As the platform, I want one government ID to map to at most one verified account, so that one-person-one-vote holds.
13. As a verified user, I want to log in with my credentials, so that I can access the platform.
14. As a user, I want a wrong password to be rejected without revealing whether the account exists, so that accounts are not enumerable.
15. As a logged-in user, I want a session token I can present on later requests, so that I stay authenticated.
16. As the platform, I want sessions recorded in a session store with an expiry, so that they can be validated and expired.
17. As the platform, I want an expired or unknown session token rejected, so that stale access is denied.
18. As a user, I want to log out so that my session is invalidated, so that a shared device is safe.
19. As the platform, I want all verification state transitions timestamped via an injected clock, so that expiry and audit are deterministic and testable.
20. As a developer, I want all auth logic in one service, so that web and mobile entry points share identical behavior.

## Implementation Decisions

**Modules built (new):**

- `services/auth.service.ts` — single source of truth. Public surface (framework-agnostic):
  - `register({ email?, phone?, password }) -> UserRecord` — creates a `users` row, `verificationStatus: "unverified"`, password hashed. Requires at least one contact channel.
  - `issueContactVerification({ userId }) -> void` — generates a one-time code with an expiry (via clock), stores its hash, and hands the code to a notifier seam (faked in tests).
  - `confirmContactVerification({ userId, code }) -> UserRecord` — validates the code + expiry, advances status to `email_verified`. Wrong/expired code rejected.
  - `submitIdentityVerification({ userId, governmentId }) -> VerificationOutcome` — hashes the government ID, calls the injected ID-verification provider, and on success advances to `id_verified`. Enforces one-verified-account-per-ID.
  - `login({ identifier, password }) -> Session` — verifies credentials, issues a signed token + session row. Non-enumerable failure.
  - `validateSession({ token }) -> UserRecord` — resolves a live, unexpired session to its user; rejects otherwise.
  - `logout({ token }) -> void` — invalidates the session.

- `db/schema/` new tables:
  - `users`: `id`, `email` (nullable, unique), `phone` (nullable, unique), `password_hash`, `verification_status` (`unverified` | `email_verified` | `id_verified`), `government_id_hash` (nullable, unique), `created_at`, `updated_at`.
  - `contact_verifications`: `id`, `user_id` (FK), `code_hash`, `expires_at`, `consumed_at` (nullable), `created_at`.
  - `sessions`: `id`, `user_id` (FK), `token_hash`, `expires_at`, `created_at`, `revoked_at` (nullable).

- `lib/validation/` — shared Zod schemas for registration, code confirmation, and ID submission.

- `lib/verification/id-verification-provider.ts` — interface `verify({ governmentId, ... }) -> { verified: boolean; reason?: string }`. Production targets Jumio/Onfido; tests inject a fake with programmable outcomes.

- `lib/notify/notifier.ts` — interface `sendCode({ channel, code }) -> void` for the one-time code. Faked in tests to capture the code.

**Collaborators (injected):** the existing `Clock`; the new ID-verification provider; the notifier. Crypto (password hashing, token signing) uses well-known libraries wrapped in a small `lib/crypto` module so the service depends on an interface, not a vendor.

**Behavioral decisions:**

- Passwords hashed with a memory-hard algorithm (argon2/bcrypt family); never stored or logged in plaintext.
- Government ID: only its hash is persisted; the raw value is used transiently for the provider call, then discarded. `government_id_hash` carries a unique constraint.
- Login failures are indistinguishable between "no such account" and "wrong password" (no user enumeration).
- Session tokens are stored as hashes in the session store; the raw token is returned to the caller once at login.
- All expiries (code, session) derived from the injected clock so tests are deterministic.
- Status is a forward-only lifecycle: `unverified -> email_verified -> id_verified`. No backward transitions in this slice.
- The service captures identity but does not enforce transport auth (thin entry points do that, per 6.1.3).

**Security note (per doc 6.3.3):** custom auth for a platform holding government-ID hashes, votes, and legal data demands a higher bar. A `SECURITY-AUDIT-REQUIRED` ADR will record that a security review is mandatory before launch and that managed auth remains an option.

## Testing Decisions

**What makes a good test:** assert observable behavior of `auth.service.ts` — returned records/sessions, status transitions, and rejections. Never assert on hashes' internal form, SQL, or token internals.

**Seam:** the single `auth.service.ts` service seam. Tests call service functions directly with:
- injected **fixed clock** (assertable code/session expiry),
- a **fake ID-verification provider** (programmable verified/failed outcomes),
- a **fake notifier** (captures the emitted one-time code),
- real test DB (pglite) so unique constraints on email/phone/government_id_hash are genuinely exercised.

**Representative cases:** register creates an `unverified` user with a non-plaintext password; duplicate email/phone rejected; issue+confirm code advances to `email_verified`; wrong/expired code rejected; ID submission with a passing provider advances to `id_verified` and stores only a hash; failed provider leaves status unchanged with a reason; a second account with the same government ID is rejected; login returns a session for good creds; wrong password and unknown identifier both fail identically; validateSession resolves a live token and rejects an expired/unknown/revoked one; logout invalidates the session.

**Prior art:** the evidence slice (`test/evidence.service.*.test.ts`) established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- 2FA / TOTP / SMS second factor (6.3.3) — a follow-up slice.
- Lawyer bar-license verification (5.3) — its own slice.
- Password reset / account recovery flows.
- Real Jumio/Onfido integration — only the injected seam and a fake here.
- Rate limiting, CAPTCHA, IP monitoring (6.6.4) — a hardening slice.
- JWT refresh-token rotation and device management.
- Web/mobile entry points and cookie handling.
- Authorization/roles (RBAC) beyond resolving the authenticated user.

## Further Notes

- Chosen as the next slice because every gated feature (polls, confidence votes, evidence ownership, lawyer onboarding) depends on an ID-verified, authenticated user.
- Reuses the evidence slice's architecture: single service seam, injected collaborators, real test DB, forward-only immutable-ish status transitions.
- Domain vocabulary introduced: **user account**, **verification status** (`unverified`/`email_verified`/`id_verified`), **contact verification (one-time code)**, **identity verification**, **session**. Seed these into `CONTEXT.md` via `/domain-modeling`.
- Follow-up items carried from the evidence code-review still apply project-wide: DB-level append-only guards for audit-style tables, and pruning unused status enum members.
- Tickets land under `.scratch/auth-identity/issues/NN-<slug>.md`.
