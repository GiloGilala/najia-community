# 02 — Lawyer onboarding & verification

**What to build:** A lawyer (an `id_verified` User) can create a profile, which starts `pending`. A platform action verifies the lawyer (`pending` → `verified`). Only `verified` lawyers are matchable.

**Blocked by:** 01 — Lawyer schema & validation

**Status:** ready-for-agent

- [x] `onboardLawyer({ userId, barNumber, practiceAreas, licensedJurisdictionIds, yearsPracticing, languages, proBono })` inserts a `pending` profile after validation
- [x] Rejects a missing or duplicate bar number
- [x] Rejects empty practice areas or licensed jurisdictions
- [x] Rejects negative years practicing
- [x] `verifyLawyer({ lawyerId })` flips `pending` → `verified`
- [x] `verifyLawyer` rejects an unknown lawyer
