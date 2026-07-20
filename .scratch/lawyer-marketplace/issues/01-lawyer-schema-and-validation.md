# 01 — Lawyer schema & validation

**What to build:** The data shape and validation the lawyer slice needs, before any service logic. Adds the `lawyers` table (user_id PK/FK, bar_number unique, practice_areas, licensed_jurisdiction_ids, years_practicing, languages, pro_bono, verification_status) plus shared lawyer validation and the matching helpers. No service logic yet — this ticket makes the layers and seams exist and migrate cleanly.

**Blocked by:** None — can start immediately (reuses the existing skeleton, harness, clock, auth slice, jurisdictions table)

**Status:** ready-for-agent

- [x] `lawyers` table exists: user_id (PK/FK users), bar_number (unique text), practice_areas (jsonb string[]), licensed_jurisdiction_ids (jsonb string[]), years_practicing (int), languages (jsonb string[]), pro_bono (bool), verification_status (pending | verified), created_at
- [x] `lib/validation/lawyer.ts` validates non-empty bar number, ≥1 practice area, ≥1 licensed jurisdiction, years ≥ 0, languages array
- [x] `lib/lawyer-match.ts` pure helpers: `scoreLawyer(profile, intake)` and `rankLawyers(profiles, intake, limit)` (practice-area match + jurisdiction match + pro-bono boost + years; deterministic tie-break by bar_number; default/cap limit at 5)
