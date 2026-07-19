# Spec: Policy Sentiment Polls

Status: done

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Section 3.1). Lets ID-verified citizens express non-binding sentiment on government policy, one vote per person per poll, with residency and anonymity guarantees. This is the first beta civic feature; it depends on the completed Auth & Identity slice (a verified User + Session identify the voter).

See also `CONTEXT.md` for canonical vocabulary (User, Account Verification Status, Session, Jurisdiction).

## Problem Statement

The platform promises structured, non-binding citizen feedback on governance. Today there is no way to create a poll, let a verified citizen cast one anonymous vote, or read aggregate sentiment. Without a trustworthy one-person-one-vote mechanism, the feedback has no legitimacy.

## Solution

A single `poll.service.ts` handles the poll lifecycle:

1. **Create a poll** — a moderator/verified creator defines a poll: title, plain-language question, 2–5 options, a jurisdiction scope (national/state/local), and an open/close window. The poll starts `scheduled`, becomes `open` when its window starts, and `closed` after.
2. **Cast a vote** — an **ID-verified** User (per `CONTEXT.md`, Account Verification Status = `id_verified`) who resides within the poll's jurisdiction casts exactly one vote. One-person-one-vote is enforced by a unique constraint on `(poll_id, voter_id)`. The vote is stored without linking back to the voter in results.
3. **Read results** — aggregated option counts and percentages, with the mandatory disclaimer: *"This is citizen sentiment only. It has no legal or electoral weight."*

## User Stories

1. As a moderator, I want to create a poll with a question, options, and a time window, so that citizens can vote on it.
2. As a moderator, I want to set the poll's jurisdiction scope, so that only residents of that area may vote.
3. As the platform, I want a poll to be `scheduled` before its window, `open` during it, and `closed` after, so that voting is time-bounded.
4. As an ID-verified citizen resident in the poll's jurisdiction, I want to cast one vote, so that my sentiment is recorded.
5. As the platform, I want to reject a vote from an unverified User, so that one-person-one-vote holds.
6. As the platform, I want to reject a vote from a User outside the poll's jurisdiction, so that residency is enforced.
7. As the platform, I want to reject a second vote by the same User on the same poll, so that one-person-one-vote holds.
8. As the platform, I want to reject votes when the poll is not `open`, so that the time window is respected.
9. As a citizen, I want to see aggregate results (counts + percentages) after voting, so that I understand overall sentiment.
10. As the platform, I want results to carry the non-binding disclaimer, so that sentiment is not mistaken for a legal or electoral outcome.
11. As the platform, I want individual votes not attributable to a User in the results, so that voters stay anonymous.
12. As a developer, I want all poll logic in one service, so that web and mobile entry points share identical behavior.

## Implementation Decisions

**Modules built (new):**

- `db/schema/` new tables:
  - `jurisdictions`: `id`, `name`, `level` (`national` | `state` | `local`), `parent_id` (nullable FK to self). A national jurisdiction contains its states; a state contains its local LGAs. Residency is satisfied when the User's jurisdiction `id` equals the poll's jurisdiction `id` **or** is a descendant of it.
  - `policy_polls`: `id`, `title`, `question`, `options` (JSON array of option strings), `jurisdiction_id` (FK), `status` (`scheduled` | `open` | `closed`), `opens_at`, `closes_at`, `created_by` (user id), `created_at`.
  - `policy_votes`: `id`, `poll_id` (FK), `voter_id` (FK), `option_index` (int), `created_at`. Unique `(poll_id, voter_id)`. Stored without any link usable to reconstruct the individual in results.

- `services/poll.service.ts` — single source of truth. Public surface:
  - `createPoll({ title, question, options, jurisdictionId, opensAt, closesAt, createdBy })` → validates (2–5 options, closesAt > opensAt, creator exists) and inserts a `scheduled` poll.
  - `castVote({ pollId, voter })` → resolves the voter (an authenticated, `id_verified` User with a jurisdiction), enforces: poll is `open` (window per injected clock), voter residency within scope, not already voted (unique constraint + pre-check), then inserts the vote.
  - `getResults({ pollId })` → returns per-option counts + percentages and the disclaimer string.
  - `statusOf({ pollId })` → derives `scheduled`/`open`/`closed` from the clock + window (the stored `status` is a cached convenience; the clock is authoritative for transitions).

- `lib/validation/poll.ts` — shared Zod schema (options count 2–5, non-empty title/question, time order, jurisdiction id present).

**Collaborators (injected):** the existing `Clock`; a `VoterResolver` that, given a session token, returns the authenticated User (with `verificationStatus` + `jurisdictionId`) or rejects — seeded from the auth service, so poll logic owns no auth. Residency resolution (ancestor walk up `jurisdictions.parent_id`) lives in the poll service or a small `lib/jurisdiction.ts` helper.

**Behavioral decisions:**

- Voter identity is established **before** `castVote` is called (the entry point validates the session via the auth service and passes the resolved User). `poll.service` enforces `verificationStatus === "id_verified"` and residency; it does not re-implement session validation.
- One-person-one-vote: unique `(poll_id, voter_id)` is the ultimate guard; a pre-check gives a clear error.
- Residency: User's jurisdiction must equal or be a descendant of the poll's jurisdiction (hierarchical). National poll → any citizen; state poll → that state and its LGAs; local poll → that LGA only.
- Time window: `statusOf` uses the injected clock; votes only accepted when `open`.
- Results are aggregate-only; the `policy_votes` row stores `voter_id` for uniqueness but results never join back to the User. (Full anonymization at rest is a later hardening concern; this slice guarantees results don't expose individuals.)
- Poll creation is open to any authenticated creator in this slice (the moderator/NGO/government approval workflow of §3.1.5 is deferred — see Out of Scope).

## Testing Decisions

**Seam:** the single `poll.service.ts` service seam, with:
- injected **fixed clock** (assertable open/close transitions),
- a **fake `VoterResolver`** (returns a configured verified User with a jurisdiction, or rejects),
- real test DB (pglite) so the `(poll_id, voter_id)` unique constraint and jurisdiction hierarchy are genuinely exercised.

**Representative cases:** createPoll persists a `scheduled` poll with 2–5 options; rejects <2 or >5 options and a bad time window; statusOf flips scheduled→open→closed across the clock; an id_verified resident votes once; an unverified User is rejected; a non-resident is rejected; a second vote is rejected (unique constraint); a vote outside the open window is rejected; getResults returns counts + percentages + the disclaimer; results never expose the voter. Jurisdiction hierarchy: a national poll accepts a local-LGA resident; a state poll accepts an LGA within it but not another state; a local poll accepts only that LGA.

**Prior art:** evidence + auth slices established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- **Poll moderation/approval workflow** (§3.1.5 advisory board, citizen suggestions) — a follow-up slice. This slice lets any authenticated creator make a poll.
- **Regional breakdown statistics & confidence intervals** (§3.1.7) — results are overall-only here.
- **Emergency/special polls, frequency rules** (§3.1.8) — not modelled.
- **Confidence votes on officials** (§3.2) — a separate slice.
- **Web/mobile entry points** — the service is callable; transport is later.
- **Full vote anonymization at rest** (no `voter_id` stored) — deferred; this slice guarantees results are aggregate-only.
- **AI/tamper on polls, audit logging of votes** — out of scope (evidence integrity is a different subsystem).

## Further Notes

- First beta civic feature. Depends on the Auth & Identity slice: a voter is an `id_verified` User resolved from a Session.
- Reuses the architecture: single service seam, injected collaborators, real test DB, forward-only-ish status derived from the clock.
- Domain terms (`User`, `Account Verification Status`, `Session`, residency via `jurisdictions`) align with `CONTEXT.md`.
- Next slices likely: Confidence Votes, then Lawyer Marketplace.
- Tickets land under `.scratch/policy-polls/issues/NN-<slug>.md`.
