# 04 — Unsupported types & validation rejection

**What to build:** Users get honest feedback about which files can and cannot be integrity-verified, and bad uploads are rejected cleanly. Unsupported-but-accepted file types resolve to a `not_applicable` verification status (so users are not falsely reassured), while oversized or disallowed uploads are rejected with a clear reason and no evidence row is created. Validation lives in a single shared schema reused across entry points. Demoable: upload an unsupported type → `not_applicable`; upload an oversized/disallowed file → clear rejection, nothing persisted.

**Blocked by:** 02 — Upload & fingerprint evidence

**Status:** resolved

- [x] A shared validation schema in `lib/validation/` defines allowed MIME types and max size
- [x] Supported types (images JPG/PNG/WebP, video MP4/AVI/WebM, audio MP3/WAV/M4A, docs PDF/DOCX/TXT) are accepted
- [x] An accepted-but-unsupported type resolves to `verification_status` = `not_applicable`
- [x] Oversized uploads are rejected with a clear validation error and no evidence row is created
- [x] Disallowed MIME types are rejected with a clear validation error and no evidence row is created

## Comments

- Added `lib/validation/evidence-upload.ts`: `evidenceUploadSchema` (Zod), `MAX_EVIDENCE_SIZE_BYTES` (100 MB per 6.7.1), allow-lists split into `VERIFIABLE_MIME_TYPES` (→ verified/altered) and `UNVERIFIABLE_ALLOWED_MIME_TYPES` (documents → not_applicable), `isVerifiableMimeType`, `validateEvidenceUpload`, and `EvidenceValidationError`.
- `uploadEvidence` now validates first — a rejected upload writes nothing to storage and creates no row. The service's duplicated MIME set was removed in favour of the shared module (single source of truth for entry points).
- Three-way policy: supported → verified; allowed-but-unverifiable → not_applicable; disallowed/oversized/empty → rejected.
- Note: used Zod v4 `z.uuid()`; test fixtures updated to valid v4 UUIDs.
- Verified: `bun run typecheck` clean; `bun test` → 30 pass, 0 fail.
