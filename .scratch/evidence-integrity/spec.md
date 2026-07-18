# Spec: Evidence Integrity Pipeline

Status: ready-for-agent

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Section 4.2). This spec covers **chain-of-custody integrity only**. AI-powered manipulation / deepfake detection (Section 4.3) is explicitly out of scope.

## Problem Statement

A citizen uploads a file (photo, video, audio, or document) as evidence for a civil dispute. They — and later, a lawyer, moderator, or the other party — need confidence that the file they are looking at is byte-for-byte the same file that was originally uploaded, and has not been silently altered afterwards. Today there is no way to prove a stored file hasn't been tampered with, which undermines the platform's core promise of evidence integrity.

## Solution

When a file is uploaded, the platform computes a cryptographic fingerprint (SHA-256) of its exact bytes and records an immutable, timestamped custody record. Every subsequent time the file is accessed, the platform re-computes the fingerprint and compares it to the original. The user is shown a clear status:

- **Verified** — the file matches its original upload (green badge)
- **Altered** — the file no longer matches (red warning)
- **Pending** — verification is in progress
- **Not applicable** — unsupported file type

Every upload, verification, and access event is written to an append-only audit trail so custody can be reconstructed later.

## User Stories

1. As a citizen, I want to upload an evidence file, so that I can submit proof relevant to my dispute.
2. As a citizen, I want the platform to fingerprint my file at the moment of upload, so that its original state is provably captured.
3. As a citizen, I want an immutable timestamp recorded for my upload, so that there is a verifiable record of when the evidence entered the system.
4. As a citizen, I want to see a "Verified" badge when my file is intact, so that I trust the evidence has not been altered.
5. As a citizen, I want to see a clear "Altered" warning if my file no longer matches its fingerprint, so that I am not misled by tampered evidence.
6. As a citizen, I want to see a "Pending" indicator while verification is running, so that I understand the status is not yet final.
7. As a citizen, I want unsupported file types to be clearly marked "Not applicable" for hash verification, so that I am not falsely reassured.
8. As a citizen, I want to upload images (JPG, PNG, WebP), so that I can submit photographic evidence.
9. As a citizen, I want to upload video (MP4, AVI, WebM), so that I can submit recorded evidence.
10. As a citizen, I want to upload audio (MP3, WAV, M4A), so that I can submit voice or sound evidence.
11. As a citizen, I want to upload documents (PDF, DOCX, TXT), so that I can submit written evidence.
12. As a citizen, I want oversized or unsupported uploads to be rejected with a clear reason, so that I know how to correct the problem.
13. As a lawyer, I want to re-verify a piece of evidence on demand, so that I can confirm its integrity before relying on it.
14. As a lawyer, I want to view the audit trail for a piece of evidence, so that I can understand its full chain of custody.
15. As a moderator, I want to see when a file's verification transitions to "Altered", so that I can investigate potential tampering.
16. As a moderator, I want every access event logged, so that I can audit who viewed which evidence and when.
17. As a citizen, I want evidence to be associated with a specific case and with me as the uploader, so that ownership and relevance are recorded.
18. As the platform, I want to prevent modification or deletion of custody records, so that the integrity guarantee cannot be quietly circumvented.
19. As the platform, I want re-verification to be idempotent and side-effect-free apart from logging, so that repeated checks do not corrupt state.
20. As a citizen, I want verification results to reflect the exact bytes stored, so that a legitimate re-encoding of a different file is never mistaken for my original.
21. As a developer, I want the integrity logic to live in a single service, so that both the web app and the mobile/public API get identical behavior.

## Implementation Decisions

**Modules built (new — greenfield):**

- `services/evidence.service.ts` — the single source of truth for all evidence-integrity behavior. Public surface (framework-agnostic):
  - `uploadEvidence({ caseId, uploaderId, filename, mimeType, bytes }) -> EvidenceRecord` — validates type/size, computes SHA-256 over the raw bytes, persists file via the storage collaborator, writes the evidence row and an append-only `uploaded` audit event, returns the record with `verificationStatus`.
  - `verifyEvidence({ evidenceId }) -> VerificationResult` — loads the stored bytes, re-hashes, compares to the stored original hash, writes a `verified` audit event capturing the outcome, returns `{ status: "verified" | "altered" | "not_applicable" | "pending" }`. Idempotent; never mutates the original hash.
  - `getAuditTrail({ evidenceId }) -> AuditEvent[]` — returns the append-only event log in chronological order. Writes an `accessed` audit event.
  - `recordAccess({ evidenceId, actorId }) -> void` — appends an `accessed` audit event (used when the file bytes are served).

- `db/schema/` — two tables:
  - `evidence`: `id`, `case_id` (FK), `uploader_id` (FK), `filename`, `mime_type`, `size_bytes`, `sha256_hash`, `storage_key`, `verification_status`, `created_at`. Immutable after insert except `verification_status` (a derived cache; the source of truth is re-hashing).
  - `evidence_audit_events`: `id`, `evidence_id` (FK), `event_type` (`uploaded` | `verified` | `accessed`), `actor_id`, `outcome` (nullable; for `verified`: `verified`/`altered`/`not_applicable`), `created_at`. Append-only — no update/delete paths exposed.

- `lib/validation/` — a shared schema for upload input (allowed MIME types, max size), reused by web actions and API routes so validation is not duplicated.

**Collaborators (injected for testability):**

- **File storage** — an interface (`put(key, bytes)`, `get(key) -> bytes`, `exists(key)`). Production impl targets the CDN/object store; tests inject an in-memory fake.
- **Clock** — a `now() -> Date` function injected so timestamps are deterministic in tests. Production uses the system clock.

**Behavioral decisions:**

- Hashing is **SHA-256 over the exact uploaded bytes**, computed before any transformation. No re-encoding, resizing, or normalization of media prior to hashing.
- `verification_status` on the row is a cached convenience value; the authoritative answer always comes from re-hashing on `verifyEvidence`. "Altered" is reported whenever the re-hash differs from the stored original.
- Supported types map to `verifiable`; any other type resolves to `not_applicable` (hash still computed and stored, but the UI states hash verification does not apply per the doc's "Not Applicable" indicator).
- Audit events are strictly append-only. The service exposes no update or delete operation for evidence rows or audit events.
- The service performs all authorization-relevant identity capture (uploader/actor IDs) but access-control enforcement (who may call it) is the caller's responsibility, consistent with Section 6.1.3 (thin entry points do auth; services do business logic).

**Deferred to a later scaffolding ADR (not decided here):** concrete web framework, ORM, object-store provider, and runtime. The spec targets the Section 6 layered structure (`services/`, `db/`, `lib/validation/`) generically.

## Testing Decisions

**What makes a good test here:** assert only external, observable behavior of `evidence.service.ts` — the returned records/results and the audit-trail contents. Do not assert on internal helpers, SQL, or storage-key formats.

**Seam:** the single service-layer seam (`evidence.service.ts`). Tests call the service functions directly (no HTTP), with:
- the **in-memory fake file storage** (so we can simulate tampering by overwriting stored bytes),
- an **injected fixed clock** (so timestamps are assertable),
- a **real test Postgres** so append-only constraints and uniqueness/immutability are genuinely exercised.

**Modules tested:** `evidence.service.ts` (the only unit under test). The DB and storage are collaborators, not separately unit-tested here.

**Representative test cases:**
- Upload a supported image → status `verified`, one `uploaded` audit event, hash present.
- Upload then immediately `verifyEvidence` → `verified`.
- Upload, then overwrite the stored bytes via the fake storage, then `verifyEvidence` → `altered`, and an `verified`-type audit event with outcome `altered`.
- Upload an unsupported type → status `not_applicable`.
- Upload exceeding max size / disallowed MIME → rejected with a clear validation error, no evidence row created.
- `verifyEvidence` twice → identical result both times; two `verified` audit events; original hash unchanged (idempotency).
- `getAuditTrail` returns events in chronological order and includes `uploaded`, `verified`, and `accessed` events after the relevant calls.
- Two different files never collide on status/hash (distinct hashes).

**Prior art:** none yet (greenfield). This spec's test module establishes the pattern (direct service calls + injected collaborators + test DB) that later slices should follow.

## Out of Scope

- **AI-powered manipulation / deepfake detection** (Section 4.3) entirely — no confidence scores, no model versions, no ensemble scoring.
- The visual UI itself (badge components); this spec covers the service behavior and the status values the UI will render. Web/mobile presentation is a follow-up slice.
- Authentication and access-control enforcement (who is allowed to upload/verify) — captured as caller responsibility; the auth slice covers it.
- Encryption at rest and signed-URL delivery (Section 6.6.3) — a security-hardening slice, though the storage interface is designed to accommodate it later.
- File-type sniffing beyond declared MIME/extension validation (e.g. deep content inspection).
- Case management itself (cases are assumed to exist; `case_id` is a foreign key only).

## Further Notes

- This slice is deliberately chosen as the first buildable unit because it is self-contained, has objectively checkable correctness (SHA-256), carries no political/reputational risk, and establishes the services-layer + injected-collaborator + test-DB architecture that the rest of the platform will reuse.
- Recommended next slices in order: (1) auth + ID verification, (2) policy sentiment polls, (3) lawyer marketplace.
- Domain vocabulary: this spec introduces the terms **evidence record**, **custody record / audit event**, **verification status**, **integrity fingerprint (SHA-256 hash)**. These should be seeded into `CONTEXT.md` via `/domain-modeling` when the glossary is first written.
- When `/to-tickets` runs against this spec, each ticket file should land under `.scratch/evidence-integrity/issues/NN-<slug>.md`.
