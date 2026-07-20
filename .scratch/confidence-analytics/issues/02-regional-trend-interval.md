# 02 — Regional breakdown, trend & confidence interval

**What to build:** The three analytics views on top of `confidence_votes`. `getRegionalBreakdown` rolls results down to leaf LGAs under the official's jurisdiction, omitting LGAs below a significance threshold; `getTrend` returns quarter-over-quarter indices; `getResults` gains a yes-percentage and Wilson confidence interval. All views carry the disclaimer.

**Blocked by:** 01 — Confidence analytics stats helpers (and the Confidence Votes slice for `getResults`, `quarterOf`, jurisdictions)

**Status:** ready-for-agent

- [x] `getRegionalBreakdown({ officialId, quarter? })` returns per-LGA counts/percentages + yes-percentage + CI, omitting LGAs with fewer than `MIN_SAMPLE` votes
- [x] `getTrend({ officialId })` returns the index per quarter, chronologically ordered
- [x] `getResults` includes `yesPercentage` and `yesConfidenceInterval` ({ low, high })
- [x] All three views include the non-binding disclaimer
- [x] Regional breakdown sums correctly per LGA and respects the official's jurisdiction scope (national → all LGAs, state → its LGAs, local → itself)
