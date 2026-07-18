# 02 — Upload & fingerprint evidence

**What to build:** A citizen can upload an evidence file and the platform captures its original state. `uploadEvidence` validates the file, computes a SHA-256 fingerprint over the exact uploaded bytes, persists the bytes via the storage collaborator, writes an immutable `evidence` row plus an append-only `uploaded` audit event, and returns the evidence record with its verification status. Demoable: upload a supported file, get back a record carrying a hash and a `verified` status.

**Blocked by:** 01 — Project skeleton & injectable collaborators

**Status:** resolved

- [x] `evidence` table exists: id, case_id, uploader_id, filename, mime_type, size_bytes, sha256_hash, storage_key, verification_status, created_at
- [x] `evidence_audit_events` table exists: id, evidence_id, event_type, actor_id, outcome, created_at
- [x] `uploadEvidence({ caseId, uploaderId, filename, mimeType, bytes })` computes SHA-256 over the raw bytes and stores it
- [x] The uploaded bytes are persisted via the storage collaborator under a storage key recorded on the row
- [x] An `uploaded` audit event is written, timestamped via the injected clock
- [x] The returned record includes `verification_status` = `verified` for a freshly uploaded supported file
- [x] Uploading two different files yields two distinct hashes (no collision on status/hash)

## Comments

- Implemented `services/evidence.service.ts` (`createEvidenceService` factory taking injected db/storage/clock). SHA-256 via node:crypto over raw bytes; bytes persisted before the row is written.
- Schema in `db/schema/evidence.ts`; migration generated at `db/migrations/0000_*.sql`. Harness gained `migrate()` which applies generated SQL to whichever driver is active.
- A minimal `getAuditTrail` was added to assert the `uploaded` event (append-only guarantees + `recordAccess` remain ticket 05's scope).
- Unsupported types already resolve to `not_applicable`, but validation/rejection is ticket 04's job — not exercised here.
- Verified: `bun run typecheck` clean; `bun test` → 18 pass, 0 fail.
