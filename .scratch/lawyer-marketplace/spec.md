# Spec: Lawyer Marketplace (core)

Status: done

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Section 5). Connects citizens with verified legal professionals. This first slice establishes the **lawyer profile** (platform-verified professional with practice areas and licensed jurisdictions) and **matching** (a citizen intake of case type + jurisdiction yields 3–5 recommended, jurisdiction-eligible lawyers). It deliberately defers reviews/ratings, engagement agreements, and fee billing.

Builds on the completed **Auth & Identity** slice (a lawyer is a `id_verified` User) and reuses the `jurisdictions` table and residency helper.

See also `CONTEXT.md` for canonical vocabulary (User, Account Verification Status, Jurisdiction).

## Problem Statement

Citizens need a trustworthy way to find qualified legal help. Today there is no lawyer directory, no notion of a verified lawyer profile, and no mechanism to match a citizen's case to eligible lawyers. Without verified profiles and jurisdiction-aware matching, the platform cannot deliver its "legal access" promise.

## Solution

A single `lawyer.service.ts` with two capabilities:

1. **Onboard a lawyer** — given an `id_verified` User, create a `lawyers` profile: `bar_number`, `practice_areas` (array of strings), `licensed_jurisdiction_ids` (array of jurisdiction ids where the lawyer is licensed), `years_practicing`, `languages`, `pro_bono` (bool), and a `verification_status` (`pending` → `verified`). In this slice, verification is set by the platform (no Bar-API integration yet); a profile is only matchable once `verified`.
2. **Match lawyers** — given a citizen intake (`practiceArea`, `jurisdictionId`), return up to 5 `verified` lawyers who are licensed in that jurisdiction and list the practice area, ordered by a transparent, published score (practice-area match + jurisdiction match + pro-bono boost + years practicing). Recommended, not mandatory.

The fee/pro-bono *display* fields live on the profile; the subscription/billing model and engagement agreements are out of scope.

## User Stories

1. As a lawyer (id_verified User), I want to create a profile with my bar number, practice areas, licensed jurisdictions, experience, and languages, so that citizens can find me.
2. As the platform, I want a lawyer profile to start `pending` and become `verified` only via platform verification, so that only vetted lawyers are matchable.
3. As a citizen, I want to submit an intake (practice area + jurisdiction) and receive up to 5 recommended lawyers, so that I can choose counsel.
4. As the platform, I want matching to require the lawyer be `verified`, licensed in the intake jurisdiction, and list the requested practice area, so that recommendations are eligible.
5. As the platform, I want matching to be transparent and ordered by a published score, so that there is no hidden preferential treatment.
6. As the platform, I want results to never expose the lawyer's User account credentials or government ID, so that profile data stays scoped.

## Implementation Decisions

**Modules built (new):**

- `db/schema/lawyers.ts` — `lawyers` table: `user_id` (PK, FK to users, the lawyer *is* a User), `bar_number` (text, unique), `practice_areas` (jsonb string[]), `licensed_jurisdiction_ids` (jsonb string[]), `years_practicing` (int), `languages` (jsonb string[]), `pro_bono` (bool), `verification_status` (`pending` | `verified`), `created_at`.
- `services/lawyer.service.ts` — single source of truth. Public surface:
  - `onboardLawyer({ userId, barNumber, practiceAreas, licensedJurisdictionIds, yearsPracticing, languages, proBono })` → validates (user exists, bar number present & unique, ≥1 practice area, ≥1 licensed jurisdiction, non-negative years) and inserts a `pending` profile.
  - `verifyLawyer({ lawyerId })` → flips `pending` → `verified` (platform action; Bar-API deferred).
  - `matchLawyers({ practiceArea, jurisdictionId, limit? })` → returns up to `limit` (default 5) `verified` lawyers licensed in `jurisdictionId` and listing `practiceArea`, scored and ordered.
- `lib/validation/lawyer.ts` — shared Zod validation (bar number non-empty + unique-enforced by DB, practice areas 1+, jurisdictions 1+, years ≥ 0, languages array).
- `lib/lawyer-match.ts` — pure `scoreLawyer(profile, intake)` and `rankLawyers(profiles, intake, limit)` helpers (practice-area match + jurisdiction match + pro-bono boost + years practicing; deterministic tie-break by bar_number).

**Collaborators (injected):** the `DbClient` (real test DB). No `Clock` needed for this slice (created_at can default in the DB or be set by an injected clock — use the existing `Clock` for consistency with other services).

**Behavioral decisions:**

- A lawyer is a User; `user_id` is the FK and primary key. The profile never stores the User's `passwordHash`/`governmentIdHash`; results return only profile fields.
- Verification is a platform action in this slice (`verifyLawyer`); the Bar-API integration and background checks are deferred.
- Matching is jurisdiction-aware: a lawyer matches only if `licensed_jurisdiction_ids` contains the intake `jurisdictionId`. (Scope is the lawyer's *licensed* set, not the citizen's residency hierarchy — a citizen may seek a lawyer licensed elsewhere; this slice matches on the intake jurisdiction directly.)
- Scoring is transparent and published in `lib/lawyer-match.ts`; ordering is deterministic.
- `limit` defaults to 5 and is capped at 5 per §5.4.1.

## Testing Decisions

**Seam:** the single `lawyer.service.ts` service seam, with the injected `Clock` and a real test DB (pglite) so the `user_id` PK and `bar_number` unique constraint are genuinely exercised.

**Representative cases:** onboardLawyer persists a `pending` profile; rejects a missing/duplicate bar number; rejects empty practice areas or jurisdictions; rejects negative years; verifyLawyer flips pending→verified; matchLawyers returns only verified, jurisdiction-licensed, practice-area lawyers; excludes pending lawyers; limits to 5 and orders by score (pro-bono and experience boost); matchLawyers returns empty when none eligible.

**Prior art:** evidence + auth + policy-polls + confidence-votes slices established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- **Reviews & ratings** (§5.5) — no citizen/peer reviews, no success-rate display.
- **Engagement agreements & liability waivers** (§5.2.4, §5.6) — contract templates deferred.
- **Fee model / subscription billing** (§5.2.3, §5.3) — fees are displayed fields only; no invoicing.
- **Bar-API verification & background checks** (§5.3.2) — verification is a manual platform flag here.
- **Web/mobile entry points** — the service is callable; transport is later.
- **Initial consultation scheduling** (§5.2.4, §5.4.1 step 5) — deferred.

## Further Notes

- First "legal access" slice. Depends on the Auth & Identity slice (a lawyer is an `id_verified` User).
- Domain terms (Lawyer, Lawyer Profile, Matching) added to CONTEXT.md when this slice is built.
- Next slices likely: Lawyer Reviews & Ratings, then Engagement/Consultation flow.
- Tickets land under `.scratch/lawyer-marketplace/issues/NN-<slug>.md`.
