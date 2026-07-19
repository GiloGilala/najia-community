# 01 — Jurisdictions & poll schema + VoterResolver seam

**What to build:** The data shape and collaborator seams the poll slice needs, before any voting logic. Adds the `jurisdictions` table (national/state/local with `parent_id`), the `policy_polls` and `policy_votes` tables, shared poll validation, and the `VoterResolver` collaborator (seeded from the auth service; faked in tests). No poll or vote logic is implemented yet — this ticket makes the layers and seams exist and migrate cleanly.

**Blocked by:** None — can start immediately (reuses the existing skeleton, harness, clock, and the auth slice)

**Status:** ready-for-agent

- [ ] `jurisdictions` table exists: id, name, level (national | state | local), parent_id (nullable FK to self)
- [ ] `policy_polls` table exists: id, title, question, options (JSON), jurisdiction_id (FK), status, opens_at, closes_at, created_by, created_at
- [ ] `policy_votes` table exists: id, poll_id (FK), voter_id (FK), option_index, created_at, unique (poll_id, voter_id)
- [ ] `lib/validation/poll.ts` validates 2–5 options, non-empty title/question, closes_at > opens_at, jurisdiction present
- [ ] `VoterResolver` interface (resolves a session token to an authenticated User with verificationStatus + jurisdictionId, or rejects) with a fake for tests
