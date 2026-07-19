# 02 — Poll creation & status

**What to build:** A creator can define a poll, and its lifecycle status is derived from the time window via the injected clock. `createPoll` validates the input (2–5 options, closes after opens, creator exists) and persists a `scheduled` poll. `statusOf` returns `scheduled` before the window, `open` during it, `closed` after — the stored status is a cached convenience; the clock is authoritative.

**Blocked by:** 01 — Jurisdictions & poll schema + VoterResolver seam

**Status:** ready-for-agent

- [x] `createPoll({ title, question, options, jurisdictionId, opensAt, closesAt, createdBy })` inserts a `scheduled` poll after validation
- [x] Rejects fewer than 2 or more than 5 options
- [x] Rejects a window where closes_at is not after opens_at
- [x] `statusOf({ pollId })` returns `scheduled` before opens_at, `open` between, `closed` after — derived from the injected clock
