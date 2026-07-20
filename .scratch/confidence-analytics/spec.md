# Spec: Confidence Vote Analytics (regional, trend, interval)

Status: done

Analytics extension to the **Confidence Votes** slice (.scratch/confidence-votes). Adds three read-only result views the base slice deferred (architecture §3.2.6): **regional breakdown** (results per local government area, when statistically significant), **trend** (quarter-over-quarter comparison), and a **confidence interval** (statistical uncertainty on the yes-percentage). No new writes; all build on the existing `confidence_votes` table and `jurisdictions` hierarchy.

Builds on the completed Confidence Votes slice (`getResults`, `quarterOf`, `isTermActive`) and reuses the `jurisdictions` table for the regional roll-up.

See also `CONTEXT.md` for canonical vocabulary (Official, Confidence Vote, Confidence Index, Jurisdiction).

## Problem Statement

The base confidence-votes slice returns only an overall Public Confidence Index for one quarter. Citizens and analysts cannot see how confidence varies by local government area, how it changes quarter over quarter, or how much uncertainty the sample carries. Without these, the index is hard to interpret or trust.

## Solution

Extend `confidence.service.ts` with three read methods:

1. **Regional breakdown** — `getRegionalBreakdown({ officialId, quarter? })` returns, for each LGA (leaf `jurisdictions` node) under the official's jurisdiction, the per-option counts/percentages and yes-percentage, **but only when that LGA has at least `MIN_SAMPLE` votes** (statistical-significance gate; otherwise it is omitted). National/state officials roll down to their descendant LGAs.
2. **Trend** — `getTrend({ officialId })` returns the Confidence Index (yes/no/uncertain percentages) for each quarter the official has votes, ordered chronologically, so callers can compare quarter over quarter.
3. **Confidence interval** — `getResults` (and the breakdown) additionally report a Wilson 95% confidence interval around the yes-percentage, so uncertainty is visible.

The mandatory disclaimer remains on every result view.

## User Stories

1. As a citizen, I want to see confidence broken down by local government area, so that I can see regional variation.
2. As the platform, I want regional rows with too few votes to be omitted, so that we don't publish statistically meaningless splits.
3. As a citizen, I want to see quarter-over-quarter trend, so that I can judge momentum.
4. As a citizen, I want a confidence interval on the yes-percentage, so that I understand the sample's uncertainty.
5. As the platform, I want every analytics view to carry the non-binding disclaimer.

## Implementation Decisions

**Modules changed:**

- `services/confidence.service.ts` — add:
  - `getRegionalBreakdown({ officialId, quarter? })` → walks the official's jurisdiction descendants to leaf LGAs (via `lib/jurisdiction.ts`/`jurisdictions`), tallies `confidence_votes` per LGA for the quarter, and returns only LGAs with `count >= MIN_SAMPLE`. Each row carries per-option counts/percentages and a yes-percentage + Wilson CI.
  - `getTrend({ officialId })` → groups `confidence_votes` by `quarter`, returns each quarter's index (yes/no/uncertain percentages) + total, chronologically ordered.
  - extend `getResults` to include `yesPercentage` and `yesConfidenceInterval` ({ low, high }) computed via a shared `wilsonInterval(successes, n)` helper.
- `lib/confidence-stats.ts` — pure helpers: `wilsonInterval(successes, n, z?)` (Wilson score interval at 95% by default) and `regionalRollup`/`isLeafLga` helpers as needed. Pure + unit-tested.

**Behavioral decisions:**

- Regional significance gate: `MIN_SAMPLE` (e.g. 30) is a named constant; LGAs below it are omitted from the breakdown (architectural "when statistically significant").
- The roll-up uses the jurisdictions hierarchy: a national official → all LGAs nationally; a state official → LGAs in that state; a local official → just that LGA. Reuse the ancestor/descendant walk.
- Trend quarters are derived from stored `quarter` strings; ordering is lexical (`YYYY-Qn` sorts correctly).
- The confidence interval is computed on the **yes** option percentage (the primary sentiment signal); other options report their percentage without a separate interval in this slice.
- All analytics views include `CONFIDENCE_DISCLAIMER`.
- Determinism: pure helpers, no clock needed beyond what `getResults` already uses.

## Testing Decisions

**Seam:** extend the existing `confidence.service.ts` tests. Unit-test the pure helpers in `lib/confidence-stats.ts` directly (Wilson interval known values; roll-up leaf detection). Service tests use the real pglite DB with seeded votes across LGAs/quarters.

**Representative cases:** wilsonInterval returns [0,1] bounds within (0,1) and narrows with larger n; regional breakdown omits LGAs below MIN_SAMPLE; breakdown sums correctly per LGA; trend returns quarters in order with correct per-quarter percentages; getResults now reports yesPercentage + CI; disclaimer present on all three views.

**Prior art:** evidence + auth + policy-polls + confidence-votes slices established the harness + injected-collaborator + real-test-DB pattern; follow it.

## Out of Scope

- **Per-option confidence intervals** — only the yes-percentage gets a CI here.
- **Significance testing across quarters** (is the trend real?) — descriptive trend only.
- **Benchmarking officials against peers** — single-official views only.
- **Web/mobile entry points** — services are callable; transport is later.

## Further Notes

- Pure analytics on the existing Confidence Votes data; no schema migration required.
- Updates CONTEXT.md terms (Regional Breakdown, Trend, Confidence Interval) when built.
- Tickets land under `.scratch/confidence-analytics/issues/NN-<slug>.md`.
