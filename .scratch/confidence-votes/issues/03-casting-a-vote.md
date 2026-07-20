# 03 — Casting a confidence vote (eligibility)

**What to build:** An ID-verified User who resides within the official's jurisdiction can cast exactly one confidence vote per quarter while the official's term is active. `castVote` enforces, in order: the official's term is active (clock-derived), the voter is `id_verified`, the voter's jurisdiction is within the official's scope (hierarchical: equal or descendant), the option is valid, and the voter has not already voted this quarter. One-vote-per-quarter is ultimately guaranteed by the unique `(official_id, voter_id, quarter)` constraint.

**Blocked by:** 02 — Official registration (and the Auth & Identity slice for `id_verified` Users)

**Status:** ready-for-agent

- [x] `castVote({ officialId, voter, option })` accepts one vote from an `id_verified` resident while the term is active
- [x] Rejects a vote when the official's term is not active
- [x] Rejects a vote from a User whose Account Verification Status is not `id_verified`
- [x] Rejects a vote from a User outside the official's jurisdiction scope (hierarchical residency)
- [x] Rejects an invalid option value
- [x] Rejects a second vote by the same User on the same official in the same quarter (unique constraint + clear error)
- [x] The vote stores option and voter_id for uniqueness, but results never expose the individual
