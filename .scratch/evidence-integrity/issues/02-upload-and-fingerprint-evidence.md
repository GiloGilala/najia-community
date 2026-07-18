# 02 — Upload & fingerprint evidence

**What to build:** A citizen can upload an evidence file and the platform captures its original state. `uploadEvidence` validates the file, computes a SHA-256 fingerprint over the exact uploaded bytes, persists the bytes via the storage collaborator, writes an immutable `evidence` row plus an append-only `uploaded` audit event, and returns the evidence record with its verification status. Demoable: upload a supported file, get back a record carrying a hash and a `verified` status.

**Blocked by:** 01 — Project skeleton & injectable collaborators

**Status:** ready-for-agent

- [ ] `evidence` table exists: id, case_id, uploader_id, filename, mime_type, size_bytes, sha256_hash, storage_key, verification_status, created_at
- [ ] `evidence_audit_events` table exists: id, evidence_id, event_type, actor_id, outcome, created_at
- [ ] `uploadEvidence({ caseId, uploaderId, filename, mimeType, bytes })` computes SHA-256 over the raw bytes and stores it
- [ ] The uploaded bytes are persisted via the storage collaborator under a storage key recorded on the row
- [ ] An `uploaded` audit event is written, timestamped via the injected clock
- [ ] The returned record includes `verification_status` = `verified` for a freshly uploaded supported file
- [ ] Uploading two different files yields two distinct hashes (no collision on status/hash)
