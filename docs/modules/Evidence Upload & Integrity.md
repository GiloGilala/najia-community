# Module Spec — Evidence Upload & Integrity

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Moderation Lead*
*Parent PRD: [PRD.md §4.4](../product/PRD.md#44-evidence-integrity-pillar-2)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: file upload, SHA-256 hash generation, integrity verification, AI manipulation detection for image/video, human-review queue for High AI flags, evidence storage, evidence lifecycle. Out of scope: AI detection for audio, bulk upload, document signing (deferred to Year 2+).

---

## 1. Overview

### 1.1 Module Name

Evidence Upload & Integrity

### 1.2 Purpose

Provide verifiable integrity and AI-manipulation detection for files uploaded by verified citizens as evidence in civil disputes. The module addresses two distinct concerns:

1. **Chain-of-custody integrity** — ensuring uploaded files remain untampered from the moment of upload. This is a cryptographic guarantee.
2. **AI-manipulation detection** — flagging files that may have been synthetically generated or altered. This is a probabilistic assessment, not a verdict.

The two are handled separately because they serve different purposes, use different technologies, and carry different implications. A file can be integrity-verified but AI-flagged; a file can pass AI detection but fail integrity (if someone tampers with the file in storage). The UI must make this distinction clear to the user.

### 1.3 In Scope

- File upload (image, video, audio, document) with size and type validation
- SHA-256 hash generation on upload
- Append-only timestamp record at upload
- Secure storage of the file with hash and metadata
- Re-hash and compare on every access (integrity verification)
- AI manipulation detection for images (JPG, PNG, WebP) and videos (MP4, AVI, WebM)
- Multi-method AI ensemble: metadata analysis, visual artifact detection, audio-video sync (video only), facial inconsistency detection, generation watermarks
- AI confidence score (Low / Medium / High) with model version recorded
- Human-review queue for High AI confidence flags
- Evidence appeal flow (after human review)
- Evidence lifecycle (active, under review, restricted, deleted)
- Evidence association with cases (optional but recommended)
- Audit trail for all access events and all state changes
- Cache layer for hash lookups (to avoid re-hashing on every access)

### 1.4 Out of Scope

- **AI detection for audio only** — out of scope per [PLATFORM.md §4.3.2](../PLATFORM.md#432-scope). Audio deepfakes are a real risk but the detection complexity and cost are too high for the pilot. Integrity verification still applies to audio files.
- **Bulk upload** — single-file upload only in the pilot.
- **Folder organization** — flat list per user / per case.
- **In-platform document signing** — deferred.
- **Re-encryption or key rotation** — pilot uses platform-managed keys; rotation is a Year 2 concern.
- **File preview beyond basic thumbnails** — full preview is a Year 2 concern.
- **Video editing or annotation** — N/A.
- **Evidence from non-verified users** — N/A; unverified users cannot upload.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Evidence uploads (verified) | ≥ 500 | Count |
| Integrity verification rate | > 90% (i.e., < 10% of accesses find a hash mismatch, which would indicate a storage integrity issue) | Audit log |
| AI detection coverage (image/video) | 100% (every image/video goes through detection) | Pipeline metrics |
| AI detection high-confidence flag rate | < 5% (false positive concern; benchmark against known clean datasets) | Detection metrics |
| Human review SLA | 95% within 24 hours | Moderation queue metrics |
| User appeal rate (after human review) | < 10% | Audit log |
| Hash lookup cache hit rate | > 95% (for files that have been verified before) | Cache metrics |
| Evidence access P95 | < 300ms (cache hit) | Server-side timing |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Verified citizen | Upload a file as evidence | I can prove what happened | Must |
| Verified citizen | See a verified integrity badge on my file | I know it hasn't been changed | Must |
| Verified citizen | See an AI detection status (Low/Medium/High) on my file | I know if it may have been manipulated | Must |
| Verified citizen | Associate a file with a case | I can organize my evidence | Should |
| Verified citizen | Add a description and tags to a file | I can remember what it is later | Should |
| Verified citizen | Download a file with its hash and timestamp | I can use it outside the platform | Should |
| Verified citizen | Share a file with a matched lawyer | The lawyer can use it in my case | Must |
| Verified citizen | Appeal a human-review decision | I can challenge a wrong assessment | Should |
| Verified citizen | Delete a file I uploaded | I can remove evidence I no longer need | Should |
| Matched lawyer | View a citizen's evidence in an assigned case | I can advise on the case | Must |
| Moderator | Review a High AI confidence flag | I can decide if it's a real issue | Must |
| Moderator | Approve, restrict, or remove a flagged file | I can enforce the policy | Must |
| Admin | View the evidence pipeline metrics | I can monitor the system | Must |
| Admin | View the audit trail for any evidence file | I can investigate issues | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design) and the database spec. Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `evidence` | `id`, `uploader_id`, `case_id` (nullable), `filename`, `mime_type`, `file_size`, `sha256_hash`, `uploaded_at`, `storage_path`, `status`, `description`, `tags` (JSON array) | The file and its metadata |
| `evidence_integrity_log` | `id`, `evidence_id`, `hash_verified`, `hash_at_access`, `hash_at_upload`, `access_event` (read/delete/share/download), `accessed_by`, `accessed_at` | Every access logs both the expected and actual hash |
| `ai_detection_results` | `id`, `evidence_id`, `model_version`, `confidence_score`, `category` (LOW/MEDIUM/HIGH), `methods_used` (JSON), `raw_scores` (JSON), `detected_at`, `applicability` (whether AI detection was attempted at all) | The AI detection output, with full traceability |
| `evidence_review_queue` | `id`, `evidence_id`, `reason`, `assigned_to`, `status`, `decision`, `decided_at`, `notes` | The human-review queue for High AI flags (consumed by the Moderation module) |
| `evidence_appeals` | `id`, `evidence_id`, `user_id`, `appeal_text`, `status`, `decided_at`, `decision`, `notes` | User appeals of moderator decisions |
| `audit_log` | cross-cutting | All evidence state changes and all access events |

#### 3.1.1 The Hashing Pipeline

The hash generation is the foundation of the integrity guarantee. The pipeline:

1. User uploads a file
2. Server computes SHA-256 hash of the file bytes (in a streaming manner for large files)
3. Server stores the hash, the file size, the original filename, the MIME type, and the uploader's user ID
4. Server stores the file in the storage layer (Cloudflare R2, Bunny CDN, or local; see architecture §1.3) at `storage_path`
5. Server writes an `evidence_integrity_log` entry with `access_event = 'upload'`, `hash_at_access = hash_at_upload`
6. Server passes the file to the AI detection pipeline (for image/video only)
7. AI detection results are written to `ai_detection_results`
8. If AI detection result is `HIGH` confidence, the file is added to `evidence_review_queue` and `status` is set to `UNDER_REVIEW`
9. Otherwise, `status` is set to `ACTIVE` and the file is visible to the uploader and (if associated with a case) the matched lawyer

#### 3.1.2 The Re-Verification Pipeline

Every time the file is accessed, the server re-computes the SHA-256 hash and compares it to the stored hash. This catches any tampering that may have happened at the storage layer (corrupted file, malicious admin, storage layer compromise).

1. Access request comes in (read, download, share, delete)
2. Server fetches the file from storage
3. Server computes SHA-256 hash of the current bytes
4. Server compares to the stored hash
5. If match: proceed with the access
6. If mismatch: return `INTEGRITY_COMPROMISED` error, log the event, alert the admin, do NOT serve the file

The integrity log records both the expected and actual hash on every access. This is the audit trail for the integrity guarantee.

#### 3.1.3 The AI Detection Ensemble

AI detection uses an ensemble of methods. The specific methods and their applicability:

| Method | Description | Image | Video |
|--------|-------------|-------|-------|
| Metadata analysis | Examines file metadata for generation artifacts | Yes | Yes |
| Visual artifact detection | Detects pixel-level anomalies, compression patterns | Yes | Yes (per-frame) |
| Audio-video sync analysis | Checks lip sync and audio coherence | No | Yes |
| Facial inconsistency detection | Identifies inconsistent facial features, blending artifacts | Yes (if faces present) | Yes (if faces present) |
| Generation watermarks | Detects generation-time watermarks (limited coverage; depends on the generative model) | Yes (where applicable) | Yes (where applicable) |

The ensemble produces a confidence score (0–100) and a category:

- **Low (0–33):** Likely authentic. No human review needed.
- **Medium (34–66):** Possibly manipulated. No human review, but the user sees a clear explanation that the result is uncertain.
- **High (67–100):** Likely manipulated. Human review required before the file becomes visible to other users.

The model version is recorded with every result, so a file can always be re-analyzed when the model improves.

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `POST` | `/api/evidence/upload` | Upload a new evidence file | Authenticated | `evidence:create` |
| `GET` | `/api/evidence` | List the current user's evidence | Authenticated | `evidence:read` (own) |
| `GET` | `/api/evidence/:evidenceId` | Get evidence detail (with status, hash, AI result) | Authenticated | `evidence:read` (own or case-assigned lawyer) |
| `GET` | `/api/evidence/:evidenceId/download` | Download the file (with integrity check) | Authenticated | `evidence:read` (own or case-assigned lawyer) |
| `POST` | `/api/evidence/:evidenceId/share` | Share a file with a case (or a lawyer) | Authenticated | `evidence:read` + `evidence:update` (own) |
| `PUT` | `/api/evidence/:evidenceId` | Update description, tags, case association | Authenticated | `evidence:update` (own) |
| `POST` | `/api/evidence/:evidenceId/appeal` | Appeal a moderator decision | Authenticated | `evidence:appeal` (own) |
| `DELETE` | `/api/evidence/:evidenceId` | Delete (soft delete) the file | Authenticated | `evidence:delete` (own) |
| `GET` | `/api/evidence/:evidenceId/integrity-log` | Get the integrity audit log for a file | Authenticated | `evidence:read` (own) |
| `POST` | `/api/evidence/:evidenceId/reanalyze` | Re-run AI detection with the current model (rate-limited) | Authenticated | `evidence:update` (own) |
| `POST` | `/api/admin/evidence/review` | Review a High AI flag (approve/restrict/remove) | Authenticated | `admin:moderation` |
| `GET` | `/api/admin/evidence/review-queue` | Get the review queue | Authenticated | `admin:moderation` |
| `GET` | `/api/admin/evidence/pipeline-metrics` | Get AI detection pipeline metrics | Authenticated | `admin:system` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `evidenceListLoader` | Load the current user's evidence |
| `evidenceDetailLoader` | Load evidence detail with full status |
| `evidenceUploadAction` | Handle file upload from the web form |
| `evidenceDownloadAction` | Trigger a download (with integrity check) |
| `evidenceAppealAction` | Submit an appeal |
| `adminEvidenceReviewAction` | Review a flagged file |

### 3.3 Business Rules

1. **Only verified citizens can upload evidence.** Unverified users get a CTA to verify.
2. **A user can only upload files they own or have rights to.** This is a representation in the ToS; the platform does not technically verify ownership.
3. **File size limit is 100 MB.** Larger files are rejected.
4. **Supported file types:** images (JPG, PNG, WebP), video (MP4, AVI, WebM), audio (MP3, WAV, M4A), documents (PDF, DOCX, TXT). Unsupported types are rejected.
5. **Every upload generates a SHA-256 hash, a timestamp, and a storage path.** These are immutable.
6. **The hash is recomputed on every access.** A mismatch triggers `INTEGRITY_COMPROMISED` and is logged.
7. **AI detection is run on every image and video upload.** Audio and documents skip it; integrity-only.
8. **AI detection results are recorded with the model version.** A file can be re-analyzed with a newer model on user request (rate-limited to once per day per file).
9. **A High AI confidence flag puts the file in `UNDER_REVIEW` status.** It is not visible to anyone but the uploader and moderators until reviewed.
10. **A Medium AI confidence flag does not trigger human review** but the file is shown to the uploader with a clear explanation that the result is uncertain.
11. **A moderator's review can result in:** approve (file becomes `ACTIVE`), restrict (file becomes `RESTRICTED` — visible only to the uploader and assigned lawyer), or remove (file becomes `REMOVED` — visible only to the uploader as a stub).
12. **A user can appeal a moderator decision once.** A second appeal escalates to the Grievance Committee.
13. **A user can delete their own file at any time** (soft delete — the record is kept but the file is not served).
14. **Files are accessible to the matched lawyer in the associated case** but not to other lawyers.
15. **All access events are audit-logged at INFO level** (read, download, share, delete) and at WARN level (integrity mismatch, AI flag, moderator action).
16. **Hash values are never logged at INFO** (only at DEBUG in development). The hash itself is not sensitive, but the pattern of "this file with this hash was accessed at this time" could be a privacy concern at scale.

### 3.4 State Machine
UPLOAD_PENDING
│ file received, hash computed
▼
UPLOADED
│ AI detection runs (if applicable)
├─────────────────────┬──────────────────────┐
▼ ▼ ▼
ACTIVE UNDER_REVIEW (audio/document: skip AI)
│ │ │
│ moderator approves │ moderator decides ▼
│ (Low/Medium) │ approve ACTIVE
│ │ restrict (audio/document path)
│ │ remove
│ ▼
│ RESTRICTED / REMOVED
│ │
│ │ user appeals → moderator re-reviews
│ ▼
│ (back to ACTIVE / stays RESTRICTED / stays REMOVED)
│
│ user deletes
▼
DELETED (soft delete)

text


Terminal states: `DELETED`, `REMOVED`. Other states can transition back (e.g., `UNDER_REVIEW` → `ACTIVE` if moderator approves).

The state machine is enforced in `services/evidence.service.ts`. The DB is a store; the service is the rule-keeper.

### 3.5 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| File too large (> 100 MB) | "Files must be under 100 MB. Try a smaller file or contact support." | `FILE_TOO_LARGE` (413) |
| Unsupported file type | "We support images (JPG, PNG, WebP), video (MP4, AVI, WebM), audio (MP3, WAV, M4A), and documents (PDF, DOCX, TXT)." | `UNSUPPORTED_FILE_TYPE` (415) |
| Hash computation fails (corrupted upload) | "Your file couldn't be processed. Please try uploading again." | `HASH_COMPUTATION_FAILED` (422) |
| Storage layer failure | "We couldn't store your file right now. Please try again in a few minutes." | `STORAGE_UNAVAILABLE` (503) |
| AI detection API failure | "AI detection is temporarily unavailable. Your file is still verified for integrity." (Integrity status is shown; AI status shows "Detection unavailable" with a link to retry.) | `AI_DETECTION_UNAVAILABLE` (503) |
| Integrity mismatch on access | "This file's integrity could not be verified. It may have been modified. Please contact support." (The file is NOT served. The admin is alerted.) | `INTEGRITY_COMPROMISED` (500) |
| High AI confidence flag | The file is held in `UNDER_REVIEW`. The user sees: "Your file is being reviewed by a moderator. This usually takes up to 24 hours." | (Not an error; operational) |
| Medium AI confidence flag | The file is `ACTIVE`. The user sees both the integrity status and the AI status with a clear "probabilistic, not definitive" message. | (Not an error) |
| User tries to access a file they don't own | "You don't have permission to access this file." | `PERMISSION_DENIED` (403) |
| User tries to access a file in `UNDER_REVIEW` (not the uploader) | "This file is being reviewed and is not available." | `NOT_VISIBLE` (404) |
| User tries to delete a file in a closed case | "This file is part of a closed case. You cannot delete it. Contact support if you need to remove it." | `DELETION_BLOCKED` (409) |
| User re-analyzes the same file repeatedly | Rate-limited to once per day per file. After the limit: "You've recently re-analyzed this file. Try again in 24 hours." | `RATE_LIMITED` (429) |
| Storage layer corruption detected | File is moved to a quarantine bucket. Admin is alerted. The user is told the file is "temporarily unavailable." | `FILE_QUARANTINED` (503) |
| User uploads a file that is exactly at the size limit | Accepted (boundary condition; ≤ 100 MB) | — |
| User uploads a file with a hash that already exists for another user | This is allowed; it just means the same file was uploaded by two users. No PII is exposed; the hashes are public-safe. | — |
| User's storage quota exceeded (Year 2+) | "You've reached your storage limit. Delete old files or contact support." | `STORAGE_QUOTA_EXCEEDED` (507) — N/A in pilot |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `evidence:create` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` | Any verified user can upload evidence |
| `evidence:read` | `citizen` (own), `lawyer` (in assigned cases), `moderator` (all), `admin` (all) | The matrix: own for citizens, case-assigned for lawyers, all for moderators/admins |
| `evidence:update` | `citizen` (own), `moderator` (all) | Citizens can update description/tags; moderators update status |
| `evidence:delete` | `citizen` (own, soft delete) | Citizens soft-delete their own; hard delete requires admin |
| `evidence:appeal` | `citizen` (own) | Citizens can appeal moderator decisions on their own files |
| `evidence:verify` | `moderator`, `admin` | Moderators verify integrity and re-run analysis if needed |
| `evidence:quarantine` | `admin` | Admins quarantine files with integrity issues |
| `admin:moderation` | `moderator`, `admin` | Access to the review queue |
| `admin:system` | `admin` | Access to pipeline metrics |

The permission `evidence:read` has conditions: for citizens, it requires `{ uploaderId: user.id }`; for lawyers, it requires `{ case: { lawyerId: user.id } }`; for moderators and admins, no condition. This is the per-user condition CASL evaluates on each access.

---

## 5. User Experience

### 5.1 Key Screens

Reference [UX & Design.md §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot). The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 19 | Evidence home (my evidence) | Tunde | Yes | Yes |
| 20 | Evidence upload | Tunde | Yes | Yes |
| 21 | Evidence detail (with verification status) | Tunde | Yes | Yes |
| 22 | Evidence appeal | Tunde | Yes | Yes |
| (admin) | Evidence review queue | Kemi | Yes | Yes (staff) |

### 5.2 User Flows

Reference [User Journeys.md §8](../product/User%20Journeys.md#8-j6--citizen-uploads-evidence-and-verifies-it) for the J6 journey. This module implements J6.

### 5.3 The Two Statuses — Distinct UI

The integrity status and the AI detection status are **two different things** and must be displayed distinctly. The user must never confuse "the file hasn't been changed" with "the file is not AI-manipulated."

#### 5.3.1 Integrity Status

- **Verified** (green badge with shield-with-check icon): The file matches the hash recorded at upload.
- **Not verified** (red badge with shield-with-X icon): The file's current bytes don't match the upload hash. (This should never happen under normal operation; it indicates storage corruption or tampering.)
- **Pending** (gray badge): Verification in progress.
- **N/A** (gray badge): File type doesn't support hashing (N/A for the pilot; all supported types support hashing).

#### 5.3.2 AI Detection Status

- **Low (likely authentic)** (green badge with shield-with-check icon — same color as integrity Verified, but distinct icon): The ensemble did not detect manipulation. Note: this icon is intentionally similar to integrity Verified to signal "passed" but the wording and the context distinguish them.
- **Medium (possibly manipulated)** (yellow badge with shield-with-question icon): The ensemble detected some indicators. The file is `ACTIVE` but the user is shown a clear explanation.
- **High (likely manipulated)** (red badge with shield-with-warning icon): The ensemble strongly indicates manipulation. The file is in `UNDER_REVIEW`.
- **Detection unavailable** (gray badge): The AI service was down at upload time. The user can retry.

The wording accompanying each status must make the distinction clear:

- Integrity: "This file is verified. It has not been changed since you uploaded it."
- AI: "This file was [not flagged / flagged with medium confidence / flagged with high confidence] for AI manipulation. This is an automated check, not a definitive verdict."

The user is never told "this file is authentic" or "this file is a deepfake" — only the probabilistic status and the model version.

### 5.4 Accessibility

- All status badges have both color and icon and text (never color alone)
- File upload supports keyboard-only operation (file picker is reachable; the drop zone has a keyboard alternative)
- The "under review" state is announced to screen readers
- Integrity log is screen-reader friendly (it's a table with clear headers)

### 5.5 The Tunde Test

Beyond the general Amara test, this module has a specific sub-test:

> **Would Tunde understand the difference between "this file hasn't been changed" and "this file is not AI-manipulated"?**

If the answer is "no" — if he would conflate the two — the design is not ready. The two badges are designed to be distinct but readable, and the wording is explicit about what each means.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | File upload (10 MB) P95 | < 5s |
| **Performance** | File upload (100 MB) P95 | < 30s |
| **Performance** | Hash computation (10 MB) P95 | < 500ms |
| **Performance** | Integrity re-verification P95 | < 200ms (cache hit) |
| **Performance** | AI detection (image) P95 | < 3s |
| **Performance** | AI detection (video) P95 | < 10s |
| **Performance** | Evidence list load P95 | < 200ms |
| **Security** | All files encrypted at rest | Yes (server-side encryption) |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | Hash values never in URLs | Yes (only the opaque evidence ID) |
| **Security** | Storage layer credentials rotated annually | Yes |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | Hash computation does not retain the file in memory after hash is computed | Yes (streaming hash) |
| **Privacy** | DSAR does not include evidence files (they are user content, not platform-generated data) | The user is told this; they can download their own files before deletion |
| **Reliability** | Pipeline uptime | ≥ 99.5% (pilot) |
| **Reliability** | Re-verification failure rate | < 1% (storage layer SLA) |
| **Observability** | Every upload, every access, every state change logged | Yes |
| **Observability** | Integrity mismatch triggers immediate alert | Yes |
| **Observability** | AI detection model version recorded with every result | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | Only verified users can upload |
| RBAC module | Internal | Per-user and per-case permission checks |
| Audit log module | Internal | All access events and state changes |
| Cache layer (SQLite) | Internal | Hash lookup cache |
| Storage layer (Cloudflare R2 / Bunny / ImageKit) | External | File storage with CDN delivery |
| AI detection service | External | The ensemble model(s). May be commercial API (Hive, Sensity) or open-source (FaceForensics++, etc.) |
| Moderation module | Internal (downstream) | Consumes the evidence review queue |
| Lawyer Matching & Consultation module | Internal (lateral) | Lawyers access evidence in assigned cases via this module |
| Notification service | Internal | Notify user when a review decision is made |
| Postgres + Drizzle ORM | Internal | Primary database |

If the AI detection service is unavailable at pilot launch, the module ships with integrity-only verification. The architecture supports this — audio and documents already do it; the upload pipeline simply skips the AI step and the file goes straight to `ACTIVE` with `AI: Detection unavailable`.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Upload and Hashing

- [ ] A verified user can upload a file (image, video, audio, document) up to 100 MB
- [ ] An unverified user cannot upload; they see a CTA to verify
- [ ] A file larger than 100 MB is rejected with `FILE_TOO_LARGE`
- [ ] An unsupported file type is rejected with `UNSUPPORTED_FILE_TYPE`
- [ ] Every uploaded file has a SHA-256 hash computed and stored
- [ ] Every uploaded file has a timestamp recorded
- [ ] Every uploaded file has a storage path recorded
- [ ] The hash is computed in a streaming manner (not loading the entire file in memory)
- [ ] The file is stored with server-side encryption
- [ ] The storage path is opaque (does not leak the user ID or filename)

### 8.2 Integrity Verification

- [ ] The hash is recomputed on every access (read, download, share, delete)
- [ ] A hash match allows the access to proceed
- [ ] A hash mismatch returns `INTEGRITY_COMPROMISED` and does NOT serve the file
- [ ] A hash mismatch is logged at WARN level with the expected and actual hashes (DEBUG only)
- [ ] A hash mismatch triggers an admin alert
- [ ] The integrity log captures every access event
- [ ] The integrity log is queryable by the file owner and by admins

### 8.3 AI Detection

- [ ] Every image and video upload is passed through the AI detection pipeline
- [ ] Audio and document uploads skip AI detection
- [ ] The AI ensemble uses at least metadata analysis + visual artifact detection
- [ ] Video files additionally use audio-video sync analysis
- [ ] The ensemble produces a confidence score (0–100) and a category (Low/Medium/High)
- [ ] The model version is recorded with every result
- [ ] The detection methods used are recorded with every result
- [ ] A Low result puts the file in `ACTIVE` immediately
- [ ] A Medium result puts the file in `ACTIVE` with a clear explanation to the user
- [ ] A High result puts the file in `UNDER_REVIEW` and adds it to the review queue
- [ ] An AI service failure puts the file in `ACTIVE` with `Detection unavailable` and allows retry
- [ ] A user can request a re-analysis (rate-limited to once per day per file)

### 8.4 Human Review

- [ ] A High AI flag appears in the moderator's review queue within 60 seconds of upload
- [ ] A moderator can approve, restrict, or remove the file
- [ ] The decision is recorded with the moderator ID and timestamp
- [ ] 95% of reviews are completed within 24 hours
- [ ] The user is notified of the decision by email and in-app
- [ ] The user can appeal once
- [ ] A second appeal escalates to the Grievance Committee

### 8.5 Access Control

- [ ] A user can see only their own evidence in the list
- [ ] A user can see only their own evidence in detail
- [ ] A lawyer can see evidence in cases they are assigned to
- [ ] A lawyer cannot see evidence in cases they are not assigned to
- [ ] A moderator can see all evidence (for moderation purposes)
- [ ] An admin can see all evidence
- [ ] A user cannot download a file they cannot read
- [ ] A user cannot share a file with someone who cannot read it

### 8.6 Lifecycle

- [ ] A user can update the description, tags, and case association of their own file
- [ ] A user can delete their own file (soft delete)
- [ ] A soft-deleted file is not served but the record is kept for 30 days for recovery
- [ ] After 30 days, a soft-deleted file is hard-deleted (storage path removed)
- [ ] A file in a closed case cannot be deleted by the user
- [ ] All state transitions are audit-logged

### 8.7 Security

- [ ] All files are encrypted at rest
- [ ] All API endpoints are over TLS 1.3
- [ ] All connections over WireGuard
- [ ] Hash values are never in URLs
- [ ] No PII in production INFO logs
- [ ] Rate limit: 20 uploads per user per hour
- [ ] Rate limit: 100 uploads per IP per hour
- [ ] Storage layer credentials are rotated annually

### 8.8 Operational

- [ ] Health check includes evidence pipeline status
- [ ] Health check includes AI detection service status
- [ ] Health check includes storage layer status
- [ ] Alert on integrity mismatch (any)
- [ ] Alert on AI detection service failure rate > 5%
- [ ] Alert on storage layer failure rate > 1%
- [ ] Alert on review queue size > 50
- [ ] Runbook exists for "integrity mismatch detected" (quarantine, alert, investigate)
- [ ] Runbook exists for "AI detection service down" (skip AI; integrity-only; backfill when service returns)
- [ ] Runbook exists for "storage layer failure" (fallback to secondary storage)
- [ ] Runbook exists for "evidence file accidentally deleted" (recover from backup within RPO)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests (`tests/unit/services/`)

- `evidence.service.ts` — upload, lifecycle, state transitions
- `evidence.hashing.ts` — SHA-256 computation, streaming hash, comparison
- `evidence.ai-detection.ts` — ensemble coordination, category assignment
- `evidence.storage.ts` — storage path generation, encryption, retrieval
- `evidence.cache.ts` — hash cache get/set/invalidate

Coverage target: ≥ 90% on the hashing and storage code (the integrity guarantee); ≥ 85% on the rest.

### 9.2 Integration Tests (`tests/integration/api/`)

- Upload image → hash → AI detection → ACTIVE
- Upload video → hash → AI detection (with AV sync) → ACTIVE
- Upload audio → hash → no AI detection → ACTIVE
- Upload document → hash → no AI detection → ACTIVE
- Upload image → hash → AI detection HIGH → UNDER_REVIEW → moderator approves → ACTIVE
- Upload image → hash → AI detection HIGH → UNDER_REVIEW → moderator restricts → RESTRICTED
- Upload image → hash → AI detection HIGH → UNDER_REVIEW → moderator removes → REMOVED
- User appeals moderator decision → moderator re-reviews
- Lawyer in assigned case accesses evidence (allowed)
- Lawyer NOT in assigned case accesses evidence (denied)
- Integrity mismatch simulation (modify file in storage) → INTEGRITY_COMPROMISED returned
- AI detection service down → file is ACTIVE with Detection unavailable
- Storage layer down → upload fails with STORAGE_UNAVAILABLE
- Re-analysis rate limit
- Soft delete → 30-day window → hard delete

### 9.3 E2E Tests (`tests/e2e/`)

- Full J6 journey (citizen uploads evidence and verifies it) — see [User Journeys.md §8](../product/User%20Journeys.md#8-j6--citizen-uploads-evidence-and-verifies-it)
- Lawyer accesses citizen's evidence in a case
- Moderator reviews a High AI flag end-to-end
- User appeals and re-reviews end-to-end

### 9.4 Manual Tests (during pilot)

- Real user uploads with real devices and connections
- Real AI detection on real (and synthetic) test datasets
- Real moderator reviews
- Edge case: a user uploads a known AI-generated image and the system flags it (positive test for the ensemble)
- Edge case: a user uploads a known clean image and the system does NOT flag it (negative test)

### 9.5 Security Tests (required for this module)

- **Integrity test:** Modify a file in storage and verify the system detects the modification.
- **Penetration test:** Attempt to access another user's evidence directly. Must fail.
- **Penetration test:** Attempt to bypass the AI detection pipeline. Must fail.
- **Penetration test:** Attempt to forge a hash. Must fail (the hash is computed server-side; the client cannot influence it).
- **Code review:** Every change to the hashing or storage code requires a security-focused review by the Engineering Lead.

### 9.6 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. For this module, the negative tests are critical:
- A user cannot access another user's evidence
- A user cannot bypass the hash computation
- A user cannot bypass the AI detection (except by uploading an unsupported file type, which is rejected)
- A user cannot delete a file in a closed case
- A lawyer cannot access evidence outside their assigned cases

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `evidence.module.enabled` | true | Disable the entire module in case of critical issue |
| `evidence.ai-detection.enabled` | true | Disable AI detection while keeping integrity verification |
| `evidence.upload.enabled` | true | Disable new uploads while keeping existing evidence accessible |
| `evidence.reanalyze.enabled` | true | Disable re-analysis (e.g., when a new model is being rolled out) |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **AI detection false positive surge:** Disable `evidence.ai-detection.enabled`. All new uploads go to `ACTIVE` with `Detection unavailable`. Existing High flags are re-evaluated by moderators. Re-enable when the false positive rate is acceptable.
- **Integrity mismatch detected in batch:** Quarantine all affected files. Alert the Board. Investigate the storage layer. Do not serve the files until integrity is restored.
- **Storage layer failure:** Fall back to secondary storage. If no secondary is available, fail uploads gracefully and queue them for retry when storage returns.
- **Critical hashing bug:** Disable uploads (`evidence.upload.enabled`). Existing evidence remains readable. Fix and re-enable.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Which AI detection vendor(s) do we use? (Hive, Sensity, open-source, hybrid?) | Engineering Lead | Open — needs vendor evaluation |
| 2 | What is the right cost threshold for AI detection per file? | Finance | Open — depends on vendor |
| 3 | Should we support re-analysis with a different model on user request, or only on admin action? | Product Lead | Open — recommend admin only in pilot |
| 4 | What is the right storage layer for the pilot? (Cloudflare R2 vs. Bunny vs. local?) | Engineering Lead | Open — needs cost analysis |
| 5 | What is the soft-delete retention period? (30 days is the spec.) | Legal | Open — needs NDPR review |
| 6 | How do we handle a file in `UNDER_REVIEW` that is associated with an active case and the case needs to proceed? | Product Lead + Legal | Open — needs policy |
| 7 | Should the integrity log be exportable to the user as part of DSAR? | Legal | Open — recommend yes for transparency |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md).

---

## Appendix A: Glossary
- **AI** — Artificial Intelligence
- **AV sync** — Audio-Video synchronization
- **CDN** — Content Delivery Network
- **DSAR** — Data Subject Access Request
- **LGA** — Local Government Area
- **NDPR** — Nigeria Data Protection Regulation
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **RPO** — Recovery Point Objective
- **SHA-256** — Secure Hash Algorithm 256-bit
- **SLA** — Service Level Agreement

## Appendix B: References
- [PRD.md §4.4 — Evidence Integrity](../product/PRD.md#44-evidence-integrity-pillar-2)
- [User Journeys.md §8 — J6 Citizen uploads evidence and verifies it](../product/User%20Journeys.md#8-j6--citizen-uploads-evidence-and-verifies-it)
- [Personas.md §3.2 — Tunde](../product/Personas.md#32-tunde--the-dispute-haver)
- [UX & Design.md §5.3 — The Two Statuses — Distinct UI](../product/UX%20%26%20Design.md#53-the-two-statuses--distinct-ui) (forthcoming — see Evidence Status Patterns)
- [PLATFORM.md §4 — Evidence Integrity & Deepfake Detection](../PLATFORM.md#4-evidence-integrity--deepfake-detection)
- [ARCHITECTURE.md §6 — Cache Layer](../ARCHITECTURE.md#6-cache-layer) (for hash cache)
- [ARCHITECTURE.md §1.3 — Technology Stack](../ARCHITECTURE.md#13-technology-stack-summary) (for storage options)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers upload, hashing, integrity verification, AI detection (image/video), human review queue, evidence lifecycle, and access control. 16 business rules, 16 edge cases, 60+ acceptance criteria. The integrity guarantee (SHA-256 + re-verification) is the foundational technical commitment. |