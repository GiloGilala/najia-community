# Module Spec — Authentication & Identity Verification

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director*
*Parent PRD: [PRD.md §4.1](../product/PRD.md#41-identity-verification-pillar-0--the-foundation)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: email/password authentication, NIMC NVS verification, Onfido document verification fallback, manual review, verification state management. Out of scope: social login, phone-only registration, biometric verification (deferred to Year 2).

---

## 1. Overview

### 1.1 Module Name

Authentication & Identity Verification

### 1.2 Purpose

Establish and maintain a verified identity for every user of the platform. The module is the foundation for all other features: only verified users can vote in polls, vote in confidence elections, upload evidence, or be matched with a lawyer. The module is also the gate for the platform's trust contract with the user — it must be honest about what is verified, what is cached, and what is shared.

### 1.3 In Scope

- Email-based registration and login
- Email verification
- NIMC NVS identity verification (primary)
- Onfido document verification (fallback)
- Manual review path for failed verifications and appeals
- Verification status management (state machine)
- Verification result caching (for performance and cost control)
- User account lifecycle (creation, suspension, deletion)
- DSAR support (data export, account deletion) — minimum viable for pilot
- RBAC role assignment on verification (default: `citizen`; for lawyers: see Lawyer Onboarding module)

### 1.4 Out of Scope

- Social login (Google, Apple, Facebook) — deferred to Year 2+
- Phone-number-only registration (without email) — deferred to Year 2+
- Biometric-only verification (fingerprint, face) — NIMC supports it but the API integration is deferred
- Two-factor authentication (2FA) — deferred to Year 2; pilot relies on password strength + session security
- Re-verification reminders — the 30-day cache makes this not needed in pilot
- SSO for institutional users (NBA, government) — out of scope; out-of-band engagement
- KYC/AML — not a regulated platform; the lawyer-side KYC is the NBA bar verification (separate module)

These are explicitly out of scope for the pilot and require a PRD amendment to be added.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Verification completion rate (started → verified or rejected) | ≥ 80% | Funnel analysis on the verification flow |
| NIMC success rate (among users who attempt NIMC) | ≥ 70% | API call outcomes |
| Fallthrough rate to Onfido | ≤ 30% of NIMC attempts | Funnel analysis |
| Time to verify (NIMC path, median) | ≤ 90 seconds | Server-side timing |
| Time to verify (Onfido path, median) | ≤ 5 minutes | Server-side timing (includes user upload time) |
| Verification appeal rate (rejected → appealed) | ≤ 20% | Audit log |
| Manual review SLA | 95% within 5 business days | Moderation queue metrics |
| DSAR fulfillment SLA | 100% within 30 days | DSAR queue metrics |
| Verification cache hit rate | ≥ 60% (returning users) | Cache metrics |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| New visitor | Register with email and password | I can create an account | Must |
| New user | Verify my email address | I can confirm I own the email | Must |
| New user | Verify my identity with NIN | I can become a verified citizen | Must |
| New user without NIN | Verify with a government ID + selfie | I can still become verified | Must |
| Failed verification user | Appeal the decision | I can have a human review my case | Must |
| Verified user | See my verification status clearly | I know what I can do | Must |
| Verified user | Log in on a new device | I can use the platform across devices | Must |
| Verified user | Log out of all sessions | I can secure my account | Should |
| User | Request a copy of my data (DSAR) | I can see what the platform holds | Must |
| User | Delete my account | I can exercise my right to be forgotten | Must |
| Returning user | Resume verification if I started but didn't finish | I don't lose my progress | Must |
| User on a slow connection | See clear progress during API calls | I know whether to wait or retry | Must |
| Admin | Manually verify a user | I can resolve edge cases | Must |
| Admin | Suspend or restore a user | I can respond to abuse | Must |
| Lawyer candidate | Have my lawyer role assigned after bar verification | I can access lawyer features | Must (handed off to Lawyer Onboarding module) |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design) and the database spec. Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `users` | `id`, `email`, `password_hash`, `full_name`, `role`, `verification_status`, `created_at`, `updated_at` | The root entity; one row per registered user |
| `verification_attempts` | `id`, `user_id`, `method` (NIMC/Onfido/Manual), `status` (pending/success/failed), `request_payload`, `response_payload`, `attempted_at`, `completed_at` | Audit trail of every verification attempt |
| `verification_results` | `id`, `user_id`, `method`, `verified_at`, `expires_at`, `provider_reference` | Cached result for fast re-verification |
| `manual_reviews` | `id`, `user_id`, `reason`, `status`, `assigned_to`, `decision`, `decided_at`, `notes` | Manual review queue (also used by other modules) |
| `sessions` | `id`, `user_id`, `token_hash`, `ip_address`, `user_agent`, `created_at`, `expires_at`, `revoked_at` | Active sessions |
| `audit_log` | `id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at` | Cross-cutting audit trail; the auth module writes to this on every state change |

The full Drizzle schemas are in `db/schema/users.schema.ts` and `db/schema/verification.schema.ts` (forthcoming in Phase 4).

#### 3.1.1 Verification Status State Machine

The `verification_status` field on the `users` table transitions through these states:
UNVERIFIED
│
▼
NIMC_VERIFICATION_PENDING ──────► NIMC_FAILED ──────► ONFIDO_PENDING
│ │ │
▼ ▼ ▼
NIMC_VERIFIED ──────► VERIFIED ◄─── ONFIDO_VERIFIED ◄────┘
│
▼
ONFIDO_FAILED
│
▼
MANUAL_REVIEW
│
┌────────┴────────┐
▼ ▼
VERIFIED REJECTED

text


Terminal states: `VERIFIED` (user can use gated features), `REJECTED` (user is blocked from gated features, can re-apply after 30 days).

The state machine is enforced in the service layer (`services/auth.service.ts` and `services/verification.service.ts`), not in the database. The DB is a store; the service is the rule-keeper.

#### 3.1.2 RBAC Role Assignment

Every user has exactly one `role` at any time. The default role is `citizen` (assigned at registration). The roles are:

| Role | When assigned | Source module |
|------|---------------|---------------|
| `citizen` | At registration | This module |
| `lawyer` | After successful bar verification | Lawyer Onboarding module (handed off from this module) |
| `writer` | Manually by an admin | Admin & Operations module |
| `moderator` | Manually by an admin | Admin & Operations module |
| `admin` | Manually by an admin | Admin & Operations module |

The full RBAC matrix is in [RBAC.md](../technical/RBAC.md) and the [architecture document §4.3](../ARCHITECTURE.md#43-permissions-matrix). This module is only responsible for the `citizen` role assignment and for handing off to the Lawyer Onboarding module when bar credentials are detected during registration.

### 3.2 API Surface

Reference [API.md](../technical/API.md) (forthcoming) and the [architecture document §3.2.3](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `POST` | `/api/auth/register` | Create an unverified account | Public | — |
| `POST` | `/api/auth/login` | Log in | Public | — |
| `POST` | `/api/auth/logout` | Log out of current session | Authenticated | — |
| `POST` | `/api/auth/verify-email` | Verify email ownership | Authenticated | — |
| `POST` | `/api/auth/verify-nin` | Submit NIN for NIMC NVS verification | Authenticated | — |
| `POST` | `/api/auth/verify-document` | Submit ID + selfie for Onfido verification | Authenticated | — |
| `GET` | `/api/auth/me` | Get current user (incl. verification status) | Authenticated | — |
| `GET` | `/api/auth/verification-status` | Get detailed verification status | Authenticated | — |
| `POST` | `/api/auth/appeal-verification` | Appeal a failed verification | Authenticated | — |
| `POST` | `/api/auth/dsar` | Request a data export | Authenticated | — |
| `POST` | `/api/auth/delete-account` | Request account deletion (30-day grace) | Authenticated | — |
| `GET` | `/api/admin/verification-queue` | View manual review queue | Authenticated | `admin:users` or `admin:verification` |
| `POST` | `/api/admin/verification-decide` | Decide a manual review | Authenticated | `admin:users` or `admin:verification` |
| `POST` | `/api/admin/users/:userId/suspend` | Suspend a user | Authenticated | `admin:users` |
| `POST` | `/api/admin/users/:userId/restore` | Restore a suspended user | Authenticated | `admin:users` |

#### 3.2.1 Server Functions (Web App)

The web app calls the same business logic via TanStack Start Server Functions (no HTTP hop):

| Server Function | Purpose |
|-----------------|---------|
| `registerAction` | Register from web form |
| `loginAction` | Log in from web form |
| `verifyNINAction` | Submit NIN from web form |
| `verifyDocumentAction` | Submit document from web form |
| `meLoader` | Load current user in route loaders |
| `verificationStatusLoader` | Load verification status in route loaders |
| `appealVerificationAction` | Submit appeal |
| `dsarAction` | Request data export |
| `deleteAccountAction` | Request deletion |

The server functions call the same service methods as the API endpoints.

### 3.3 Business Rules

Numbered list of explicit rules the service layer enforces:

1. **One account per email.** Registration fails if the email already exists.
2. **One account per NIN.** NIMC verification fails if the NIN is already linked to another verified user. (Multi-account prevention.)
3. **One account per Onfido document.** Onfido verification fails if the document is already linked to another verified user.
4. **Email must be verified before identity verification.** A user cannot start NIMC or Onfido until their email is verified.
5. **NIMC verification requires the user to be 18+.** DOB from NIMC must indicate 18th birthday has passed. (Per [PLATFORM.md §2.1](../PLATFORM.md#21-what-the-platform-is), the platform serves adult citizens.)
6. **NIMC verification has a 24-hour cool-down after failure.** A user who fails NIMC cannot retry for 24 hours. This is to prevent enumeration attacks.
7. **Onfido verification has a 24-hour cool-down after failure.** Same rationale.
8. **Maximum 5 verification attempts per user.** After 5 failures (NIMC + Onfido combined), the user is sent to manual review only.
9. **Manual review SLA is 5 business days.** A user in manual review is notified of the expected timeline.
10. **Verified users are cached for 30 days.** The cached result is used for fast re-verification on subsequent logins; the cache is invalidated on any state change.
11. **Sessions expire after 7 days of inactivity.** Sliding window; activity extends the session.
12. **Maximum 5 active sessions per user.** Oldest session is revoked when the limit is reached.
13. **DSAR is fulfilled within 30 days** of request.
14. **Account deletion has a 30-day grace period** during which the user can restore. After 30 days, the account and all PII are permanently deleted (with limited exceptions for legal hold).
15. **All state changes are audit-logged.** The audit log is append-only and queryable by admins.
16. **The platform never shares PII with third parties** except as required by law (NIMC, Onfido) or with explicit user consent (lawyer matching, where the user opts in).

### 3.4 State Machines

#### 3.4.1 Account Lifecycle
REGISTERED (email not verified)
│
│ email verified
▼
EMAIL_VERIFIED
│
│ NIMC or Onfido started
▼
IDENTITY_PENDING
│
├─► VERIFIED (success)
│
├─► REJECTED (after 5 failures or manual review denied)
│
└─► SUSPENDED (admin action)
│
├─► RESTORED (admin action)
│
└─► DELETED (user-initiated, after 30-day grace)

text


#### 3.4.2 Session Lifecycle
LOGGED_OUT ──login──► ACTIVE ──logout──► REVOKED
│
├──7 days inactivity──► EXPIRED
│
└──5 active sessions──► OLDEST_REVOKED

text


### 3.5 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| Email already registered | "An account with this email already exists. Try logging in." | `EMAIL_EXISTS` (409) |
| NIN format invalid | Inline error on the NIN field | `INVALID_NIN_FORMAT` (400) |
| NIN already linked to another user | "This NIN is already linked to another account. Please contact support if you believe this is an error." | `NIN_ALREADY_LINKED` (409) |
| NIMC API timeout | "Verification is taking longer than expected. You can wait, try again, or use a document." (with retry and path-switch options) | `NIMC_TIMEOUT` (504) |
| NIMC API 5xx | "We can't reach the verification service right now. Please try again in a few minutes." (auto-retry with backoff) | `NIMC_UNAVAILABLE` (503) |
| NIMC no match | "We couldn't match your details. Check your NIN, date of birth, and name, or use a document instead." | `NIMC_NO_MATCH` (422) |
| Onfido document rejected | "We couldn't verify your document. You can try again with a different document." | `ONFIDO_REJECTED` (422) |
| Onfido selfie mismatch | "The selfie didn't match the document. Please try again with a clearer photo." | `ONFIDO_SELFIE_MISMATCH` (422) |
| User fails 5 attempts | "You've reached the maximum verification attempts. Your case is being reviewed manually. We'll be in touch within 5 business days." | `MAX_ATTEMPTS_REACHED` (422) |
| User tries to vote/upload before verification | "You need to verify your identity first. [CTA: Verify now]" | `VERIFICATION_REQUIRED` (403) |
| User tries to verify before email verification | "Please verify your email first. [CTA: Resend email]" | `EMAIL_NOT_VERIFIED` (403) |
| Session expired | "Your session has expired. Please log in again." | `SESSION_EXPIRED` (401) |
| DSAR request for non-existent user | "We couldn't find an account with that email." | `NOT_FOUND` (404) |
| Manual review SLA missed | "We apologize for the delay. Your case is still being reviewed. We'll be in touch within [X] days." | `MANUAL_REVIEW_DELAYED` (informational) |
| Account deletion during active case | "You have [N] active cases. Please close them before deleting your account, or contact support." | `DELETION_BLOCKED` (409) |
| User under 18 (per NIMC DOB) | "You must be at least 18 to use this platform." | `AGE_REQUIREMENT_NOT_MET` (422) |

Full error response format is in [ARCHITECTURE.md §13.1](../ARCHITECTURE.md#131-response-format).

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md) for the full permission grant matrix. This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `auth:register` | (none — public endpoint) | Anyone can register |
| `auth:login` | (none — public endpoint) | Anyone can attempt login |
| `auth:verify` | authenticated (any role, must be email-verified) | Any logged-in user can attempt identity verification |
| `auth:appeal` | authenticated (any role, must be in `REJECTED` or `MANUAL_REVIEW` state) | Any user can appeal a failed verification |
| `auth:me` | authenticated (self only) | Any logged-in user can read their own profile |
| `auth:dsar` | authenticated (self only) | Any user can request their own data export |
| `auth:delete` | authenticated (self only) | Any user can request their own deletion |
| `admin:users` | `admin` | Admins can suspend, restore, and change roles |
| `admin:verification` | `admin`, `moderator` | Moderators and admins can review the manual review queue |

If this module introduces any new permission, it must be added to RBAC.md and to `defineAbilityFor` in `lib/rbac/ability.ts` (forthcoming in Phase 4).

---

## 5. User Experience

### 5.1 Key Screens

Reference [UX & Design.md §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot) for the full inventory. The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 4 | Registration | All | No | No |
| 5 | Login | All | No | No |
| 6 | Email verification | All | Yes | No |
| 7 | Identity verification choice | All | Yes | No |
| 8 | NIMC verification | All | Yes | No |
| 9 | Onfido verification | All | Yes | No |
| 10 | "You're verified" success | All | Yes | Yes |
| 41 | Profile | All | Yes | Yes |
| 42 | Settings | All | Yes | Yes |
| 43 | Verification status | All | Yes | No |

### 5.2 User Flows

Reference [User Journeys.md §3](../product/User%20Journeys.md#3-j1--first-time-user-becomes-a-verified-citizen) for the J1 journey (first-time user becomes verified). This module implements J1.

Key UX decisions specific to this module:

| Decision | Rationale |
|----------|-----------|
| NIN is the recommended path, not the only path | NIN is faster and government-recognized; Onfido is offered as an explicit alternative, not a fallback shown after failure |
| Email verification is required before identity verification | Prevents spam and reduces enumeration; the email is a primary identifier |
| The "You're verified" screen explicitly states what the user can now do | Amara and Tunde need to understand the value they unlocked |
| Verification status is always visible in the avatar menu | Trust and clarity are ongoing, not just at registration |
| Errors are honest and specific | Generic errors erode trust; specific errors are the platform's contract with the user |
| The non-binding disclaimer is not on the verification screens | The disclaimer applies to civic features, not identity |

### 5.3 Empty / Loading / Error States

- **Loading states** for every API call (NIMC and Onfido both have multi-second waits)
- **Empty states** for the manual review queue (when empty, show "Queue is healthy, no pending reviews" rather than a blank page)
- **Error states** for every failure mode listed in §3.5
- **Edge case state** for the rare "verification in flight" status (e.g., user starts NIMC, then closes the app, then comes back)

### 5.4 Accessibility

- All forms are keyboard-navigable and screen-reader friendly
- Verification status is conveyed by both color AND icon AND text (never color alone)
- The "You're verified" success screen announces itself to screen readers
- All error messages are linked to their field and announced

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | NIMC API call P95 | < 3s |
| **Performance** | Onfido API call P95 | < 10s |
| **Performance** | Login API P95 | < 200ms |
| **Performance** | Registration API P95 | < 500ms |
| **Performance** | Verification cache lookup P95 | < 50ms |
| **Security** | Password hashing | Bun.password (argon2id) |
| **Security** | Session token | JWT with rotating secret, httpOnly cookie |
| **Security** | Rate limit on login | 5 attempts per 15 minutes per IP |
| **Security** | Rate limit on registration | 3 per hour per IP |
| **Security** | Rate limit on verification endpoints | 5 per hour per user |
| **Security** | All PII encrypted at rest | Yes |
| **Security** | All connections over WireGuard + TLS 1.3 | Yes |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | DSAR fulfillment | ≤ 30 days |
| **Privacy** | Breach notification to NDPC | ≤ 72 hours |
| **Privacy** | Account deletion (full) | ≤ 30 days from request |
| **Reliability** | Verification flow uptime | ≥ 99.5% (pilot) |
| **Observability** | All API calls logged with timing | Yes |
| **Observability** | All state changes audit-logged | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| NIMC NVS API | External | Government service; we hold a client ID and secret; we have a Service Level Agreement in place |
| Onfido API | External | Commercial vendor; we hold an API key; we have a contract in place |
| Email service (e.g., Resend, Postmark) | External | Transactional email for registration, verification, and notifications |
| Postgres + Drizzle ORM | Internal | Primary database |
| SQLite cache | Internal | Verification result cache (30-day TTL) |
| WireGuard VPN | Internal | Network security |
| RBAC module | Internal | Permission checks (forthcoming in Phase 4) |
| Audit log module | Internal | Cross-cutting audit trail (forthcoming in Phase 4) |
| Rate limit module | Internal | Per-endpoint and per-user rate limits |
| Notification service | Internal | Email and in-app notifications (forthcoming) |
| Lawyer Onboarding module | Internal (downstream) | This module hands off to Lawyer Onboarding when a lawyer registers |
| Admin & Operations module | Internal (downstream) | Admins use this module's endpoints for user management |

If NIMC NVS API is unavailable at pilot launch, the module ships with Onfido as the primary path; the module spec already supports this — no spec change needed.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Registration and Login

- [ ] A new visitor can register with email and password in ≤ 60 seconds
- [ ] A registration with a duplicate email returns `EMAIL_EXISTS` and does not create a second account
- [ ] A password is hashed with argon2id; the plaintext is never stored
- [ ] The email verification email is sent within 60 seconds of registration
- [ ] Clicking the email verification link marks the email as verified and redirects to identity verification
- [ ] A user can log in with email and password and receive a session cookie
- [ ] A user with the wrong password receives a generic "Invalid credentials" error (does not leak whether the email exists)
- [ ] A user with 5 failed login attempts in 15 minutes is rate-limited
- [ ] A session expires after 7 days of inactivity
- [ ] A user can have at most 5 active sessions; the oldest is revoked on the 6th
- [ ] A user can log out of the current session
- [ ] A user can log out of all sessions

### 8.2 NIMC Verification

- [ ] A user can submit NIN, DOB, and full name for NIMC verification
- [ ] An invalid NIN format (not 11 digits) returns `INVALID_NIN_FORMAT` without an API call
- [ ] A successful NIMC match marks the user as `NIMC_VERIFIED` then `VERIFIED`
- [ ] A NIMC no-match returns `NIMC_NO_MATCH` and allows retry or path switch
- [ ] A NIMC API timeout (10s) shows a clear error and offers retry or path switch
- [ ] A NIMC API 5xx error is auto-retried 3 times with exponential backoff
- [ ] A NIN already linked to another user returns `NIN_ALREADY_LINKED`
- [ ] A NIMC failure puts the user in a 24-hour cool-down
- [ ] A successful NIMC result is cached for 30 days
- [ ] A user under 18 is rejected with `AGE_REQUIREMENT_NOT_MET`

### 8.3 Onfido Verification

- [ ] A user can submit a government ID (passport, driver's license, voter's card) and a selfie for Onfido verification
- [ ] A successful Onfido match marks the user as `ONFIDO_VERIFIED` then `VERIFIED`
- [ ] An Onfido document rejection returns `ONFIDO_REJECTED` and allows retry
- [ ] An Onfido selfie mismatch returns `ONFIDO_SELFIE_MISMATCH` and allows retry
- [ ] An Onfido failure puts the user in a 24-hour cool-down
- [ ] A successful Onfido result is cached for 30 days

### 8.4 Manual Review

- [ ] A user who fails 5 verification attempts is sent to manual review
- [ ] A user in manual review is shown an expected timeline (5 business days)
- [ ] A moderator can view the manual review queue
- [ ] A moderator can approve (→ VERIFIED) or reject (→ REJECTED) a manual review
- [ ] 95% of manual reviews are decided within 5 business days
- [ ] The user is notified of the manual review decision by email and in-app

### 8.5 RBAC and State

- [ ] A user with `verification_status = UNVERIFIED` cannot vote, upload evidence, or be matched with a lawyer
- [ ] A user with `verification_status = VERIFIED` can vote, upload evidence, and be matched
- [ ] A user with `verification_status = REJECTED` can submit an appeal
- [ ] A user with `verification_status = SUSPENDED` cannot log in
- [ ] All state transitions are audit-logged
- [ ] The state machine cannot be bypassed (e.g., direct DB write cannot mark a user as `VERIFIED` without going through the service)

### 8.6 Privacy and DSAR

- [ ] A user can request a DSAR and receive a JSON export of their data within 30 days
- [ ] A user can request account deletion; the account enters a 30-day grace period
- [ ] During the grace period, the user can restore the account
- [ ] After 30 days, all PII is permanently deleted (with limited exceptions for legal hold)
- [ ] An account with active cases cannot be deleted until the cases are closed (or support is contacted)

### 8.7 Security

- [ ] Passwords are hashed with argon2id; plaintext is never logged
- [ ] Sessions are JWTs with httpOnly cookies
- [ ] All API endpoints are over TLS 1.3
- [ ] All PII at rest is encrypted
- [ ] The login endpoint is rate-limited (5/15min/IP)
- [ ] The registration endpoint is rate-limited (3/hour/IP)
- [ ] The verification endpoints are rate-limited (5/hour/user)
- [ ] No PII appears in URLs (e.g., NIN in the path) — only in the request body
- [ ] No PII is logged at INFO level; only at DEBUG in development

### 8.8 Operational

- [ ] Health check endpoint includes NIMC and Onfido API status
- [ ] Alert when NIMC API failure rate > 5%
- [ ] Alert when Onfido API failure rate > 5%
- [ ] Alert when manual review queue grows above 50 items
- [ ] Alert when verification cache hit rate drops below 50%
- [ ] Runbook exists for NIMC outage (fallback to Onfido-only)
- [ ] Runbook exists for Onfido outage (manual review for all)
- [ ] Runbook exists for credential compromise (rotate NIMC and Onfido keys)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming) for the testing strategy. This module's test focus:

### 9.1 Unit Tests (`tests/unit/services/`)

- `auth.service.ts` — registration, login, password hashing, session management
- `verification.service.ts` — NIMC, Onfido, manual review, state machine transitions
- `verification.cache.ts` — cache get/set/invalidate, TTL behavior
- `verification.rules.ts` — rate limit enforcement, age check, attempt counting

Coverage target: ≥ 90% on the service layer (this is the highest-stakes module).

### 9.2 Integration Tests (`tests/integration/api/`)

- Registration → email verification → NIMC → verified (happy path)
- Registration → email verification → NIMC failure → Onfido → verified (fallthrough)
- Registration → email verification → 5 NIMC failures → manual review → verified (manual path)
- Registration → email verification → NIMC failure → appeal → manual review → approved
- Login with wrong password (5x) → rate limited
- Login → session expired → re-login
- DSAR request → data export delivered
- Account deletion → grace period → restore
- Account deletion → grace period expires → data purged

### 9.3 E2E Tests (`tests/e2e/`)

- Full J1 journey (first-time user becomes verified) — see [User Journeys.md §3](../product/User%20Journeys.md#3-j1--first-time-user-becomes-a-verified-citizen)
- New device login with cache hit (no NIMC API call)
- Appeal flow end-to-end
- Account deletion with active case (correctly blocked)

### 9.4 Manual Tests (during pilot)

- NIMC with real NINs (requires test users with NINs)
- Onfido with real documents
- Manual review queue walkthrough with moderators
- DSAR with real user data

### 9.5 The "Negative Test" Rule

For every "user *can* do X" test, there must be a matching "user *cannot* do X" test. For this module especially: a verified user can vote; an unverified user cannot. An admin can suspend; a non-admin cannot. A user can see their own data; a user cannot see another user's data.

---

## 10. Rollout Plan

### 10.1 Feature Flags

This module ships behind a single feature flag:

- `auth.module.enabled` — defaults to `true` at pilot launch

The flag exists to disable the module in case of a critical issue at launch; it is not for gradual rollout (the module is the foundation; the platform cannot run without it).

### 10.2 Migration (if applicable)

Not applicable for the pilot — this is a greenfield module.

If we add a "migrate from NIMC-only to NIMC + Onfido" feature in the future, the migration would re-verify all users with cached NIMC results. This is not in the pilot scope.

### 10.3 Rollback Plan

- **NIMC API issue:** Fall back to Onfido-only (the module supports this; the UI already shows the choice). No rollback needed; just update the recommended path.
- **Onfido API issue:** Fall back to manual review for all new verifications. No code rollback needed; just update the queue SLA.
- **Session or password issue:** Force-logout all users; require password reset. This is a hard operation; documented in the runbook.
- **Critical module bug:** The `auth.module.enabled` flag disables the module; new registrations and logins are blocked until the issue is fixed.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the actual NIMC NVS API SLA and error rate? | Engineering Lead | Open — awaiting API access |
| 2 | What is the Onfido cost per verification at our expected volume? | Finance | Open — needs quote |
| 3 | Should we support multiple Onfido workflows (e.g., passport-only for diaspora) in the pilot? | Product Lead | Open — recommend no, deferred to Y2 |
| 4 | What email service do we use (Resend, Postmark, SendGrid)? | Engineering Lead | Open — decide pre-pilot |
| 5 | How do we handle a user who changes their name after NIMC verification? | Product Lead | Open — needs legal review |
| 6 | Do we need a "trusted device" feature for the pilot? | Product Lead | Open — recommend no |
| 7 | What is the DSAR export format? (JSON, PDF, both?) | Legal + Engineering | Open — recommend JSON for pilot |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## Appendix A: Glossary
- **DSAR** — Data Subject Access Request (NDPR)
- **JWT** — JSON Web Token
- **NIN** — National Identification Number
- **NVS** — National Verification Service (NIMC)
- **NIMC** — National Identity Management Commission
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SLA** — Service Level Agreement

## Appendix B: References
- [PRD.md §4.1 — Identity Verification](../product/PRD.md#41-identity-verification-pillar-0--the-foundation)
- [User Journeys.md §3 — J1 First-time user becomes a verified citizen](../product/User%20Journeys.md#3-j1--first-time-user-becomes-a-verified-citizen)
- [Personas.md §3.1 — Amara, §3.2 — Tunde](../product/Personas.md)
- [UX & Design.md §3 — Screen Inventory](../product/UX%20%26%20Design.md#3-screen-inventory-pilot)
- [PLATFORM.md §6 — Identity Verification](../PLATFORM.md#6-identity-verification)
- [ARCHITECTURE.md §5 — Identity Verification](../ARCHITECTURE.md#5-identity-verification)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [API.md](../technical/API.md) (forthcoming in Phase 4)
- [Database spec](../technical/Database.md) (forthcoming in Phase 4)
- [QA.md](../technical/QA.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers registration, email verification, NIMC, Onfido, manual review, RBAC, DSAR, and account lifecycle. 16 business rules, 16 edge cases, 60+ acceptance criteria. |