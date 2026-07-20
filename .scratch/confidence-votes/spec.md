# Spec: Confidence Votes on Elected Officials

Status: done

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Section 3.2). Lets ID-verified citizens express non-binding confidence in elected officials, one vote per official per quarter, with residency and anonymity guarantees. Builds directly on the completed **Policy Polls** slice (reuses the `jurisdictions` table, `VoterResolver` seam, the injected `Clock`, and the aggregate-only results pattern).

See also `CONTEXT.md` for canonical vocabulary (User, Account Verification Status, Jurisdiction, Poll, Vote, Poll Results) and `.scratch/policy-polls/spec.md` for the prior slice this one mirrors.

## Problem Statement

The platform promises structured, ongoing accountability feedback on elected officials between elections. Today there is no way to register an official, let a verified resident cast one confidence vote per quarter, or read an aggregate Public Confidence Index. Without a trustworthy one-person-one-vote-per-quarter mechanism, the feedback has no legitimacy.

## Solution

A single `confidence.service.ts` handles the confidence-vote lifecycle:

1. **Register an official** — an official is a normalized entity: name, title, `jurisdiction_id` (FK to `jurisdictions`), and a term window (`term_starts_at`, `term_ends_at`, nullable). Officials are platform-managed data, not user-submitted.
2. **Cast a confidence vote** — an **ID-verified** User who resides within the official's jurisdiction casts exactly one vote per quarter. Options are `yes` / `no` / `uncertain`. One-person-one-quarter is enforced by a unique constraint on `(official_id, voter_id, quarter)`.
3. **Read results** — aggregated confidence index (percentage `yes` / `no` / `uncertain`) for the current or a given quarter, with the mandatory disclaimer: *"This is citizen sentiment only. It has no legal or electoral weight."*

The "quarter" is derived from the injected clock (Jan/Apr/Jul/Oct boundaries, 7-day open window per §3.2.7 — the open window is out of scope for this slice; votes are accepted whenever the official's term is active and the voter hasn't voted that quarter).

## User Stories

1. As the platform, I want to register an elected official (name, title, jurisdiction, term), so that citizens can vote on them.
2. As the platform, I want a confidence vote to ask "Do you have confidence that [Official] is taking [Jurisdiction] in the right direction?" with Yes / No / Uncertain.
3. As an ID-verified citizen resident in the official's jurisdiction, I want to cast one confidence vote, so that my sentiment is recorded.
4. As the platform, I want to reject a vote from an unverified User, so that one-person-one-vote holds.
5. As the platform, I want to reject a vote from a User outside the official's jurisdiction, so that residency is enforced.
6. As the platform, I want to reject a second vote by the same User on the same official in the same quarter, so that one-vote-per-quarter holds.
7. As the platform, I want to reject a vote when the official is not in an active term, so that only sitting officials are evaluated.
8. As a citizen, I want to see the aggregate confidence index (counts + percentages) for a quarter, so that I understand overall sentiment.
9. As the platform, I want results to carry the non-binding disclaimer, so that sentiment is not mistaken for a legal or electoral outcome.
10. As the platform, I want individual votes not attributable to a User in the results, so that voters stay anonymous.

## Implementation Decisions

**Modules built (new):**

- `db/schema/officials.ts` — `officials` table: `id`, `name`, `title`, `jurisdiction_id` (FK), `term_starts_at`, `term_ends_at` (nullable timestamp), `created_at`.
- `db/schema/confidence-votes.ts` — `confidence_votes` table: `id`, `official_id` (FK), `voter_id` (FK), `option` (`yes` | `no` | `uncertain`), `quarter` (text, e.g. `"2025-Q1"`), `created_at`. Unique `(official_id, voter_id, quarter)`. Stored without any link usable to reconstruct the individual in results.
- `services/confidence.service.ts` — single source of truth. Public surface:
  - `registerOfficial({ name, title, jurisdictionId, termStartsAt, termEndsAt? })` → validates and inserts an official.
  - `castVote({ officialId, voter, option })` → resolves the voter (an authenticated, `id_verified` User with a jurisdiction), enforces: official term is active (clock within term window), voter residency within scope (reuse `lib/jurisdiction.ts`), `verificationStatus === "id_verified"`, and not already voted this quarter (unique constraint + pre-check), then inserts the vote.
  - `getResults({ officialId, quarter? })` → returns per-option counts + percentages and the disclaimer string for the requested quarter (defaults to the current quarter per the injected clock).
- `lib/validation/confidence.ts` — shared validation (name/title non-empty, jurisdiction present, term ordering, option in the allowed set).

**Collaborators (injected):** the existing `Clock`; the existing `VoterResolver` (reused from policy polls); the residency helper `lib/jurisdiction.ts` (reused).

**Behavioral decisions:**

- Quarter derivation: a pure helper `quarterOf(date)` → `"YYYY-Qn"` (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec). The unique constraint + stored `quarter` column enforce one-vote-per-quarter; the pre-check gives a clear error.
- Term activity: `isActive(termStartsAt, termEndsAt, now)` — active when `now >= termStartsAt` and (`termEndsAt` is null or `now <= termEndsAt`). A vote outside an active term is rejected.
- Voter identity is established **before** `castVote` is called (same seam pattern as policy polls); `confidence.service` enforces `verificationStatus === "id_verified"` and residency; it does not re-implement session validation.
- Residency: reuse the hierarchical `isResidentOf` from `lib/jurisdiction.ts` (national official → any citizen; state → that state and its LGAs; local → that LGA only).
- Results are aggregate-only; the `confidence_votes` row stores `voter_id` for uniqueness but results never join back to the User.
- Official registration is platform-managed in this slice (no approval workflow yet).

## Testing Decisions

**Seam:** the single `confidence.service.ts` service seam, with the injected **fixed clock**, a **fake `VoterResolver`** (reused), and a real test DB (pglite) so the `(official_id, voter_id, quarter)` unique constraint and jurisdiction hierarchy are genuinely exercised.

**Representative cases:** registerOfficial persists an official; rejects empty name/title; castVote accepts one `yes`/`no`/`uncertain` from an id_verified resident while the term is active; rejects an unverified User; rejects a non-resident; rejects a second vote in the same quarter (unique constraint); rejects a vote outside the active term; getResults returns counts + percentages + the disclaimer; results never expose the voter. Jurisdiction hierarchy: a national official accepts a local-LGA resident; a state official accepts an LGA within it but not another state; a local official accepts only that LGA. Quarter rollover: a voter may vote again in a later quarter.

**Prior art:** evidence + auth + policy-polls slices established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- **Regional breakdown statistics & confidence intervals** (§3.2.6) — results are overall-only here, matching the policy-polls slice.
- **Trend analysis (quarter-over-quarter)** (§3.2.6) — `getResults` is single-quarter; trend is a follow-up.
- **Optional rationale / explanation comments** (§3.2.5) — not modelled.
- **Special/extraordinary confidence votes & 7-day open window** (§3.2.7) — votes accepted whenever the term is active; the 7-day window is deferred.
- **Web/mobile entry points** — the service is callable; transport is later.
- **Full vote anonymization at rest (no `voter_id` stored)** — deferred; this slice guarantees results are aggregate-only.
- **AI/tamper on confidence votes, audit logging of votes** — out of scope (evidence integrity is a different subsystem).

## Further Notes

- Second beta civic feature. Depends on the Auth & Identity slice (a voter is an `id_verified` User) and the Policy Polls slice (jurisdictions, VoterResolver, Clock, aggregate results pattern).
- Reuses the architecture: single service seam, injected collaborators, real test DB, residency helper.
- Domain terms align with `CONTEXT.md`; new terms (Official, Confidence Vote, Confidence Index) added to the glossary when this slice is built.
- Next slices likely: Confidence Votes trend/regional breakdown, then Lawyer Marketplace.
- Tickets land under `.scratch/confidence-votes/issues/NN-<slug>.md`.
