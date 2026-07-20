# 03 — Lawyer matching

**What to build:** A citizen submits an intake (practice area + jurisdiction) and receives up to 5 recommended, eligible lawyers, scored and deterministically ordered. Matching requires the lawyer be `verified`, licensed in the intake jurisdiction, and list the requested practice area.

**Blocked by:** 02 — Lawyer onboarding & verification

**Status:** ready-for-agent

- [x] `matchLawyers({ practiceArea, jurisdictionId, limit? })` returns up to 5 verified lawyers licensed in the jurisdiction and listing the practice area
- [x] Excludes `pending` (unverified) lawyers
- [x] Excludes lawyers not licensed in the intake jurisdiction
- [x] Excludes lawyers not listing the requested practice area
- [x] Orders by the transparent published score (practice-area match + jurisdiction match + pro-bono boost + years) with a deterministic tie-break
- [x] Returns an empty list when no lawyer is eligible
- [x] Results expose only profile fields, never the underlying User credentials
