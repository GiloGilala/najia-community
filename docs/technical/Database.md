# Database Architecture

_Document Version: 1.0.0_
_Last Updated: 2026-07-20_
_Status: Active_
_Owner: Engineering Lead_

> **Changelog:**
>
> - 1.0.0 (2026-07-20) — **Fresh rewrite.** This document replaces earlier drafts that used prefixed text IDs and a different table set. The schema is now consistent with the canonical Drizzle implementation in `DB_SCHEMA.md`. Key changes from the v1.1.0 conceptual draft: (1) UUID primary keys (not prefixed text IDs) to match the actual implementation; (2) `poll_votes` and `confidence_votes` store `voterTokenHash` (not `userId`) to implement [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id); (3) the new tables (files, notifications, jobs, webhooks, api_keys) from the architecture review are included; (4) the moderation queue is the unified model (per the review); (5) the audit log includes `actor_type` and `category` for access control. This document is the conceptual reference; `DB_SCHEMA.md` is the implementation reference.

> **How to read this document:** This is the **conceptual schema reference** for the platform. It describes what the schema is, why each table exists, and how the tables relate. For the exact Drizzle ORM definitions (TypeScript code, relations, constraints), see [DB_SCHEMA.md](./DB_SCHEMA.md). For the high-level architecture (PostgreSQL + SQLite, connection pooling, backup strategy), see [ARCHITECTURE.md §8](../ARCHITECTURE.md#8-database-layer). For the migration workflow, see [Engineering.md §8](./Engineering.md#8-database-migrations).

> **Related documents:**
>
> - [DB_SCHEMA.md](./DB_SCHEMA.md) — the canonical Drizzle ORM definitions
> - [ARCHITECTURE.md §8](../ARCHITECTURE.md#8-database-layer) — the high-level architecture
> - [Engineering.md §8](./Engineering.md#8-database-migrations) — the migration workflow
> - [Module Specs](../modules/) — each module has a data model section

---

## 1. Overview

### 1.1 Technology

| Aspect               | Choice                     | Rationale                                                                                        |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| **Primary database** | PostgreSQL 14+             | Strong relational integrity, complex queries, full-text search, NDPR compliance via self-hosting |
| **ORM**              | Drizzle ORM                | TypeScript-first, schema-as-code, lightweight, Bun-compatible                                    |
| **Migrations**       | Drizzle Kit                | Versioned, append-only, generated from schema changes                                            |
| **Cache store**      | SQLite (via `bun:sql`)     | Sub-millisecond reads, no separate service, ACID-compliant                                       |
| **Rate limit store** | SQLite (via `bun:sql`)     | Same as cache; can be shared or separate                                                         |
| **Hosting**          | Self-hosted VPS in Nigeria | Data sovereignty for NDPR compliance                                                             |

### 1.2 Conventions

| Convention             | Rule                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary keys**       | `uuid` (`defaultRandom()`) on every table. No auto-increment integer PKs, no prefixed text IDs                                                                                                     |
| **Timestamps**         | Every table has `createdAt` and `updatedAt` (`timestamp with time zone`, defaulting to `now()`). `updatedAt` is bumped in the service layer, not via DB trigger, to keep behavior explicit         |
| **Soft delete**        | Tables that support deletion use `deletedAt: timestamp` (nullable) + `deletedBy: uuid` (nullable, references `users.id`). Hard deletes are reserved for GDPR/NDPR erasure requests only            |
| **Foreign keys**       | Always declared with `.references()`, always indexed. `onDelete` defaults to `restrict` unless explicitly noted                                                                                    |
| **Enums**              | Declared with `pgEnum` at the top of the owning schema file and exported for reuse in Zod schemas                                                                                                  |
| **JSON columns**       | `jsonb`, typed via a paired TypeScript interface, never used for data that needs to be queried/filtered (those become real columns)                                                                |
| **Money**              | Stored as `integer` in kobo (smallest currency unit), never `float`                                                                                                                                |
| **Unique constraints** | Declared with `uniqueIndex('name').on(...)` in the table's second-argument callback. Never as a plain object literal, which Drizzle silently ignores                                               |
| **File references**    | Where a table needs a file, reference `files.id` (not inline `storage_path`)                                                                                                                       |
| **Anonymization**      | Vote tables store `voterTokenHash` (not `userId`). The hash is a one-way function of `userId + entityId + pepper`. See [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) |

### 1.3 ID Prefixes

UUIDs are used for all primary keys (no prefixed text IDs). For human-readable references (e.g., case reference numbers), the application generates a separate field:

| Field                   | Format                               | Example             |
| ----------------------- | ------------------------------------ | ------------------- |
| `cases.referenceNumber` | `NCB-YYYY-NNNNNN` (server-generated) | `NCB-2026-000123`   |
| `officials.publicId`    | UUID                                 | (internal use only) |

### 1.4 Schema Files

The schema is split across multiple files by domain, composed into a single schema graph:

| File                          | Domain                       | Key Tables                                                                                              |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `users.schema.ts`             | Identity                     | `users`                                                                                                 |
| `jurisdictions.schema.ts`     | Reference                    | `jurisdictions`                                                                                         |
| `cases.schema.ts`             | Cases                        | `cases`                                                                                                 |
| `evidence.schema.ts`          | Evidence                     | `evidence`, `evidenceAccessLog`                                                                         |
| `polls.schema.ts`             | Polls                        | `polls`, `pollOptions`, `pollVotes`                                                                     |
| `officials.schema.ts`         | Officials & confidence votes | `officials`, `confidenceVotePeriods`, `confidenceVotes`                                                 |
| `lawyers.schema.ts`           | Lawyer marketplace           | `lawyers`, `lawyerFees`, `lawyerReviews`, `lawyerCaseMatches`                                           |
| `blog.schema.ts`              | Blog                         | `blogPosts`, `blogComments`, `newsletterSubscribers`                                                    |
| `legal-literacy.schema.ts`    | Legal literacy               | `legalLiteracyModules`, `legalLiteracyQuizzes`, `legalLiteracyEnrollments`, `legalLiteracyQuizAttempts` |
| `rbac.schema.ts`              | RBAC                         | `roles`, `permissions`, `rolePermissions`, `userPermissionOverrides`                                    |
| `audit.schema.ts`             | Audit                        | `auditLogs`                                                                                             |
| `moderation.schema.ts`        | Moderation                   | `moderationQueue`, `moderationAppeals`                                                                  |
| `verification.schema.ts`      | Verification                 | `verificationRecords`                                                                                   |
| `files.schema.ts`             | Files (unified storage)      | `files`                                                                                                 |
| `notifications.schema.ts`     | Notifications                | `notifications`, `notificationPreferences`, `notificationQueue`                                         |
| `jobs.schema.ts`              | Background jobs              | `jobs`, `jobLogs`                                                                                       |
| `webhooks.schema.ts`          | Webhooks                     | `webhooks`, `webhookEvents`                                                                             |
| `integrations.schema.ts`      | API keys                     | `apiKeys`                                                                                               |
| `content-analytics.schema.ts` | Analytics                    | `contentAnalytics`, `analyticsEvents` (Y2)                                                              |
| `settings.schema.ts`          | Settings                     | `settings` (unified: system config + feature flags)                                                     |
| `operational.schema.ts`       | Operational                  | `operationalAlerts`, `transparencyReportData`                                                           |

---

## 2. Entity-Relationship Overview

users ──┬──< cases (complainantId, respondentId, lawyerId) >──┬── lawyers
│ │
├──< evidence (uploaderId) >── cases ├── lawyerReviews
│ │
├──< pollVotes └── lawyerCaseMatches
├──< confidenceVotes >── officials
│
├──< blogPosts (authorId)
├──< blogComments (userId)
├──< legalLiteracyEnrollments >── legalLiteracyModules
│
├──< userPermissionOverrides
├──< verificationRecords
├──< files (uploaderId)
├──< notifications
└──< auditLogs

jurisdictions ──< users
jurisdictions ──< officials
jurisdictions ──< polls (scope)

polls ──< pollOptions ──< pollVotes
officials ──< confidenceVotePeriods ──< confidenceVotes

files ──< evidence (fileId)
files ──< users (avatarFileId)
files ──< lawyers (photoFileId)
files ──< blogPosts (coverImageFileId)
files ──< legalLiteracyModules (coverImageFileId)
files ──< officials (photoFileId)

cases ──< evidence
cases ──< lawyerCaseMatches >── lawyers

moderationQueue ──< moderationAppeals >── users (appellant)
moderationQueue >── users (assignedTo)

text

---

## 3. Identity Domain

### 3.1 `users`

The root entity. One row per registered user.

| Column                                | Type                                                     | Notes                                                        |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `id`                                  | `uuid` PK                                                |                                                              |
| `email`                               | `text` UNIQUE NOT NULL                                   | Login, notifications                                         |
| `phone`                               | `text` UNIQUE                                            | Optional, for SMS notifications                              |
| `passwordHash`                        | `text` NOT NULL                                          | Bun.password (argon2id)                                      |
| `fullName`                            | `text` NOT NULL                                          |                                                              |
| `role`                                | `text` NOT NULL DEFAULT `'citizen'`                      | Denormalized primary role; fine-grained perms in RBAC tables |
| `jurisdictionId`                      | `uuid` FK → `jurisdictions.id`                           | For jurisdiction-based access control                        |
| `nin`                                 | `text`                                                   | Stored encrypted (AES-256) at the application layer          |
| `verificationStatus`                  | `verificationStatusEnum` NOT NULL DEFAULT `'unverified'` |                                                              |
| `verifiedAt`                          | `timestamptz`                                            |                                                              |
| `emailVerifiedAt`                     | `timestamptz`                                            |                                                              |
| `isActive`                            | `boolean` NOT NULL DEFAULT `true`                        |                                                              |
| `isSuspended`                         | `boolean` NOT NULL DEFAULT `false`                       |                                                              |
| `suspendedReason`                     | `text`                                                   |                                                              |
| `avatarFileId`                        | `uuid` FK → `files.id`                                   | Profile photo                                                |
| `metadata`                            | `jsonb`                                                  | Flexible per-user data (never for queryable fields)          |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps                                               |                                                              |

**Indexes:** `email`, `phone`, `(role, jurisdiction_id)`, `(verification_status)`, `nin` (partial, where not null)

**Note on sessions:** Active session state is managed via JWT (httpOnly cookie for web, SecureStore for mobile) with a small revocation list in SQLite cache. There is no `sessions` table in PostgreSQL. Login/logout events are recorded in `auditLogs`.

### 3.2 `jurisdictions`

| Column      | Type                             | Notes                                    |
| ----------- | -------------------------------- | ---------------------------------------- |
| `id`        | `uuid` PK                        |                                          |
| `name`      | `text` NOT NULL                  | E.g., "Lagos", "Ikeja"                   |
| `level`     | `jurisdictionLevelEnum` NOT NULL | One of: `'national'`, `'state'`, `'lga'` |
| `code`      | `text` NOT NULL                  | ISO/NG state code                        |
| `parentId`  | `uuid` FK → `jurisdictions.id`   | LGA → state, state → null                |
| `createdAt` | `timestamp`                      |                                          |

**Unique:** `(level, code)`

### 3.3 `verificationRecords`

Append-only audit log of verification attempts.

| Column                | Type                   | Notes                                                |
| --------------------- | ---------------------- | ---------------------------------------------------- |
| `id`                  | `uuid` PK              |                                                      |
| `userId`              | `uuid` FK → `users.id` |                                                      |
| `provider`            | `text` NOT NULL        | `'nimc'`, `'onfido'`, `'manual'`                     |
| `providerReferenceId` | `text`                 | The provider's reference for this attempt            |
| `status`              | `text` NOT NULL        | Mirrors `verificationStatusEnum`                     |
| `rawResponse`         | `jsonb`                | Redacted before storage — no raw NIN/document images |
| `createdAt`           | `timestamp`            |                                                      |

---

## 4. Polls Domain (Pillar 1)

### 4.1 `polls`

| Column                   | Type                                                 | Notes                                                                              |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `id`                     | `uuid` PK                                            |                                                                                    |
| `title`                  | `text` NOT NULL                                      |                                                                                    |
| `summary`                | `text` NOT NULL                                      | 50–100 word plain-language explanation                                             |
| `question`               | `text` NOT NULL                                      | < 200 characters per [PLATFORM.md §9.1.3](../PLATFORM.md#913-poll-question-design) |
| `scope`                  | `pollScopeEnum` NOT NULL                             | `'national'`, `'state'`, `'local'`                                                 |
| `jurisdictionId`         | `uuid` FK → `jurisdictions.id`                       | NULL for national scope                                                            |
| `status`                 | `pollStatusEnum` NOT NULL DEFAULT `'draft'`          | `'draft'`, `'pending_review'`, `'scheduled'`, `'open'`, `'closed'`, `'archived'`   |
| `creatorType`            | `pollCreatorTypeEnum` NOT NULL DEFAULT `'moderator'` | `'moderator'`, `'ngo'`, `'government_partner'`                                     |
| `createdBy`              | `uuid` FK → `users.id`                               | Moderator who drafted                                                              |
| `approvedBy`             | `uuid` FK → `users.id`                               | Advisory Board sign-off                                                            |
| `contextUrl`             | `text`                                               | Link to official policy document                                                   |
| `startsAt`, `endsAt`     | `timestamptz` NOT NULL                               |                                                                                    |
| `createdAt`, `updatedAt` | timestamps                                           |                                                                                    |

### 4.2 `pollOptions`

| Column      | Type                           | Notes |
| ----------- | ------------------------------ | ----- |
| `id`        | `uuid` PK                      |       |
| `pollId`    | `uuid` FK → `polls.id`         |       |
| `label`     | `text` NOT NULL                |       |
| `sortOrder` | `integer` NOT NULL DEFAULT `0` |       |

### 4.3 `pollVotes` — The Anonymization-Critical Table

**This table has no `userId` column.** The voter is identified only by `voterTokenHash`, a one-way hash that cannot be reversed. This implements [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) — a foundational architectural decision.

| Column           | Type                                   | Notes                             |
| ---------------- | -------------------------------------- | --------------------------------- |
| `id`             | `uuid` PK                              |                                   |
| `pollId`         | `uuid` FK → `polls.id`                 |                                   |
| `optionId`       | `uuid` FK → `pollOptions.id`           |                                   |
| `voterTokenHash` | `text` NOT NULL                        | SHA-256(userId + pollId + pepper) |
| `createdAt`      | `timestamptz` NOT NULL DEFAULT `now()` |                                   |

**Unique:** `(pollId, voterTokenHash)` — prevents double-voting at the DB level

**The anonymization design:**

- The pepper is a 256-bit secret stored in an environment variable (never in code)
- The same pepper is used across `pollVotes` and `confidenceVotes` to prevent cross-table correlation
- The pepper is rotated annually and on any staff departure with database access
- Even with full database access, the `userId` cannot be recovered from the hash
- DSAR requests for vote history return an explicit statement: "Your poll votes are recorded anonymously and cannot be retrieved"

**Why this matters:** The Amara persona's trust constraint is that her vote cannot be traced back to her, even by platform staff. If the schema had `userId`, the constraint would be violated at the database level, regardless of what the application code does.

---

## 5. Officials and Confidence Votes Domain (Pillar 1)

### 5.1 `officials`

| Column           | Type                              | Notes                                                                 |
| ---------------- | --------------------------------- | --------------------------------------------------------------------- |
| `id`             | `uuid` PK                         |                                                                       |
| `fullName`       | `text` NOT NULL                   |                                                                       |
| `role`           | `officialRoleEnum` NOT NULL       | `'president'`, `'governor'`, `'assembly_member'`, `'lga_chairperson'` |
| `jurisdictionId` | `uuid` FK → `jurisdictions.id`    |                                                                       |
| `termStartsAt`   | `timestamptz` NOT NULL            |                                                                       |
| `termEndsAt`     | `timestamptz`                     | NULL for incumbents                                                   |
| `isCurrent`      | `boolean` NOT NULL DEFAULT `true` |                                                                       |
| `photoFileId`    | `uuid` FK → `files.id`            |                                                                       |
| `createdAt`      | `timestamp`                       |                                                                       |

### 5.2 `confidenceVotePeriods`

| Column                | Type                       | Notes                                                                          |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `id`                  | `uuid` PK                  |                                                                                |
| `officialId`          | `uuid` FK → `officials.id` |                                                                                |
| `quarter`             | `text` NOT NULL            | E.g., `'2026-Q3'`                                                              |
| `opensAt`, `closesAt` | `timestamptz` NOT NULL     | 7-day window per [PLATFORM.md §3.2.7](../PLATFORM.md#327-frequency-and-timing) |

### 5.3 `confidenceVotes` — The Anonymization-Critical Table (Shared Pepper)

**Same anonymization design as `pollVotes`.** No `userId` column. The `voterTokenHash` uses the same platform-wide pepper.

| Column           | Type                                   | Notes                                            |
| ---------------- | -------------------------------------- | ------------------------------------------------ |
| `id`             | `uuid` PK                              |                                                  |
| `periodId`       | `uuid` FK → `confidenceVotePeriods.id` |                                                  |
| `officialId`     | `uuid` FK → `officials.id`             |                                                  |
| `voterTokenHash` | `text` NOT NULL                        | SHA-256(userId + officialId + periodId + pepper) |
| `response`       | `confidenceVoteResponseEnum` NOT NULL  | `'yes'`, `'no'`, `'uncertain'`                   |
| `rationale`      | `text`                                 | Optional, anonymous, user-acknowledged           |
| `createdAt`      | `timestamptz` NOT NULL DEFAULT `now()` |                                                  |

**Unique:** `(periodId, officialId, voterTokenHash)` — prevents double-voting at the DB level

---

## 6. Cases Domain

### 6.1 `cases`

| Column                                             | Type                                        | Notes                                                                                                |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`                                               | `uuid` PK                                   |                                                                                                      |
| `referenceNumber`                                  | `text` UNIQUE NOT NULL                      | Server-generated: `NCB-YYYY-NNNNNN`                                                                  |
| `complainantId`                                    | `uuid` FK → `users.id` NOT NULL             |                                                                                                      |
| `respondentId`                                     | `uuid` FK → `users.id`                      | Nullable until respondent is identified                                                              |
| `respondentName`                                   | `text`                                      | Free-text fallback if respondent is not a platform user                                              |
| `lawyerId`                                         | `uuid` FK → `lawyers.id`                    |                                                                                                      |
| `caseType`                                         | `caseTypeEnum` NOT NULL                     | `'landlord_tenant'`, `'consumer'`, `'employment'`, `'family'`, `'contract'`, `'property'`, `'other'` |
| `status`                                           | `caseStatusEnum` NOT NULL DEFAULT `'draft'` | See state machine in [Lawyer Matching module](../modules/Lawyer%20Matching%20%26%20Consultation.md)  |
| `title`                                            | `text` NOT NULL                             |                                                                                                      |
| `description`                                      | `text` NOT NULL                             |                                                                                                      |
| `jurisdictionId`                                   | `uuid` FK → `jurisdictions.id` NOT NULL     |                                                                                                      |
| `respondentConsentedAt`                            | `timestamptz`                               |                                                                                                      |
| `isPublic`                                         | `boolean` NOT NULL DEFAULT `false`          | Never true without both-party consent                                                                |
| `resolvedAt`, `closedAt`                           | `timestamptz`                               |                                                                                                      |
| `createdAt`, `updatedAt`, `deletedAt`, `deletedBy` | timestamps                                  |                                                                                                      |

**Indexes:** `referenceNumber`, `(complainant_id, status)`, `(respondent_id, status)`, `(case_type, status)`

---

## 7. Evidence Domain (Pillar 2)

### 7.1 `evidence`

| Column                                | Type                                                     | Notes                                                      |
| ------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| `id`                                  | `uuid` PK                                                |                                                            |
| `caseId`                              | `uuid` FK → `cases.id`                                   |                                                            |
| `uploaderId`                          | `uuid` FK → `users.id`                                   |                                                            |
| `fileId`                              | `uuid` FK → `files.id`                                   | The actual file (see §13)                                  |
| `evidenceType`                        | `evidenceTypeEnum` NOT NULL                              | `'image'`, `'video'`, `'audio'`, `'document'`              |
| `sha256Hash`                          | `text` NOT NULL                                          | Chain-of-custody integrity                                 |
| `integrityStatus`                     | `integrityStatusEnum` NOT NULL DEFAULT `'pending'`       | `'pending'`, `'verified'`, `'altered'`, `'not_applicable'` |
| `lastVerifiedAt`                      | `timestamptz`                                            |                                                            |
| `aiDetectionApplicable`               | `boolean` NOT NULL DEFAULT `false`                       | Only for image/video                                       |
| `aiConfidenceScore`                   | `integer`                                                | 0–100, NULL if not applicable                              |
| `aiFlagCategory`                      | `aiFlagCategoryEnum` NOT NULL DEFAULT `'not_applicable'` | `'low'`, `'medium'`, `'high'`, `'not_applicable'`          |
| `aiDetectionModelVersion`             | `text`                                                   | E.g., `'ensemble-v1.2.0'`                                  |
| `aiDetectionRawResult`                | `jsonb`                                                  | Per-method scores for debugging                            |
| `requiresHumanReview`                 | `boolean` NOT NULL DEFAULT `false`                       | Set when AI flags high confidence                          |
| `reviewedBy`                          | `uuid` FK → `users.id`                                   | Moderator who reviewed                                     |
| `reviewedAt`                          | `timestamptz`                                            |                                                            |
| `reviewOutcome`                       | `text`                                                   | `'confirmed'`, `'false_positive'`, `'inconclusive'`        |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps                                               |                                                            |

**Indexes:** `caseId`, `sha256Hash` (for duplicate detection), `(integrityStatus)`, `(aiFlagCategory, requiresHumanReview)`

### 7.2 `evidenceAccessLog`

Chain-of-custody audit log for every evidence access.

| Column             | Type                      | Notes                                |
| ------------------ | ------------------------- | ------------------------------------ |
| `id`               | `uuid` PK                 |                                      |
| `evidenceId`       | `uuid` FK → `evidence.id` |                                      |
| `accessedBy`       | `uuid` FK → `users.id`    |                                      |
| `action`           | `text` NOT NULL           | `'view'`, `'download'`, `'reverify'` |
| `hashAtAccessTime` | `text` NOT NULL           | DEBUG-only logging                   |
| `matchedOriginal`  | `boolean` NOT NULL        | Was the hash still valid?            |
| `createdAt`        | `timestamp`               |                                      |

---

## 8. Lawyer Marketplace Domain (Pillar 3)

### 8.1 `lawyers`

| Column                                | Type                                                        | Notes                       |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| `id`                                  | `uuid` PK                                                   |                             |
| `userId`                              | `uuid` FK → `users.id` UNIQUE                               |                             |
| `barNumber`                           | `text` UNIQUE NOT NULL                                      |                             |
| `barJurisdictions`                    | `jsonb` NOT NULL DEFAULT `[]`                               | States licensed to practice |
| `practiceAreas`                       | `jsonb` NOT NULL DEFAULT `[]`                               |                             |
| `yearsOfExperience`                   | `integer` NOT NULL DEFAULT `0`                              |                             |
| `languages`                           | `jsonb` NOT NULL DEFAULT `["English"]`                      |                             |
| `verificationStatus`                  | `lawyerVerificationStatusEnum` NOT NULL DEFAULT `'pending'` |                             |
| `verifiedAt`                          | `timestamptz`                                               |                             |
| `bio`                                 | `text`                                                      |                             |
| `officeAddress`                       | `text`                                                      |                             |
| `officeLatitude`, `officeLongitude`   | `decimal`                                                   | For proximity matching      |
| `offersProBono`                       | `boolean` NOT NULL DEFAULT `false`                          |                             |
| `isAcceptingCases`                    | `boolean` NOT NULL DEFAULT `true`                           |                             |
| `photoFileId`                         | `uuid` FK → `files.id`                                      |                             |
| `createdAt`, `updatedAt`, `deletedAt` | timestamps                                                  |                             |

**Note on the flat subscription model:** The `lawyers` table does NOT include any fee-share or commission field. The platform charges lawyers a flat monthly subscription, not a percentage of legal fees. This is enforced at four levels: data model (no fee-share field), service code (no fee-share logic), CI grep (build-time check), and code review (Legal Director sign-off). See [ADR-011](../ADRs.md#adr-011--flat-subscription-model-for-lawyer-marketplace).

### 8.2 `lawyerFees`

| Column        | Type                     | Notes                                  |
| ------------- | ------------------------ | -------------------------------------- |
| `id`          | `uuid` PK                |                                        |
| `lawyerId`    | `uuid` FK → `lawyers.id` |                                        |
| `feeType`     | `feeTypeEnum` NOT NULL   | `'hourly'`, `'flat'`, `'consultation'` |
| `amountKobo`  | `integer` NOT NULL       | Money in kobo (smallest currency unit) |
| `description` | `text`                   |                                        |

### 8.3 `lawyerReviews`

| Column                                                  | Type                                | Notes                                   |
| ------------------------------------------------------- | ----------------------------------- | --------------------------------------- |
| `id`                                                    | `uuid` PK                           |                                         |
| `lawyerId`                                              | `uuid` FK → `lawyers.id`            |                                         |
| `clientId`                                              | `uuid` FK → `users.id`              |                                         |
| `caseId`                                                | `uuid` FK → `cases.id`              | Nullable link back to the resolved case |
| `overallRating`                                         | `integer` NOT NULL                  | 1–5                                     |
| `communicationRating`, `expertiseRating`, `valueRating` | `integer`                           | Optional sub-ratings                    |
| `body`                                                  | `text`                              |                                         |
| `isAnonymous`                                           | `boolean` NOT NULL DEFAULT `false`  |                                         |
| `lawyerResponse`                                        | `text`                              | The lawyer's public response            |
| `moderationStatus`                                      | `text` NOT NULL DEFAULT `'pending'` | `'pending'`, `'approved'`, `'removed'`  |
| `createdAt`                                             | `timestamp`                         |                                         |

**Moderation flow:** Reviews with `moderationStatus = 'pending'` are processed via the unified `moderationQueue` (see §11). The `contentType` is `'lawyer_review'`. This avoids a separate `lawyer_review_appeals` table — the review's appeal is just another item in the `moderationAppeals` table with `moderationQueueId` referencing the review's queue item.

### 8.4 `lawyerCaseMatches`

| Column                    | Type                               | Notes                                                          |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `id`                      | `uuid` PK                          |                                                                |
| `caseId`                  | `uuid` FK → `cases.id`             |                                                                |
| `lawyerId`                | `uuid` FK → `lawyers.id`           |                                                                |
| `matchScore`              | `decimal(5,2)` NOT NULL            | The weighted match score                                       |
| `matchCriteria`           | `jsonb` NOT NULL                   | Breakdown: `{ practiceArea, jurisdiction, availability, ... }` |
| `wasSelected`             | `boolean` NOT NULL DEFAULT `false` | Did the citizen select this match?                             |
| `consultationScheduledAt` | `timestamptz`                      |                                                                |
| `engagementSignedAt`      | `timestamptz`                      |                                                                |
| `createdAt`               | `timestamp`                        |                                                                |

**Note on naming:** Kept as `lawyerCaseMatches` (not `matches`) for clarity. May be renamed to `caseAssignments` in Y2 if we add mediators, paralegals, or other participant types. The "make the change easy" principle.

---

## 9. Content Domain

### 9.1 `blogPosts`

| Column                   | Type                                               | Notes                                                                     |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`                     | `uuid` PK                                          |                                                                           |
| `slug`                   | `text` UNIQUE NOT NULL                             | URL-safe                                                                  |
| `title`                  | `text` NOT NULL                                    |                                                                           |
| `excerpt`                | `text`                                             |                                                                           |
| `mdxBody`                | `text` NOT NULL                                    | Raw MDX source; compiled at build/request time and cached                 |
| `category`               | `blogCategoryEnum` NOT NULL                        | 8 categories per [PLATFORM.md §7.3](../PLATFORM.md#73-content-categories) |
| `contentType`            | `blogContentTypeEnum` NOT NULL DEFAULT `'article'` |                                                                           |
| `status`                 | `blogPostStatusEnum` NOT NULL DEFAULT `'draft'`    | `'draft'`, `'in_review'`, `'scheduled'`, `'published'`, `'archived'`      |
| `authorId`               | `uuid` FK → `users.id`                             |                                                                           |
| `isOpinion`              | `boolean` NOT NULL DEFAULT `false`                 | Clearly labeled per editorial guidelines                                  |
| `isSponsored`            | `boolean` NOT NULL DEFAULT `false`                 | Clearly labeled                                                           |
| `coverImageFileId`       | `uuid` FK → `files.id`                             |                                                                           |
| `publishedAt`            | `timestamptz`                                      |                                                                           |
| `readingTimeMinutes`     | `integer`                                          | Computed at publish                                                       |
| `createdAt`, `updatedAt` | timestamps                                         |                                                                           |

**Indexes:** `slug` UNIQUE, `(status, published_at)`

### 9.2 `blogComments`

| Column             | Type                                | Notes                    |
| ------------------ | ----------------------------------- | ------------------------ |
| `id`               | `uuid` PK                           |                          |
| `postId`           | `uuid` FK → `blogPosts.id`          |                          |
| `userId`           | `uuid` FK → `users.id`              |                          |
| `parentId`         | `uuid` FK → `blogComments.id`       | For one-level replies    |
| `body`             | `text` NOT NULL                     |                          |
| `moderationStatus` | `text` NOT NULL DEFAULT `'visible'` | `'visible'`, `'removed'` |
| `createdAt`        | `timestamp`                         |                          |

### 9.3 `newsletterSubscribers`

| Column           | Type                                   | Notes |
| ---------------- | -------------------------------------- | ----- |
| `id`             | `uuid` PK                              |       |
| `email`          | `text` UNIQUE NOT NULL                 |       |
| `subscribedAt`   | `timestamptz` NOT NULL DEFAULT `now()` |       |
| `unsubscribedAt` | `timestamptz`                          |       |

**Note on migration to `contacts`:** The architecture review recommended a unified `contacts` table for newsletter, marketing, and other contact types. This is deferred to Y2. For the pilot, `newsletterSubscribers` is specific and clear.

### 9.4 `legalLiteracyModules`

| Column                   | Type                               | Notes               |
| ------------------------ | ---------------------------------- | ------------------- |
| `id`                     | `uuid` PK                          |                     |
| `slug`                   | `text` UNIQUE NOT NULL             |                     |
| `title`                  | `text` NOT NULL                    |                     |
| `category`               | `text` NOT NULL                    | 8 module categories |
| `learningObjectives`     | `jsonb` NOT NULL DEFAULT `[]`      |                     |
| `mdxBody`                | `text` NOT NULL                    |                     |
| `glossary`               | `jsonb`                            |                     |
| `authorId`               | `uuid` FK → `users.id`             |                     |
| `coverImageFileId`       | `uuid` FK → `files.id`             |                     |
| `isPublished`            | `boolean` NOT NULL DEFAULT `false` |                     |
| `createdAt`, `updatedAt` | timestamps                         |                     |

### 9.5 `legalLiteracyQuizzes`

| Column               | Type                                  | Notes                           |
| -------------------- | ------------------------------------- | ------------------------------- |
| `id`                 | `uuid` PK                             |                                 |
| `moduleId`           | `uuid` FK → `legalLiteracyModules.id` |                                 |
| `question`           | `text` NOT NULL                       |                                 |
| `options`            | `jsonb` NOT NULL                      | `["Option A", "Option B", ...]` |
| `correctOptionIndex` | `integer` NOT NULL                    |                                 |

### 9.6 `legalLiteracyEnrollments`

| Column            | Type                                  | Notes |
| ----------------- | ------------------------------------- | ----- |
| `id`              | `uuid` PK                             |       |
| `moduleId`        | `uuid` FK → `legalLiteracyModules.id` |       |
| `userId`          | `uuid` FK → `users.id`                |       |
| `progressPercent` | `integer` NOT NULL DEFAULT `0`        |       |
| `completedAt`     | `timestamptz`                         |       |
| `createdAt`       | `timestamp`                           |       |

**Unique:** `(moduleId, userId)` — one enrollment per user per module

### 9.7 `legalLiteracyQuizAttempts`

| Column                | Type                                  | Notes |
| --------------------- | ------------------------------------- | ----- |
| `id`                  | `uuid` PK                             |       |
| `quizId`              | `uuid` FK → `legalLiteracyQuizzes.id` |       |
| `userId`              | `uuid` FK → `users.id`                |       |
| `selectedOptionIndex` | `integer` NOT NULL                    |       |
| `isCorrect`           | `boolean` NOT NULL                    |       |
| `createdAt`           | `timestamp`                           |       |

**Note on blog/legal_literacy merge:** The architecture review recommended a unified `content` table. This is deferred to Y2. For the pilot, the two domains are separate because the differences are real (legal literacy has quizzes, progress tracking, structured learning paths). The Y2 merge is a rename, not a rewrite, because the current schemas use consistent conventions.

---

## 10. RBAC Domain

### 10.1 `roles`

| Column           | Type                   | Notes                                                             |
| ---------------- | ---------------------- | ----------------------------------------------------------------- |
| `id`             | `uuid` PK              |                                                                   |
| `name`           | `text` UNIQUE NOT NULL | `'admin'`, `'moderator'`, `'writer'`, `'lawyer'`, `'citizen'`     |
| `hierarchyLevel` | `text` NOT NULL        | `100`, `70`, `50`, `40`, `10` (stored as text, cast at read time) |
| `description`    | `text`                 |                                                                   |

**Note on hierarchy vs. grants:** The `hierarchyLevel` is for display and ordering only. It does NOT imply permission inheritance. All grants are explicit in the `rolePermissions` table. See [ADR-006](../ADRs.md#adr-006--casl-as-the-rbac-library).

### 10.2 `permissions`

| Column     | Type                   | Notes                                                        |
| ---------- | ---------------------- | ------------------------------------------------------------ |
| `id`       | `uuid` PK              |                                                              |
| `resource` | `text` NOT NULL        | `'Case'`, `'Evidence'`, `'Poll'`, etc.                       |
| `action`   | `text` NOT NULL        | `'read'`, `'create'`, `'update'`, `'delete'`, `'vote'`, etc. |
| `key`      | `text` UNIQUE NOT NULL | Denormalized `'cases:read'` for fast lookup                  |

### 10.3 `rolePermissions`

| Column         | Type                         | Notes |
| -------------- | ---------------------------- | ----- |
| `roleId`       | `uuid` FK → `roles.id`       |       |
| `permissionId` | `uuid` FK → `permissions.id` |       |

**Composite PK:** `(roleId, permissionId)`

### 10.4 `userPermissionOverrides`

Per-user permission overrides on top of role defaults. Kept intentionally (not over-engineering) for:

1. **Time-bounded grants** (e.g., temporary moderation powers during the election freeze)
2. **Specific grants without role escalation** (e.g., a writer with publish permission for a specific post without becoming a Blog Editor)
3. **Revocations without role change** (e.g., a specific lawyer temporarily suspended from publishing)

| Column          | Type                   | Notes                                                                 |
| --------------- | ---------------------- | --------------------------------------------------------------------- |
| `id`            | `uuid` PK              |                                                                       |
| `userId`        | `uuid` FK → `users.id` |                                                                       |
| `permissionKey` | `text` NOT NULL        | E.g., `'admin:moderation'`, `'-blog:publish'` (prefix `-` for revoke) |
| `effect`        | `text` NOT NULL        | `'grant'`, `'deny'`                                                   |
| `grantedBy`     | `uuid` FK → `users.id` | Admin who made the change                                             |
| `expiresAt`     | `timestamptz`          | Time-bounded override                                                 |
| `createdAt`     | `timestamp`            |                                                                       |

**The `users.role` column** remains the primary role assignment used by `defineAbilityFor()` in `lib/rbac/ability.ts`. The `roles` / `permissions` / `rolePermissions` tables exist to make permissions data-driven and auditable in the admin UI. The `userPermissionOverrides` table is the exception layer.

---

## 11. Moderation Domain (Cross-Cutting)

### 11.1 `moderationQueue` — The Unified Queue

The single queue for all moderation work. All flagged content (evidence, lawyer reviews, blog comments, UGC, poll comments) flows through this table.

| Column           | Type                                               | Notes                                                                                                                              |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `uuid` PK                                          |                                                                                                                                    |
| `contentType`    | `moderationContentTypeEnum` NOT NULL               | `'poll'`, `'poll_comment'`, `'evidence'`, `'lawyer_profile'`, `'lawyer_review'`, `'case_comment'`, `'blog_post'`, `'blog_comment'` |
| `contentId`      | `uuid` NOT NULL                                    | The ID of the moderated object                                                                                                     |
| `trigger`        | `text` NOT NULL                                    | `'automated_detection'`, `'user_report'`, `'ai_high_confidence'`, `'new_user_first_upload'`                                        |
| `status`         | `moderationStatusEnum` NOT NULL DEFAULT `'queued'` | `'queued'`, `'approved'`, `'removed'`, `'escalated'`                                                                               |
| `assignedTo`     | `uuid` FK → `users.id`                             | Moderator                                                                                                                          |
| `decision`       | `text`                                             |                                                                                                                                    |
| `decisionReason` | `text`                                             |                                                                                                                                    |
| `decidedAt`      | `timestamptz`                                      |                                                                                                                                    |
| `createdAt`      | `timestamp`                                        |                                                                                                                                    |

**Indexes:** `(status, content_type)`, `(assigned_to, status)`

**The unified queue design:** The architecture review identified `evidenceReviewQueue` and `lawyerReviewAppeals` as redundant tables. This design eliminates both. Evidence AI flags become a `moderationQueue` row with `contentType = 'evidence'` and `trigger = 'ai_high_confidence'`. Lawyer review appeals become a `moderationAppeals` row referencing the `lawyer_review` queue item.

### 11.2 `moderationAppeals`

| Column              | Type                                | Notes                                                             |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `id`                | `uuid` PK                           |                                                                   |
| `moderationQueueId` | `uuid` FK → `moderationQueue.id`    | The decision being appealed                                       |
| `submittedBy`       | `uuid` FK → `users.id`              | The appellant                                                     |
| `reason`            | `text` NOT NULL                     |                                                                   |
| `status`            | `text` NOT NULL DEFAULT `'pending'` | `'pending'`, `'upheld'`, `'overturned'`                           |
| `reviewedBy`        | `uuid` FK → `users.id`              | Senior moderator (must be different from original decision-maker) |
| `createdAt`         | `timestamp`                         |                                                                   |

**Reviewer reassignment:** The appeal must be decided by a moderator different from the one who made the original decision. This is enforced at the application layer (the queue doesn't show appeals to the original decision-maker).

---

## 12. Audit Domain

### 12.1 `auditLogs` — The Unified Audit Log

**Changed from the v1.1.0 conceptual draft:** This table replaces the earlier split between `audit_log` and `admin_audit_log`. The `actor_type` and `category` fields enable access control without separate tables.

| Column         | Type                                | Notes                                                                              |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `id`           | `uuid` PK                           |                                                                                    |
| `userId`       | `uuid` FK → `users.id`              | NULL for system actions                                                            |
| `action`       | `text` NOT NULL                     | E.g., `'case:updated'`, `'evidence:verified'`, `'rbac:denied'`                     |
| `resourceType` | `text` NOT NULL                     |                                                                                    |
| `resourceId`   | `uuid`                              |                                                                                    |
| `actorType`    | `text` NOT NULL DEFAULT `'USER'`    | `'USER'`, `'ADMIN'`, `'SYSTEM'` — for access control                               |
| `category`     | `text` NOT NULL DEFAULT `'GENERAL'` | `'GENERAL'`, `'ADMIN'`, `'SECURITY'`, `'USER'`, `'FINANCIAL'` — for access control |
| `severity`     | `text` NOT NULL DEFAULT `'INFO'`    | `'INFO'`, `'WARN'`, `'CRITICAL'`                                                   |
| `metadata`     | `jsonb`                             | Action-specific data                                                               |
| `ipAddress`    | `text`                              |                                                                                    |
| `requestId`    | `text`                              | For correlation across logs                                                        |
| `createdAt`    | `timestamp`                         |                                                                                    |

**Indexes:** `(userId, createdAt)`, `(resourceType, resourceId)`, `(category, createdAt)`, `(severity, createdAt)`

**Append-only:** the table is not edited or deleted (except for DSAR-driven deletion, which is itself logged).

**Access control:** Only admins can query `category = 'ADMIN'`. This is enforced at the query layer (views or row-level security policies).

---

## 13. Files Domain (Unified File Storage)

### 13.1 `files`

The unified file storage table. All uploaded assets (evidence, profile photos, blog images, verification documents) reference this table.

| Column                   | Type                               | Notes                                                                                                   |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `id`                     | `uuid` PK                          |                                                                                                         |
| `uploaderId`             | `uuid` FK → `users.id`             |                                                                                                         |
| `originalFilename`       | `text` NOT NULL                    |                                                                                                         |
| `mimeType`               | `text` NOT NULL                    |                                                                                                         |
| `fileSizeBytes`          | `bigint` NOT NULL                  |                                                                                                         |
| `sha256Hash`             | `text`                             | For files where integrity matters (evidence, verification docs)                                         |
| `storageProvider`        | `text` NOT NULL DEFAULT `'bunny'`  | `'bunny'`, `'imagekit'`, future providers                                                               |
| `storageKey`             | `text` NOT NULL                    | Path/key within the provider's bucket                                                                   |
| `storageUrl`             | `text` NOT NULL                    | CDN-resolvable URL                                                                                      |
| `purpose`                | `text` NOT NULL                    | `'EVIDENCE'`, `'PROFILE_PHOTO'`, `'BLOG_IMAGE'`, `'MODULE_IMAGE'`, `'VERIFICATION_DOCUMENT'`, `'OTHER'` |
| `expiresAt`              | `timestamptz`                      | For time-bounded files (e.g., DSAR exports)                                                             |
| `deletedAt`              | `timestamptz`                      | Soft delete                                                                                             |
| `isQuarantined`          | `boolean` NOT NULL DEFAULT `false` | Set on integrity mismatch                                                                               |
| `quarantineReason`       | `text`                             |                                                                                                         |
| `createdAt`, `updatedAt` | timestamps                         |                                                                                                         |

**Indexes:** `uploaderId`, `purpose`, `sha256Hash` (for integrity), `storageKey` UNIQUE, `expiresAt` (for cleanup)

**Why this table:** Previously, each table that needed a file had its own `storage_path` string. This led to duplicated storage metadata, no unified integrity verification, and no unified retention policy. The `files` table unifies all of this.

---

## 14. Notifications Domain

### 14.1 `notifications`

| Column      | Type                   | Notes                                                                   |
| ----------- | ---------------------- | ----------------------------------------------------------------------- |
| `id`        | `uuid` PK              |                                                                         |
| `userId`    | `uuid` FK → `users.id` |                                                                         |
| `type`      | `text` NOT NULL        | `'POLL_PUBLISHED'`, `'MATCH_RECEIVED'`, `'CONSULTATION_REMINDER'`, etc. |
| `title`     | `text` NOT NULL        |                                                                         |
| `body`      | `text`                 |                                                                         |
| `link`      | `text`                 | URL to the relevant page                                                |
| `readAt`    | `timestamptz`          |                                                                         |
| `createdAt` | `timestamp`            |                                                                         |

### 14.2 `notificationPreferences`

| Column      | Type                              | Notes                 |
| ----------- | --------------------------------- | --------------------- |
| `id`        | `uuid` PK                         |                       |
| `userId`    | `uuid` FK → `users.id`            |                       |
| `eventType` | `text` NOT NULL                   |                       |
| `channel`   | `text` NOT NULL                   | `'IN_APP'`, `'EMAIL'` |
| `enabled`   | `boolean` NOT NULL DEFAULT `true` |                       |

**Unique:** `(userId, eventType, channel)`

### 14.3 `notificationQueue`

Async outbox for email delivery. Workers process the queue and send emails.

| Column           | Type                                   | Notes                                              |
| ---------------- | -------------------------------------- | -------------------------------------------------- |
| `id`             | `uuid` PK                              |                                                    |
| `userId`         | `uuid` FK → `users.id`                 |                                                    |
| `notificationId` | `uuid` FK → `notifications.id`         | If the email corresponds to an in-app notification |
| `eventType`      | `text` NOT NULL                        |                                                    |
| `payload`        | `jsonb` NOT NULL                       | Email template variables                           |
| `status`         | `text` NOT NULL DEFAULT `'PENDING'`    | `'PENDING'`, `'SENT'`, `'FAILED'`, `'CANCELLED'`   |
| `attempts`       | `integer` NOT NULL DEFAULT `0`         |                                                    |
| `maxAttempts`    | `integer` NOT NULL DEFAULT `3`         |                                                    |
| `lastError`      | `text`                                 |                                                    |
| `scheduledAt`    | `timestamptz` NOT NULL DEFAULT `now()` |                                                    |
| `sentAt`         | `timestamptz`                          |                                                    |

**Indexes:** `(status, scheduledAt)` (for workers), `userId`

---

## 15. Background Jobs Domain

### 15.1 `jobs`

| Column                     | Type                                   | Notes                                                              |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `id`                       | `uuid` PK                              |                                                                    |
| `type`                     | `text` NOT NULL                        | `'NIGHTLY_BACKUP'`, `'EMAIL_DELIVERY'`, `'AI_REANALYSIS'`, etc.    |
| `payload`                  | `jsonb` NOT NULL                       |                                                                    |
| `status`                   | `text` NOT NULL DEFAULT `'PENDING'`    | `'PENDING'`, `'RUNNING'`, `'COMPLETED'`, `'FAILED'`, `'CANCELLED'` |
| `priority`                 | `integer` NOT NULL DEFAULT `0`         | Higher = more urgent                                               |
| `attempts`                 | `integer` NOT NULL DEFAULT `0`         |                                                                    |
| `maxAttempts`              | `integer` NOT NULL DEFAULT `3`         |                                                                    |
| `lastError`                | `text`                                 |                                                                    |
| `scheduledAt`              | `timestamptz` NOT NULL DEFAULT `now()` |                                                                    |
| `startedAt`, `completedAt` | `timestamptz`                          |                                                                    |
| `createdAt`                | `timestamp`                            |                                                                    |

**Indexes:** `(status, scheduledAt)`, `type`

### 15.2 `jobLogs`

| Column      | Type                  | Notes                                    |
| ----------- | --------------------- | ---------------------------------------- |
| `id`        | `uuid` PK             |                                          |
| `jobId`     | `uuid` FK → `jobs.id` |                                          |
| `level`     | `text` NOT NULL       | `'DEBUG'`, `'INFO'`, `'WARN'`, `'ERROR'` |
| `message`   | `text` NOT NULL       |                                          |
| `metadata`  | `jsonb`               |                                          |
| `createdAt` | `timestamp`           |                                          |

---

## 16. Webhooks Domain

### 16.1 `webhooks`

| Column            | Type                              | Notes                                                |
| ----------------- | --------------------------------- | ---------------------------------------------------- |
| `id`              | `uuid` PK                         |                                                      |
| `name`            | `text` NOT NULL                   | Human-readable name                                  |
| `url`             | `text` NOT NULL                   | The endpoint URL                                     |
| `events`          | `jsonb` NOT NULL                  | `['subscription.created', 'subscription.cancelled']` |
| `secret`          | `text` NOT NULL                   | For HMAC signature verification                      |
| `isActive`        | `boolean` NOT NULL DEFAULT `true` |                                                      |
| `createdBy`       | `uuid` FK → `users.id`            |                                                      |
| `createdAt`       | `timestamp`                       |                                                      |
| `lastTriggeredAt` | `timestamptz`                     |                                                      |

### 16.2 `webhookEvents`

| Column        | Type                                | Notes                                                 |
| ------------- | ----------------------------------- | ----------------------------------------------------- |
| `id`          | `uuid` PK                           |                                                       |
| `webhookId`   | `uuid` FK → `webhooks.id`           |                                                       |
| `eventType`   | `text` NOT NULL                     |                                                       |
| `payload`     | `jsonb` NOT NULL                    |                                                       |
| `status`      | `text` NOT NULL DEFAULT `'PENDING'` | `'PENDING'`, `'DELIVERED'`, `'FAILED'`, `'CANCELLED'` |
| `attempts`    | `integer` NOT NULL DEFAULT `0`      |                                                       |
| `maxAttempts` | `integer` NOT NULL DEFAULT `5`      |                                                       |
| `lastError`   | `text`                              |                                                       |
| `deliveredAt` | `timestamptz`                       |                                                       |
| `createdAt`   | `timestamp`                         |                                                       |

---

## 17. Integrations Domain

### 17.1 `apiKeys`

Third-party integration key management.

| Column               | Type                              | Notes                                                            |
| -------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `id`                 | `uuid` PK                         |                                                                  |
| `name`               | `text` NOT NULL                   | E.g., `'Paystack Production'`, `'NIMC Sandbox'`                  |
| `provider`           | `text` NOT NULL                   | `'paystack'`, `'nimc'`, `'onfido'`, `'cloudflare_r2'`, `'other'` |
| `environment`        | `text` NOT NULL                   | `'production'`, `'staging'`, `'development'`, `'sandbox'`        |
| `keyId`              | `text` NOT NULL                   | The public key/ID                                                |
| `keySecretEncrypted` | `text` NOT NULL                   | Encrypted secret (never stored plaintext)                        |
| `isActive`           | `boolean` NOT NULL DEFAULT `true` |                                                                  |
| `expiresAt`          | `timestamptz`                     | For time-bounded keys                                            |
| `lastRotatedAt`      | `timestamptz`                     |                                                                  |
| `lastUsedAt`         | `timestamptz`                     |                                                                  |
| `createdBy`          | `uuid` FK → `users.id`            |                                                                  |
| `createdAt`          | `timestamp`                       |                                                                  |

**Unique:** `(provider, environment, keyId)`

**Note:** For the pilot, environment variables are sufficient for these keys. This table is for Y2 when we need key rotation, revocation, or per-integration rate limiting.

---

## 18. Settings Domain

### 18.1 `settings`

The unified settings table. Replaces the earlier `system_config` and `feature_flags` tables.

| Column        | Type                            | Notes                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------- |
| `key`         | `text` PK                       | E.g., `'posts_per_page'`, `'feature_flag:polling'`      |
| `value`       | `jsonb` NOT NULL                | The typed value (boolean, integer, string, object)      |
| `type`        | `text` NOT NULL                 | `'boolean'`, `'integer'`, `'string'`, `'json'`          |
| `category`    | `text` NOT NULL                 | `'system_config'`, `'feature_flag'`, `'limits'`, `'ui'` |
| `environment` | `text` NOT NULL DEFAULT `'all'` | `'all'`, `'development'`, `'staging'`, `'production'`   |
| `description` | `text`                          | What this setting does                                  |
| `updatedBy`   | `uuid` FK → `users.id`          |                                                         |
| `updatedAt`   | `timestamp`                     |                                                         |

**Indexes:** `category`, `environment`

**Feature flags:** `category = 'feature_flag'`. The toggle is a boolean in the `value` field. Feature flags must have a documented rollback plan before toggling (per [Engineering.md §11](./Engineering.md#11-code-review)).

---

## 19. Analytics Domain

### 19.1 `contentAnalytics`

| Column               | Type                           | Notes                                    |
| -------------------- | ------------------------------ | ---------------------------------------- |
| `id`                 | `uuid` PK                      |                                          |
| `contentType`        | `text` NOT NULL                | `'BLOG_POST'`, `'LEGAL_LITERACY_MODULE'` |
| `contentId`          | `uuid` NOT NULL                |                                          |
| `views`              | `integer` NOT NULL DEFAULT `0` |                                          |
| `readCompletions`    | `integer` NOT NULL DEFAULT `0` | Read > 50% of content                    |
| `avgReadTimeSeconds` | `integer` NOT NULL DEFAULT `0` |                                          |
| `date`               | `date` NOT NULL                |                                          |

**Unique:** `(contentType, contentId, date)`

### 19.2 `analyticsEvents` (Y2)

For Y2, the proper pattern is events → aggregation → rollups. For the pilot, the application writes directly to `contentAnalytics` (low volume).

---

## 20. Operational Tables

### 20.1 `operationalAlerts`

| Column                             | Type                          | Notes                                        |
| ---------------------------------- | ----------------------------- | -------------------------------------------- |
| `id`                               | `uuid` PK                     |                                              |
| `alertType`                        | `text` NOT NULL               | E.g., `'SLA_BREACH'`, `'INTEGRITY_MISMATCH'` |
| `severity`                         | `text` NOT NULL               | `'INFO'`, `'WARNING'`, `'CRITICAL'`          |
| `message`                          | `text` NOT NULL               |                                              |
| `details`                          | `jsonb` NOT NULL DEFAULT `{}` |                                              |
| `createdAt`                        | `timestamp`                   |                                              |
| `acknowledgedAt`, `acknowledgedBy` |                               |                                              |
| `resolvedAt`                       | `timestamptz`                 |                                              |

### 20.2 `transparencyReportData`

| Column         | Type                                   | Notes                |
| -------------- | -------------------------------------- | -------------------- |
| `id`           | `uuid` PK                              |                      |
| `reportPeriod` | `text` UNIQUE NOT NULL                 | E.g., `'2026-Q3'`    |
| `data`         | `jsonb` NOT NULL                       | The full report data |
| `generatedAt`  | `timestamptz` NOT NULL DEFAULT `now()` |                      |
| `publishedAt`  | `timestamptz`                          |                      |
| `publishedBy`  | `uuid` FK → `users.id`                 |                      |

---

## 21. SQLite Cache and Rate Limit

The cache and rate limit layers use SQLite (managed via `bun:sql`). These are **separate from PostgreSQL** — they're operational stores, not business data. For the full schema, see [DB_SCHEMA.md §4](./DB_SCHEMA.md#4-sqlite-stores-cache--rate-limit).

### 21.1 `cache_entries` (SQLite)

The generic cache table. All cache types use this table with a `cache_type` discriminator:

| `cache_type`         | Purpose                         |
| -------------------- | ------------------------------- |
| `session`            | JWT revocation list             |
| `verification`       | Verification cache (30-day TTL) |
| `poll_results`       | Aggregated poll results         |
| `confidence_results` | Aggregated confidence results   |
| `rbac`               | RBAC permission cache           |
| `config`             | System config cache             |
| `query`              | Database query cache            |
| `mdx`                | Compiled MDX cache              |
| `blog`               | Blog content cache              |

**Note:** This replaces the earlier specialized `poll_results_cache` and `confidence_results_cache` tables. The `cache_type` discriminator handles the type distinction.

### 21.2 `rate_limits` and `rate_limit_config` (SQLite)

See [DB_SCHEMA.md §4.2](./DB_SCHEMA.md#42-rate-limitdb).

---

## 22. Index Strategy

| Table              | Index                                               | Reason                   |
| ------------------ | --------------------------------------------------- | ------------------------ |
| `users`            | `email`                                             | Login                    |
| `users`            | `phone`                                             | SMS login                |
| `users`            | `(role, jurisdiction_id)`                           | RBAC queries             |
| `users`            | `(verification_status)`                             | Verification queue       |
| `users`            | `nin` (partial, where not null)                     | NIMC lookups             |
| `cases`            | `reference_number`                                  | Public reference lookup  |
| `cases`            | `(complainant_id, status)`                          | Dashboard                |
| `cases`            | `(respondent_id, status)`                           | Dashboard                |
| `cases`            | `(case_type, status)`                               | Filtering                |
| `evidence`         | `case_id`                                           | Case detail              |
| `evidence`         | `sha256_hash`                                       | Duplicate detection      |
| `evidence`         | `(integrity_status)`                                | Integrity issues         |
| `evidence`         | `(ai_flag_category, requires_human_review)`         | Moderation queue         |
| `poll_votes`       | `(poll_id, voter_token_hash)` UNIQUE                | One-vote enforcement     |
| `confidence_votes` | `(period_id, official_id, voter_token_hash)` UNIQUE | One-vote enforcement     |
| `blog_posts`       | `slug` UNIQUE                                       | Routing                  |
| `blog_posts`       | `(status, published_at)`                            | Published list           |
| `moderation_queue` | `(status, content_type)`                            | Moderator queue          |
| `audit_logs`       | `(user_id, created_at)`                             | User history             |
| `audit_logs`       | `(resource_type, resource_id)`                      | Investigation            |
| `audit_logs`       | `(category, created_at)`                            | Access control + cleanup |
| `audit_logs`       | `(severity, created_at)`                            | Alerting                 |
| `files`            | `uploader_id`                                       | User's files             |
| `files`            | `purpose`                                           | Purpose-based queries    |
| `files`            | `sha256_hash`                                       | Integrity verification   |
| `files`            | `storage_key` UNIQUE                                | Fast lookup              |
| `files`            | `expires_at`                                        | Cleanup                  |
| `notifications`    | `(user_id, read_at)`                                | Unread feed              |
| `jobs`             | `(status, scheduled_at)`                            | Worker polling           |
| `webhook_events`   | `webhook_id`                                        | Per-webhook history      |

---

## 23. Deferred Decisions (Y2 Evaluation)

The following decisions were deferred to Year 2. Document the evaluation criteria now so the Y2 team has a starting point.

| Decision                                                                 | Current State                                    | Y2 Evaluation Criteria                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Unified `content` table** (merge `blogPosts` + `legalLiteracyModules`) | Separate tables                                  | When the maintenance burden of two parallel content pipelines exceeds the complexity of a unified pipeline |
| **`files` table for user avatars and blog images**                       | Already implemented (all file types use `files`) | N/A — already done                                                                                         |
| **Per-user permission override** (`userPermissionOverrides`)             | Implemented                                      | Keep — the override layer is a security feature, not over-engineering                                      |
| **`matches` → `case_assignments`** rename                                | Kept as `lawyerCaseMatches`                      | When we add mediators, paralegals, or other participant types                                              |
| **`newsletterSubscribers` → `contacts`** migration                       | Kept as `newsletterSubscribers`                  | When we add marketing contacts, lawyer outreach, beta tester lists                                         |
| **`analyticsEvents` table**                                              | Y2                                               | When the volume of analytics events exceeds what direct writes can handle                                  |
| **Redis** (replacing SQLite cache)                                       | SQLite via `bun:sql`                             | When multi-instance cache coherence becomes a bottleneck                                                   |
| **Managed PostgreSQL** (e.g., RDS)                                       | Self-hosted VPS                                  | When operational complexity exceeds the team capacity, subject to NDPR constraints                         |

---

## 24. Migration Order

When applying migrations, the order matters because of foreign key constraints:

1. `jurisdictions` (no dependencies)
2. `users` (depends on `jurisdictions`)
3. `verificationRecords` (depends on `users`)
4. `files` (no dependencies; can be referenced by many tables)
5. `polls` and `pollOptions` (depend on `users` and `jurisdictions`)
6. `pollVotes` (depends on `polls` and `pollOptions`) — **no `userId` column**
7. `officials` and `confidenceVotePeriods` (depend on `users` and `jurisdictions`)
8. `confidenceVotes` (depends on `confidenceVotePeriods` and `officials`) — **no `userId` column**
9. `cases` (depends on `users`, `lawyers`, `jurisdictions`)
10. `evidence` and `evidenceAccessLog` (depend on `cases`, `users`, `files`)
11. `lawyers`, `lawyerFees`, `lawyerReviews`, `lawyerCaseMatches` (depend on `users`, `cases`)
12. `blogPosts`, `blogComments`, `newsletterSubscribers` (depend on `users`, `files`)
13. `legalLiteracyModules`, `legalLiteracyQuizzes`, `legalLiteracyEnrollments`, `legalLiteracyQuizAttempts` (depend on `users`, `files`)
14. `roles`, `permissions`, `rolePermissions`, `userPermissionOverrides` (depend on `users`)
15. `moderationQueue`, `moderationAppeals` (depend on `users`)
16. `auditLogs` (depends on `users`)
17. `notifications`, `notificationPreferences`, `notificationQueue` (depend on `users`)
18. `jobs`, `jobLogs` (no foreign key dependencies)
19. `webhooks`, `webhookEvents` (depend on `users`)
20. `apiKeys` (depends on `users`)
21. `settings` (no foreign key dependencies)
22. `operationalAlerts`, `transparencyReportData` (depend on `users`)

---

## Appendix A: Tables by Domain

| Domain                                  | Tables                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity                                | `users`, `jurisdictions`, `verificationRecords`                                                                                                               |
| Polls (Pillar 1)                        | `polls`, `pollOptions`, `pollVotes`                                                                                                                           |
| Officials & Confidence Votes (Pillar 1) | `officials`, `confidenceVotePeriods`, `confidenceVotes`                                                                                                       |
| Cases                                   | `cases`                                                                                                                                                       |
| Evidence (Pillar 2)                     | `evidence`, `evidenceAccessLog`                                                                                                                               |
| Lawyers (Pillar 3)                      | `lawyers`, `lawyerFees`, `lawyerReviews`, `lawyerCaseMatches`                                                                                                 |
| Content                                 | `blogPosts`, `blogComments`, `newsletterSubscribers`, `legalLiteracyModules`, `legalLiteracyQuizzes`, `legalLiteracyEnrollments`, `legalLiteracyQuizAttempts` |
| RBAC                                    | `roles`, `permissions`, `rolePermissions`, `userPermissionOverrides`                                                                                          |
| Moderation                              | `moderationQueue`, `moderationAppeals`                                                                                                                        |
| Audit                                   | `auditLogs`                                                                                                                                                   |
| Files                                   | `files`                                                                                                                                                       |
| Notifications                           | `notifications`, `notificationPreferences`, `notificationQueue`                                                                                               |
| Jobs                                    | `jobs`, `jobLogs`                                                                                                                                             |
| Webhooks                                | `webhooks`, `webhookEvents`                                                                                                                                   |
| Integrations                            | `apiKeys`                                                                                                                                                     |
| Settings                                | `settings`                                                                                                                                                    |
| Analytics                               | `contentAnalytics` (current), `analyticsEvents` (Y2)                                                                                                          |
| Operational                             | `operationalAlerts`, `transparencyReportData`                                                                                                                 |

## Appendix B: Glossary

- **AB** — Advisory Board
- **AI** — Artificial Intelligence
- **DSAR** — Data Subject Access Request
- **GC** — Grievance Committee
- **JSON** — JavaScript Object Notation
- **JWT** — JSON Web Token
- **LGA** — Local Government Area
- **MDX** — Markdown with JSX
- **NBA** — Nigerian Bar Association
- **NDPR** — Nigeria Data Protection Regulation
- **NIN** — National Identification Number
- **NVS** — National Verification Service (NIMC)
- **RBAC** — Role-Based Access Control
- **SHA-256** — Secure Hash Algorithm 256-bit
- **SLA** — Service Level Agreement
- **UUID** — Universally Unique Identifier
- **UGC** — User-Generated Content
- **YAGNI** — You Aren't Gonna Need It

## Appendix C: Related Documents

- [DB_SCHEMA.md](./DB_SCHEMA.md) — the canonical Drizzle ORM definitions
- [ARCHITECTURE.md](../ARCHITECTURE.md) — the high-level architecture
- [Engineering.md §8](./Engineering.md#8-database-migrations) — the migration workflow
- [Security.md](../technical/Security.md) — the security architecture
- [Module Specs](../modules/) — each module has a data model section

## Appendix D: Database Architecture Revision History

| Version | Date       | Author           | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-07-20 | Engineering Lead | Fresh rewrite. This document replaces the earlier conceptual drafts. The schema is now consistent with the canonical Drizzle implementation in `DB_SCHEMA.md`. Key changes from the v1.1.0 conceptual draft: (1) UUID primary keys (not prefixed text IDs) to match the actual implementation; (2) `poll_votes` and `confidence_votes` store `voterTokenHash` (not `userId`) to implement [ADR-009](../ADRs.md#adr-009--voter-anonymization-via-hash-without-user-id) — this is the most important change; (3) the new tables from the architecture review (files, notifications, jobs, webhooks, api_keys) are included with full Drizzle conventions; (4) the moderation queue is the unified model with `contentType` and `trigger` fields; (5) the audit log includes `actor_type`, `category`, and `severity` for access control and alerting; (6) the RBAC design uses the normalized `roles` / `permissions` / `rolePermissions` / `userPermissionOverrides` structure. This document is the conceptual reference; `DB_SCHEMA.md` is the implementation reference. |
