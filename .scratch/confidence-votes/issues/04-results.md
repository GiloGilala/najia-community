# 04 — Confidence results

**What to build:** After votes are cast, aggregate results can be read. `getResults` returns per-option counts and percentages (the Public Confidence Index) for a quarter, plus the mandatory non-binding disclaimer. Results are aggregate-only and never attribute a vote to an individual User. Defaults to the current quarter per the injected clock; accepts an explicit quarter.

**Blocked by:** 03 — Casting a confidence vote (eligibility)

**Status:** ready-for-agent

- [x] `getResults({ officialId, quarter? })` returns per-option counts and percentages for the requested quarter (default current)
- [x] The result includes the disclaimer: "This is citizen sentiment only. It has no legal or electoral weight."
- [x] Results are aggregate-only — no voter identity is exposed (no join back to the User in the output)
