# 01 — Officials schema, validation & confidence-vote schema

**What to build:** The data shape and validation the confidence-vote slice needs, before any voting logic. Adds the `officials` table (name, title, jurisdiction_id, term window) and the `confidence_votes` table (official_id, voter_id, option, quarter, unique (official_id, voter_id, quarter)), plus shared confidence validation and the quarter/term helpers. No vote logic is implemented yet — this ticket makes the layers and seams exist and migrate cleanly. Reuses the existing `jurisdictions` table, `VoterResolver`, and `lib/jurisdiction.ts`.

**Blocked by:** None — can start immediately (reuses the existing skeleton, harness, clock, auth slice, and policy-polls residency helper)

**Status:** ready-for-agent

- [x] `officials` table exists: id, name, title, jurisdiction_id (FK), term_starts_at, term_ends_at (nullable), created_at
- [x] `confidence_votes` table exists: id, official_id (FK), voter_id (FK), option (yes | no | uncertain), quarter (text), created_at, unique (official_id, voter_id, quarter)
- [x] `lib/validation/confidence.ts` validates non-empty name/title, jurisdiction present, term ordering, option in {yes, no, uncertain}
- [x] `quarterOf(date)` pure helper returns `"YYYY-Qn"`; `isActive(termStartsAt, termEndsAt, now)` returns whether an official's term is active
