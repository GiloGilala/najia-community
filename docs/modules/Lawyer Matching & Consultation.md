# Module Spec — Lawyer Matching & Consultation

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Bar Association liaison*
*Parent PRD: [PRD.md §4.5](../product/PRD.md#45-lawyer-marketplace-pillar-3)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: case intake form, matching algorithm, lawyer match notifications, free consultation scheduling and delivery (video/audio/chat), post-consultation rating of the platform's matching quality, case status tracking. Out of scope: in-app messaging (deferred), document sharing with the lawyer via the platform (deferred), multi-party consultations (deferred), legal engagement itself (outside the platform).

---

## 1. Overview

### 1.1 Module Name

Lawyer Matching & Consultation

### 1.2 Purpose

Connect citizens with civil disputes to verified lawyers via a transparent matching algorithm, facilitate a free 15–20 minute platform-funded consultation, and enable a clear handoff for any subsequent engagement (which happens outside the platform). The module is the operational core of Pillar 3 (Lawyer Marketplace) and is the only mechanism by which a citizen gets matched to a lawyer. The module's primary design constraints are: (1) **transparent matching** — criteria are published and explainable; (2) **free consultation funded by the platform** — the citizen pays nothing, the lawyer is compensated; (3) **clear separation between platform and engagement** — the platform facilitates but does not participate in the legal engagement itself.

### 1.3 In Scope

- Case intake form (case type, jurisdiction, budget, urgency, brief description)
- Matching algorithm (weighted criteria, 3–5 recommendations)
- Match result display (lawyer profiles with key fields)
- Match notification to the lawyer
- Lawyer accept/decline of the match
- Free consultation scheduling (15–20 minute slots, lawyer's availability)
- Consultation delivery (video/audio/chat, platform-hosted)
- Consultation tracking (duration, attendance, completion)
- Post-consultation rating of the platform's matching quality (not the lawyer)
- Case status tracking (no match / match pending / match accepted / consultation scheduled / consultation completed / engagement (outside) / closed)
- Audit trail for all matching decisions and consultation events
- RBAC and access control (citizen sees their own cases; lawyer sees assigned cases)
- Refund logic for no-show by the lawyer (platform-funded consultation)

### 1.4 Out of Scope

- **In-app messaging between citizen and lawyer** — uses platform tools during consultation, then off-platform. Deferred to Year 2.
- **Document sharing with the lawyer via the platform** — citizens can use the Evidence module to upload files, and the lawyer sees them in the case context (this is in scope, via the Evidence module integration). Direct document sharing outside of Evidence is deferred.
- **Multi-party consultations** — one citizen, one lawyer. Multi-party (e.g., both parties in a dispute) is deferred.
- **Mediation or arbitration** — we are not a court. The platform does not provide mediation services. (See the "what the platform IS NOT" list in PLATFORM.md §2.2.)
- **The legal engagement itself** — any work after the consultation happens outside the platform, between the lawyer and the client. The platform does not track, bill, or mediate the engagement.
- **Hourly billing or time tracking for engagements** — outside the platform.
- **Document drafting or contract generation** — outside the platform.
- **Automated translation during consultations** — deferred to Year 2.
- **Legal aid clinic integration** — deferred to Year 2.
- **Group practices or firm accounts** — one citizen, one lawyer. Deferred.
- **Persistent case file across consultations** — a single consultation per match; if the citizen wants further engagement, they do it outside.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Cases matched to lawyers | ≥ 20 | Count |
| Free consultations completed | ≥ 50 | Count |
| Citizen satisfaction with match (1–5) | ≥ 4.0 | Post-consultation rating |
| Match-to-consultation conversion | ≥ 60% (matches that result in a completed consultation) | Funnel analysis |
| Lawyer response SLA (accept/decline within 24h) | ≥ 80% | Audit log |
| Consultation on-time rate | ≥ 90% (consultations that start within 5 minutes of scheduled time) | Tracking |
| Lawyer no-show rate | < 10% | Tracking |
| Time from intake to first consultation (median) | ≤ 5 business days | Funnel analysis |
| Match quality rating (post-consultation, 1–5) | ≥ 4.0 | Survey |
| Bar Association compliance: zero fee from client engagement | 100% | Code review + audit |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Verified citizen | Complete a case intake form | The system can match me to lawyers | Must |
| Verified citizen | See 3–5 matched lawyers | I can choose who to consult with | Must |
| Verified citizen | Understand why each lawyer was matched to me | I can make an informed choice | Must |
| Verified citizen | Schedule a free consultation with a chosen lawyer | I can evaluate the lawyer | Must |
| Verified citizen | Know the consultation is free | I can engage without financial risk | Must |
| Verified citizen | Know the platform does not take a percentage of any future legal fees | I can trust the platform's neutrality | Must |
| Verified citizen | Rate the matching experience (not the lawyer) | I can give feedback on the platform | Must |
| Verified citizen | Be re-matched if my first choice is unavailable | I can still find a lawyer | Must |
| Verified citizen | Withdraw from a match before consultation | I can change my mind | Should |
| Active lawyer | Receive a match notification | I can accept or decline a case | Must |
| Active lawyer | See a brief case summary (without the citizen's identity) | I can decide if I'm a good fit | Must |
| Active lawyer | Accept or decline a match | I can manage my caseload | Must |
| Active lawyer | Set my availability for consultations | I can manage my time | Should |
| Active lawyer | Receive a no-show refund policy explanation | I know I'm protected if a citizen no-shows | Must |
| Active lawyer | Be compensated for completed consultations | My time has value | Must |
| Moderator | View the matching pipeline metrics | I can monitor the marketplace | Must |
| Admin | Override a match (rare; for misclassification) | I can correct errors | Should |
| Admin | Refund a no-show consultation | I can handle disputes | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `cases` | `id`, `citizen_id`, `case_type`, `jurisdiction_type`, `jurisdiction_value`, `budget_min`, `budget_max`, `urgency`, `description` (≤ 2000 chars), `status` (NO_MATCH / MATCH_PENDING / MATCH_ACCEPTED / CONSULTATION_SCHEDULED / CONSULTATION_COMPLETED / ENGAGEMENT / CLOSED / WITHDRAWN), `created_at`, `closed_at` | The citizen's case |
| `matches` | `id`, `case_id`, `lawyer_id`, `match_score` (JSON, the algorithm's breakdown), `status` (PENDING / ACCEPTED / DECLINED / EXPIRED / CANCELLED), `notified_at`, `responded_at`, `response` (accept/decline), `response_notes` | A specific match between a case and a lawyer |
| `consultations` | `id`, `match_id`, `case_id`, `lawyer_id`, `citizen_id`, `scheduled_start`, `scheduled_end`, `actual_start` (nullable), `actual_end` (nullable), `status` (SCHEDULED / IN_PROGRESS / COMPLETED / NO_SHOW_LAWYER / NO_SHOW_CITIZEN / CANCELLED), `platform_funded_amount` (NGN), `lawyer_paid` (boolean) | The free consultation |
| `consultation_attendance` | `id`, `consultation_id`, `participant_id`, `joined_at`, `left_at` | Tracks join/leave events for each participant |
| `consultation_ratings` | `id`, `consultation_id`, `citizen_id`, `match_quality_rating` (1–5), `match_quality_feedback` (≤ 1000 chars), `rated_at` | The citizen's post-consultation rating of the **platform's matching** (not the lawyer; that's in the Lawyer Reviews module) |
| `lawyer_availability` | `id`, `lawyer_id`, `day_of_week`, `start_time`, `end_time`, `timezone` (Africa/Lagos in pilot) | The lawyer's available time slots |
| `audit_log` | cross-cutting | All state changes and matching decisions |

#### 3.1.1 The Matching Algorithm (Transparent and Explainable)

The matching algorithm is the most user-facing piece of logic in the marketplace. It must be **transparent** (criteria are published) and **explainable** (the user can see why each lawyer was matched).

The algorithm uses weighted scoring:

| Criterion | Weight | Description | Source |
|-----------|--------|-------------|--------|
| **Practice area match** | High (40%) | The lawyer's practice areas must include the case type. This is a hard filter, not a soft score. | `lawyer_profiles.practice_areas` |
| **Jurisdiction match** | High (30%) | The lawyer must be licensed in the case's jurisdiction. This is also a hard filter. | `lawyer_profiles.jurisdictions` |
| **Availability** | Medium (10%) | The lawyer has available slots in the next 7 days. | `lawyer_availability` |
| **Budget alignment** | Medium (10%) | The lawyer's fee structure is within the citizen's budget. | `lawyer_profiles.fee_structure` vs. `cases.budget_min/max` |
| **Rating** | Medium (5%) | The lawyer's overall rating from past consultations. | `lawyer_reviews` (from Lawyer Reviews module) |
| **Experience** | Medium (5%) | Years since bar call. | `lawyer_profiles.year_of_call` |
| **Language** | Low (5%) | Language match between lawyer and citizen. | `lawyer_profiles.languages` vs. `users.preferred_language` |
| **Location proximity** | Low (3%) | Proximity of the lawyer's office to the citizen. | `lawyer_profiles.office_location` vs. `users.location` |
| **Active match load** | Penalty (-5 per active match) | Lawyers with many active matches are deprioritized. | `matches.status = ACCEPTED` count |

The total score is normalized to 0–100. The top 3–5 lawyers by score are returned.

**Transparency:** The algorithm's criteria and weights are published in the platform documentation. The user sees the match score breakdown for each lawyer: "Matched because: Practice area (40/40), Jurisdiction (30/30), Availability (8/10), Budget alignment (7/10), Rating (4/5), Experience (3/5), Language (5/5), Location (2/3), Active match load (-2). Total: 95/100."

**Fairness:** The algorithm does not preferentially treat any lawyer. The "Active match load" penalty is the only mechanism that could be perceived as preferential, and it is published and applies uniformly.

**Quality-focused:** Rating and experience are weighted, but the hard filters (practice area, jurisdiction) come first. A 5-star lawyer in the wrong jurisdiction is not matched.

**Citizen choice:** The recommendations are suggestions, not mandates. The citizen can browse all lawyers and select any.

#### 3.1.2 The Free Consultation — Platform-Funded

The free consultation is funded by the platform. The financial flow:

1. Citizen schedules a 15–20 minute consultation
2. Both parties join the platform's video/audio/chat
3. Consultation runs for the scheduled duration (or until either party leaves)
4. Platform records the actual duration
5. Platform pays the lawyer a flat fee per completed consultation (per the Operations finance model — see [Business Case §3.2.2](../business/Business.md#322-government--ngo-poll-fees) for the consultation cost)
6. The platform does **not** charge the citizen
7. The platform does **not** take a percentage of any subsequent engagement

The flat fee per consultation is set by the Operations team and is **not** based on the duration (within the 15–20 minute window). This is to avoid the perception that the platform is "metering" the consultation or pressuring the lawyer to end it early.

#### 3.1.3 Engagement Is Outside the Platform

After the consultation, the lawyer and the citizen may agree to engage. This engagement:

- Is a private agreement between the lawyer and the citizen
- Is not tracked, billed, or mediated by the platform
- Does not result in any fee to the platform
- Is not affected by the citizen's rating of the platform (which is about the matching, not the engagement)

The platform's role ends at the consultation. The handoff is explicit in the UX: after the consultation, both parties see a "If you wish to engage [Lawyer Name], you can do so directly. The platform is not involved in any engagement and does not take a percentage of any fees." message.

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `POST` | `/api/cases` | Create a case (citizen) | Authenticated | `cases:create` |
| `GET` | `/api/cases` | List the current user's cases | Authenticated | `cases:read` (own) |
| `GET` | `/api/cases/:caseId` | Get case detail | Authenticated | `cases:read` (own or assigned lawyer) |
| `POST` | `/api/cases/:caseId/match` | Run the matching algorithm (citizen) | Authenticated | `cases:update` (own) |
| `GET` | `/api/cases/:caseId/matches` | Get the match results | Authenticated | `cases:read` (own or assigned lawyer) |
| `POST` | `/api/cases/:caseId/matches/:matchId/select` | Citizen selects a lawyer from matches | Authenticated | `cases:update` (own) |
| `POST` | `/api/matches/:matchId/accept` | Lawyer accepts a match | Authenticated | `lawyer:match` (self) |
| `POST` | `/api/matches/:matchId/decline` | Lawyer declines a match | Authenticated | `lawyer:match` (self) |
| `GET` | `/api/lawyers/me/matches` | List the lawyer's pending matches | Authenticated | `lawyer:read` (self) |
| `POST` | `/api/consultations` | Schedule a consultation (after match selected) | Authenticated | `cases:update` (own) |
| `GET` | `/api/consultations/:consultationId` | Get consultation detail | Authenticated | `cases:read` (participant) |
| `POST` | `/api/consultations/:consultationId/start` | Join the consultation (citizen or lawyer) | Authenticated | `cases:read` (participant) |
| `POST` | `/api/consultations/:consultationId/end` | End the consultation (either party or system) | Authenticated | `cases:read` (participant) |
| `POST` | `/api/consultations/:consultationId/rate` | Rate the matching quality (citizen) | Authenticated | `cases:update` (own) |
| `POST` | `/api/cases/:caseId/withdraw` | Withdraw the case (citizen) | Authenticated | `cases:update` (own) |
| `GET` | `/api/lawyers/me/availability` | Get the lawyer's availability | Authenticated | `lawyer:read` (self) |
| `PUT` | `/api/lawyers/me/availability` | Set the lawyer's availability | Authenticated | `lawyer:update` (self) |
| `POST` | `/api/admin/consultations/:consultationId/refund` | Refund a no-show consultation | Authenticated | `admin:system` |
| `POST` | `/api/admin/matches/:matchId/override` | Override a match (rare) | Authenticated | `admin:system` |
| `GET` | `/api/admin/marketplace-metrics` | Get marketplace metrics | Authenticated | `admin:system` |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `caseIntakeAction` | Submit the case intake form |
| `matchResultsLoader` | Load the match results |
| `selectMatchAction` | Select a lawyer from matches |
| `scheduleConsultationAction` | Schedule the consultation |
| `consultationRoomLoader` | Load the consultation room |
| `rateConsultationAction` | Submit the matching quality rating |
| `lawyerMatchesLoader` | Load the lawyer's pending matches |
| `acceptMatchAction` | Accept a match (lawyer) |
| `declineMatchAction` | Decline a match (lawyer) |
| `lawyerAvailabilityAction` | Set/update availability |

### 3.3 Business Rules

1. **Only verified citizens can create cases.** Unverified users get a CTA to verify.
2. **A citizen can have multiple cases** (sequential, not parallel in the pilot; parallel is a Year 2 feature).
3. **The intake form requires all fields.** Case type, jurisdiction, budget, urgency, and description are all required.
4. **The matching algorithm runs on demand** (when the citizen clicks "Find lawyers") and is deterministic (same inputs → same outputs).
5. **Hard filters (practice area, jurisdiction) eliminate non-matching lawyers.** A lawyer without the right practice area or jurisdiction is not in the result set, regardless of other scores.
6. **3–5 lawyers are returned.** If fewer than 3 match, the citizen is shown the available matches and told "We have [N] lawyers matching your case. We'll notify you when more join."
7. **The match results are valid for 7 days.** After 7 days, the citizen can re-run the match (which may return different results as lawyer availability and load change).
8. **A lawyer has 24 hours to respond to a match** (accept or decline). If no response, the match is marked `EXPIRED` and the citizen is notified.
9. **A lawyer can decline a match without a reason.** If a reason is provided, it is shared with the citizen (anonymously).
10. **A consultation is 15–20 minutes.** The duration is set at scheduling time. Shorter durations are not allowed; longer durations are not allowed.
11. **The consultation is free to the citizen.** The platform pays the lawyer a flat fee per completed consultation.
12. **The consultation is delivered via the platform's video/audio/chat.** Off-platform consultation tools are not supported in the pilot.
13. **A no-show by the lawyer results in a refund to the platform's consultation budget** (i.e., the lawyer is not paid; the platform keeps the budget for that consultation).
14. **A no-show by the citizen results in the lawyer being paid the full consultation fee.** The platform absorbs the cost.
15. **Both parties can rate the matching quality** (in the pilot, only the citizen rates; lawyer rating is Year 2). The rating is about the platform's matching, not the lawyer.
16. **A citizen can withdraw a case at any time** before the consultation. After the consultation, the case is auto-closed.
17. **A lawyer's availability is set in 1-hour blocks** in the pilot (finer granularity is a Year 2 feature).
18. **All state changes are audit-logged.** Every match, every accept/decline, every consultation start/end, every no-show, every rating.
19. **The matching algorithm's criteria and weights are published** in the platform documentation and in the UX (the score breakdown is shown to the citizen).
20. **The platform does not take a percentage of any engagement fees.** This is enforced in the data model and the fee model (per the Lawyer Onboarding module's CI grep).

### 3.4 State Machine — Case
INTAKE_SUBMITTED
│ matching algorithm runs
▼
MATCH_PENDING
│ 3–5 matches returned, waiting for citizen selection
│ citizen selects a lawyer
▼
MATCH_SELECTED
│ lawyer notified, waiting for response
│ lawyer accepts
▼
MATCH_ACCEPTED
│ citizen schedules consultation
▼
CONSULTATION_SCHEDULED
│ consultation time arrives, both parties join
▼
CONSULTATION_IN_PROGRESS
│ scheduled end time, or either party leaves
▼
CONSULTATION_COMPLETED
│ citizen rates matching quality
│ (engagement happens outside; the case is auto-closed after 7 days)
▼
CLOSED

text


Alt paths:
- `MATCH_PENDING` → `WITHDRAWN` (citizen withdraws before selecting)
- `MATCH_SELECTED` → `MATCH_PENDING` (lawyer declines; citizen can select another)
- `MATCH_ACCEPTED` → `MATCH_PENDING` (lawyer declines; citizen can re-select)
- `CONSULTATION_SCHEDULED` → `MATCH_PENDING` (citizen cancels the scheduled consultation; can re-select)
- `CONSULTATION_IN_PROGRESS` → `CONSULTATION_COMPLETED_NO_SHOW_LAWYER` or `CONSULTATION_COMPLETED_NO_SHOW_CITIZEN` (per the no-show rules)

### 3.5 State Machine — Match
PENDING
│ lawyer accepts
▼
ACCEPTED
│ consultation scheduled
▼
IN_CONSULTATION
│ consultation completed
▼
COMPLETED
│
│ terminal (for this match)
│
│ alternative paths from PENDING:
│ lawyer declines → DECLINED
│ 24h no response → EXPIRED
│ citizen withdraws → CANCELLED

text


### 3.6 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| User not verified | "You need to verify your identity to find a lawyer. [CTA: Verify now]" | `VERIFICATION_REQUIRED` (403) |
| Intake form missing required fields | Inline errors on the missing fields | `VALIDATION_ERROR` (400) |
| No lawyers match | "We don't have a lawyer matching your case right now. We'll notify you when one joins." (The case is saved; the citizen is added to a waitlist.) | `NO_MATCHES` (200 with empty result; not an error) |
| Fewer than 3 lawyers match | "We have [N] lawyers matching your case. We'll notify you when more join." | — |
| Lawyer doesn't respond within 24h | Match is `EXPIRED`. Citizen is notified and can re-select. | (Operational) |
| Lawyer declines the match | Citizen is notified and can select another. The decline reason (if provided) is shown. | — |
| Citizen tries to schedule outside lawyer's availability | "This time is not available. Please choose from the available slots." | `SLOT_UNAVAILABLE` (409) |
| Consultation missed by lawyer | "Your lawyer didn't join the consultation. We've noted the no-show and you can pick another or try again." (The lawyer is not paid.) | (Operational) |
| Consultation missed by citizen | The lawyer is paid the full consultation fee. The case is closed. | (Operational) |
| Both parties no-show | The platform keeps the budget. The case is closed. | (Operational) |
| Consultation runs over 20 minutes | The consultation is auto-ended at 20 minutes. The platform records the actual duration. | (Operational) |
| Technical failure during consultation | The consultation is marked `TECHNICAL_FAILURE`. The citizen is offered a re-schedule. | `TECHNICAL_FAILURE` (500) |
| Citizen tries to rate after 30 days | "The rating window for this consultation has closed." | `RATING_WINDOW_CLOSED` (422) |
| Citizen tries to withdraw after consultation | "This consultation has already happened. The case is closed." | `WITHDRAWAL_DENIED` (409) |
| Citizen has an open case and tries to create a new one | "You have an open case. Please close it before creating a new one." (Sequential cases in pilot.) | `OPEN_CASE_EXISTS` (409) |
| Lawyer's subscription lapses while they have a pending match | The match is auto-declined. The citizen is notified. | (Operational) |
| Lawyer is suspended while they have an accepted match | The match is cancelled. The citizen is notified. | (Operational) |
| Two consultations are scheduled for the same lawyer at the same time | The second one is rejected at scheduling time (slot conflict). | `SLOT_CONFLICT` (409) |
| Match score breakdown reveals sensitive data (e.g., the lawyer's full review history) | Only the aggregate rating is shown in the breakdown, not individual reviews. | — |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `cases:create` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` | Any verified user can create a case |
| `cases:read` | `citizen` (own), `lawyer` (assigned), `moderator` (all), `admin` (all) | Citizens see their own; lawyers see assigned; staff see all |
| `cases:update` | `citizen` (own), `moderator` (all) | Citizens update their own (status, withdrawal); moderators can correct |
| `cases:delete` | `admin` | Admin only (hard delete; rare) |
| `cases:consent` | `citizen` (own) | A user can consent to their case being shared with a matched lawyer |
| `lawyer:match` | `citizen` (initiate), `lawyer` (accept/decline) | Citizens initiate matches; lawyers respond |
| `consultation:read` | `citizen` (own), `lawyer` (own), `admin` (all) | Both participants can read their own consultations |
| `consultation:start` | `citizen` (own), `lawyer` (own) | Both participants can start the consultation |
| `consultation:end` | `citizen` (own), `lawyer` (own), `system` | Either party or the system can end it |
| `consultation:rate` | `citizen` (own) | The citizen rates the matching quality |
| `lawyer:availability:read` | `lawyer` (self), `admin` (all) | The lawyer sees their own; admins see all |
| `lawyer:availability:update` | `lawyer` (self) | The lawyer sets their own availability |
| `admin:system` | `admin` | Admin override, refund, metrics |

The `cases:read` permission has CASL conditions:
- For citizens: `{ complainantId: user.id }` (the citizen who created the case)
- For lawyers: `{ lawyerId: user.id }` (the lawyer assigned to the case via an accepted match)
- For moderators and admins: no condition (all)

---

## 5. User Experience

### 5.1 Key Screens

Reference [UX & Design.md §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot). The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 25 | Lawyer intake form | Tunde | Yes | Yes |
| 26 | Match results | Tunde | Yes | Yes |
| 27 | Schedule consultation | Tunde | Yes | Yes |
| 28 | Consultation (video/audio/chat) | Tunde, Ngozi | Yes | Yes |
| 29 | Post-consultation rating | Tunde | Yes | Yes |
| (admin) | Marketplace metrics | Admin | Yes | Yes (staff) |

### 5.2 User Flows

Reference [User Journeys.md §6](../product/User%20Journeys.md#6-j4--citizen-with-a-dispute-gets-matched-to-a-lawyer) for the J4 journey. This module implements J4.

### 5.3 The Matching Score Breakdown

The citizen sees the match score breakdown for each lawyer. The display is clear, plain language, and visible:
⭐⭐⭐⭐⭐ (4.8/5) — 23 reviews
Ngozi Adeyemi
Practice areas: Landlord-Tenant, Consumer Protection
Jurisdictions: Lagos
Languages: English, Yoruba
Office: Victoria Island

Matched because:
✓ Practice area: 40/40
✓ Jurisdiction: 30/30
• Availability: 8/10 (next slot: tomorrow 2pm)
• Budget alignment: 7/10 (within your range)
• Rating: 5/5
• Experience: 3/5 (8 years)
• Language: 5/5
• Location: 2/3 (5km away)
• Active match load: -2 (4 active matches)
Total: 98/100

[Schedule free consultation]

text


The citizen understands **why** each lawyer was matched, not just that they were. This is the transparency principle in action.

### 5.4 The Free Consultation — UX Reinforcement

The free consultation is reinforced in the UI at every relevant moment:

| Where | What the user sees |
|-------|---------------------|
| Match results | "Schedule a free 15-minute consultation. The platform funds the consultation; you pay nothing." |
| Schedule consultation | "This consultation is free. The platform pays the lawyer; you pay nothing." |
| After scheduling | "Your consultation is scheduled for [date] at [time]. The consultation is free." |
| During consultation | (No financial UI; focus on the conversation) |
| After consultation | "If you wish to engage [Lawyer Name] for further work, you can do so directly. The platform is not involved in any engagement and does not take a percentage of any fees." |

The Tunde persona is concerned about being scammed. The free consultation is the platform's contract with him: try the lawyer, no risk.

### 5.5 The Ngozi Experience

The lawyer's UX is also important. The lawyer:

- Receives a notification of a new match with a brief case summary (case type, jurisdiction, urgency, budget range, brief description — but **not** the citizen's identity)
- Has 24 hours to accept or decline
- Can see the case summary before accepting
- Does NOT see the citizen's name, photo, or contact info until they accept (and even then, contact info is only revealed at consultation time, not at match time)

This protects the citizen's identity from a lawyer who might decline based on the citizen's demographics. The lawyer accepts based on the case, not the person.

### 5.6 The Consultation Room

The consultation is a platform-hosted video/audio/chat room. The UX:

- Both parties join via a unique URL (the consultation ID)
- Video is the default; either party can switch to audio-only or chat-only
- A timer shows the remaining time (15 or 20 minutes)
- At the scheduled end time, both parties are warned "2 minutes remaining"
- At the end time, the room auto-closes
- Either party can leave early

The platform does not record the consultation. This is a privacy feature, not a limitation. (Recording is a Year 2 candidate, with explicit consent from both parties.)

### 5.7 The Post-Consultation Rating

The citizen rates the **matching quality**, not the lawyer. The UX:

- "How well did the platform match you with this lawyer?" (1–5 stars)
- "What could we improve about the matching?" (free text, optional)
- The rating is about the platform's matching algorithm and process, not the lawyer's performance

The lawyer's performance is rated separately in the Lawyer Reviews module (post-engagement, outside the platform's consultation flow).

### 5.8 Accessibility

Same standards as other modules. The consultation room supports:
- Keyboard navigation (for chat)
- Captions for video (browser-native)
- Screen reader compatibility (the timer is announced)
- Adjustable text size for chat

The video/audio itself is not accessible to all users; the chat option is the accessible alternative. The intake form explicitly asks the citizen's communication preference.

### 5.9 The Tunde Test (Module-Specific)

Beyond the general design principles:

> **Would Tunde understand (1) that the consultation is free, (2) that the engagement is outside the platform, (3) that the platform does not take a percentage of any future fees, and (4) why each lawyer was matched to him?**

If the answer to any of these is "no" — the design is not ready. Each of these is a trust question for the dispute-haver persona.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Match algorithm P95 | < 2s (with 200 active lawyers; scales linearly) |
| **Performance** | Match results load P95 | < 500ms |
| **Performance** | Schedule consultation P95 | < 1s |
| **Performance** | Consultation room join P95 | < 2s (WebRTC connection establishment) |
| **Performance** | Lawyer match notification delivery | < 60s |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | WebRTC peer-to-peer (not relayed through platform) | Yes (for privacy) |
| **Security** | Consultation room access controlled by consultation ID | Yes (unguessable IDs) |
| **Security** | Citizen identity not visible to lawyer until consultation time | Yes (enforced in the API) |
| **Security** | Lawyer identity visible to citizen immediately | Yes (after match selected) |
| **Privacy** | Consultations are not recorded | Yes (no recording) |
| **Privacy** | Case description is visible to matched lawyer only | Yes (per RBAC) |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | Lawyer does not see citizen's name, photo, or contact until consultation | Yes (enforced in the data model) |
| **Reliability** | Lawyer response SLA | 80% within 24h |
| **Reliability** | Consultation on-time rate | ≥ 90% |
| **Reliability** | Lawyer no-show rate | < 10% |
| **Reliability** | Consultation room uptime during scheduled consultations | ≥ 99% |
| **Observability** | Every match, accept, decline, consultation start/end logged | Yes |
| **Observability** | Every no-show logged with details | Yes |
| **Observability** | Alert on lawyer no-show rate > 10% | Yes (per lawyer) |
| **Observability** | Alert on consultation technical failure rate > 5% | Yes |
| **Observability** | Alert on match-to-consultation conversion < 40% | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | User must be verified |
| Lawyer Onboarding & Verification module | Internal | Provides the lawyer pool and lawyer profiles |
| Evidence module | Internal (lateral) | Lawyers can see evidence in assigned cases |
| RBAC module | Internal | Permission checks with per-case conditions |
| Audit log module | Internal | All state changes and matching decisions |
| Cache layer (SQLite) | Internal | Lawyer availability cache, match score cache |
| Notification service | Internal | Match notifications, consultation reminders |
| WebRTC service (for consultation room) | External (or self-hosted) | Video/audio peer-to-peer |
| Postgres + Drizzle ORM | Internal | Primary database |

If WebRTC is unavailable or unreliable, the consultation falls back to chat-only. The chat-only mode is always available and is the accessibility fallback.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Intake and Matching

- [ ] A verified citizen can complete the intake form
- [ ] An unverified user cannot create a case
- [ ] All required fields are enforced
- [ ] The matching algorithm returns 3–5 lawyers (or fewer if < 3 match)
- [ ] The match score breakdown is shown for each lawyer
- [ ] Hard filters (practice area, jurisdiction) are applied correctly
- [ ] The algorithm is deterministic (same inputs → same outputs)
- [ ] The criteria and weights are published in the platform documentation
- [ ] "No matches" is handled gracefully (the citizen is waitlisted)

### 8.2 Lawyer Match Response

- [ ] A lawyer receives a notification within 60 seconds of the match
- [ ] The notification includes a brief case summary (not the citizen's identity)
- [ ] The lawyer has 24 hours to respond
- [ ] An unresponded match is auto-expired after 24 hours
- [ ] The lawyer can accept or decline with optional notes
- [ ] The citizen is notified of the lawyer's response
- [ ] A declined match allows the citizen to select another lawyer

### 8.3 Scheduling

- [ ] A citizen can schedule a consultation with an accepted match
- [ ] The duration is 15 or 20 minutes
- [ ] Scheduling is only within the lawyer's available slots
- [ ] Double-booking is prevented (slot conflict)
- [ ] Both parties receive a confirmation with the join link
- [ ] Both parties receive a reminder 1 hour before the consultation

### 8.4 Consultation Delivery

- [ ] Both parties can join the consultation room via the link
- [ ] Video, audio, and chat modes are available
- [ ] Either party can switch modes mid-consultation
- [ ] The timer shows the remaining time
- [ ] The room auto-closes at the scheduled end time
- [ ] Either party can leave early
- [ ] The actual start and end times are recorded
- [ ] The platform does NOT record the consultation
- [ ] The chat-only fallback works for users with no video/audio

### 8.5 No-Show Handling

- [ ] A lawyer no-show is detected and recorded
- [ ] A citizen no-show is detected and recorded
- [ ] A lawyer no-show results in no payment to the lawyer
- [ ] A citizen no-show results in the lawyer being paid the full fee
- [ ] A both-no-show results in the platform keeping the budget
- [ ] The no-show rate is monitored per lawyer and alerts are triggered

### 8.6 Post-Consultation

- [ ] The citizen can rate the matching quality (1–5 stars)
- [ ] The citizen can provide free-text feedback (optional)
- [ ] The rating window is 30 days
- [ ] The case is auto-closed 7 days after the consultation
- [ ] The post-consultation message clearly states the engagement is outside the platform

### 8.7 Transparency

- [ ] The matching algorithm's criteria and weights are published
- [ ] The score breakdown is shown to the citizen
- [ ] The fee model (flat subscription, not percentage) is clearly stated
- [ ] The "no percentage of legal fees" commitment is visible at every relevant point

### 8.8 Privacy and Identity

- [ ] A lawyer does NOT see the citizen's name, photo, or contact info until consultation time
- [ ] A citizen DOES see the lawyer's name, photo, and profile immediately after match selection
- [ ] The case description is visible to the matched lawyer only
- [ ] NDPR compliance is maintained throughout
- [ ] The consultation is not recorded

### 8.9 Security

- [ ] All API endpoints over TLS 1.3
- [ ] All connections over WireGuard
- [ ] Consultation room access controlled by unguessable consultation ID
- [ ] WebRTC peer-to-peer (not relayed through platform)
- [ ] Rate limit: 5 case creations per user per hour
- [ ] Rate limit: 10 match requests per case per day

### 8.10 Operational

- [ ] Health check includes matching service status
- [ ] Health check includes consultation room status
- [ ] Alert on lawyer no-show rate > 10% (per lawyer)
- [ ] Alert on consultation technical failure rate > 5%
- [ ] Alert on match-to-consultation conversion < 40%
- [ ] Runbook exists for "WebRTC service down" (fall back to chat-only)
- [ ] Runbook exists for "lawyer disputes a no-show marking" (review the consultation log)
- [ ] Runbook exists for "citizen disputes a no-show marking" (review the consultation log)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `matching.algorithm.ts` — the weighted scoring, hard filters, normalization
- `matching.explainability.ts` — the score breakdown generation
- `case.service.ts` — case lifecycle, state transitions
- `match.service.ts` — match acceptance, decline, expiration
- `consultation.service.ts` — scheduling, joining, ending, duration tracking
- `consultation.no-show.ts` — no-show detection, refund logic

Coverage target: ≥ 95% on the matching algorithm (the most user-facing logic); ≥ 85% on the rest.

### 9.2 Integration Tests

- Full flow: intake → match → select → accept → schedule → join → complete → rate → close
- No lawyers match (case is waitlisted)
- Fewer than 3 lawyers match (graceful handling)
- Lawyer declines (citizen re-selects)
- Lawyer doesn't respond in 24h (match expires)
- Lawyer no-show (no payment, citizen can re-select)
- Citizen no-show (lawyer is paid, case closes)
- Both no-show (platform keeps budget)
- Technical failure during consultation (re-schedule offered)
- Identity protection: lawyer cannot see citizen's identity before consultation
- Engagement messaging: after consultation, the "outside the platform" message is clear

### 9.3 E2E Tests

- Full J4 journey — see [User Journeys.md §6](../product/User%20Journeys.md#6-j4--citizen-with-a-dispute-gets-matched-to-a-lawyer)
- Full lawyer-side flow (match notification → accept → schedule → join)
- No-show flow (simulated by having one party not join)
- Post-consultation rating flow

### 9.4 Manual Tests (during pilot)

- Real matching with real cases and real lawyers
- Real consultation with real video/audio
- Real no-show detection
- Edge case: consultation runs over time (test the auto-end)
- Edge case: a lawyer's subscription lapses while they have a pending match

### 9.5 Security Tests (required)

- **Penetration test:** Attempt to access another user's case. Must fail.
- **Penetration test:** Attempt to join a consultation without authorization. Must fail.
- **Penetration test:** Attempt to view the citizen's identity as a lawyer before the consultation. Must fail at the API.
- **Determinism test:** Run the matching algorithm with the same inputs N times, verify the same outputs.
- **Code review:** Every change to the matching algorithm is reviewed by the Engineering Lead AND the Legal Director (because the algorithm is published and any change to the weights is a policy change).

### 9.6 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. For this module, the negative tests are especially important for:
- A user cannot access another user's case
- A lawyer cannot see the citizen's identity before the consultation
- A user cannot join a consultation they are not a participant in
- A user cannot rate a consultation they did not attend
- A user cannot create a second case while one is open

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `marketplace.module.enabled` | true | Disable the entire module |
| `marketplace.intake.enabled` | true | Disable new case intake |
| `marketplace.consultation.enabled` | true | Disable new consultation scheduling |
| `marketplace.video.enabled` | true | Disable video consultations (fall back to chat-only) |
| `marketplace.matching-algorithm.v2.enabled` | false | Toggle the next version of the algorithm (for A/B testing in Year 2) |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **Matching algorithm produces bad results:** The algorithm is deterministic, so the issue is usually a data issue. Roll back to a snapshot of the lawyer pool data, re-run the algorithm. If the algorithm itself is wrong, revert the code and re-run.
- **WebRTC service unreliable:** Disable `marketplace.video.enabled`. All consultations fall back to chat-only. The chat-only mode is always available and is the accessibility fallback.
- **No-show surge:** A pattern of no-shows (citizen or lawyer) triggers an investigation. The system may temporarily restrict new matches for the offending party.
- **Identity protection breach:** This is the catastrophic case. Take the marketplace offline. Audit the API. Notify the Board. Notify NDPC. Notify affected users.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Is WebRTC peer-to-peer sufficient, or do we need a TURN server for some connections? | Engineering Lead | Open — needs network testing |
| 2 | What is the right flat fee per completed consultation? (Operations finance model) | Finance | Open — pending Year 1 cost analysis |
| 3 | Should the lawyer see the citizen's identity at match time, or only at consultation time? (Current spec: consultation time.) | Product Lead + Legal | Open — recommend consultation time |
| 4 | Should the post-consultation rating be required or optional? | Product Lead | Open — recommend optional |
| 5 | What is the right consultation duration default? (15 or 20 minutes?) | Operations | Open — pilot data will inform |
| 6 | How do we handle a consultation that runs over time? (Current spec: auto-end at scheduled time.) | Product Lead | Open — recommend auto-end |
| 7 | Should the platform provide a "report no-show" flow for citizens? (Current spec: no-show is auto-detected.) | Product Lead | Open — recommend auto-detect only |
| 8 | Should we record consultations with explicit consent? (Current spec: no recording.) | Legal Director | Open — recommend no in pilot |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the matching algorithm's published criteria or the fee model require Legal Director sign-off.

---

## Appendix A: Glossary
- **LGA** — Local Government Area
- **NDPR** — Nigeria Data Protection Regulation
- **NDPC** — Nigeria Data Protection Commission
- **NBA** — Nigerian Bar Association
- **NGN** — Nigerian Naira
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SLA** — Service Level Agreement
- **TURN** — Traversal Using Relays around NAT (WebRTC relay server)
- **WebRTC** — Web Real-Time Communication (peer-to-peer video/audio)

## Appendix B: References
- [PRD.md §4.5 — Lawyer Marketplace](../product/PRD.md#45-lawyer-marketplace-pillar-3)
- [User Journeys.md §6 — J4 Citizen with a dispute gets matched to a lawyer](../product/User%20Journeys.md#6-j4--citizen-with-a-dispute-gets-matched-to-a-lawyer)
- [Personas.md §3.2 — Tunde, §3.3 — Ngozi](../product/Personas.md)
- [PLATFORM.md §5 — Lawyer Matching & Case Referral](../PLATFORM.md#5-lawyer-matching--case-referral)
- [PLATFORM.md §5.4 — Lawyer Matching](../PLATFORM.md#54-lawyer-matching) (the principles)
- [modules/Lawyer Onboarding & Verification.md](./Lawyer%20Onboarding%20%26%20Verification.md) — the peer module
- [Business Case §5.4 — Bar Association Fee-Splitting Constraint](../business/Business.md#54-bar-association-fee-splitting-constraint)
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers case intake, matching algorithm (transparent and explainable), match response, free consultation delivery, no-show handling, post-consultation rating, and the platform-funded lawyer compensation. 20 business rules, 17 edge cases, 50+ acceptance criteria. The matching algorithm's transparency (§3.1.1) and the engagement separation (§3.1.3) are the most important design decisions and require Legal Director sign-off. |