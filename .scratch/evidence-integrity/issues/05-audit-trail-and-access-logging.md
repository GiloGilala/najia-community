# 05 — Audit trail & access logging

**What to build:** A complete, tamper-resistant chain of custody can be reconstructed for any piece of evidence. `getAuditTrail` returns the append-only event log in chronological order, `recordAccess` appends an `accessed` event when the file bytes are served, and the service exposes no way to update or delete evidence rows or audit events. Demoable: after upload, verify, and access, the audit trail shows `uploaded`, `verified`, and `accessed` events in order, and there is no API to mutate them.

**Blocked by:** 03 — Verify evidence & detect tampering

**Status:** ready-for-agent

- [ ] `getAuditTrail({ evidenceId })` returns all events for the evidence in chronological order
- [ ] `recordAccess({ evidenceId, actorId })` appends an `accessed` audit event, timestamped via the injected clock
- [ ] The audit trail includes `uploaded`, `verified`, and `accessed` events after the corresponding calls
- [ ] The service exposes no update or delete operation for evidence rows or audit events (append-only guarantee)
