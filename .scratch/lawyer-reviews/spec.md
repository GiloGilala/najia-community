# Spec: Lawyer Reviews & Ratings

Status: done

Slice of the Najia Community Bridge platform (see `civic-platform-architecture.md`, Section 5.5). Extends the completed **Lawyer Marketplace** slice with citizen reviews of lawyers. A verified citizen who has engaged a lawyer can leave a review (overall rating 1–5 plus optional text); reviews can be anonymous; a review carries a `moderated` flag (platform moderation deferred to a later workflow, but the field and a `moderate` action exist). Lawyers can respond to reviews. The lawyer's **overall rating** (average of non-moderated reviews, out of 5) and **review count** are derived for display.

Builds on the **Lawyer Marketplace** slice (`lawyers` table, `verification_status`) and the **Auth & Identity** slice (a reviewer is an `id_verified` User; reviews never expose the reviewer's credentials).

See also `CONTEXT.md` for canonical vocabulary (User, Account Verification Status, Lawyer, Lawyer Profile).

## Problem Statement

The Lawyer Marketplace lets citizens find eligible lawyers, but there is no way to record or surface quality signals. Without reviews and an overall rating, citizens cannot make informed choices and the platform cannot weight matching by satisfaction (§5.4.2).

## Solution

A single `lawyer-reviews.service.ts` with:

1. **Submit a review** — a verified User posts a review for a `verified` lawyer: `rating` (1–5 integer), `comment` (optional, non-empty if present, capped length), `anonymous` (bool). Stored with `reviewer_id` for uniqueness/audit but never surfaced in public display.
2. **Lawyer responds** — a lawyer (the reviewed lawyer's owning User) can post one `response` to a review.
3. **Moderate** — a platform action sets `moderated = true` (e.g. inflammatory/defamatory; full moderation workflow is deferred). Moderated reviews are excluded from the overall rating and public list.
4. **Read reviews & rating** — `getReviews({ lawyerId })` returns non-moderated reviews (reviewer identity hidden; if `anonymous`, no name shown) plus `getRating({ lawyerId })` → `{ averageRating, reviewCount }` computed from non-moderated reviews.

## User Stories

1. As a verified citizen, I want to leave a 1–5 review (with optional comment) for a lawyer I engaged, so that others can judge quality.
2. As a citizen, I want my review to be anonymous if I choose, so that I can speak freely.
3. As the platform, I want reviews to require a `verified` lawyer and a `verified` reviewer, so that only legitimate reviews count.
4. As a lawyer, I want to respond to a review left for me, so that I can give context.
5. As the platform, I want to moderate (flag) a review, so that inflammatory or defamatory content is excluded.
6. As a citizen, I want to see a lawyer's overall rating (average out of 5) and review count, so that I can compare lawyers.
7. As the platform, I want moderated reviews excluded from the rating and public list, so that only authentic content counts.
8. As the platform, I want public review display to never expose the reviewer's credentials, so that privacy holds.

## Implementation Decisions

**Modules built (new):**

- `db/schema/lawyer-reviews.ts` — `lawyer_reviews` table: `id`, `lawyer_id` (FK lawyers.user_id), `reviewer_id` (FK users), `rating` (int 1–5), `comment` (text, nullable), `anonymous` (bool), `moderated` (bool, default false), `created_at`. Unique `(lawyer_id, reviewer_id)` so a reviewer reviews a lawyer once (one review per lawyer per reviewer).
- `services/lawyer-reviews.service.ts` — single source of truth. Public surface:
  - `submitReview({ lawyerId, reviewer, rating, comment?, anonymous })` → validates (lawyer exists & `verified`, reviewer `id_verified`, rating 1–5, comment length cap) and inserts.
  - `respondToReview({ reviewId, lawyerId, response })` → sets `response` on the review if it belongs to that lawyer.
  - `moderateReview({ reviewId })` → sets `moderated = true`.
  - `getReviews({ lawyerId })` → non-moderated reviews, reviewer identity hidden (name shown only when not anonymous; `reviewerId` never returned).
  - `getRating({ lawyerId })` → `{ averageRating, reviewCount }` over non-moderated reviews.
- `lib/validation/lawyer-review.ts` — shared Zod validation (rating 1–5, comment optional ≤ 1000 chars).

**Collaborators (injected):** the `DbClient` and `Clock` (consistent with other services). The reviewer is passed as a `ResolvedVoter` (reused from auth), so the service enforces `verificationStatus === "id_verified"` without owning auth.

**Behavioral decisions:**

- A lawyer is identified by `lawyer_id` = `lawyers.user_id` (the Lawyer *is* a User). `submitReview` requires the lawyer row exist and be `verified`.
- One review per lawyer per reviewer (unique constraint; a pre-check gives a clear error).
- `anonymous` reviews hide the reviewer name in `getReviews`; `reviewerId` is never returned in any public method.
- `moderated` reviews are excluded from both `getReviews` and `getRating`.
- `respondToReview` is restricted to the lawyer who owns the review (matched by `lawyerId`).
- Rating average rounds to one decimal for stable display; `reviewCount` is the count of non-moderated reviews.

## Testing Decisions

**Seam:** the single `lawyer-reviews.service.ts` service seam, with the injected `Clock` and a real test DB (pglite) so the `(lawyer_id, reviewer_id)` unique constraint is genuinely exercised. Reviewer is a `FakeVoterResolver`-style object (a `ResolvedVoter`) passed directly.

**Representative cases:** submitReview persists a review for a verified lawyer by an id_verified reviewer; rejects a missing/unverified lawyer; rejects an unverified reviewer; rejects rating out of range; rejects duplicate review (unique constraint); anonymous review hides reviewer in getReviews; lawyer responds to own review; moderateReview excludes the review from getReviews and getRating; getRating computes average and count; public display never returns reviewerId.

**Prior art:** evidence + auth + policy-polls + confidence-votes + lawyer-marketplace slices established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- **Full moderation workflow** (queue, moderator roles, appeal) — only a `moderate` flag action here (§5.5.2 moderation deferred to workflow).
- **Category breakdown ratings** (communication, expertise, value — §5.5.3) — overall 1–5 only.
- **Peer reviews (other lawyers)** and **case success rate** (§5.5.1) — citizen reviews only.
- **Verification that the reviewer actually engaged the lawyer** — the "verified client" gate (§5.5.2) is deferred; any id_verified User may review in this slice.
- **Web/mobile entry points** — the service is callable; transport is later.

## Further Notes

- Extends the Lawyer Marketplace slice. Depends on it (lawyers table) and the Auth & Identity slice (reviewer is an id_verified User).
- Domain terms (Review, Overall Rating) added to CONTEXT.md when this slice is built.
- Next slices likely: engagement/consultation flow, then Confidence Votes trend/regional breakdown.
- Tickets land under `.scratch/lawyer-reviews/issues/NN-<slug>.md`.
