# 04 — Results

**What to build:** After votes are cast, aggregate results can be read. `getResults` returns per-option counts and percentages, plus the mandatory non-binding disclaimer. Results are aggregate-only and never attribute a vote to an individual User.

**Blocked by:** 03 — Casting a vote (eligibility)

**Status:** ready-for-agent

- [x] `getResults({ pollId })` returns per-option counts and percentages
- [x] The result includes the disclaimer: "This is citizen sentiment only. It has no legal or electoral weight."
- [x] Results are aggregate-only — no voter identity is exposed (no join back to the User in the output)
