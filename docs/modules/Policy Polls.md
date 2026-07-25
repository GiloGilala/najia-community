# Module Spec — Policy Polls

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Advisory Board liaison*
*Parent PRD: [PRD.md §4.2](../product/PRD.md#42-policy-polls-pillar-1)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: poll lifecycle (draft → review → active → closed), voting (eligibility, uniqueness, anonymization), results display (with non-binding disclaimer), poll topic suggestion by citizens. Out of scope: comments on polls, real-time results, citizen poll creation, multi-language polls (deferred to Year 2+).

---

## 1. Overview

### 1.1 Module Name

Policy Polls

### 1.2 Purpose

Enable verified citizens to express non-binding sentiment on government policies and initiatives through structured polls. The module is the first expression of Pillar 1 (Civic Engagement) and is the most public-facing feature of the platform. Its primary design constraint is **the non-binding framing**: every interaction must reinforce that the poll is citizen sentiment, not a vote that affects policy or elections. The module's secondary constraint is **vote anonymization**: votes must be stored in a way that cannot be tied back to a user beyond the eligibility check.

### 1.3 In Scope

- Poll lifecycle: topic suggestion → draft → Advisory Board review → published → active → closed
- Poll creation by moderators (only; see §1.4 for why citizens cannot create directly)
- Poll topic suggestion by verified citizens
- Voting by verified citizens in the poll's jurisdiction
- Vote uniqueness enforcement (one vote per user per poll)
- Results aggregation and display (with confidence intervals and non-binding disclaimer)
- Historical comparison (trend across polls on the same topic)
- Advisory Board review workflow
- Citizen poll topic suggestion intake
- Region-scoped polls (national, state, local)
- Audit trail for all state changes and vote eligibility checks

### 1.4 Out of Scope

- **Citizen-created polls** — only moderators can create polls; citizens can suggest topics. This is per [PLATFORM.md §3.1.5](../PLATFORM.md#3115-poll-creation-rights) and is non-negotiable in the pilot. Direct citizen creation is a Y2 candidate at earliest.
- **Comments on polls** — would require moderation at scale, and the noise-vs-signal ratio is poor for a polling context. Deferred to Y2.
- **Real-time results during the voting window** — results are computed at poll close. Showing results during the vote is an anchor effect that biases outcomes.
- **Multi-language polls** — English only in pilot. The data model supports it (a `translations` table is reserved) but the UI does not.
- **Conditional / branching questions** — deferred.
- **Push notification reminders to vote** — deferred to mobile Y2.
- **"Share to social" with pre-filled results** — deferred. We do not want to amplify poll results beyond the platform in the pilot.
- **Quorum requirements** — a poll is valid regardless of how many people voted. We show participation numbers, not a "did this poll succeed" status.
- **Binding anything** — by design, by policy, and by law.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Polls published (total) | ≥ 12 | Count |
| Poll participants (cumulative) | ≥ 1,000 | Unique voters across all polls |
| Poll engagement rate (users who view at least one poll ÷ users who vote on at least one poll) | ≥ 30% | Funnel analysis |
| Poll topic suggestions from citizens | ≥ 50 per quarter | Count |
| Advisory Board review turnaround | 100% within 7 days | Review queue metrics |
| Vote anonymization verification | 100% (no query path from vote to user beyond eligibility check) | Code review + audit |
| Non-binding disclaimer visibility | 100% (on every poll page) | UI audit |
| User trust baseline (correctly identifies polls as non-binding) | ≥ 80% | Pre-pilot + post-pilot survey |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Verified citizen | View active policy polls | I can see what's being asked | Must |
| Verified citizen | Vote on a policy poll | I can express my view | Must |
| Verified citizen | See the non-binding disclaimer prominently | I know my vote doesn't affect policy | Must |
| Verified citizen | See poll results after the poll closes | I can compare my view with others | Must |
| Verified citizen | Suggest a poll topic | I can flag issues I care about | Must |
| Verified citizen | See a historical trend for recurring topics | I can track sentiment over time | Should |
| Verified citizen | Not be identified as the voter | I can vote without fear of consequences | Must |
| Verified citizen | Be unable to vote twice on the same poll | I trust the integrity of the result | Must |
| Verified citizen | Receive a clear message if I'm not in the poll's jurisdiction | I understand why I can't vote | Must |
| Non-verified visitor | View poll results (but not vote) | I can see what citizens think | Must |
| Moderator | Draft a poll | I can publish it for review | Must |
| Moderator | Submit a draft to the Advisory Board for review | I can get the required approval | Must |
| Moderator | Publish an approved poll | Citizens can vote on it | Must |
| Moderator | Edit a poll before voting starts (only) | I can correct issues | Must |
| Moderator | Close a poll early (only in rare cases) | I can respond to emergency situations | Should |
| Advisory Board member | Review a poll draft | I can approve or reject it | Must |
| Advisory Board member | Request changes to a draft | I can ensure quality | Must |
| Admin | View all polls (including drafts) | I can audit the process | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design) and the database spec. Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `polls` | `id`, `title`, `summary`, `question`, `jurisdiction_type` (national/state/LGA), `jurisdiction_value` (state name or LGA code or NULL for national), `status` (DRAFT/IN_REVIEW/APPROVED/ACTIVE/CLOSED), `start_date`, `end_date`, `created_by`, `approved_by`, `created_at`, `closed_at` | The poll itself |
| `poll_options` | `id`, `poll_id`, `option_text`, `display_order` | 2–5 options per poll |
| `poll_votes` | `id`, `poll_id`, `option_id`, `voter_token_hash`, `cast_at` | **No `user_id` column.** See §3.3 for why. |
| `poll_results_cache` | `poll_id`, `total_votes`, `option_counts` (JSON), `confidence_intervals` (JSON), `computed_at` | Cached aggregated results |
| `poll_topic_suggestions` | `id`, `user_id`, `topic_text`, `rationale`, `status` (PENDING/UNDER_REVIEW/ACCEPTED/REJECTED), `created_at`, `decided_at` | Citizen-suggested topics |
| `poll_review_log` | `id`, `poll_id`, `reviewer_id`, `action` (SUBMITTED/COMMENTED/APPROVED/REJECTED/CHANGES_REQUESTED), `notes`, `created_at` | Advisory Board review audit trail |
| `audit_log` | cross-cutting | Every poll state change and every vote eligibility check is logged |

#### 3.1.1 The Critical Decision: No `user_id` on `poll_votes`

This is the most important data model decision in the entire platform. **The `poll_votes` table has no `user_id` column.** Instead, it has a `voter_token_hash` — a one-way hash that proves the voter is eligible and unique, but that cannot be reversed to identify the user.

How it works:

1. When a user votes, the server combines: `user_id` + `poll_id` + a platform-secret pepper
2. The result is hashed with SHA-256
3. The hash is stored as `voter_token_hash`
4. A database uniqueness constraint on `(poll_id, voter_token_hash)` prevents double-voting
5. The hash cannot be reversed: even with full database access, an attacker cannot determine who voted for which option

This means:
- Double-voting prevention works (uniqueness on the hash)
- Vote eligibility is verified at the time of voting (the server knows who is voting and confirms they're eligible; then creates the hash and forgets the link)
- No post-hoc identification is possible, even by the platform's own staff

The trade-off: the user cannot change their vote, because doing so would require re-creating the same hash for the same user, which would just create a duplicate and fail the uniqueness check. Vote change is out of scope for the pilot and would require a different design if added later.

This decision is what the **Amara test** (UX & Design §9.3) exists to defend. Any team member can block a design that compromises this anonymization.

### 3.2 API Surface

Reference [API.md](../technical/API.md) and the [architecture document §3.2.3](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/polls` | List polls (filterable by status, jurisdiction) | Public | — |
| `GET` | `/api/polls/:pollId` | Get poll detail (public-safe) | Public | — |
| `GET` | `/api/polls/:pollId/results` | Get aggregated results (only after close) | Public | — |
| `POST` | `/api/polls/:pollId/vote` | Cast a vote | Authenticated | `polls:vote` |
| `GET` | `/api/polls/:pollId/my-vote` | Get the current user's selection (by hash lookup) | Authenticated | `polls:vote` |
| `POST` | `/api/polls/suggest-topic` | Suggest a poll topic | Authenticated | `polls:suggest` |
| `GET` | `/api/polls/my-suggestions` | List the current user's suggestions | Authenticated | `polls:suggest` |
| `POST` | `/api/admin/polls` | Create a poll draft | Authenticated | `admin:polls` (moderator+) |
| `PUT` | `/api/admin/polls/:pollId` | Edit a poll (only when status = DRAFT) | Authenticated | `admin:polls` |
| `POST` | `/api/admin/polls/:pollId/submit-for-review` | Submit draft for Advisory Board review | Authenticated | `admin:polls` |
| `POST` | `/api/admin/polls/:pollId/publish` | Publish an approved poll | Authenticated | `admin:polls` |
| `POST` | `/api/admin/polls/:pollId/close` | Close an active poll (emergency only) | Authenticated | `admin:polls` |
| `GET` | `/api/admin/polls/review-queue` | Get polls awaiting Advisory Board review | Authenticated | `admin:polls` or `advisory:review` |
| `POST` | `/api/admin/polls/:pollId/review` | Advisory Board action (approve/reject/request changes) | Authenticated | `advisory:review` |
| `GET` | `/api/admin/poll-suggestions` | Get citizen-suggested topics | Authenticated | `admin:polls` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `pollsListLoader` | Load polls list (paginated, filterable) |
| `pollDetailLoader` | Load poll detail with the current user's eligibility status |
| `pollResultsLoader` | Load results (only after close) |
| `castVoteAction` | Cast a vote from the poll detail page |
| `suggestTopicAction` | Submit a topic suggestion |
| `adminPollDraftAction` | Create/edit a draft |
| `adminPollReviewAction` | Submit for review / approve / reject |
| `adminPollPublishAction` | Publish an approved poll |

### 3.3 Business Rules

Numbered list of explicit rules the service layer enforces:

1. **Only verified citizens can vote.** Unverified users get a CTA to verify.
2. **A user can vote only once per poll.** The `voter_token_hash` uniqueness constraint enforces this at the DB level.
3. **A user must be in the poll's jurisdiction to vote.** National polls: any verified user in Nigeria. State polls: verified users in that state. LGA polls: verified users in that LGA.
4. **Voting is only allowed when the poll is `ACTIVE` and between `start_date` and `end_date`.** A vote outside this window returns `POLL_NOT_ACTIVE`.
5. **The `poll_votes` table has no `user_id` column.** The voter is identified only by a `voter_token_hash` that cannot be reversed. (See §3.1.1.)
6. **The non-binding disclaimer is displayed on every poll page**, in the API response (so the disclaimer can be rendered by any client), and in any user-facing communication about polls. Standard language: "This is citizen sentiment only. It has no legal or electoral weight."
7. **Results are not shown during the voting window.** The `/api/polls/:pollId/results` endpoint returns 404 during the active period. (See §3.5 for what the user sees instead.)
8. **Results are computed at poll close** and cached in `poll_results_cache`.
9. **Confidence intervals are computed and displayed.** The 95% CI is shown alongside each option's percentage.
10. **Trend data is shown for recurring topics.** If a poll on the same topic was conducted previously, the current result is shown alongside the previous one.
11. **Poll drafts cannot be edited after they are submitted for review.** Changes require the Advisory Board to send it back.
12. **Poll drafts cannot be published without Advisory Board approval.** The publish endpoint requires `approved_by` to be set.
13. **A moderator cannot review their own draft.** The Advisory Board review must be done by a different user.
14. **A poll is closed by the system at `end_date`.** Manual closing is for emergencies only and requires a written reason in the audit log.
15. **Poll topic suggestions are visible only to the suggesting user and to moderators.** They are not public.
16. **All poll state changes are audit-logged.** Every draft, every review, every publish, every close.
17. **Every vote eligibility check is audit-logged at DEBUG level.** Successful and failed eligibility checks both log: `user_id`, `poll_id`, `result (eligible/ineligible)`, `reason`. This is the only place `user_id` and `poll_id` appear together in the same record, and the audit log is not user-facing.
18. **A poll is never deleted, only closed.** Historical polls are part of the public record.

### 3.4 State Machine

Polls transition through these states:
DRAFT
│ moderator submits for review
▼
IN_REVIEW
│ AB approves │ AB rejects │ AB requests changes
▼ ▼ ▼
APPROVED REJECTED DRAFT (back to start)
│ moderator publishes
▼
ACTIVE
│ end_date passes │ moderator closes (emergency)
▼ ▼
CLOSED

text


- `DRAFT` → `IN_REVIEW` is a moderator action
- `IN_REVIEW` → `APPROVED` is an Advisory Board action
- `IN_REVIEW` → `REJECTED` is an Advisory Board action (terminal for this draft; a new draft can be created)
- `IN_REVIEW` → `DRAFT` is an Advisory Board "request changes" action
- `APPROVED` → `ACTIVE` is a moderator "publish" action
- `ACTIVE` → `CLOSED` is the system at `end_date`, or a moderator emergency close

The state machine is enforced in `services/poll.service.ts`. The DB is a store; the service is the rule-keeper.

### 3.5 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| User not verified | "You need to verify your identity to vote. [CTA: Verify now]" | `VERIFICATION_REQUIRED` (403) |
| User already voted | "You've already voted on this poll. See your selection above." (Shows the user's previous option, looked up by token hash.) | `ALREADY_VOTED` (409) |
| User not in jurisdiction | "This poll is for [State] residents only. You're registered as a resident of [State]." | `NOT_IN_JURISDICTION` (403) |
| Poll not active (before start_date) | "Voting opens on [date]." | `POLL_NOT_STARTED` (422) |
| Poll not active (after end_date) | "Voting for this poll has closed. See the results." | `POLL_CLOSED` (422) |
| Poll in DRAFT or IN_REVIEW state | "This poll is not yet open for voting." | `POLL_NOT_PUBLISHED` (422) |
| Results requested during active period | The endpoint returns 404. The user sees: "Results will be available when voting closes on [date]." | (Not an error to the user; 404 is a deliberate signal.) |
| Advisory Board review past 7 days | The poll is auto-flagged for senior moderator review. The moderator may follow up with the AB. | (Operational; not a user-facing error.) |
| Same user repeatedly votes on different polls (bot pattern) | Rate limit at the per-user level; the pattern is flagged in the audit log for moderator review. | (Rate limit; user gets a generic "Slow down" message.) |
| NIMC API failure at vote time (re-verification fails) | User is shown: "We can't verify your eligibility right now. Please try again in a few minutes." (Their previous verification cache is honored if within 30 days.) | `VERIFICATION_UNAVAILABLE` (503) |
| Two users vote at exactly the same time | Both votes are recorded; database uniqueness is on the hash, not on time. | — |
| Advisory Board member submits a draft and then approves it | The publish endpoint requires `approved_by != created_by`. The poll stays in APPROVED until a different AB member publishes. | `SELF_APPROVAL_DENIED` (403) |
| Moderator tries to edit a poll that is ACTIVE | "Polls cannot be edited while voting is open. If a change is needed, close the poll and create a new draft." | `EDIT_DENIED_POLL_ACTIVE` (409) |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `polls:read` | public (anonymous) | Anyone can view polls and results |
| `polls:suggest` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` | Any verified user can suggest a topic |
| `polls:vote` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` | Any verified user in the poll's jurisdiction |
| `polls:create` | `moderator`, `admin` | Moderators create drafts |
| `polls:update` | `moderator`, `admin` | Moderators edit drafts (not active polls) |
| `polls:delete` | `admin` | Admin only; reserved for removing a poll that violates policy (e.g., a DRAFT that should not exist) |
| `polls:publish` | `moderator`, `admin` | Moderators publish approved polls |
| `polls:close` | `moderator`, `admin` | Moderators close polls (emergency only) |
| `advisory:review` | `advisory_board`, `admin` | Advisory Board members review drafts |
| `polls:admin-read` | `admin` | Admins can view draft state |

**The Advisory Board role is a special-purpose role** assigned to external members per [PLATFORM.md §9.3](../PLATFORM.md#93-advisory-board). It grants `advisory:review` and not the moderator's full poll permissions. This separation is what keeps the Advisory Board independent.

If this module introduces a new permission, it must be added to RBAC.md and to `defineAbilityFor`.

---

## 5. User Experience

### 5.1 Key Screens

Reference [UX & Design.md §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot). The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 11 | Polls list | All | No | No |
| 12 | Poll detail (pre-vote) | Amara | Yes | Yes |
| 13 | Vote submitted confirmation | Amara | Yes | Yes |
| 14 | Poll results | All | No | No |
| 18 | Suggest a poll topic | Amara | Yes | Yes |
| 47 | Poll draft editor (admin) | Kemi | Yes | Yes (staff) |
| 49 | (covers AB review queue — shared with admin dashboard) | — | Yes | Yes (staff) |

### 5.2 User Flows

Reference [User Journeys.md §4](../product/User%20Journeys.md#4-j2--verified-citizen-votes-on-a-policy-poll) for the J2 journey. This module implements J2.

### 5.3 The Non-Binding Disclaimer — The Most Important Design Pattern

The non-binding disclaimer is the single most important UX element in this module. It must be:

| Where it appears | Format | Rationale |
|------------------|--------|-----------|
| **Poll detail (pre-vote)** | Banner with info icon, ABOVE the vote options | The user sees the disclaimer before they commit |
| **Vote submitted confirmation** | Banner with info icon, below the confirmation | Reinforces the framing after commitment |
| **Poll results** | Banner with info icon, ABOVE the results chart | The user sees the disclaimer every time they see results |
| **Polls list** | Small text under each poll title | Lightweight reminder; the full disclaimer is on each poll's detail page |
| **Polls list (page header)** | Section-level notice: "All polls below are non-binding expressions of citizen sentiment." | Top-of-page orientation |
| **Newsletter, blog, any comms mentioning polls** | Standardized callout | Same language everywhere |

The standard text is: **"This is citizen sentiment only. It has no legal or electoral weight."** Variations require Design Lead approval.

### 5.4 The Amara Test (Reinforced for This Module)

Beyond the general Amara test in UX & Design §9.3, this module has a specific sub-test:

> **Would Amara understand that her vote cannot be traced back to her, even by the platform's own staff?**

If the answer is "no" or "I'm not sure," the design is not ready. The data model decision (§3.1.1) makes this technically true; the UX must make it *perceptibly* true. The vote confirmation screen should say (in plain language):

> "Your vote has been recorded anonymously. Only you know how you voted."

### 5.5 Accessibility

- All poll screens are keyboard-navigable
- Vote options are radio buttons (semantic HTML), with explicit labels
- The non-binding disclaimer is read by screen readers as part of the page, not as a separate "info" element
- Results charts have a text-based accessible alternative (the percentages and confidence intervals are also displayed as a table)
- Color is never the only signal (the disclaimer has both an icon and a distinctive color)

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Vote cast API P95 | < 200ms (excluding the eligibility check) |
| **Performance** | Vote cast API P99 | < 500ms |
| **Performance** | Polls list P95 | < 200ms |
| **Performance** | Poll detail P95 | < 200ms |
| **Performance** | Results P95 | < 300ms |
| **Performance** | Eligibility check P95 | < 100ms (cache hit) |
| **Security** | voter_token_hash pepper | Rotated annually; rotated immediately on any staff departure with database access |
| **Security** | Poll results cache | No user-identifying data |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Privacy** | `poll_votes` contains no `user_id` | Verified by code review and DB inspection before each release |
| **Privacy** | Eligibility check logs do not contain the user's choice | Only eligibility, not vote |
| **Privacy** | DSAR does not include poll votes | Even the user themselves cannot retrieve their own vote (this is the cost of anonymization) |
| **Privacy** | NDPR compliance | Full |
| **Reliability** | Polls uptime (pilot) | ≥ 99.5% |
| **Observability** | Every vote eligibility check logged | Yes |
| **Observability** | Every poll state change logged | Yes |
| **Observability** | Alert on vote rate anomaly | Yes (e.g., 10x normal rate triggers review) |

**Note on DSAR:** Because votes are anonymized at write time, a user who requests a DSAR will receive a copy of their account data but not their poll votes. This is disclosed in the privacy policy and the DSAR response: "Your poll votes are recorded anonymously and cannot be retrieved, even by you, to protect your privacy."

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | The user must be verified to vote. The eligibility check uses the verification cache. |
| RBAC module | Internal | Permission checks (forthcoming in Phase 4) |
| Audit log module | Internal | Cross-cutting audit trail |
| Cache layer (SQLite) | Internal | Voter eligibility cache (30-day TTL) |
| Notification service | Internal | Email notifications for poll lifecycle events (forthcoming) |
| Advisory Board members | External | Human review of every poll draft. The AB is a constraint, not a service. |
| Moderator staff | Internal | Draft and publish polls. The moderator team is a constraint, not a service. |
| Postgres + Drizzle ORM | Internal | Primary database |

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Poll Lifecycle

- [ ] A moderator can create a poll draft with title, summary, question, options, dates, and jurisdiction
- [ ] A draft cannot be published without Advisory Board approval
- [ ] A moderator submits a draft for review; an Advisory Board member receives a notification
- [ ] An Advisory Board member can approve, reject, or request changes
- [ ] An Advisory Board member cannot approve their own draft (if they were the creator)
- [ ] 100% of draft reviews are completed within 7 days
- [ ] A poll is auto-flagged if not reviewed within 7 days
- [ ] An approved poll can be published by a moderator
- [ ] A published poll is visible on the polls list
- [ ] A published poll becomes active at `start_date`
- [ ] An active poll is closed by the system at `end_date`
- [ ] A moderator can close an active poll with a written reason
- [ ] The non-binding disclaimer is shown on every poll page (pre-vote, post-vote, results)

### 8.2 Voting

- [ ] An unverified user cannot vote; they see a CTA to verify
- [ ] A verified user in the poll's jurisdiction can vote
- [ ] A verified user NOT in the poll's jurisdiction sees a clear "this poll is for [State] residents" message
- [ ] A user can vote exactly once per poll; a second attempt returns `ALREADY_VOTED`
- [ ] The vote confirmation screen shows the user's selection
- [ ] The vote confirmation screen contains the "your vote is anonymous" message
- [ ] A user cannot change their vote
- [ ] A user cannot vote outside the poll's date range
- [ ] A user cannot vote on a poll in DRAFT, IN_REVIEW, or REJECTED state

### 8.3 Anonymization

- [ ] The `poll_votes` table has no `user_id` column (verified by DB schema inspection)
- [ ] The `voter_token_hash` is SHA-256(user_id + poll_id + pepper), where the pepper is a server-side secret
- [ ] The voter token hash cannot be reversed to identify the user (verified by attempting reversal on a test dataset)
- [ ] No query path exists from a vote record to a user identity
- [ ] The DSAR response explicitly states that poll votes are not retrievable
- [ ] Eligibility check logs do not contain the user's choice (only eligibility)
- [ ] The DB uniqueness constraint on `(poll_id, voter_token_hash)` is in place

### 8.4 Results

- [ ] Results are not available during the active voting window (the endpoint returns 404)
- [ ] Results are computed at poll close
- [ ] Results include percentages for each option
- [ ] Results include confidence intervals
- [ ] Results include total vote count
- [ ] Results include the non-binding disclaimer
- [ ] Recurring topics show trend vs. the previous poll
- [ ] Regional breakdowns are shown only when statistically significant (n ≥ 100 per region)

### 8.5 Topic Suggestion

- [ ] A verified user can suggest a poll topic with rationale (≤ 500 chars)
- [ ] The user sees their suggestions in "My suggestions"
- [ ] A moderator can view all suggestions
- [ ] A suggestion's status transitions are visible to the suggesting user
- [ ] Suggestions are never public

### 8.6 Advisory Board Workflow

- [ ] An AB member is notified when a draft is submitted for review
- [ ] An AB member can approve, reject, or request changes
- [ ] An AB member's decision is audit-logged
- [ ] An AB member cannot review their own draft
- [ ] An AB member can only review one poll at a time? (No — they can have multiple in flight. But the system tracks what each AB member is currently reviewing.)
- [ ] The 7-day SLA is enforced via auto-flagging, not blocking

### 8.7 Security

- [ ] The voter token pepper is stored as an environment variable, not in code
- [ ] The pepper is rotated annually
- [ ] The pepper is rotated immediately on any staff departure with DB access
- [ ] All API endpoints are over TLS 1.3
- [ ] Rate limit: 30 votes per user per hour (anomaly detection)
- [ ] Rate limit: 1000 votes per IP per hour
- [ ] No PII in URLs (poll ID is a prefixed opaque ID, not a meaningful number)
- [ ] No PII in logs (no user_id in production INFO logs; only DEBUG in development)

### 8.8 Operational

- [ ] Health check includes poll service status
- [ ] Alert on eligibility check failure rate > 5%
- [ ] Alert on vote rate anomaly (e.g., 10x normal in a 5-minute window)
- [ ] Runbook exists for "poll needs to be unpublished" (extreme case; involves DB and audit)
- [ ] Runbook exists for "voter token pepper compromise" (rotate pepper, invalidate all existing votes, force re-vote — this is the catastrophic case)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests (`tests/unit/services/`)

- `poll.service.ts` — state machine transitions, lifecycle rules
- `poll.voting.service.ts` — eligibility check, voter token generation, uniqueness enforcement
- `poll.results.service.ts` — aggregation, confidence interval calculation, trend calculation
- `poll.anonymization.ts` — voter token generation, pepper rotation (CRITICAL: this is the highest-stakes code in the platform)

Coverage target: ≥ 95% on the anonymization code; ≥ 85% on the rest.

### 9.2 Integration Tests (`tests/integration/api/`)

- Create draft → submit for review → approve → publish → activate → vote → close → results
- Create draft → submit for review → reject (verify cannot be re-approved)
- Create draft → submit for review → request changes (verify back to DRAFT)
- Vote with eligibility check failures (all the cases in §3.5)
- Double-vote attempt (verify ALREADY_VOTED)
- Out-of-jurisdiction vote attempt (verify NOT_IN_JURISDICTION)
- Anonymization verification: vote, then attempt to identify the voter (must fail)
- Pepper rotation: rotate, then verify old hashes are invalid and new votes work

### 9.3 E2E Tests (`tests/e2e/`)

- Full J2 journey (verified citizen votes on a policy poll) — see [User Journeys.md §4](../product/User%20Journeys.md#4-j2--verified-citizen-votes-on-a-policy-poll)
- AB review workflow end-to-end
- Poll results display end-to-end
- Trust baseline survey flow (post-vote, optional, with consent)

### 9.4 Manual Tests (during pilot)

- Real user votes with real NINs and real Onfido verifications
- AB review with real AB members
- Edge case: a user votes and then requests DSAR; verify DSAR response is correct
- Edge case: pepper rotation during a live poll; verify the rotation works without losing in-flight eligibility checks

### 9.5 Security Tests (required for this module)

- **Penetration test:** Attempt to correlate a vote with a user identity from the DB. Must fail.
- **Penetration test:** Attempt to enumerate users by sending many vote requests with different NINs. Must be rate-limited.
- **Penetration test:** Attempt to vote multiple times for the same user. Must fail at the DB uniqueness constraint.
- **Code review:** Every change to the `poll.anonymization.ts` file requires a security-focused review by the Engineering Lead AND the Legal Director.

### 9.6 The "Negative Test" Rule

For this module, the negative tests are **the most important tests.** The module exists to enable voting, but it must also *prevent* double-voting, jurisdiction violations, anonymization breaches, and premature result disclosure. Every positive test has a negative counterpart.

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `polls.module.enabled` | true | Disable the entire module in case of critical issue |
| `polls.voting.enabled` | true | Disable voting while keeping the polls list visible |
| `polls.results.enabled` | true | Disable results display (rare; for embargoed results) |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **Poll must be unpublished:** If a poll is discovered to be in violation of policy after publication but before active, it can be moved from APPROVED back to REJECTED by an admin. Audit log records the action.
- **Poll must be closed early:** A moderator closes with a written reason. The poll goes to CLOSED; partial results are NOT published (only complete, post-close results are published).
- **Voter token pepper compromise:** This is the catastrophic case. The runbook covers: rotate the pepper, mark all existing votes as INVALID, notify the Board, notify NDPC if required by breach notification rules, and force users to re-vote on active polls. This is the only scenario in which a user might re-vote on the same poll.
- **Anonymization breach discovered:** This is also catastrophic. The runbook covers: take the module offline, audit-log the breach, notify the Board, notify NDPC, and notify affected users if identifiable (which they should not be, by design).

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the actual Advisory Board review SLA? (7 days is the spec; is that realistic given AB members' availability?) | Project Lead | Open — needs AB input |
| 2 | Do we need a "poll close early" capability beyond emergencies? (e.g., closing at 80% participation for efficiency) | Product Lead | Open — recommend no |
| 3 | Should the voter token pepper be HSM-backed, or is environment-variable storage sufficient for the pilot? | Engineering Lead | Open — recommend env var for pilot, HSM in Year 2 |
| 4 | What is the right level of regional breakdown? (LGA, state, or both?) | Data team | Open — needs user research |
| 5 | How do we handle polls that overlap with the 2027 election? | Project Lead | Open — needs election freeze planning |
| 6 | Should citizens be able to see aggregate demographic breakdowns (e.g., "60% of voters under 30 voted Yes")? | Product Lead | Open — privacy implications |
| 7 | What is the right language for the "your vote is anonymous" message? | Design Lead | Open — needs user research |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the anonymization model or the non-binding framing require AB sign-off.

---

## Appendix A: Glossary
- **AB** — Advisory Board
- **CI** — Confidence Interval
- **LGA** — Local Government Area
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **RBAC** — Role-Based Access Control
- **SLA** — Service Level Agreement

## Appendix B: References
- [PRD.md §4.2 — Policy Polls](../product/PRD.md#42-policy-polls-pillar-1)
- [User Journeys.md §4 — J2 Verified citizen votes on a policy poll](../product/User%20Journeys.md#4-j2--verified-citizen-votes-on-a-policy-poll)
- [Personas.md §3.1 — Amara](../product/Personas.md#31-amara--the-engaged-citizen)
- [UX & Design.md §2.3 — Where the Non-Binding Disclaimer Lives](../product/UX%20%26%20Design.md#23-the-non-binding-disclaimer--where-it-lives)
- [UX & Design.md §9.3 — The Amara Test](../product/UX%20%26%20Design.md#93-the-amara-test)
- [PLATFORM.md §3.1 — Policy Sentiment Polls](../PLATFORM.md#31-policy-sentiment-polls)
- [PLATFORM.md §9.1 — Poll Governance](../PLATFORM.md#91-poll-governance)
- [PLATFORM.md §9.3 — Advisory Board](../PLATFORM.md#93-advisory-board)
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers poll lifecycle, voting, anonymization (with `voter_token_hash` design), results, AB workflow, and topic suggestions. 18 business rules, 12 edge cases, 50+ acceptance criteria. The anonymization design (§3.1.1) is the highest-stakes technical decision and requires AB sign-off. |