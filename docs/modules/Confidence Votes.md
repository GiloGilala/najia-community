# Module Spec — Confidence Votes

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director*
*Parent PRD: [PRD.md §4.3](../product/PRD.md#43-confidence-votes-pillar-1)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: officials list, quarterly confidence windows, voting on officials, results with quarter-over-quarter trend, official lifecycle. Out of scope: comments on officials, following officials, push notifications for window open/close, federal officials (pilot is Lagos-focused).

---

## 1. Overview

### 1.1 Module Name

Confidence Votes

### 1.2 Purpose

Enable verified citizens to express non-binding sentiment on the performance of elected officials during structured quarterly windows. Like Policy Polls, the module's primary design constraints are the **non-binding framing** and **vote anonymization**. The secondary constraint is the **quarterly cadence** — windows are open for a fixed 7-day period, and the system's behavior is largely automatic (open / close / compute results / display).

### 1.3 In Scope

- Officials list (President, Governors, State House of Assembly Members, LGA Chairpersons) — pilot is Lagos-focused
- Official profile pages with role, jurisdiction, responsibilities
- Quarterly confidence windows (Jan, Apr, Jul, Oct; 7 days per quarter)
- Voting (Yes / No / Uncertain) by verified citizens in the official's jurisdiction
- Vote uniqueness enforcement (one vote per user per official per quarter)
- Vote anonymization using the same `voter_token_hash` design as Policy Polls
- Results aggregation with confidence intervals
- Quarter-over-quarter trend display (from Q2 of the pilot onwards)
- Regional breakdowns (when statistically significant)
- Official lifecycle (added within 30 days of assuming office, updated at term end)
- Audit trail for all state changes and eligibility checks

### 1.4 Out of Scope

- **Federal officials (President, federal legislators) in the pilot** — the pilot is Lagos-focused. Federal officials come with Phase 2 expansion or Year 2 national expansion.
- **Comments on officials** — deferred to Year 2 (would require moderation at scale).
- **Following an official for updates** — deferred to Year 2.
- **Push notifications when windows open** — deferred to mobile Year 2.
- **Historical analysis beyond quarter-over-quarter** — Year 2+.
- **LGA-level breakdowns** — only state-level in the pilot; LGA breakdowns are a Year 2 feature (privacy threshold: n ≥ 100 per LGA).
- **Senator / House of Reps members** — State House of Assembly only in the pilot.
- **Judicial officials** — elected executive and legislative only; the judiciary is a different domain.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Confidence votes conducted | 4 (one per quarter) | Count |
| Confidence vote participants (cumulative) | ≥ 1,000 | Unique voters across all votes |
| Officials covered in Lagos | All sitting (Governor, House of Assembly Members per LGA, LGA Chairpersons) | Admin count |
| Vote-to-officials ratio | ≥ 30% of Lagos officials receive at least 100 votes per quarter | Analytics |
| Quarter-over-quarter display | Available from Q2 onwards | UI check |
| Vote anonymization verification | 100% (same standard as Policy Polls) | Code review + audit |
| Non-binding disclaimer visibility | 100% (on every results page) | UI audit |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Verified citizen | View the list of officials I can vote on | I can see who I'm being asked about | Must |
| Verified citizen | Vote Yes / No / Uncertain on an official | I can express my confidence in them | Must |
| Verified citizen | Add an optional rationale to my vote | I can express my view in more detail (non-binding) | Should |
| Verified citizen | See the non-binding disclaimer prominently | I know my vote doesn't have legal or electoral effect | Must |
| Verified citizen | See quarter-over-quarter trend for an official | I can track how sentiment is changing | Should |
| Verified citizen | Not be identified as the voter | I can vote without fear of consequences | Must |
| Verified citizen | Be unable to vote twice on the same official in the same quarter | I trust the integrity of the result | Must |
| Verified citizen | Receive a clear message if I'm not in the official's jurisdiction | I understand why I can't vote | Must |
| Non-verified visitor | View past confidence vote results | I can see what citizens thought | Must |
| Admin | Add an official to the system | The official is available for voting | Must |
| Admin | Update an official's term status | Outgoing officials are no longer votable | Must |
| Admin | Override a window's open/close time in an emergency | I can respond to operational issues | Should |
| Moderator | View all confidence vote results | I can audit the system | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `officials` | `id`, `name`, `role` (GOVERNOR/HOUSE_MEMBER/LGA_CHAIR/PRESIDENT — pilot uses first three), `jurisdiction_type` (state/LGA), `jurisdiction_value`, `term_start`, `term_end` (nullable for incumbents), `description` (responsibilities), `photo_url`, `is_active`, `created_at`, `updated_at` | The officials themselves |
| `confidence_windows` | `id`, `quarter` (Q1/Q2/Q3/Q4), `year`, `start_at`, `end_at`, `status` (SCHEDULED/OPEN/CLOSED) | The quarterly voting windows |
| `confidence_votes` | `id`, `window_id`, `official_id`, `voter_token_hash`, `option` (YES/NO/UNCERTAIN), `rationale_text` (nullable, ≤ 500 chars), `cast_at` | **No `user_id` column.** Same anonymization design as Policy Polls. |
| `confidence_results_cache` | `window_id`, `official_id`, `total_votes`, `option_counts` (JSON), `confidence_intervals` (JSON), `computed_at` | Cached aggregated results |
| `audit_log` | cross-cutting | Every state change and every eligibility check |

#### 3.1.1 The Anonymization Model (Same as Policy Polls)

The `confidence_votes` table has no `user_id` column. The `voter_token_hash` is computed the same way as in Policy Polls:
voter_token_hash = SHA-256(user_id + official_id + window_id + pepper)

text


The pepper is the same platform-wide pepper used for Policy Polls. This is **critical** — using a single pepper means a user cannot be correlated across the two voting tables by hash analysis, because the hashes are computed from the same secret and look uniformly random. If we used a different pepper per module, a sophisticated attacker could potentially correlate by analyzing the hash distribution.

The DB uniqueness constraint is on `(window_id, official_id, voter_token_hash)`. The combination of all three prevents:
- Double-voting on the same official in the same window
- Using a vote from a different window to bypass the per-window uniqueness
- Using a vote from a different official to bypass the per-official uniqueness

The hash cannot be reversed to identify the user. No query path exists from a vote record to a user identity.

The trade-offs are the same as Policy Polls:
- No vote change after submission
- DSAR cannot retrieve confidence votes
- The user sees a confirmation but cannot re-access "their" vote later (because we don't store the link)

#### 3.1.2 The Quarterly Window Model

A confidence window is a quarterly voting period. The window:

| Field | Value |
|-------|-------|
| `quarter` | Q1, Q2, Q3, Q4 |
| `year` | The year |
| `start_at` | First day of the window at 00:00:00 UTC |
| `end_at` | First day of the window at 23:59:59 UTC + 6 days (so 7 full days) |
| `status` | SCHEDULED (before start), OPEN (during window), CLOSED (after end) |

The exact dates:

| Quarter | Typical window |
|---------|----------------|
| Q1 | January 1–7 |
| Q2 | April 1–7 |
| Q3 | July 1–7 |
| Q4 | October 1–7 |

The pilot starts in Q3 2026 (July 2026) and the first window opens on July 1, 2026. Windows for the next 2 years are pre-created at pilot launch.

Windows transition automatically:
- A scheduled Bun.cron job checks every minute and transitions `SCHEDULED` → `OPEN` at `start_at` and `OPEN` → `CLOSED` at `end_at`
- Manual override by an admin is possible (emergency only) and is audit-logged

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/officials` | List officials (filterable by role, jurisdiction) | Public | — |
| `GET` | `/api/officials/:officialId` | Get official profile | Public | — |
| `GET` | `/api/officials/:officialId/history` | Get all past results for an official | Public | — |
| `GET` | `/api/confidence/current-window` | Get the current window info | Public | — |
| `GET` | `/api/confidence/windows` | List all windows (past, current, future) | Public | — |
| `GET` | `/api/confidence/windows/:windowId` | Get window detail | Public | — |
| `GET` | `/api/confidence/windows/:windowId/results` | Get aggregated results (only after close) | Public | — |
| `POST` | `/api/confidence/windows/:windowId/officials/:officialId/vote` | Cast a vote | Authenticated | `confidence:vote` |
| `GET` | `/api/confidence/windows/:windowId/officials/:officialId/my-vote` | Get current user's selection | Authenticated | `confidence:vote` |
| `POST` | `/api/admin/officials` | Add an official | Authenticated | `admin:officials` |
| `PUT` | `/api/admin/officials/:officialId` | Update an official | Authenticated | `admin:officials` |
| `POST` | `/api/admin/confidence/windows/:windowId/open` | Open a window early (emergency) | Authenticated | `admin:officials` |
| `POST` | `/api/admin/confidence/windows/:windowId/close` | Close a window early (emergency) | Authenticated | `admin:officials` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `officialsListLoader` | Load officials list (filterable) |
| `officialProfileLoader` | Load official profile with current window status and history |
| `castConfidenceVoteAction` | Cast a vote from the official's profile page |
| `confidenceResultsLoader` | Load results (only after close) |
| `adminOfficialsAction` | Add/update an official |
| `adminWindowAction` | Emergency window open/close |

### 3.3 Business Rules

1. **Only verified citizens can vote.** Unverified users get a CTA to verify.
2. **A user must reside in the official's jurisdiction.** Lagos officials are votable only by verified Lagos residents.
3. **A user can vote only once per official per quarter.** The `(window_id, official_id, voter_token_hash)` uniqueness constraint enforces this at the DB level.
4. **Voting is only allowed when the window is `OPEN` and the current time is between `start_at` and `end_at`.**
5. **The `confidence_votes` table has no `user_id` column.** Voter is identified only by `voter_token_hash`.
6. **The non-binding disclaimer is displayed on every results page and on every official profile when a window is open.** Standard language: "This is citizen sentiment only. It has no legal or electoral weight."
7. **The rationale field (if used) is anonymous.** It is stored with the vote but not associated with the user. The user understands this; it is disclosed in the UI.
8. **Results are not shown during an open window.** Same as Policy Polls — to prevent anchoring.
9. **Results are computed at window close** and cached in `confidence_results_cache`.
10. **Confidence intervals are computed and displayed.** 95% CI alongside each option's percentage.
11. **Quarter-over-quarter trend is shown from Q2 of the pilot onwards.** (We need a Q1 baseline before we can show a trend.)
12. **Regional breakdowns (state-level for federal officials, LGA-level for state officials) are shown only when statistically significant** (n ≥ 100 per region). Pilot shows state-level only.
13. **Officials are added to the system within 30 days of assuming office** (per [PLATFORM.md §9.2.1](../PLATFORM.md#921-official-identification)). The platform never invents officials; they are seeded from public records.
14. **An official's term end date is updated within 30 days of their term ending.** Once `is_active = false`, the official is no longer votable, but their history is preserved.
15. **The quarterly window schedule is fixed.** The system opens and closes windows automatically; moderators do not manage windows.
16. **An admin can override the window schedule in an emergency** (e.g., system outage during a window). The override is audit-logged with a written reason.
17. **All state changes are audit-logged.** Every window transition, every official add/update, every vote eligibility check.

### 3.4 State Machine — Windows
SCHEDULED
│ system: now >= start_at
│ OR admin: emergency open
▼
OPEN
│ system: now >= end_at
│ OR admin: emergency close
▼
CLOSED

text


`CLOSED` is terminal for the window. The next quarter's window is a separate row.

### 3.5 State Machine — Officials
DRAFT
│ admin publishes
▼
ACTIVE
│ term ends / admin deactivates
▼
INACTIVE
│ (terminal for now; reactivating creates a new record with a new term)

text


`DRAFT` allows admins to set up an official (including photo, bio, jurisdiction) before the official is public. `INACTIVE` preserves the official's history but removes them from votable lists.

### 3.6 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| User not verified | "You need to verify your identity to vote. [CTA: Verify now]" | `VERIFICATION_REQUIRED` (403) |
| User not in jurisdiction | "This official represents [State]. You're registered as a resident of [State]." | `NOT_IN_JURISDICTION` (403) |
| Window not open | "The current window is [SCHEDULED/CLOSED]. Voting is open from [date] to [date]." | `WINDOW_NOT_OPEN` (422) |
| Window closed | "Voting for this quarter has closed. The next window opens [date]. See results below." | `WINDOW_CLOSED` (422) |
| User already voted this quarter | "You voted on [Official] in [Quarter]. See your selection above." (Shows the user's previous option.) | `ALREADY_VOTED` (409) |
| Official is INACTIVE | "This official is no longer in office. You cannot vote on them." | `OFFICIAL_INACTIVE` (422) |
| Results requested during open window | The endpoint returns 404. The user sees: "Results will be available when the window closes on [date]." | (Not an error; 404 is deliberate.) |
| NIMC API failure at vote time | "We can't verify your eligibility right now. Please try again in a few minutes." (Cached verification honored if within 30 days.) | `VERIFICATION_UNAVAILABLE` (503) |
| Admin opens a window that's already open | "This window is already open." | `WINDOW_ALREADY_OPEN` (409) |
| Admin closes a window that's already closed | "This window is already closed." | `WINDOW_ALREADY_CLOSED` (409) |
| Official added with a `term_start` in the past | Allowed (for incumbents); the official becomes votable immediately | — |
| Official added with a `term_end` in the past | Rejected: "An official cannot be added with a term end date in the past. Use a term_start and leave term_end open for incumbents." | `INVALID_TERM_END` (422) |
| Official added without a jurisdiction | Rejected: "An official must have a jurisdiction." | `JURISDICTION_REQUIRED` (422) |
| Vote with rationale > 500 chars | Rejected: "Rationale must be 500 characters or fewer." | `RATIONALE_TOO_LONG` (422) |
| Vote with empty rationale | Allowed (rationale is optional) | — |
| Window transitions missed (system clock drift) | The Bun.cron job runs every minute, so the maximum delay is 60 seconds. Alert if a transition is more than 5 minutes late. | (Operational) |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `confidence:read` | public (anonymous) | Anyone can view officials and past results |
| `confidence:vote` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` | Any verified user in the official's jurisdiction |
| `admin:officials` | `admin` | Admins add/update officials |
| `admin:officials:view` | `moderator`, `admin` | Moderators can view official list and history |

Note: the same anonymized `voter_token_hash` design is used. The permission to vote is `confidence:vote` (a resource-level permission on `Confidence`). CASL conditions check jurisdiction at the user level (the user's verification record includes their state), not at the vote level.

---

## 5. User Experience

### 5.1 Key Screens

Reference [UX & Design.md §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot). The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 15 | Confidence votes list | All | No | No |
| 16 | Official detail (pre-vote) | Amara | Yes | Yes |
| 17 | Confidence vote results | All | No | No |

### 5.2 User Flows

Reference [User Journeys.md §5](../product/User%20Journeys.md#5-j3--verified-citizen-votes-on-a-confidence-question) for the J3 journey. This module implements J3.

### 5.3 The Non-Binding Disclaimer

Same as Policy Polls (§5.3 of that module). The disclaimer must appear:

- On every official profile when a window is open
- On every vote submission confirmation
- On every results page
- On the confidence votes list page header

The standard text: **"This is citizen sentiment only. It has no legal or electoral weight."**

### 5.4 The Rationale Field

The optional rationale field is a sensitive design decision. The user can write up to 500 characters explaining their vote. The system displays it as anonymous in the UI:

- The UI says: "Optional. Your rationale will be anonymous — only your vote (Yes/No/Uncertain) is associated with your identity check, and even that is anonymized."
- The user understands that the rationale text is stored with the vote but is not linked to them.
- The user is reminded: "Be careful not to include identifying information in your rationale."

This is the same anonymization model as the vote itself — the rationale is anonymous by design. But unlike the vote, the rationale is text, so the user could accidentally identify themselves in it. The reminder is the design's defense against this.

### 5.5 Quarter-over-Quarter Trend Display

From Q2 of the pilot onwards, the official's profile shows the trend:
Q2 2026: 58% Yes (±3%) — Q1 2026: 55% Yes (±3%) → +3 percentage points
Q2 2026: 35% No (±3%) — Q1 2026: 38% No (±3%) → -3 percentage points
Q2 2026: 7% Uncertain — Q1 2026: 7% Uncertain → no change

text


The trend is shown with the change, the direction, and the statistical significance. A change within the confidence interval is shown as "no meaningful change" rather than a fake precision number.

### 5.6 Accessibility

Same standards as Policy Polls. The trend display has a text-based accessible alternative (the percentages and intervals are also displayed as a table).

### 5.7 The Amara Test (Module-Specific)

Beyond the general Amara test:

> **Would Amara understand that her confidence vote cannot be tied back to her, even by the platform's own staff, AND that her optional rationale is anonymous?**

If the answer is "no" or "I'm not sure" — the design is not ready. The user must understand both the vote and the rationale are anonymous, and the reminder about not including identifying information must be visible.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Vote cast API P95 | < 200ms (excluding the eligibility check) |
| **Performance** | Officials list P95 | < 200ms |
| **Performance** | Official profile P95 | < 300ms (with history) |
| **Performance** | Results P95 | < 300ms |
| **Security** | voter_token_hash pepper | Same as Policy Polls (shared, rotated together) |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | Rate limit: 30 votes per user per hour (anomaly detection) | Yes |
| **Security** | Rate limit: 1000 votes per IP per hour | Yes |
| **Privacy** | `confidence_votes` contains no `user_id` | Verified by code review |
| **Privacy** | Eligibility check logs do not contain the user's choice | Only eligibility, not vote |
| **Privacy** | DSAR does not include confidence votes | Disclosed in the DSAR response |
| **Reliability** | Confidence vote uptime | ≥ 99.5% |
| **Reliability** | Window transition accuracy | < 60 seconds (Bun.cron runs every minute) |
| **Observability** | Every vote eligibility check logged | Yes |
| **Observability** | Every window transition logged | Yes |
| **Observability** | Alert on window transition > 5 minutes late | Yes |
| **Observability** | Alert on vote rate anomaly | Yes (same threshold as Policy Polls) |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | User must be verified to vote |
| Policy Polls module | Internal (lateral) | Shares the voter token pepper; the anonymization design is intentionally identical |
| RBAC module | Internal | Permission checks |
| Audit log module | Internal | Cross-cutting audit trail |
| Cache layer (SQLite) | Internal | Eligibility cache (30-day TTL) |
| Notification service | Internal | Notify users when a window opens (in-app only, no push) |
| Bun.cron | Internal | Automated window transitions |
| Postgres + Drizzle ORM | Internal | Primary database |

The pepper is **shared** with Policy Polls by design. The two modules' vote tables cannot be correlated by an attacker analyzing hash distributions. A single pepper rotation event must cover both modules.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Officials

- [ ] An admin can add an official with name, role, jurisdiction, term_start, and description
- [ ] An official cannot be added with a `term_end` in the past
- [ ] An official without a jurisdiction is rejected
- [ ] An admin can update an official's term_end
- [ ] An INACTIVE official does not appear in votable lists
- [ ] An INACTIVE official's history is preserved and visible
- [ ] Officials are added within 30 days of assuming office (operational; tracked in the audit log)

### 8.2 Windows

- [ ] Windows are pre-created for at least 2 years at pilot launch
- [ ] A SCHEDULED window transitions to OPEN at `start_at` (within 60 seconds)
- [ ] An OPEN window transitions to CLOSED at `end_at` (within 60 seconds)
- [ ] The transition is logged with the timestamp
- [ ] An admin can open a window early in an emergency (with a written reason)
- [ ] An admin can close a window early in an emergency (with a written reason)
- [ ] An alert fires if a window transition is more than 5 minutes late

### 8.3 Voting

- [ ] An unverified user cannot vote; they see a CTA to verify
- [ ] A verified user in the official's jurisdiction can vote
- [ ] A verified user NOT in the jurisdiction sees a clear "this official represents [State]" message
- [ ] A user can vote exactly once per official per quarter
- [ ] A second attempt returns `ALREADY_VOTED`
- [ ] The vote confirmation shows the user's selection (Yes/No/Uncertain)
- [ ] The vote confirmation includes the optional rationale if provided
- [ ] The vote confirmation includes the non-binding disclaimer
- [ ] A user cannot vote outside the window's date range
- [ ] A user cannot vote on an INACTIVE official
- [ ] A user can submit a vote with an empty rationale (optional)
- [ ] A user cannot submit a rationale > 500 characters

### 8.4 Anonymization

- [ ] The `confidence_votes` table has no `user_id` column (verified by DB schema inspection)
- [ ] The `voter_token_hash` is SHA-256(user_id + official_id + window_id + pepper), where the pepper is the same as Policy Polls
- [ ] The hash cannot be reversed to identify the user
- [ ] No query path exists from a confidence vote to a user identity
- [ ] The DSAR response explicitly states that confidence votes are not retrievable
- [ ] Eligibility check logs do not contain the user's choice
- [ ] The DB uniqueness constraint on `(window_id, official_id, voter_token_hash)` is in place
- [ ] **Cross-table correlation test:** A vote in `confidence_votes` cannot be correlated to a vote in `poll_votes` by hash analysis (because the pepper is shared, the hash domains look uniform)

### 8.5 Results

- [ ] Results are not available during the open window (the endpoint returns 404)
- [ ] Results are computed at window close
- [ ] Results include percentages for Yes / No / Uncertain
- [ ] Results include confidence intervals
- [ ] Results include total vote count
- [ ] Results include the non-binding disclaimer
- [ ] Quarter-over-quarter trend is shown from Q2 onwards
- [ ] A trend within the CI is shown as "no meaningful change"
- [ ] Regional breakdowns (state-level) are shown only when statistically significant

### 8.6 Lifecycle

- [ ] An official's term end date is updated within 30 days of their term ending
- [ ] An INACTIVE official is automatically excluded from votable lists
- [ ] All state transitions (officials, windows) are audit-logged
- [ ] All vote eligibility checks are audit-logged

### 8.7 Security

- [ ] The voter token pepper is the same env var as Policy Polls
- [ ] The pepper is rotated annually (single rotation event covers both modules)
- [ ] The pepper is rotated immediately on any staff departure with DB access
- [ ] All API endpoints over TLS 1.3
- [ ] Rate limit: 30 votes per user per hour
- [ ] Rate limit: 1000 votes per IP per hour
- [ ] No PII in URLs (official ID is a prefixed opaque ID)

### 8.8 Operational

- [ ] Health check includes confidence vote service status
- [ ] Alert on eligibility check failure rate > 5%
- [ ] Alert on vote rate anomaly (10x normal in a 5-minute window)
- [ ] Alert on window transition > 5 minutes late
- [ ] Runbook exists for "window transition missed" (manual transition by admin)
- [ ] Runbook exists for "voter token pepper compromise" (rotate pepper, invalidate all existing votes in both modules)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `confidence.service.ts` — window transitions, official lifecycle
- `confidence.voting.service.ts` — eligibility check, voter token generation, uniqueness
- `confidence.results.service.ts` — aggregation, CI, trend calculation
- `confidence.cron.ts` — window transition logic

Coverage target: ≥ 90% on the anonymization code; ≥ 85% on the rest.

### 9.2 Integration Tests

- Admin adds official → official appears in list → user votes → window closes → results
- Window transition simulation: SCHEDULED → OPEN at start_at, OPEN → CLOSED at end_at
- All voting edge cases from §3.6
- Double-vote attempt (verify ALREADY_VOTED)
- Out-of-jurisdiction vote (verify NOT_IN_JURISDICTION)
- Anonymization: vote, then attempt to identify the voter (must fail)
- **Cross-table correlation test:** vote in both Policy Polls and Confidence Votes, verify the hashes are not correlatable
- Pepper rotation: rotate, verify old hashes invalid, new votes work
- Trend calculation: Q1 has X%, Q2 has Y%, verify the display
- Regional breakdown threshold: n < 100 per region → not shown; n ≥ 100 → shown
- Admin emergency open/close

### 9.3 E2E Tests

- Full J3 journey — see [User Journeys.md §5](../product/User%20Journeys.md#5-j3--verified-citizen-votes-on-a-confidence-question)
- Window open → user votes → window close → results display
- Quarter-over-quarter trend display (simulated with two consecutive windows)

### 9.4 Security Tests (required)

- **Penetration test:** Attempt to correlate a confidence vote with a user identity. Must fail.
- **Penetration test:** Attempt to correlate a confidence vote with a policy poll vote for the same user (via hash analysis). Must fail (because the pepper is shared and hash domains are uniform).
- **Penetration test:** Attempt to vote multiple times for the same official in the same quarter. Must fail.
- **Penetration test:** Attempt to vote outside the window. Must fail.
- **Penetration test:** Attempt to access another user's eligibility. Must fail.
- **Code review:** Every change to `confidence.anonymization.ts` requires a security-focused review by the Engineering Lead AND the Legal Director. This is a joint review with the Policy Polls module — they share the anonymization design.

### 9.5 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. The negative tests are the most important for this module — the anonymization is the feature.

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `confidence.module.enabled` | true | Disable the entire module |
| `confidence.voting.enabled` | true | Disable voting while keeping results visible |
| `confidence.results.enabled` | true | Disable results display |
| `confidence.window-transitions.enabled` | true | Disable automatic transitions (for emergency control by admin) |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **Anonymization breach discovered:** Take the module offline. Notify the Board. Notify NDPC. Notify affected users if identifiable (they should not be, by design).
- **Window transition bug:** Disable `confidence.window-transitions.enabled`. Admins transition windows manually. Fix the cron, re-enable.
- **Vote rate anomaly from a bot attack:** Tighten rate limits. Investigate the pattern. Coordinate with the Policy Polls module (same pattern likely applies there).
- **Pepper compromise:** This is the catastrophic case. Same procedure as Policy Polls: rotate the pepper, mark all existing votes in BOTH modules as INVALID, force re-vote. Joint runbook with Policy Polls.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should LGA Chairpersons be in the pilot, or only Governor and House of Assembly Members? | Project Lead | Open — needs NBA + public records check |
| 2 | What is the right rationale character limit? (500 is the spec.) | Product Lead | Open — needs user research |
| 3 | Should we display the total number of votes cast, or only percentages? (Total can be a privacy concern at small N.) | Data team | Open — recommend yes for n ≥ 100, no for n < 100 |
| 4 | How do we handle an official who changes role mid-term? (e.g., a House member becomes a Senator) | Admin team | Open — needs policy |
| 5 | What is the right cadence for the pilot windows? (Quarterly is the spec; do we want monthly for the first quarter to gather more data?) | Product Lead | Open — recommend quarterly; we have other mechanisms to gather data |
| 6 | Should the rationale field be displayed in the results for transparency, or kept private to the voter? | Product Lead + Legal | Open — recommend not displayed in pilot |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the anonymization model require joint sign-off with the Policy Polls module.

---

## Appendix A: Glossary
- **CI** — Confidence Interval
- **DSAR** — Data Subject Access Request
- **LGA** — Local Government Area
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **RBAC** — Role-Based Access Control

## Appendix B: References
- [PRD.md §4.3 — Confidence Votes](../product/PRD.md#43-confidence-votes-pillar-1)
- [User Journeys.md §5 — J3 Verified citizen votes on a confidence question](../product/User%20Journeys.md#5-j3--verified-citizen-votes-on-a-confidence-question)
- [Personas.md §3.1 — Amara](../product/Personas.md#31-amara--the-engaged-citizen)
- [PLATFORM.md §3.2 — Confidence Votes on Elected Officials](../PLATFORM.md#32-confidence-votes-on-elected-officials)
- [PLATFORM.md §9.2 — Confidence Vote Governance](../PLATFORM.md#92-confidence-vote-governance)
- [modules/Policy Polls.md](./Policy%20Polls.md) — the peer module; shares the voter token pepper
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers officials, quarterly windows, voting, anonymization (sharing pepper with Policy Polls), results, trends, and admin lifecycle. 17 business rules, 14 edge cases, 50+ acceptance criteria. The shared pepper with Policy Polls is the most important design decision and requires joint sign-off. |