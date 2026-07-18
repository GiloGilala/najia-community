# 05 — Audit trail & access logging

**What to build:** A complete, tamper-resistant chain of custody can be reconstructed for any piece of evidence. `getAuditTrail` returns the append-only event log in chronological order, `recordAccess` appends an `accessed` event when the file bytes are served, and the service exposes no way to update or delete evidence rows or audit events. Demoable: after upload, verify, and access, the audit trail shows `uploaded`, `verified`, and `accessed` events in order, and there is no API to mutate them.

**Blocked by:** 03 — Verify evidence & detect tampering

**Status:** resolved

- [x] `getAuditTrail({ evidenceId })` returns all events for the evidence in chronological order
- [x] `recordAccess({ evidenceId, actorId })` appends an `accessed` audit event, timestamped via the injected clock
- [x] The audit trail includes `uploaded`, `verified`, and `accessed` events after the corresponding calls
- [x] The service exposes no update or delete operation for evidence rows or audit events (append-only guarantee)

## Comments

- Added `recordAccess` to `services/evidence.service.ts`: verifies the evidence exists (`EvidenceNotFoundError` otherwise), then appends an `accessed` event with the actor and clock timestamp.
- `getAuditTrail` orders by `createdAt` ascending; tests confirm the full `uploaded → verified → accessed` sequence and that trails are scoped per evidence id.
- Append-only guarantee asserted through the public surface: the service exposes exactly `uploadEvidence`, `verifyEvidence`, `recordAccess`, `getAuditTrail` — no update/delete methods.
- Verified: `bun run typecheck` clean; `bun test` → 34 pass, 0 fail.
