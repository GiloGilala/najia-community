# Module Spec — Lawyer Reviews

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Moderation Lead*
*Parent PRD: [PRD.md §4.5](../product/PRD.md#45-lawyer-marketplace-pillar-3)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: post-consultation review prompt, post-engagement review submission, moderation queue, lawyer response, review display on the lawyer's public profile. Out of scope: lawyer-initiated reviews of citizens, reviews of the platform itself (handled in the Lawyer Matching module), review editing after publication (reviews are immutable once public).

---

## 1. Overview

### 1.1 Module Name

Lawyer Reviews

### 1.2 Purpose

Enable verified citizens who have completed a free consultation to leave a moderated review of the lawyer, after a documented engagement. The review is the citizen's account of working with the lawyer outside the platform's consultation. The module's primary design constraints are: (1) **engagement confirmation** — the platform does not see the engagement, so the citizen must confirm it happened; (2) **moderation first** — every review goes through the moderation queue before becoming public; (3) **lawyer response** — the lawyer can respond publicly to any review, which is the platform's commitment to fairness.

### 1.3 In Scope

- Post-consultation prompt to the citizen (asking if an engagement happened)
- Engagement confirmation flow (citizen confirms; or skips if no engagement)
- Review submission form (overall rating + category ratings + free text)
- Review moderation queue (all reviews go through moderation before becoming public)
- Lawyer response to a published review
- Review display on the lawyer's public profile (aggregate rating, breakdown, recent reviews)
- Review moderation actions (approve, edit, remove)
- Review appeal flow (citizen appeals a removed review)
- Audit trail for all review state changes
- RBAC and access control (citizen sees own reviews; lawyer sees own reviews; public sees approved reviews)

### 1.4 Out of Scope

- **Lawyer-initiated reviews of citizens** — out of scope. The platform's commitment is to the citizen's voice about the lawyer; the reverse would create an asymmetry that could be misused.
- **Reviews of the platform itself** — handled in the Lawyer Matching module (the post-consultation rating of matching quality).
- **Review editing after publication** — reviews are immutable once public. This is to preserve the integrity of the public record. If a citizen wants to update their view, they can submit a follow-up review (Year 2 feature).
- **Star rating without text** — every review must include both a rating and a text component. This is to ensure reviews are substantive and to reduce drive-by 1-star or 5-star ratings.
- **Review voting (helpful/not helpful)** — deferred to Year 2.
- **Review filtering by case type** — all reviews are shown on the lawyer's profile, regardless of case type. (Filtering is a Year 2 feature.)
- **Verified vs. unverified review labels** — all reviews come from verified citizens who completed a consultation. There is no "unverified" review.
- **Anonymous reviews with no engagement** — every review requires an engagement confirmation. Anonymous reviews without engagement are not supported.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Reviews submitted (cumulative) | ≥ 30 | Count |
| Reviews approved (after moderation) | ≥ 80% of submitted | Moderation metrics |
| Reviews removed (after moderation) | < 15% of submitted | Moderation metrics |
| Review appeal rate | < 10% of removed reviews | Audit log |
| Lawyer response rate | ≥ 50% of published reviews | Count |
| Time to moderation decision (median) | ≤ 24 hours | Moderation queue metrics |
| Average rating (across all lawyers) | 4.0–4.5 (informational; not a target) | Analytics |
| Review-driven consultation requests | ≥ 10% of consultations reference a review | Survey (sample) |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Citizen who completed a consultation | Be prompted to confirm whether an engagement happened | I can leave a review if it did | Must |
| Citizen | Skip the review if no engagement happened | I'm not forced to review | Must |
| Citizen with a confirmed engagement | Submit a review (rating + text) | My experience is shared | Must |
| Citizen | See my review's moderation status | I know if it's been published | Must |
| Citizen | Appeal a removed review | I can challenge a wrong decision | Must |
| Active lawyer | See all reviews of me (including pending) | I can prepare a response | Must |
| Active lawyer | Respond to a published review | I can share my side | Must |
| Active lawyer | Be notified of a new review | I can respond promptly | Must |
| Active lawyer | Aggregate rating affects my matching (indirectly) | Good lawyers are matched more often | Should |
| Moderator | Review the review queue | I can approve/remove reviews | Must |
| Moderator | Edit a review to remove defamatory content (rare) | I can preserve the review while removing harm | Should |
| Visitor | See a lawyer's aggregate rating and recent reviews | I can choose a lawyer | Must |
| Visitor | See lawyer responses to reviews | I can see both sides | Must |
| Admin | View review pipeline metrics | I can monitor the system | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `lawyer_reviews` | `id`, `consultation_id`, `lawyer_id`, `citizen_id`, `engagement_confirmed` (boolean), `engagement_confirmed_at`, `overall_rating` (1–5), `category_ratings` (JSON — see §3.1.1), `review_text` (≤ 2000 chars), `status` (DRAFT / PENDING_MODERATION / APPROVED / REMOVED / APPEALED), `moderation_notes`, `moderated_by`, `moderated_at`, `submitted_at`, `published_at` | The review itself |
| `lawyer_review_responses` | `id`, `review_id`, `lawyer_id`, `response_text` (≤ 1000 chars), `submitted_at`, `updated_at` | The lawyer's public response (one per review) |
| `lawyer_review_appeals` | `id`, `review_id`, `citizen_id`, `appeal_text` (≤ 1000 chars), `status` (PENDING / APPROVED / DENIED), `decided_at`, `decision_notes` | The citizen's appeal of a removed review |
| `lawyer_review_audit_log` | cross-cutting | All review state changes (also in the main `audit_log`) |

The consultation that preceded the review is referenced via `consultation_id`. The consultation must be in `COMPLETED` state for a review to be submitted. This is the integrity check that prevents fake reviews.

#### 3.1.1 Category Ratings

The review includes an overall rating and category ratings:

| Category | Description | Weight in overall |
|----------|-------------|-------------------|
| **Communication** | How clearly the lawyer communicated | 25% |
| **Expertise** | The lawyer's knowledge of the relevant law | 30% |
| **Responsiveness** | How quickly the lawyer responded | 20% |
| **Value** | Whether the consultation/engagement was worth the time | 25% |

The overall rating is the weighted average of the four categories. The citizen can adjust the weights (the default is the standard weighting), but the overall rating is always shown alongside the breakdown.

This category structure does two things:
1. Gives the citizen a structured way to express their view
2. Gives the lawyer actionable feedback (a low communication rating with a high expertise rating tells a different story than the reverse)

The category weights are published and consistent across all reviews. The citizen can adjust them per-review (a "I value communication more than expertise" preference), but the aggregate rating on the lawyer's profile uses the standard weighting so lawyers are compared apples-to-apples.

#### 3.1.2 The Engagement Confirmation

Because the platform does not see the engagement, the citizen must confirm it happened. The flow:

1. Citizen completes a consultation
2. 7 days after the consultation, the platform sends a prompt: "Did you engage [Lawyer Name] for further work?"
3. Citizen has 3 options:
   - **Yes, I engaged them** → review form opens
   - **No, I did not engage them** → case closes, no review
   - **I'm not ready to say** → prompt is re-sent 30 days later
4. If "Yes" is selected, the review form opens. The citizen must complete it within 14 days, or the prompt is dismissed.
5. If the review is submitted, it goes to the moderation queue. The lawyer is notified.
6. If the review is approved, it is published on the lawyer's profile.
7. If the review is removed, the citizen is notified with the reason and can appeal.

**Why engagement confirmation matters:** Without it, a citizen could review a lawyer they only had a free consultation with, which would conflate "the lawyer was good in a 15-minute conversation" with "the lawyer was good in an actual engagement." The two are different.

**The abuse risk:** A citizen could falsely confirm an engagement to leave a defamatory or fake review. The moderation queue is the defense — moderators check for signs of bad-faith reviews (e.g., the review text describes events that didn't happen, or the review is part of a coordinated attack). If a pattern of false confirmations is detected from a citizen, the citizen's review privileges are revoked.

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/consultations/:consultationId/review-prompt` | Get the post-consultation prompt status | Authenticated | `cases:read` (participant) |
| `POST` | `/api/consultations/:consultationId/confirm-engagement` | Citizen confirms engagement | Authenticated | `cases:update` (own) |
| `POST` | `/api/consultations/:consultationId/decline-engagement` | Citizen declines (no engagement) | Authenticated | `cases:update` (own) |
| `GET` | `/api/reviews/drafts/:consultationId` | Get a draft review (if any) | Authenticated | `cases:read` (own) |
| `POST` | `/api/reviews` | Submit a new review | Authenticated | `review:create` |
| `GET` | `/api/reviews/:reviewId` | Get a review | Authenticated | `review:read` (own or lawyer) |
| `PUT` | `/api/reviews/:reviewId` | Update a draft review (only when DRAFT) | Authenticated | `review:update` (own) |
| `POST` | `/api/reviews/:reviewId/submit` | Submit the draft for moderation | Authenticated | `review:update` (own) |
| `POST` | `/api/reviews/:reviewId/appeal` | Appeal a removed review | Authenticated | `review:appeal` (own) |
| `GET` | `/api/lawyers/:lawyerId/reviews` | List approved reviews for a lawyer (public) | Public | — |
| `GET` | `/api/lawyers/me/reviews` | List all reviews of the current lawyer (including pending) | Authenticated | `lawyer:read` (self) |
| `POST` | `/api/reviews/:reviewId/respond` | Lawyer responds to a review | Authenticated | `review:respond` (lawyer) |
| `PUT` | `/api/reviews/:reviewId/respond` | Lawyer updates a response (within 30 days of submission) | Authenticated | `review:respond` (lawyer) |
| `GET` | `/api/admin/reviews/queue` | Get the moderation queue | Authenticated | `admin:moderation` |
| `POST` | `/api/admin/reviews/:reviewId/moderate` | Approve, edit, or remove a review | Authenticated | `admin:moderation` |
| `GET` | `/api/admin/reviews/metrics` | Get review pipeline metrics | Authenticated | `admin:system` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `reviewPromptLoader` | Load the post-consultation prompt status |
| `confirmEngagementAction` | Submit the engagement confirmation |
| `reviewFormLoader` | Load the review form (with the consultation context) |
| `submitReviewAction` | Submit the review for moderation |
| `appealReviewAction` | Submit an appeal |
| `lawyerResponseAction` | Submit a lawyer response |
| `adminReviewModerateAction` | Moderate a review |

### 3.3 Business Rules

1. **A review can only be submitted for a consultation in `COMPLETED` state.** No review for cancelled, no-show, or in-progress consultations.
2. **An engagement confirmation is required before a review can be submitted.** The platform does not see the engagement, but the citizen confirms it.
3. **A citizen can submit at most one review per consultation.** Multiple reviews are not allowed.
4. **The review includes an overall rating (1–5) and at least one category rating.** All four categories are required for the standard weighting; the citizen can adjust weights per-review.
5. **The review text is required and must be ≥ 50 characters and ≤ 2000 characters.** This is to ensure reviews are substantive.
6. **All reviews go through the moderation queue before becoming public.** No review is published without moderator approval.
7. **The moderation SLA is 24 hours.** 95% of reviews are moderated within this window.
8. **A moderator can approve, remove, or edit a review.** Editing is rare and used only to remove defamatory content while preserving the substantive feedback.
9. **A citizen can appeal a removed review once.** A second appeal escalates to the Grievance Committee.
10. **A lawyer can respond to a published review.** The response is public, attributed to the lawyer by name.
11. **A lawyer can update a response within 30 days of submission.** After 30 days, the response is locked.
12. **A lawyer cannot delete a response.** (They can update it, but the original is preserved in the audit log.)
13. **Reviews are displayed on the lawyer's public profile** with: overall rating, category breakdown, count of reviews, recent reviews (last 10), and the lawyer's responses.
14. **Reviews are anonymous to the public.** The lawyer can see who left the review (because they know who they consulted with), but the public display does not show the citizen's name or photo.
15. **The aggregate rating is calculated from approved reviews only.** Removed or pending reviews do not affect the aggregate.
16. **All state changes are audit-logged.** Every submission, every moderation action, every response, every appeal.

### 3.4 State Machine — Review
DRAFT
│ citizen submits
▼
PENDING_MODERATION
│ moderator approves
▼
APPROVED → PUBLISHED (visible on profile)
│ moderator removes
▼
REMOVED
│ citizen appeals
▼
APPEALED
│ senior moderator / Grievance Committee
│ approves (→ APPROVED) or denies (→ REMOVED, terminal)
▼
APPROVED or REMOVED (terminal)

text


### 3.5 State Machine — Lawyer Response
NULL (no response yet)
│ lawyer submits
▼
RESPONDED
│ lawyer updates (within 30 days)
▼
RESPONDED (updated)
│
│ 30 days pass
▼
LOCKED (terminal)

text


### 3.6 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| Review submitted for a consultation that is not COMPLETED | "You can only review a completed consultation." | `CONSULTATION_NOT_COMPLETED` (422) |
| Review submitted without engagement confirmation | "Please confirm whether an engagement with this lawyer happened." | `ENGAGEMENT_NOT_CONFIRMED` (422) |
| Review text < 50 characters | "Please write at least 50 characters in your review." | `REVIEW_TEXT_TOO_SHORT` (422) |
| Review text > 2000 characters | "Reviews are limited to 2000 characters." | `REVIEW_TEXT_TOO_LONG` (422) |
| Citizen tries to submit a second review for the same consultation | "You've already submitted a review for this consultation." | `REVIEW_ALREADY_EXISTS` (409) |
| Review is removed by moderation; citizen is not notified | (Operational; this should never happen) | — |
| Moderation SLA missed | The reviewer is reminded; the citizen is shown "Your review is taking longer than expected to review. We apologize for the delay." | (Operational) |
| Lawyer tries to respond to a pending (not yet approved) review | "This review is not yet published. You can respond once it's approved." | `REVIEW_NOT_PUBLISHED` (422) |
| Lawyer tries to update a response after 30 days | "Response editing is locked after 30 days. Please contact support if you need to make changes." | `RESPONSE_LOCKED` (422) |
| Citizen tries to appeal after 30 days of removal | "The appeal window for this review has closed." | `APPEAL_WINDOW_CLOSED` (422) |
| Lawyer's subscription lapses while they have a pending response | The response is held; the lawyer is reminded to renew. | (Operational) |
| Lawyer is suspended while they have pending reviews | The reviews remain on the profile (they are about the lawyer's past work); the lawyer cannot respond. | (Operational) |
| Coordinated review attack detected (multiple reviews from related accounts within a short window) | Reviews are flagged for additional moderation scrutiny. The pattern is reported to the admin team. | (Operational) |
| Review text contains personal data of a third party (not the lawyer) | The moderation process flags this; the moderator edits or removes. | (Moderation decision) |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `review:create` | `citizen` (own consultations) | The citizen creates a review for a consultation they completed |
| `review:read` | `citizen` (own), `lawyer` (own), `moderator` (all), `admin` (all) | The matrix: own for citizens, own for lawyers (as the reviewed party), all for moderators/admins |
| `review:update` | `citizen` (own, only when DRAFT) | The citizen can update a draft before submission |
| `review:appeal` | `citizen` (own, only when REMOVED) | The citizen can appeal a removed review |
| `review:respond` | `lawyer` (self, on reviews of self) | The lawyer can respond to reviews of themselves |
| `review:read:public` | public (anonymous) | Anyone can read approved reviews on a lawyer's public profile |
| `admin:moderation` | `moderator`, `admin` | Moderators access the review queue |
| `admin:system` | `admin` | Admins access pipeline metrics |

The `review:read` permission has CASL conditions:
- For citizens: `{ citizenId: user.id }` (the citizen who wrote the review)
- For lawyers: `{ lawyerId: user.id }` (the lawyer being reviewed)
- For moderators and admins: no condition (all)

---

## 5. User Experience

### 5.1 Key Screens

The review flow has several screens, mostly variations of the standard forms. The screens this module adds or owns:

| Screen | Name | Persona | Login | Verified |
|--------|------|---------|-------|----------|
| (form) | Post-consultation engagement prompt | Tunde | Yes | Yes |
| (form) | Review form | Tunde | Yes | Yes |
| (form) | Lawyer response form | Ngozi | Yes | Yes |
| (form) | Review appeal form | Tunde | Yes | Yes |
| (admin) | Review moderation queue | Kemi | Yes | Yes (staff) |

The public review display is integrated into the lawyer profile (Screen #24 in the UX inventory).

### 5.2 The Post-Consultation Prompt

The prompt is sent 7 days after the consultation. The UX:
Hi Tunde,

You had a free consultation with Ngozi Adeyemi on July 15, 2026.

Did you engage Ngozi for further legal work?

[ Yes, I engaged her ] [ No, I did not ] [ Not ready to say ]

text


If "Yes" is selected, the review form opens. If "No" is selected, the case is closed with a thank-you message. If "Not ready to say" is selected, the prompt is re-sent 30 days later.

### 5.3 The Review Form

The review form is structured but not overwhelming:
Overall, how would you rate Ngozi?

★★★★★ (5 of 5)

How would you rate her on each of these?

Communication: ★★★★☆
Expertise: ★★★★★
Responsiveness: ★★★★☆
Value: ★★★★☆

(You can adjust the importance of each category below)

[ Sliders for category weights ]

Tell us about your experience (50–2000 characters):

[ Text area ]

[ Submit for review ]

text


The category weights default to the standard (25/30/20/25) but can be adjusted. The aggregate rating shown on the lawyer's profile always uses the standard weighting, so lawyers are compared consistently.

### 5.4 The Lawyer Response

The lawyer can respond to a published review. The response:

- Is public (visible to anyone who sees the review)
- Is attributed to the lawyer by name
- Has a 1000-character limit
- Can be updated within 30 days of submission
- Cannot be deleted

The response form is a single text area. The lawyer is reminded: "Be respectful and constructive. Responses that violate the moderation policy may be removed."

### 5.5 The Public Review Display

The lawyer's public profile shows reviews in this order:

1. Aggregate rating (e.g., "4.5 out of 5, based on 23 reviews")
2. Category breakdown (bar chart of averages per category)
3. Recent reviews (last 10, paginated)
4. Each review shows: overall rating, category ratings, review text, date, lawyer's response (if any)

Reviews are displayed as anonymous ("A verified citizen who consulted with Ngozi in July 2026"). The citizen's name and photo are not shown.

### 5.6 The Moderation Workflow

The moderation workflow is the standard content moderation flow (defined in the future Moderation module). For reviews specifically:

- Every submitted review goes to the queue
- A moderator reads the review, checks for violations (defamation, hate speech, personal data, off-topic)
- The moderator can: approve, remove, or edit
- Editing is rare and documented
- The citizen is notified of the decision

### 5.7 Accessibility

Same standards as other modules. The star ratings are accessible (not just visual stars — they have ARIA labels and keyboard input). The review form is keyboard-navigable. The category breakdown chart has a text-based alternative.

### 5.8 The Tunde Test (Module-Specific)

Beyond the general design principles:

> **Would Tunde understand (1) that he needs to confirm an engagement before reviewing, (2) that the review goes through moderation before becoming public, and (3) that his review is anonymous to other users?**

If the answer to any of these is "no" — the design is not ready. The engagement confirmation is the most non-obvious part of the flow; the UX must explain it clearly.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Review submission API P95 | < 500ms |
| **Performance** | Review moderation API P95 | < 300ms |
| **Performance** | Public reviews load P95 | < 300ms (with pagination) |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | Reviews cannot be submitted by users who didn't complete the consultation | Enforced at the API |
| **Security** | Lawyer responses cannot be submitted on reviews the lawyer didn't receive | Enforced at the API |
| **Privacy** | Reviews are anonymous to the public | Yes |
| **Privacy** | Lawyer can see who reviewed them (because they know who they consulted with) | Yes |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | Removed reviews are not retained in the public profile | Yes |
| **Privacy** | Removed reviews are retained in the audit log for the legally required period | Yes |
| **Reliability** | Moderation SLA | 95% within 24h |
| **Reliability** | Review pipeline uptime | ≥ 99.5% |
| **Observability** | Every review state change logged | Yes |
| **Observability** | Every moderation action logged | Yes |
| **Observability** | Every appeal logged | Yes |
| **Observability** | Alert on moderation queue size > 30 | Yes |
| **Observability** | Alert on coordinated review attack patterns | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | User must be verified |
| Lawyer Onboarding & Verification module | Internal | Provides the lawyer profile where reviews are displayed |
| Lawyer Matching & Consultation module | Internal | Provides the consultation that triggers the review |
| Moderation module | Internal (downstream) | Consumes the review moderation queue (this module feeds into it) |
| RBAC module | Internal | Permission checks with per-review conditions |
| Audit log module | Internal | All state changes |
| Cache layer (SQLite) | Internal | Aggregate rating cache per lawyer |
| Notification service | Internal | Engagement prompt, review status notifications, lawyer response notifications |
| Postgres + Drizzle ORM | Internal | Primary database |

The Moderation module (forthcoming) is the consumer of this module's review queue. The interface is defined here: the review queue is exposed via `/api/admin/reviews/queue` and the moderation actions are `approve`, `edit`, `remove`. The Moderation module wraps these endpoints with the general moderation UI and workflow.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Engagement Prompt

- [ ] A citizen receives a prompt 7 days after a completed consultation
- [ ] The prompt offers three options: Yes / No / Not ready to say
- [ ] "No" closes the case with a thank-you message
- [ ] "Not ready to say" re-sends the prompt 30 days later
- [ ] "Yes" opens the review form
- [ ] The prompt is not sent if the citizen has already submitted a review

### 8.2 Review Submission

- [ ] A citizen can submit a review only after engagement confirmation
- [ ] A citizen can submit at most one review per consultation
- [ ] The review includes an overall rating and four category ratings
- [ ] The review text is 50–2000 characters
- [ ] The review goes to PENDING_MODERATION
- [ ] The lawyer is notified of the pending review
- [ ] The citizen is notified when the review's status changes

### 8.3 Moderation

- [ ] Every review goes through the moderation queue
- [ ] A moderator can approve, remove, or edit a review
- [ ] 95% of reviews are moderated within 24 hours
- [ ] The citizen is notified of the moderation decision
- [ ] Edits are documented with the moderator's notes

### 8.4 Appeals

- [ ] A citizen can appeal a removed review within 30 days
- [ ] The appeal goes to a senior moderator or the Grievance Committee
- [ ] The appeal decision is communicated to the citizen
- [ ] A second appeal escalates to the Grievance Committee
- [ ] The appeal window is 30 days

### 8.5 Lawyer Response

- [ ] A lawyer can respond to a published review
- [ ] The response is public and attributed to the lawyer
- [ ] The response is 1000 characters or fewer
- [ ] The response can be updated within 30 days
- [ ] The response is locked after 30 days
- [ ] The response cannot be deleted

### 8.6 Display

- [ ] The lawyer's public profile shows the aggregate rating
- [ ] The lawyer's public profile shows the category breakdown
- [ ] The lawyer's public profile shows recent reviews (last 10, paginated)
- [ ] Reviews are displayed as anonymous to the public
- [ ] Lawyer responses are displayed alongside the reviews
- [ ] The aggregate rating is calculated from approved reviews only

### 8.7 Security

- [ ] A user cannot submit a review for a consultation they did not complete
- [ ] A lawyer cannot respond to a review that is not about them
- [ ] A user cannot see another user's draft review
- [ ] All API endpoints over TLS 1.3
- [ ] All connections over WireGuard
- [ ] Rate limit: 3 review submissions per user per day
- [ ] Rate limit: 5 appeal submissions per user per day

### 8.8 Operational

- [ ] Health check includes review module status
- [ ] Alert on moderation queue size > 30
- [ ] Alert on coordinated review attack patterns
- [ ] Runbook exists for "coordinated review attack detected" (suspend the pattern, notify admin)
- [ ] Runbook exists for "lawyer disputes a removed review" (escalate to Legal Director)
- [ ] Runbook exists for "citizen disputes a removed review" (the appeal flow)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `review.service.ts` — submission, state transitions
- `review.engagement.ts` — engagement confirmation, prompt scheduling
- `review.moderation.ts` — approval, removal, editing
- `review.appeal.ts` — appeal submission, escalation
- `review.aggregate.ts` — aggregate rating calculation, category breakdown
- `review.response.ts` — lawyer response lifecycle

Coverage target: ≥ 90% on the moderation logic (the highest-stakes code); ≥ 85% on the rest.

### 9.2 Integration Tests

- Full flow: consultation completed → engagement confirmed → review submitted → moderated → published → lawyer responded
- Engagement declined → case closes, no review
- Review submitted without engagement confirmation → rejected
- Review removed by moderation → citizen appeals → appeal approved → review published
- Review removed → appeal denied → review stays removed
- Aggregate rating updates correctly as reviews are added/removed
- Coordinated review attack simulation → flagged for additional scrutiny
- Lawyer response submitted → updated within 30 days → updated successfully
- Lawyer response submitted → updated after 30 days → rejected
- Category weights adjustment → aggregate rating recalculated

### 9.3 E2E Tests

- Full review flow from a citizen's perspective
- Full review flow from a lawyer's perspective
- Full moderation flow from a moderator's perspective
- Full appeal flow

### 9.4 Manual Tests (during pilot)

- Real reviews with real citizens and real lawyers
- Real moderation with real moderators
- Edge case: a coordinated attack (simulated)
- Edge case: a review that requires editing (defamation, with consent from the citizen)

### 9.5 Security Tests (required)

- **Penetration test:** Attempt to submit a review for a consultation that was not completed. Must fail.
- **Penetration test:** Attempt to submit a review without engagement confirmation. Must fail.
- **Penetration test:** Attempt to respond to a review that is not about the current lawyer. Must fail.
- **Penetration test:** Attempt to see another user's draft review. Must fail.
- **Code review:** Every change to the moderation logic is reviewed by the Engineering Lead AND the Legal Director.

### 9.6 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. The negative tests are especially important for:
- A user cannot review a consultation they did not complete
- A user cannot review without engagement confirmation
- A lawyer cannot respond to a review that is not about them
- A user cannot see another user's draft review
- A user cannot submit a second review for the same consultation

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `reviews.module.enabled` | true | Disable the entire module |
| `reviews.submission.enabled` | true | Disable new review submissions |
| `reviews.display.enabled` | true | Hide reviews from public display (rare) |
| `reviews.lawyer-response.enabled` | true | Disable lawyer responses |
| `reviews.engagement-prompt.enabled` | true | Disable the post-consultation prompt |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **Coordinated review attack detected:** Disable `reviews.submission.enabled` for the offending accounts. Investigate. Notify the admin team. Coordinate with the Moderation module.
- **Moderation backlog:** Increase moderator staffing. The 24-hour SLA may slip temporarily; citizens are notified.
- **Aggregate rating manipulation detected:** A lawyer with a suspicious rating pattern (e.g., sudden 5-star burst from new accounts) is flagged for admin review. Ratings are not corrected automatically; the admin decides.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Is the engagement confirmation enough of a defense against fake reviews, or do we need a stronger mechanism? | Legal Director | Open — pilot data will inform |
| 2 | Should we allow the citizen to edit the category weights per review, or always use the standard? | Product Lead | Open — recommend adjustable, with standard for aggregate |
| 3 | What is the right length for the review text? (50–2000 is the spec.) | Product Lead | Open — needs user research |
| 4 | Should the moderation editing preserve the original text, or replace it? | Legal Director | Open — recommend preserve original, show edited version publicly |
| 5 | Should the lawyer be notified of a review before or after it is approved? | Product Lead | Open — recommend after approval, to avoid alerting to a review that may be removed |
| 6 | How do we handle a review that mentions a third party (e.g., "the lawyer was better than my previous lawyer")? | Moderation Lead | Open — needs policy |
| 7 | Should we publish the moderation decision (e.g., "this review was edited for defamation") on the public profile? | Legal Director | Open — recommend no, to avoid chilling effect on reviewers |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the moderation policy require Legal Director sign-off.

---

## Appendix A: Glossary
- **LGA** — Local Government Area
- **NDPR** — Nigeria Data Protection Regulation
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SLA** — Service Level Agreement

## Appendix B: References
- [PRD.md §4.5 — Lawyer Marketplace](../product/PRD.md#45-lawyer-marketplace-pillar-3)
- [Personas.md §3.2 — Tunde, §3.3 — Ngozi](../product/Personas.md)
- [PLATFORM.md §5.5 — Lawyer Ratings & Reviews](../PLATFORM.md#55-lawyer-ratings--reviews)
- [modules/Lawyer Matching & Consultation.md](./Lawyer%20Matching%20%26%20Consultation.md) — the peer module that triggers the review
- [modules/Lawyer Onboarding & Verification.md](./Lawyer%20Onboarding%20%26%20Verification.md) — the peer module that displays the reviews
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers post-consultation prompt, engagement confirmation, review submission, moderation, lawyer response, public display, and appeals. 16 business rules, 14 edge cases, 40+ acceptance criteria. The engagement confirmation (§3.1.2) is the most distinctive design decision and reflects the platform's commitment to substantive reviews over drive-by ratings. |