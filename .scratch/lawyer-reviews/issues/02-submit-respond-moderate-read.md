# 02 — Submit, respond, moderate & read reviews

**What to build:** The review lifecycle. `submitReview` lets an id_verified reviewer post a 1–5 review (optional comment, anonymous flag) for a `verified` lawyer, enforcing one review per lawyer per reviewer. `respondToReview` lets the reviewed lawyer post one response. `moderateReview` flags a review (excluded from display/rating). `getReviews` returns non-moderated reviews with reviewer identity hidden; `getRating` returns the average and count over non-moderated reviews. Public methods never expose the reviewer's credentials.

**Blocked by:** 01 — Review schema & validation (and the Lawyer Marketplace slice for `verified` lawyers, and Auth for id_verified reviewers)

**Status:** ready-for-agent

- [x] `submitReview({ lawyerId, reviewer, rating, comment?, anonymous })` inserts a review after validation (lawyer exists & verified, reviewer id_verified, rating 1–5)
- [x] Rejects a missing or unverified lawyer
- [x] Rejects an unverified reviewer
- [x] Rejects a duplicate review (unique constraint + clear error)
- [x] `respondToReview({ reviewId, lawyerId, response })` sets the response on a review owned by that lawyer
- [x] `moderateReview({ reviewId })` flags a review moderated
- [x] `getReviews({ lawyerId })` returns non-moderated reviews, hiding reviewer identity (name hidden when anonymous; reviewerId never returned)
- [x] `getRating({ lawyerId })` returns averageRating (1 decimal) and reviewCount over non-moderated reviews
- [x] Moderated reviews are excluded from getReviews and getRating
