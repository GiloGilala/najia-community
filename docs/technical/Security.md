# Security Architecture

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Engineering Lead + Legal Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Consolidates the security architecture from ARCHITECTURE.md §12, with the threat model, the controls per threat, and the compliance posture.

> **How to read this document:** This is the **threat-focused security reference** for the platform. It consolidates the security design from [ARCHITECTURE.md §12](../ARCHITECTURE.md#12-security) and the relevant [ADRs](../ADRs.md). For the encryption at rest and in transit details, see [ARCHITECTURE.md §12.3](../ARCHITECTURE.md#123-data-encryption). For the VPN configuration, see [ARCHITECTURE.md §12.4](../ARCHITECTURE.md#124-vpn-security).

> **Related documents:**
> - [ARCHITECTURE.md §12](../ARCHITECTURE.md#12-security) — the high-level security architecture
> - [ADRs.md](../ADRs.md) — especially ADR-009 (voter anonymization) and ADR-011 (flat subscription model)
> - [Engineering.md §10](./Engineering.md#10-security-practices) — the engineering security practices
> - [QA.md §7](./QA.md#7-security-tests) — the security testing requirements
> - [Risk Register in PLATFORM.md §11](../PLATFORM.md#11-risk-register) — the platform risks

---

## 1. Security Principles

These are the security principles that guide every design and implementation decision. They are not aspirational; they are enforced by code review, CI, and audit.

| Principle | Application |
|-----------|-------------|
| **Defense in depth** | RBAC is enforced at the API route, the service layer, and the database query layer. No single layer is the only defense. |
| **Least privilege** | Users have only the permissions they need. The default is denial. |
| **Zero trust** | Every request is authenticated and authorized, even from "internal" sources. |
| **Encryption everywhere** | Data is encrypted in transit (TLS 1.3) and at rest (AES-256 for sensitive data). |
| **Audit by default** | Every state change is audit-logged. Audit logs are append-only and retained per legal requirements. |
| **Fail safe** | When something goes wrong, the default is to deny access, not to allow it. |
| **No secrets in code** | Secrets are environment variables, never in code or comments. |
| **No PII in logs** | PII is never logged at INFO level. Only at DEBUG in development. |
| **Verify, don't trust** | Every input is validated. Every client is authenticated. Every authorization is checked. |

---

## 2. Threat Model

The threat model uses the STRIDE categories (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). For each category, we list the specific threats to the platform and the controls that mitigate them.

### 2.1 Spoofing

**Threat:** An attacker pretends to be a legitimate user.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| User spoofs another user's identity | NIMC NVS API or Onfido verification at registration | [PLATFORM.md §6](../PLATFORM.md#6-identity-verification) |
| User spoofs another user's NIN | NIN uniqueness check; verification at the NIMC API | [Auth module §3.1](../modules/Authentication%20%26%20Identity%20Verification.md) |
| Attacker spoofs a JWT | JWT signed with a strong secret; signature verified on every request | [Engineering.md §10.1](./Engineering.md#101-secrets-management) |
| Attacker spoofs a moderator/admin | Admin actions require senior admin approval for high-stakes; all actions are audit-logged | [Admin module §3.3](../modules/Admin%20%26%20Operations.md) |
| Attacker spoofs a Paystack webhook | Webhook signature verification (HMAC-SHA256) | [Lawyer Onboarding §3.2.1](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |
| Lawyer spoofs another lawyer's bar number | Bar number uniqueness check | [Lawyer Onboarding §3.6](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |

### 2.2 Tampering

**Threat:** An attacker modifies data they shouldn't be able to modify.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| Attacker tampers with stored evidence | SHA-256 hash on every upload; re-hash on every access; mismatch triggers INTEGRITY_COMPROMISED | [Evidence module §3.1.2](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| Attacker tampers with a vote | Voter token hash is one-way; the original is not stored | [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) |
| Attacker tampers with the database directly | DB credentials are restricted; all admin actions are audit-logged; no admin can edit the audit log | [Admin module §3.1.1](../modules/Admin%20%26%20Operations.md) |
| Attacker tampers with the audit log | Audit log is append-only (DB constraint); deletion requires DSAR-driven exception, which is itself logged | [Admin module §3.1.1](../modules/Admin%20%26%20Operations.md) |
| Attacker tampers with stored files | Server-side encryption; access via signed URLs | [ARCHITECTURE.md §12.3](../ARCHITECTURE.md#123-data-encryption) |
| Attacker tampers with the API in transit | TLS 1.3; WireGuard VPN | [ARCHITECTURE.md §12.2](../ARCHITECTURE.md#122-encryption-in-transit) |

### 2.3 Repudiation

**Threat:** A user denies having performed an action.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| User denies having voted | Eligibility check logged; vote record stored (anonymized but logged at eligibility) | [Policy Polls §3.3](../modules/Policy%20Polls.md) |
| User denies having uploaded evidence | Upload timestamp + hash stored; uploader ID stored; access events logged | [Evidence module §3.1](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| User denies having submitted a moderation action | Every action is logged with moderator ID, timestamp, before/after state | [Moderation module §3.1.1](../modules/Moderation.md) |
| User denies having made a payment | Payment records are tied to Paystack references; webhook events are logged | [Lawyer Onboarding §3.2.1](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |
| Admin denies having taken an admin action | Admin audit log with IP, user agent, before/after state | [Admin module §3.1.1](../modules/Admin%20%26%20Operations.md) |

### 2.4 Information Disclosure

**Threat:** Sensitive data is exposed to unauthorized parties.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| Vote is tied back to a voter | `poll_votes` and `confidence_votes` have no `user_id` column; only a one-way hash | [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) |
| Lawyer sees citizen's identity before consultation | API does not return citizen's identity to the lawyer until consultation time | [Lawyer Matching §3.6](../modules/Lawyer%20Matching%20%26%20Consultation.md) |
| Evidence is exposed to the wrong user | RBAC with per-case conditions; integrity log captures every access | [Evidence module §3.6](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| Password is exposed in a breach | Bun.password (argon2id); passwords are never stored plaintext | [Engineering.md §10.1](./Engineering.md#101-secrets-management) |
| API exposes internal details | Standard error response format; no stack traces in production | [ARCHITECTURE.md §13.1](../ARCHITECTURE.md#131-response-format) |
| Admin audit log is exposed to the wrong admin | RBAC on the admin audit log; sensitive entries restricted to senior admins | [Admin module §3.4](../modules/Admin%20%26%20Operations.md) |
| PII is leaked in logs | Structured logger with no PII at INFO level; only DEBUG in development | [Engineering.md §10.4](./Engineering.md#104-logging) |
| PII is exposed in a DSAR response to the wrong party | DSAR data delivered via time-limited signed URL; verified user identity required | [Admin module §3.3](../modules/Admin%20%26%20Operations.md) |
| Voter token pepper is leaked | Pepper is in environment variable, rotated annually and on staff departure | [Engineering.md §7](./Engineering.md#7-the-voter-token-pepper-management) |

### 2.5 Denial of Service

**Threat:** An attacker makes the platform unavailable.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| API is overwhelmed by requests | Per-endpoint and per-user rate limits (token bucket + sliding window) | [ARCHITECTURE.md §7](../ARCHITECTURE.md#7-rate-limiting-layer) |
| Login endpoint is brute-forced | Rate limit: 5 attempts per 15 minutes per IP | [Auth module §6](../modules/Authentication%20%26%20Identity%20Verification.md) |
| Registration endpoint is abused for spam | Rate limit: 3 per hour per IP; email verification required | [Auth module §3.3](../modules/Authentication%20%26%20Identity%20Verification.md) |
| Evidence upload is abused for storage exhaustion | File size limit (100 MB); rate limit: 5 per hour per user | [Evidence module §3.3](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| Bot voting | NIMC verification required; one vote per user per poll (DB-level uniqueness) | [Policy Polls §3.3](../modules/Policy%20Polls.md) |
| AI detection API is overwhelmed | Open-source models as primary; commercial APIs rate-limited per user | [Business Case §4.2](../business/Business.md#42-cost-notes-by-category) |
| VPN is attacked | WireGuard's limited attack surface; DDoS protection at the VPS level | [ARCHITECTURE.md §12.4](../ARCHITECTURE.md#124-vpn-security) |
| Database connection pool is exhausted | Connection pooling with limits; alerting at 80% of pool | [ARCHITECTURE.md §9.2](../ARCHITECTURE.md#92-metrics) |

### 2.6 Elevation of Privilege

**Threat:** A user gains permissions they shouldn't have.

| Specific threat | Mitigation | Reference |
|----------------|------------|-----------|
| Citizen becomes a lawyer without verification | Lawyer registration requires identity verification + bar verification + profile activation | [Lawyer Onboarding §3.3](../modules/Lawyer%20Onboarding%20%26%20Verification.md) |
| Moderator becomes admin | Admin role is assigned by another admin (no self-grant); high-stakes changes require senior admin approval | [Admin module §3.3](../modules/Admin%20%26%20Operations.md) |
| User accesses another user's data | RBAC with per-resource conditions (CASL); tested with negative tests | [RBAC.md](./RBAC.md), [QA.md §8](./QA.md#8-the-negative-test-rule) |
| User accesses admin endpoints | Admin endpoints are on a separate URL prefix and require the admin role | [Admin module §5.1](../modules/Admin%20%26%20Operations.md) |
| Lawyer accesses evidence outside their assigned case | `evidence:read` CASL condition requires `{ case: { lawyerId: user.id } }` | [Evidence module §4](../modules/Evidence%20Upload%20%26%20Integrity.md) |
| Moderator decides on their own appeal | Reviewer reassignment is enforced at the queue level (the same person cannot decide the original and the appeal) | [Moderation module §3.3](../modules/Moderation.md) |
| Fee model violation is introduced | CI grep audit fails the build if a percentage-of-fees pattern is introduced | [ADR-011](../ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace), [Engineering.md §6](./Engineering.md#6-the-fee-model-grep-audit) |
| Voter token pepper is exposed | Pepper is in environment variable, not in code; rotated on staff departure | [Engineering.md §7](./Engineering.md#7-the-voter-token-pepper-management) |

---

## 3. Authentication and Authorization

### 3.1 Authentication

The platform uses JWT-based authentication:

- **Token format:** JWT, signed with HS256
- **Token lifetime:** 7 days (sliding window; activity extends)
- **Token storage (web):** httpOnly cookie, Secure, SameSite=Strict
- **Token storage (mobile):** Expo SecureStore (encrypted)
- **Token refresh:** automatic, via `/api/auth/refresh`
- **Logout:** server-side session revocation (the token is in the session table; logout marks it as revoked)

Multi-factor authentication is out of scope for the pilot (deferred to Year 2).

### 3.2 Authorization

The platform uses CASL for RBAC. The permission model is in [RBAC.md](./RBAC.md). Key principles:

- **Role-based defaults:** each role has a default set of abilities (defined in `defineAbilityFor`)
- **Per-user overrides:** admins can grant or revoke individual permissions for specific users (stored in `user_permissions`)
- **Conditional permissions:** abilities can include conditions (e.g., `{ uploaderId: user.id }`)
- **Defense in depth:** RBAC is enforced at the API route, the service layer, and the database query layer
- **Self-protection:** admins cannot suspend themselves, change their own role, or remove the last admin

### 3.3 The Voter Token Anonymization (Special Case)

The most important authorization design in the platform is the voter token hash. See [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id).

- `poll_votes` and `confidence_votes` have **no `user_id` column**
- The `voter_token_hash` is SHA-256(user_id + poll_id + pepper) (or equivalent for confidence votes)
- The pepper is a 256-bit secret, stored in an environment variable, never in code
- The same pepper is shared between `poll_votes` and `confidence_votes` to prevent cross-table correlation
- The pepper is rotated annually and on any staff departure with database access
- The DB-level UNIQUE constraint on `(poll_id, voter_token_hash)` prevents double-voting without needing the user_id

The Amara test ([Personas.md §3.1](../product/Personas.md#31-amara--the-engaged-citizen)) is the binding constraint: would Amara understand that her vote cannot be traced back to her, even by platform staff?

### 3.4 The Fee Model (Compliance Case)

The most important compliance design in the platform is the flat subscription model. See [ADR-011](../ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace).

- The platform takes a flat monthly subscription fee (Basic / Enhanced / Premium)
- The platform **never** takes a percentage of legal fees, consultation fees, or any fee that flows from a lawyer–client engagement
- This constraint is enforced at four levels: data model, service code, CI grep, code review
- The CI grep ([Engineering.md §6](./Engineering.md#6-the-fee-model-grep-audit)) fails the build if a percentage-of-fees pattern is introduced

The Ngozi test ([Personas.md §3.3](../product/Personas.md#33-ngozi--the-verified-lawyer)) is the binding constraint: would Ngozi understand that the platform does not take a percentage of her legal fees?

---

## 4. Encryption

### 4.1 At Rest

| Data | Encryption method | Notes |
|------|-------------------|-------|
| User passwords | Bun.password (argon2id) | Plaintext never stored |
| Government IDs (in evidence) | SHA-256 hash | The file is the evidence; the hash is the integrity check |
| NIN data | AES-256 | Encrypted at the application layer before storage |
| Evidence files | Server-side encryption (provider-managed) | Cloudflare R2, Bunny CDN, or ImageKit |
| User PII | Database encryption (PGP) | Sensitive fields encrypted at the column level |
| Session data | JWT + SQLite (SecureStore on mobile) | Tokens are hashed at rest |
| Rate limit data | Plain (non-sensitive) | |
| Cache data | Plain (non-sensitive) | Cached values are non-sensitive (e.g., poll results) |
| Blog content | Plain (non-sensitive) | |
| RBAC data | Plain (non-sensitive) | |
| Audit log | Encrypted at rest (database encryption) | Sensitive entries (admin actions) are protected by RBAC |
| Voter token pepper | Environment variable (not in code) | The most security-sensitive constant |

### 4.2 In Transit

| Connection | Protocol |
|------------|----------|
| Web traffic | TLS 1.3 |
| API traffic | TLS 1.3 |
| Database connections | TLS 1.3 |
| CDN connections | TLS 1.3 |
| NIMC NVS API | TLS 1.3 |
| Onfido API | TLS 1.3 |
| Paystack webhook | TLS 1.3 (signature-verified) |
| VPN tunnel | WireGuard |

All connections are over TLS 1.3 minimum. The platform does not support TLS 1.0 or 1.1.

### 4.3 Key Management

- **Encryption keys** are stored in environment variables, not in code
- **Database credentials** are stored in environment variables, not in code
- **API keys** (NIMC, Onfido, Paystack, etc.) are stored in environment variables
- **Voter token pepper** is in an environment variable, rotated annually
- **JWT signing secret** is in an environment variable, rotated annually
- **The `.env` file** is gitignored; the `.env.example` documents required variables with placeholders
- **Secrets are never logged**, even at DEBUG level
- **Secret rotation** is documented in the runbook (forthcoming in [Infrastructure.md](./Infrastructure.md))

---

## 5. Identity Verification

### 5.1 NIMC NVS API

- Used for: primary identity verification
- Authentication: Client ID + Client Secret + Timestamp
- Request format: JSON over HTTPS
- Response format: JSON
- Timeout: 10 seconds
- Retry: 3 retries with exponential backoff
- Cache: 30 days (non-sensitive data)

### 5.2 Onfido

- Used for: fallback identity verification (for users without NIN)
- Authentication: API key
- Document types supported: Passport, Driver's License, Voter's Card
- Webhook events: `check.completed`, `check.failed`, `report.completed`

### 5.3 Verification Cache and State

The verification state machine is documented in [Auth module §3.1.1](../modules/Authentication%20%26%20Identity%20Verification.md). The cache TTL is 30 days. The state transitions are enforced in the service layer.

### 5.4 The Verification 24-Hour Cool-Down

After a failed verification attempt (NIMC or Onfido), the user is in a 24-hour cool-down. This prevents enumeration attacks. The cool-down is enforced at the service layer.

---

## 6. Input Validation

Every API request is validated with Zod at the boundary. The validation rules:

- **Type check:** every field has a Zod schema with a type
- **Format check:** emails, phone numbers, NINs, etc. are validated against a format regex
- **Length check:** strings have a min and max length
- **Range check:** numbers have a min and max
- **Enum check:** string values are from a fixed set
- **Cross-field check:** some fields are validated together (e.g., date ranges)

The Zod schemas live in `lib/validation/`. They are the source of truth for both runtime validation and TypeScript types.

---

## 7. Rate Limiting

The rate limiting layer is documented in [ARCHITECTURE.md §7](../ARCHITECTURE.md#7-rate-limiting-layer). The default rate limits per category are in [ARCHITECTURE.md §7.1.2](../ARCHITECTURE.md#712-default-rate-limits).

Key principles:

- **Rate limit first:** every endpoint enforces rate limits before any processing
- **Per-endpoint and per-user:** limits are per-endpoint and per-user (or per-IP for unauthenticated endpoints)
- **Sliding window:** the algorithm is sliding window, not fixed bucket (more accurate for burst detection)
- **Standard headers:** all responses include the `X-RateLimit-*` headers
- **429 on exceed:** over-limit requests return 429 with a `Retry-After` header
- **Anomaly detection:** the audit log captures unusual rate patterns for moderation review

---

## 8. Audit Logging

### 8.1 What Is Logged

| Event type | Log level | Notes |
|------------|-----------|-------|
| User state changes (registration, verification, suspension) | INFO | |
| Authentication events (login, logout, password reset) | INFO | Failed logins at WARN |
| Voting (eligibility check) | DEBUG | **Not the vote choice** — only the eligibility |
| Evidence upload and access | INFO | Hash, file metadata, access event |
| Moderation actions (approve, remove, warn, suspend) | INFO | With moderator ID, before/after state |
| Admin actions (suspension, restoration, role change) | INFO | Admin audit log (separate from main) |
| API errors and exceptions | ERROR | With stack trace at DEBUG only |
| Rate limit breaches | WARN | |
| RBAC denials (permission denied) | WARN | |
| Integrity mismatches (evidence hash mismatch) | ERROR + alert | |
| Voter token pepper rotation | INFO | With the rotation timestamp |

### 8.2 What Is NOT Logged

| Data | Why not |
|------|---------|
| Passwords (plaintext) | Never stored, never logged |
| API keys or secrets | Never logged |
| Full NIN | Hashed in logs; only the last 4 digits in admin contexts |
| Full NVS response | Only the eligibility outcome, not the full payload |
| Vote choice | Only the eligibility check, not the choice |
| PII at INFO level | Only at DEBUG in development |
| Session tokens | Only the session ID (not the JWT) |

### 8.3 Retention

| Log type | Retention |
|----------|----------|
| Main audit log | 7 years (NDPR requirement) |
| Admin audit log | 7 years (NDPR requirement) |
| Application logs | 90 days (operational; longer for compliance) |
| Access logs | 30 days (operational) |
| Error logs | 1 year (for trend analysis) |

Retention is enforced by a Bun.cron job that runs nightly.

---

## 9. Compliance

### 9.1 NDPR (Nigeria Data Protection Regulation)

The platform is designed to comply with the NDPR. The specific requirements and how we satisfy them:

| NDPR requirement | How we satisfy it |
|------------------|-------------------|
| Lawful basis for processing | Explicit consent at registration; legitimate interest for civic features |
| Purpose limitation | Data is collected for specific, documented purposes |
| Data minimization | We collect only the data we need (no excessive collection) |
| Accuracy | Users can update their data; verification has a 30-day cache TTL |
| Storage limitation | Data is deleted when the user requests it (DSAR-driven) or after the retention period |
| Integrity and confidentiality | Encryption at rest and in transit; access controls; audit logging |
| Accountability | Documented data flows; impact assessments; compliance reviews |
| Data Subject Access Request (DSAR) | The user can request a data export; fulfilled within 30 days |
| Right to be forgotten | The user can request account deletion; 30-day grace period; hard delete after |
| Breach notification | The platform notifies the NDPC within 72 hours of a breach |
| Cross-border data transfer | All data is stored within Nigeria (self-hosted VPS); no cross-border transfer |
| Data Protection Officer | The Legal Director serves as the DPO |

### 9.2 Nigerian Bar Association Rules

The platform is designed to comply with the NBA Rules of Professional Conduct. The specific requirements and how we satisfy them:

| NBA requirement | How we satisfy it |
|-----------------|-------------------|
| No fee-splitting with non-lawyers | Flat subscription model, never a percentage of legal fees ([ADR-011](../ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace)) |
| No advertising by lawyers | The platform does not display advertising; lawyer profiles are standardized |
| Confidentiality of lawyer-client relationship | The consultation is on the platform; the engagement is off; the platform does not record consultations |
| No solicitation | Lawyers do not solicit clients on the platform; matching is driven by the citizen's intake |

### 9.3 Other Compliance

| Regulation | How we satisfy it |
|------------|-------------------|
| Electoral Act 2022 | Polls are explicitly non-binding; disclaimers on every poll page; feature freeze before elections |
| Cybercrime Act 2015 | Content moderation; no prohibited content; user safety features |
| Consumer Protection Act 2018 | Transparent pricing (subscription tiers); no hidden fees; clear ToS |
| NIMC Act 2007 | Compliance with national identity verification requirements |

### 9.4 Compliance Reviews

| Review | Frequency | Owner |
|--------|-----------|-------|
| NDPR compliance review | Annually (or at major changes) | Legal Director |
| NBA compliance review | Annually (or at major changes) | Legal Director + Bar Association liaison |
| Security review | Quarterly | Engineering Lead + Legal Director |
| Penetration test | Annually (or at major changes) | External firm |
| Code review for security-sensitive code | Every PR | Engineering Lead + Legal Director |

---

## 10. Incident Response

### 10.1 Severity Levels

| Severity | Definition | Response time |
|----------|------------|---------------|
| P1 | Service is down or a critical feature is broken; a security breach has occurred or is suspected | Immediate (on-call) |
| P2 | A non-critical feature is broken or significantly degraded; a potential security issue is being investigated | < 1 hour |
| P3 | A minor issue or a question | < 1 business day |

### 10.2 Incident Workflow

1. **Detect:** the issue is detected (alert, user report, monitoring)
2. **Triage:** the on-call engineer assesses the severity
3. **Mitigate:** the on-call engineer takes action to stop the bleeding (e.g., disable a feature, rotate a key)
4. **Investigate:** the root cause is identified
5. **Fix:** the underlying issue is resolved
6. **Communicate:** the status is communicated to the team, the users (if affected), and the Board (if P1 or P2)
7. **Post-mortem:** for P1 and P2 incidents, a blameless post-mortem is written
8. **Action items:** the action items from the post-mortem are tracked

### 10.3 Security Incident Specifics

For security incidents specifically:

1. **Containment:** disable the affected feature, rotate compromised credentials, take the affected service offline
2. **Assessment:** determine the scope of the breach (what data was accessed, who was affected)
3. **Notification:** notify the Legal Director within 1 hour; notify the Board within 4 hours
4. **NDPR notification:** if NDPR data was breached, notify the NDPC within 72 hours
5. **User notification:** if users were affected, notify them within 72 hours
6. **Law enforcement:** if criminal activity is suspected, notify law enforcement (after Legal Director review)
7. **Post-mortem:** a blameless post-mortem is written, with a focus on prevention
8. **Action items:** the action items from the post-mortem are tracked and verified

### 10.4 Post-Mortems

Post-mortems are blameless. The goal is to learn, not to blame. The post-mortem includes:

- **Timeline:** what happened, when, who was involved
- **Root cause:** the underlying cause (not just the symptoms)
- **What went well:** the things that worked
- **What went poorly:** the things that didn't
- **Action items:** the things that will be done to prevent recurrence

Action items are tracked in the issue tracker and verified at the next post-mortem review.

---

## 11. Security Testing

The security testing requirements are documented in [QA.md §7](./QA.md#7-security-tests). The most important tests:

- **Voter anonymization test** ([QA.md §7.3](./QA.md#73-the-voter-anonymization-test)): the most important security test in the project
- **Fee model test** ([QA.md §7.4](./QA.md#74-the-fee-model-test)): the most important compliance test
- **Penetration test:** performed by an external firm (or internal red team) before launch
- **CI grep audit:** the fee model grep runs on every PR

The security tests are required for launch. See [PRD.md §7.3](../product/PRD.md#73-security-and-compliance) for the Security and Compliance Gate.

---

## 12. Security Operations

### 12.1 Access Control

- **Production access** is restricted to the Engineering Lead and designated operators
- **SSH access** is via key-based authentication, behind WireGuard
- **Database access** is via the application (not direct), except for the Engineering Lead for emergencies
- **Secrets** are stored in environment variables, not in code or in the database

### 12.2 Monitoring

- **All API requests** are logged with timing and status
- **All state changes** are audit-logged
- **Rate limit breaches** are alerted at > 10/hour
- **Integrity mismatches** are alerted immediately
- **Service health** is monitored (uptime, error rate, P95 response time)
- **Operational alerts** are acknowledged and resolved

### 12.3 Backups

- **PostgreSQL** is backed up daily, with WAL archiving (RPO < 1 hour)
- **SQLite cache** is backed up daily
- **Backups are encrypted** and stored off-site
- **Backups are tested** monthly (restore drill)
- **Backup retention** is 30 days for daily backups, 7 days for WAL

### 12.4 Patching

- **Operating system patches** are applied within 1 week of release (or immediately for security patches)
- **Bun and runtime updates** are applied within 1 month
- **Dependency updates** are applied within 1 month (or immediately for security advisories)
- **Major version upgrades** are planned (ADR-driven)

---

## 13. Open Security Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right key rotation cadence for the database encryption keys? | Legal Director | Open — needs NDPR review |
| 2 | Should we use HSM for the voter token pepper? | Engineering Lead | Open — recommend Y2 |
| 3 | How do we handle a coordinated attack (e.g., many fake users all voting at once)? | Engineering Lead + Legal Director | Open — operational scenario |
| 4 | What is the right DSAR fulfillment process for users who can't verify their identity? | Legal Director | Open — needs NDPR guidance |
| 5 | Should we implement 2FA in the pilot? | Engineering Lead + Product Lead | Open — recommend Y2 |
| 6 | How do we detect and respond to an insider threat (a staff member with DB access who is also a user)? | Legal Director | Open — operational policy |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the security posture require Legal Director sign-off.

---

## Appendix A: Security Checklist for New Features

For every new feature, the security review covers:

- [ ] Authentication: who can access the feature? Are they authenticated?
- [ ] Authorization: who can do what? Is RBAC enforced at the API, service, and database layers?
- [ ] Input validation: is every input validated with Zod at the boundary?
- [ ] Output encoding: is output safely encoded (no XSS, no SQL injection)?
- [ ] Audit logging: is every state change logged?
- [ ] Rate limiting: is the feature rate-limited?
- [ ] Privacy: does the feature expose PII? Is the exposure minimized?
- [ ] Anonymization: does the feature involve any anonymized data (e.g., votes)? Is the anonymization correct?
- [ ] Encryption: is sensitive data encrypted at rest and in transit?
- [ ] Testing: are there negative tests for the security properties? Are there security tests for the threat model?

## Appendix B: Security Architecture Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead + Legal Director | Initial set. Consolidates the security architecture from ARCHITECTURE.md §12, with the threat model (STRIDE), the controls per threat, the encryption design, the compliance posture (NDPR, NBA, Electoral Act, etc.), and the incident response workflow. The voter anonymization and the flat subscription model are called out as the most important security/compliance designs. |