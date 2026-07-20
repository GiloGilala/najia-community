# 01 — Review schema & validation

**What to build:** The data shape and validation the lawyer-reviews slice needs. Adds the `lawyer_reviews` table (lawyer_id FK, reviewer_id FK, rating 1–5, comment nullable, anonymous bool, moderated bool, created_at, unique (lawyer_id, reviewer_id)) plus shared review validation. No service logic yet — this ticket makes the layers and seams exist and migrate cleanly. Reuses the `lawyers` table and `ResolvedVoter` shape from auth.

**Blocked by:** None — can start immediately (reuses the existing skeleton, harness, clock, lawyer-marketplace slice, auth slice)

**Status:** ready-for-agent

- [x] `lawyer_reviews` table exists: id, lawyer_id (FK lawyers.user_id), reviewer_id (FK users), rating (int 1–5), comment (text, nullable), anonymous (bool), moderated (bool default false), created_at
- [x] unique constraint on (lawyer_id, reviewer_id)
- [x] `lib/validation/lawyer-review.ts` validates rating 1–5 and optional comment ≤ 1000 chars
