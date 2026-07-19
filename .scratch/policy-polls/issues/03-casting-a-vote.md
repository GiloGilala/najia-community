# 03 — Casting a vote (eligibility)

**What to build:** An ID-verified User who resides within the poll's jurisdiction can cast exactly one vote while the poll is `open`. `castVote` enforces, in order: the poll is currently `open` (clock-derived), the voter is `id_verified`, the voter's jurisdiction is within the poll's scope (hierarchical: equal or descendant), and the voter has not already voted. One-person-one-vote is ultimately guaranteed by the unique `(poll_id, voter_id)` constraint.

**Blocked by:** 02 — Poll creation & status (and the Auth & Identity slice for `id_verified` Users)

**Status:** ready-for-agent

- [x] `castVote({ pollId, voter })` accepts one vote from an `id_verified` resident while the poll is `open`
- [x] Rejects a vote when the poll is not `open` (scheduled or closed)
- [x] Rejects a vote from a User whose Account Verification Status is not `id_verified`
- [x] Rejects a vote from a User outside the poll's jurisdiction scope (hierarchical residency)
- [x] Rejects a second vote by the same User on the same poll (unique constraint + clear error)
- [x] The vote stores option_index and voter_id for uniqueness, but results never expose the individual
