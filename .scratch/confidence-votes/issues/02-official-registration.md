# 02 — Official registration

**What to build:** The platform can register an elected official as a normalized entity. `registerOfficial` validates the input (non-empty name/title, jurisdiction present, term ordering) and persists the official. This is platform-managed data (no approval workflow in this slice).

**Blocked by:** 01 — Officials schema, validation & confidence-vote schema

**Status:** ready-for-agent

- [x] `registerOfficial({ name, title, jurisdictionId, termStartsAt, termEndsAt? })` inserts an official after validation
- [x] Rejects empty name or title
- [x] Rejects a missing jurisdiction
- [x] Rejects a term where term_ends_at is present and not after term_starts_at
