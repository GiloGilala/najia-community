# Module Spec — Lawyer Onboarding & Verification

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Bar Association liaison*
*Parent PRD: [PRD.md §4.5](../product/PRD.md#45-lawyer-marketplace-pillar-3)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: lawyer registration, identity verification handover from Auth module, bar license verification (manual), profile creation, subscription tier selection and payment, profile lifecycle, suspension/restoration. Out of scope: lawyer matching (separate module), in-app messaging, document automation, group practices (deferred to Year 2+).

---

## 1. Overview

### 1.1 Module Name

Lawyer Onboarding & Verification

### 1.2 Purpose

Enable verified lawyers to register on the platform, complete bar license verification, create a profile, select a subscription tier, and become visible in the lawyer marketplace. The module is the entry point for Pillar 3 (Lawyer Marketplace) and is the only path by which a user becomes a `lawyer` role. The module's primary design constraints are: (1) the **flat subscription model** — never a percentage of legal fees; (2) the **manual bar verification** — slow and careful, with a documented moderator check; and (3) the **profile ownership** — the lawyer controls their own profile, with a moderator review before it goes live.

### 1.3 In Scope

- Lawyer registration (with the "I am a lawyer" flag)
- Identity verification handover from the Auth module (NIMC/Onfido)
- Bar license submission (bar number, year of call, jurisdictions, practice areas)
- Bar license verification (manual, by a moderator, against the Body of Benchers public register)
- Lawyer profile creation (name, photo, bio, languages, fee structure, availability)
- Subscription tier selection (Basic / Enhanced / Premium) and payment via Paystack
- Profile review by a moderator before going live
- Lawyer profile lifecycle (DRAFT / PENDING_BAR / PENDING_REVIEW / ACTIVE / SUSPENDED)
- Suspension and restoration (admin action)
- Lawyer fee structure (flat listing/subscription, NOT a percentage of legal fees) — enforced in the data model
- Subscription management (renewal, cancellation, payment failure)
- Audit trail for all state changes and all verification steps
- RBAC role transition (`citizen` → `lawyer`) after successful bar verification and profile activation

### 1.4 Out of Scope

- **Lawyer matching** (intake form, 3–5 recommendations) — separate module
- **Free consultation scheduling and delivery** — separate module (in the Lawyer Matching & Consultation module)
- **Lawyer reviews** — separate module
- **In-app messaging with the client** — deferred to Year 2
- **Document automation or template library** — deferred
- **Group practices / firm accounts** — one account per lawyer; firm accounts are Year 2
- **Multi-lawyer case teams** — deferred
- **In-app case management** — lawyers have their own tools; the platform doesn't replace them
- **Hourly rate display in the lawyer profile** — only the fee structure (e.g., "₦50,000–₦100,000 per consultation") is shown; exact rates are between lawyer and client
- **Public lawyer ratings and reviews in the onboarding flow** — these are added by clients post-engagement, in the Lawyer Reviews module

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Lawyers onboarded and active | 5–10 | Count |
| Lawyer registration completion rate (started → ACTIVE) | ≥ 60% | Funnel analysis |
| Bar verification SLA | 95% within 3 business days | Moderation queue metrics |
| Profile review SLA | 95% within 24 hours after bar verification | Moderation queue metrics |
| Time from registration to ACTIVE (median) | ≤ 5 business days | Funnel analysis |
| Subscription payment success rate | ≥ 95% | Paystack metrics |
| Subscription renewal rate (after first month) | ≥ 80% | Billing metrics |
| Fee-model compliance: zero percentage-of-fees code | 100% | Code review + grep audit |
| Profile suspension rate | < 5% (suspended within 30 days of activation) | Admin metrics |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Verified citizen who is also a lawyer | Register as a lawyer | I can offer my services on the platform | Must |
| New lawyer | Submit my bar license details | My credentials can be verified | Must |
| New lawyer | See the status of my bar verification | I know where I am in the process | Must |
| New lawyer | Create my profile (bio, practice areas, fees, languages) | Clients can find me | Must |
| New lawyer | Select a subscription tier and pay | My profile goes live | Must |
| New lawyer | Understand that the platform takes a flat fee, not a percentage of legal fees | I can make an informed decision | Must |
| New lawyer | Be able to edit my profile after it goes live | I can keep it current | Should |
| New lawyer | Cancel my subscription | I can leave the platform | Must |
| Active lawyer | Renew my subscription each month | My profile stays live | Must |
| Active lawyer | Receive a notification before my subscription lapses | I don't lose my profile | Must |
| Active lawyer | See how many matches I've received | I can evaluate the value of the platform | Should |
| Moderator | View the bar verification queue | I can process pending applications | Must |
| Moderator | Approve or reject a bar verification | I can move the application forward | Must |
| Moderator | Review a profile before it goes live | I can ensure quality | Must |
| Moderator | Request changes to a profile | I can ensure it meets standards | Should |
| Admin | Suspend a lawyer | I can respond to misconduct | Must |
| Admin | Restore a suspended lawyer | I can lift a suspension | Must |
| Admin | Override a subscription status | I can handle edge cases (refunds, comped accounts) | Should |
| Admin | View the financial summary (lawyer revenue) | I can report to the Board | Must |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `lawyer_profiles` | `id`, `user_id`, `bar_number`, `year_of_call`, `jurisdictions` (JSON array), `practice_areas` (JSON array), `bio`, `photo_url`, `languages` (JSON array), `fee_structure` (JSON — see §3.1.2), `availability_hours` (JSON), `status` (DRAFT/PENDING_BAR/PENDING_REVIEW/ACTIVE/SUSPENDED), `suspension_reason` (nullable), `activated_at`, `created_at`, `updated_at` | The lawyer's profile |
| `bar_verifications` | `id`, `lawyer_profile_id`, `bar_number_submitted`, `bar_number_verified`, `verification_status` (PENDING/APPROVED/REJECTED), `verified_by` (moderator ID), `verified_at`, `verification_method` (PUBLIC_REGISTER / NBA_LIAISON / FAILED), `notes`, `evidence_url` (screenshot of public register, if used) | Audit trail of the bar check |
| `lawyer_subscriptions` | `id`, `lawyer_profile_id`, `tier` (BASIC/ENHANCED/PREMIUM), `status` (ACTIVE/PAST_DUE/CANCELLED/EXPIRED), `current_period_start`, `current_period_end`, `paystack_subscription_code`, `paystack_customer_code`, `created_at`, `cancelled_at` | Subscription state, synced with Paystack |
| `subscription_payments` | `id`, `lawyer_subscription_id`, `amount`, `currency` (NGN), `paystack_reference`, `paystack_status` (SUCCESS/FAILED/PENDING), `paid_at` | Payment audit trail |
| `lawyer_profile_history` | `id`, `lawyer_profile_id`, `changed_by`, `change_type`, `before` (JSON), `after` (JSON), `changed_at` | Full audit trail of profile changes (compliance requirement) |
| `audit_log` | cross-cutting | All state changes |

The `users` table is owned by the Auth module but is referenced here. A user has at most one `lawyer_profile`. The role transition is:
citizen (default)
│
│ lawyer registration + bar verification + profile activated
▼
lawyer

text


A user cannot revert to `citizen` after becoming a `lawyer`; they can only be suspended (which keeps the role but restricts access).

#### 3.1.1 The Fee Model — Enforced in the Data Model

The fee model is **flat subscription**, not a percentage of legal fees. This is enforced at multiple levels:

**In the data model:** The `lawyer_subscriptions` table has a `tier` field (BASIC/ENHANCED/PREMIUM) and a fixed monthly amount. The `lawyer_profiles` table has a `fee_structure` field that is the lawyer's *own* fee structure for clients (e.g., "₦50,000 per consultation"), not any relationship to the platform's revenue.

**In the service layer:** The subscription service does not have any field or method that takes a percentage of legal fees. The code is structured so that adding such a field would be a deliberate, visible change — not an accidental refactor.

**In the code review:** Every change to the subscription service or the lawyer profile service is reviewed by the Legal Director specifically for fee-model compliance.

**In the runtime:** A grep audit runs as a CI step that fails the build if any new code introduces a percentage-of-fees pattern. The grep pattern is documented in the engineering standards (forthcoming in Phase 4) and is required for the pilot.

The fee model commitment is not just a policy — it's an enforced property of the code.

#### 3.1.2 The `fee_structure` Field

The lawyer's own fee structure is a JSON object:

```json
{
  "consultation_fee": "₦50,000 - ₦100,000",
  "hourly_rate": "₦75,000",
  "accepts_pro_bono": true,
  "payment_methods": ["bank_transfer", "card"],
  "currency": "NGN"
}
This is the lawyer's representation of their fees to potential clients. It is not used for any platform billing. The platform's billing is the subscription tier, completely separate.

3.2 API Surface
Reference API.md. The endpoints this module owns:

Method	Path	Purpose	Auth	RBAC
POST	/api/lawyers/register	Start lawyer registration (sets the "I am a lawyer" flag)	Authenticated	lawyer:register
POST	/api/lawyers/me/bar-license	Submit bar license details	Authenticated	lawyer:register
GET	/api/lawyers/me/verification-status	Get the current verification status	Authenticated	lawyer:read (self)
PUT	/api/lawyers/me/profile	Update the lawyer profile (only when DRAFT or ACTIVE)	Authenticated	lawyer:update (self)
POST	/api/lawyers/me/profile/submit-for-review	Submit the profile for moderator review (after bar verified)	Authenticated	lawyer:update (self)
GET	/api/lawyers/me/subscription	Get subscription status	Authenticated	lawyer:read (self)
POST	/api/lawyers/me/subscription/subscribe	Subscribe to a tier (initiates Paystack checkout)	Authenticated	lawyer:update (self)
POST	/api/lawyers/me/subscription/cancel	Cancel the subscription	Authenticated	lawyer:update (self)
POST	/api/webhooks/paystack	Paystack webhook for subscription events	Webhook (signature verified)	—
GET	/api/lawyers/:lawyerId	Get a lawyer's public profile	Public	—
GET	/api/admin/lawyers/bar-verification-queue	Get the bar verification queue	Authenticated	admin:lawyers
POST	/api/admin/lawyers/:lawyerId/verify-bar	Approve or reject a bar verification	Authenticated	admin:lawyers
POST	/api/admin/lawyers/:lawyerId/review-profile	Approve or reject a profile	Authenticated	admin:lawyers
POST	/api/admin/lawyers/:lawyerId/suspend	Suspend a lawyer	Authenticated	admin:users
POST	/api/admin/lawyers/:lawyerId/restore	Restore a suspended lawyer	Authenticated	admin:users
POST	/api/admin/lawyers/:lawyerId/override-subscription	Override subscription status (admin only)	Authenticated	admin:system
GET	/api/admin/lawyers/revenue	Get the financial summary	Authenticated	admin:system
3.2.1 Server Functions (Web App)
Server Function	Purpose
lawyerRegisterAction	Start lawyer registration
lawyerSubmitBarAction	Submit bar license
lawyerProfileAction	Update the profile
lawyerSubscribeAction	Initiate subscription (calls Paystack)
lawyerCancelAction	Cancel subscription
adminBarVerifyAction	Approve/reject bar verification
adminProfileReviewAction	Approve/reject profile
3.3 Business Rules
A user can register as a lawyer only if they are verified as a citizen first (via the Auth module). Identity verification is the foundation.
A user can have at most one lawyer profile. Multiple profiles are not allowed.
The bar license must be verified before the profile is reviewed. The flow is sequential: register → identity verified (from Auth) → bar license submitted → bar verified (by moderator) → profile created → profile submitted for review → profile reviewed (by moderator) → profile ACTIVE.
The bar verification is manual. A moderator checks the bar number against the Body of Benchers public register (or contacts the NBA directly). There is no automated check.
The bar verification SLA is 3 business days. 95% of verifications are completed within this window.
The profile review SLA is 24 hours after the profile is submitted for review.
The fee model is flat subscription. No code path takes a percentage of legal fees. The CI grep enforces this.
Subscription tiers are fixed pricing: Basic ₦3,000/month, Enhanced ₦7,000/month, Premium ₦15,000/month (per Business Case §3.2.1). Prices are not negotiable in the pilot.
Payment is via Paystack. Other payment methods are out of scope for the pilot.
A subscription is required for the profile to be ACTIVE. Without an active subscription, the profile is SUSPENDED (billing-suspended, distinct from misconduct-suspended).
A subscription renews automatically each month via Paystack, unless cancelled.
A subscription payment failure puts the subscription in PAST_DUE state. The lawyer has a 7-day grace period to fix the payment before the profile is suspended.
Cancellation takes effect at the end of the current billing period. The lawyer keeps access until the period ends.
A lawyer can edit their profile at any time (after ACTIVE), but major changes (fee structure, practice areas) require a re-review.
Suspension for misconduct is by admin action only. A misconduct-suspension is distinct from a billing-suspension; both use the same SUSPENDED status but have different suspension_reason values.
All state changes are audit-logged. Every bar verification, every profile review, every subscription change, every suspension.
The lawyer's fee_structure is visible to the public; their bar number is also visible (for verification by clients).
A lawyer's name, photo, and practice areas are visible to the public. Other fields (email, phone, internal notes) are private.
3.4 State Machine
text

[Created via Auth module as citizen]
   │
   │  lawyer registration
   ▼
DRAFT (bar license not yet submitted)
   │
   │  bar license submitted
   ▼
PENDING_BAR
   │  moderator approves bar         │  moderator rejects bar
   ▼                                  ▼
PENDING_REVIEW (profile)          REJECTED (terminal for this application; can re-apply after 30 days)
   │  moderator approves profile    │  moderator requests changes
   │  + subscription ACTIVE         ▼
   │                            DRAFT (back; lawyer edits and re-submits)
   ▼
ACTIVE
   │  subscription payment fails (>7 days)        │  admin suspends (misconduct)
   │  OR subscription cancelled                  │
   ▼                                              ▼
SUSPENDED (billing or misconduct)
   │  payment fixed / subscription resumed
   │  OR admin restores
   ▼
ACTIVE (back)
Terminal states: REJECTED (terminal for the bar verification; the user can re-apply), SUSPENDED (transient; can be restored).

3.5 Subscription State Machine
The lawyer_subscriptions table has its own state machine:

text

NULL (no subscription yet)
   │
   │  lawyer subscribes
   ▼
ACTIVE
   │  payment fails                  │  lawyer cancels
   ▼                                  ▼
PAST_DUE                           CANCELLED (at period end)
   │  payment fixed within 7 days       │  period ends
   ▼                                    ▼
ACTIVE (back)                     EXPIRED (terminal)
   │
   │  period ends without renewal
   ▼
EXPIRED (terminal)
EXPIRED triggers lawyer_profiles.status = SUSPENDED with suspension_reason = 'billing'. The profile is hidden from public listings but the lawyer can log in and fix the payment.

3.6 Edge Cases and Error Handling
Scenario	Expected Behavior	Error Code
User not verified (citizen)	"You need to verify your identity before registering as a lawyer. [CTA: Verify now]"	VERIFICATION_REQUIRED (403)
User already has a lawyer profile	"You already have a lawyer profile. [Link to it]"	LAWYER_PROFILE_EXISTS (409)
Bar license submitted with invalid format	Inline error on the bar number field	INVALID_BAR_NUMBER_FORMAT (400)
Bar number already in use by another verified lawyer	"This bar number is already linked to another account. Please contact support if you believe this is an error."	BAR_NUMBER_ALREADY_LINKED (409)
Bar verification past 3-day SLA	The moderator is reminded; the lawyer is shown "Your verification is taking longer than expected. We're working on it."	(Operational)
Profile submitted with no practice areas	"Please select at least one practice area."	PRACTICE_AREAS_REQUIRED (422)
Profile submitted with no jurisdictions	"Please select at least one jurisdiction where you are licensed to practice."	JURISDICTIONS_REQUIRED (422)
Profile photo upload fails	"We couldn't upload your photo. Please try again or continue without a photo for now."	PHOTO_UPLOAD_FAILED (503)
Subscription payment fails	The lawyer is shown: "Your payment didn't go through. Please try again or use a different card."	PAYMENT_FAILED (402)
Subscription payment past 7-day grace	The profile is suspended; the lawyer is notified by email and in-app	(Operational)
Lawyer cancels during a free trial	N/A — no free trial in the pilot	—
Lawyer's bar license is suspended by the NBA	The platform does not automatically detect this; relies on admin action. If detected, the lawyer is suspended.	(Operational)
Paystack webhook delivery fails	The webhook is retried by Paystack (standard behavior). The platform's subscription state is reconciled on the next successful webhook or admin action.	(Operational)
Lawyer changes their name after activation	The name change is reflected in the profile, but the bar license still shows the old name. This is acceptable; the bar license is the authority.	—
Admin suspends a lawyer with active matches	The matches are cancelled; the citizens are notified. The lawyer is informed of the suspension reason.	(Operational)
Two lawyers submit the same bar number	The second submission is rejected with BAR_NUMBER_ALREADY_LINKED.	BAR_NUMBER_ALREADY_LINKED (409)
Subscription tier change (Basic → Enhanced)	The new tier takes effect immediately; the lawyer is charged the prorated difference (or the full new amount, depending on Paystack's behavior). The profile's tier field is updated.	—
Subscription tier change (Enhanced → Basic)	The new tier takes effect at the next billing period. The lawyer keeps Enhanced features until then.	—
4. Permissions
Reference RBAC.md. This module requires:

Permission	Roles	Notes
lawyer:register	citizen (verified)	A verified citizen can register as a lawyer
lawyer:read	lawyer (self), moderator, admin	The lawyer can read their own profile; moderators and admins can read all
lawyer:update	lawyer (self, own profile)	The lawyer can edit their own profile (with re-review for major changes)
lawyer:read:public	public (anonymous)	Anyone can read a public lawyer profile
lawyer:register:bar	admin, moderator	Moderators verify bar licenses
lawyer:review:profile	admin, moderator	Moderators review profiles before they go live
lawyer:suspend	admin	Admins suspend for misconduct
lawyer:restore	admin	Admins restore
admin:users	admin	General user management (overlaps with the Auth module)
admin:system	admin	System-level operations including subscription override
The lawyer role is assigned by this module after successful bar verification and profile activation. The Auth module handles the role assignment via a service call from this module.

5. User Experience
5.1 Key Screens
Reference UX & Design.md §3. The screens this module owns:

Screen #	Name	Persona	Login	Verified
23	Lawyer directory	All	No	No
24	Lawyer profile	All	No	No
30	Lawyer registration	Ngozi	Yes	Yes
31	Lawyer profile editor	Ngozi	Yes	Yes
32	Lawyer subscription tier selection	Ngozi	Yes	Yes
33	Lawyer match notification	Ngozi	Yes	Yes
34	Lawyer match accept/decline	Ngozi	Yes	Yes
5.2 User Flows
Reference User Journeys.md §7 for the J5 journey. This module implements the registration and profile creation phases of J5.

5.3 The Fee Model — UX Reinforcement
The flat subscription model is reinforced in the UI at every relevant moment:

Where	What the user sees
Lawyer registration landing	"Reach qualified clients. No percentage of your fees. Pro bono opportunities."
Subscription tier selection	"The platform takes a flat monthly fee. We never take a percentage of your legal fees."
Lawyer terms (TOS)	A clear, plain-language section: "Subscription Model. The platform charges a flat monthly subscription. We do not take any percentage of the fees you charge your clients, including consultation fees, hourly rates, or contingency fees. Your engagement with clients is independent of the platform after the free consultation."
After subscription	"Your subscription is active. You will be charged ₦3,000/month (Basic) until you cancel."
The Ngozi persona's trust baseline (per Personas §3.3) is skeptical of platforms that take a percentage of fees. The fee model must be clearly and repeatedly stated, not buried in the terms.

5.4 The Bar Verification Wait
Bar verification is manual and takes up to 3 business days. The UX must:

Set expectations early: "Bar verification is a manual check by our team. It usually takes 1–3 business days."
Show progress: a clear "Submitted → Under review → Approved/Rejected" status indicator.
Allow the lawyer to continue profile setup during the wait (the bar verification and profile creation can run in parallel after the bar license is submitted).
Send notifications when the status changes.
The Ngozi persona is busy. A lawyer who has to wait without clear progress will assume the platform is broken and may not return.

5.5 The Profile Editor
The profile editor has two modes:

During registration (DRAFT): All fields are editable. The lawyer builds the profile before submission.
After ACTIVE: Most fields are editable. Major fields (fee structure, practice areas, jurisdictions) trigger a re-review when changed. The lawyer is told which changes require re-review.
The re-review is a feature, not a bug: it ensures the public profile doesn't change silently in ways that would mislead clients.

5.6 Accessibility
Same standards as the Auth module. The subscription payment flow supports keyboard-only navigation and screen readers. The Paystack checkout is Paystack's hosted page, which is itself accessible; the platform ensures the redirect to and from Paystack is accessible.

5.7 The Ngozi Test (Module-Specific)
Beyond the general design principles:

Would Ngozi understand (1) that the platform does not take a percentage of her legal fees, (2) that bar verification is a manual process, and (3) that her profile changes (especially fees and practice areas) require a re-review?

If the answer to any of these is "no" — the design is not ready. Each of these is a trust question for the lawyer persona.

6. Non-Functional Requirements
Category	Requirement	Target
Performance	Lawyer registration API P95	< 500ms
Performance	Bar license submission API P95	< 300ms
Performance	Profile save API P95	< 500ms
Performance	Public lawyer profile load P95	< 300ms
Performance	Subscription checkout redirect	< 1s
Security	All PII encrypted at rest	Yes
Security	All API endpoints over TLS 1.3	Yes
Security	All connections over WireGuard	Yes
Security	Paystack webhook signature verification	Required; unsigned webhooks are rejected
Security	Bar number validation	Format check + uniqueness check
Security	Fee model compliance grep	Runs in CI; build fails if a percentage-of-fees pattern is introduced
Privacy	NDPR compliance	Full
Privacy	Bar verification evidence (screenshots of public register) is retained for audit but not shared	Yes
Reliability	Bar verification SLA	95% within 3 business days
Reliability	Profile review SLA	95% within 24 hours after bar verified
Reliability	Paystack webhook uptime	Per Paystack's SLA; reconciled on next successful webhook
Observability	Every state change logged	Yes
Observability	Every subscription change logged	Yes
Observability	Every Paystack webhook logged (with payload)	Yes
Observability	Alert on bar verification queue size > 10	Yes
Observability	Alert on subscription payment failure rate > 5%	Yes
7. Dependencies
Depends On	Type	Notes
Authentication & Identity Verification module	Internal	The user must be a verified citizen before they can register as a lawyer
RBAC module	Internal	Role transition and permission checks
Audit log module	Internal	All state changes
Cache layer (SQLite)	Internal	Lawyer profile cache (for fast public lookups)
Storage layer	Internal (shared with Evidence module)	Profile photos
Notification service	Internal	Bar verification status, subscription reminders, suspension notifications
Paystack	External	Subscription billing
Body of Benchers public register	External (manual)	Bar verification source
NBA (Nigerian Bar Association)	External (manual)	Optional direct liaison for ambiguous cases
Postgres + Drizzle ORM	Internal	Primary database
If Paystack is unavailable at pilot launch, the module ships with manual subscription tracking (admin records payment manually). The architecture supports this; the subscription state machine already has admin override capability.

8. Acceptance Criteria
Testable checklist. Every item must be verifiable before the pilot launches.

8.1 Registration and Identity
 A verified citizen can register as a lawyer
 An unverified user cannot register as a lawyer; they see a CTA to verify
 A user cannot have more than one lawyer profile
 The "I am a lawyer" flag is recorded in the user record
8.2 Bar License
 A lawyer can submit bar number, year of call, jurisdictions, and practice areas
 An invalid bar number format is rejected
 A bar number already linked to another lawyer is rejected
 The bar license appears in the moderator's verification queue within 60 seconds
 95% of bar verifications are completed within 3 business days
 The bar verification status is visible to the lawyer at all times
 A rejected bar verification is clearly explained to the lawyer
 A lawyer can re-apply 30 days after a rejection
8.3 Profile
 A lawyer can create a profile with bio, photo, languages, fee structure, availability
 A profile cannot be submitted with no practice areas
 A profile cannot be submitted with no jurisdictions
 The profile appears in the moderator's review queue within 60 seconds of submission
 95% of profile reviews are completed within 24 hours
 A lawyer can edit their profile after activation
 Major changes (fee structure, practice areas, jurisdictions) trigger a re-review
 The re-review SLA is the same as the initial review (24 hours)
8.4 Subscription and Payment
 A lawyer can select Basic, Enhanced, or Premium
 Tier prices are ₦3,000, ₦7,000, ₦15,000 per month respectively
 The payment redirects to Paystack's hosted checkout
 The Paystack webhook is signature-verified
 A successful payment activates the subscription
 A failed payment is reported to the lawyer with a retry option
 A subscription past 7-day grace is suspended (billing-suspension)
 A lawyer can cancel their subscription
 Cancellation takes effect at the end of the current period
 A lawyer can change tiers (upgrade immediate, downgrade at period end)
8.5 Fee Model Compliance
 The grep audit runs in CI and fails the build if any new percentage-of-fees pattern is introduced
 The subscription service has no method or field that takes a percentage of legal fees
 The lawyer terms explicitly state the flat subscription model
 The subscription tier selection screen shows the flat subscription model explanation
 The Legal Director has reviewed the fee model code
8.6 RBAC and Lifecycle
 A user is assigned the lawyer role only after successful bar verification AND profile activation
 A suspended lawyer cannot be matched to new cases
 A suspended lawyer's profile is hidden from public listings
 A suspended lawyer can log in to fix billing issues
 An admin can restore a suspended lawyer
 An admin's suspension includes a written reason
 All state transitions are audit-logged
 The role transition from citizen to lawyer is audit-logged
8.7 Security
 All API endpoints over TLS 1.3
 All connections over WireGuard
 Paystack webhook signature verified
 Rate limit: 5 registration attempts per user per hour
 Rate limit: 10 profile updates per user per hour
 Bar number never in URLs
 No PII in production INFO logs
8.8 Operational
 Health check includes lawyer module status
 Health check includes Paystack webhook endpoint status
 Alert on bar verification queue > 10
 Alert on profile review queue > 10
 Alert on subscription payment failure rate > 5%
 Alert on Paystack webhook delivery failures
 Runbook exists for "Paystack is down" (manual subscription tracking)
 Runbook exists for "lawyer disputes a suspension" (escalation to Legal Director)
 Runbook exists for "bar verification dispute" (NBA liaison)
9. Test Plan Summary
Reference QA.md (forthcoming). This module's test focus:

9.1 Unit Tests
lawyer.service.ts — registration, profile lifecycle, state transitions
bar-verification.service.ts — submission, moderator decision, rejection
subscription.service.ts — tier management, payment, cancellation
lawyer.fee-model.ts — the grep-able compliance code (this is a separate test target)
lawyer.audit.ts — audit log entries for every state change
Coverage target: ≥ 90% on the fee-model compliance code; ≥ 85% on the rest.

9.2 Integration Tests
Full flow: register → identity verified → bar submitted → bar approved → profile created → profile approved → subscription paid → ACTIVE
Bar rejected → lawyer re-applies after 30 days
Profile submitted without practice areas → rejected
Subscription payment success → ACTIVE
Subscription payment failure → PAST_DUE → 7 days → SUSPENDED → payment fixed → ACTIVE
Paystack webhook delivery → subscription state reconciled
Subscription cancellation → ACTIVE until period end → EXPIRED → SUSPENDED
Admin suspends → lawyer cannot log in (or can log in but cannot be matched)
Admin restores → ACTIVE
Major profile change → re-review required
9.3 E2E Tests
Full J5 journey (lawyer registers and gets the first match) — see User Journeys.md §7
Bar verification flow with a real moderator
Subscription payment with Paystack test mode
Suspension and restoration flow
9.4 Manual Tests (during pilot)
Real bar verification with real bar numbers (using test lawyers)
Real Paystack transactions
Real lawyer onboarding with real lawyers
Edge case: lawyer's bar license is suspended by the NBA mid-pilot (test the admin response)
9.5 Security Tests (required)
Penetration test: Attempt to access another lawyer's profile (must fail).
Penetration test: Attempt to bypass bar verification (must fail).
Penetration test: Attempt to forge a Paystack webhook (must fail at signature verification).
Code review: Every change to the subscription service is reviewed by the Legal Director for fee-model compliance.
CI audit: The grep audit must pass on every PR that touches the subscription service.
9.6 The "Negative Test" Rule
For every "lawyer can do X" test, there must be a matching "lawyer cannot do X" test. The negative tests are especially important for the fee model and the suspension flows.

10. Rollout Plan
10.1 Feature Flags
Flag	Default	Purpose
lawyers.module.enabled	true	Disable the entire module
lawyers.registration.enabled	true	Disable new registrations
lawyers.marketplace.enabled	true	Hide the lawyer directory from citizens (rare; for legal hold)
lawyers.subscription-payment.enabled	true	Disable new payments (e.g., Paystack down)
lawyers.profile-re-review.required	true	Toggle the re-review requirement for major changes
10.2 Migration (if applicable)
Not applicable — greenfield module.

10.3 Rollback Plan
Paystack outage: Disable lawyers.subscription-payment.enabled. Admin records payments manually. Subscription state is reconciled when Paystack returns.
Fee model compliance violation discovered: The build fails in CI. The PR is blocked. The Legal Director is notified.
Suspension escalation: A suspended lawyer who escalates to the Legal Director is reviewed; the decision is documented.
Bar verification dispute: A lawyer disputes a bar verification rejection. The Legal Director reviews; the NBA is contacted if necessary.
11. Open Questions
#	Question	Owner	Status
1	Is the Body of Benchers public register sufficient for bar verification, or do we need direct NBA API access?	Legal Director	Open — engagement in progress
2	Should we offer a free trial in the pilot?	Product Lead + Finance	Open — recommend no for pilot; deferred to Year 2
3	What is the right suspension reason taxonomy?	Legal Director	Open — needs policy
4	Should the public lawyer profile include a "verified by" badge with the bar number?	Product Lead	Open — recommend yes for trust
5	What happens to a lawyer's matches if they cancel their subscription mid-engagement?	Legal Director	Open — needs policy
6	Should we support Paystack's "manage subscription" portal, or build our own?	Engineering	Open — recommend Paystack portal for pilot
7	How do we handle a subscription payment in a currency other than NGN?	Engineering + Finance	Open — recommend NGN only in pilot
Resolved questions move to the Decision Log. Decisions that affect the fee model or the Bar Association compliance require Legal Director sign-off.

Appendix A: Glossary
NBA — Nigerian Bar Association
NGN — Nigerian Naira
NDPR — Nigeria Data Protection Regulation
PAY — Paystack payment gateway
PII — Personally Identifiable Information
RBAC — Role-Based Access Control
SLA — Service Level Agreement
TOS — Terms of Service
Appendix B: References
PRD.md §4.5 — Lawyer Marketplace
User Journeys.md §7 — J5 Lawyer registers and gets the first match
Personas.md §3.3 — Ngozi
PLATFORM.md §5 — Lawyer Matching & Case Referral
PLATFORM.md §5.2.3 — Fee Structure (the flat subscription model)
Business Case §5.4 — Bar Association Fee-Splitting Constraint
ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements
RBAC.md (forthcoming in Phase 4)
Decision Log
Appendix C: Module Spec Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead	Initial draft. Covers lawyer registration, bar verification (manual), profile lifecycle, subscription via Paystack, fee-model compliance (enforced in code + CI grep), and the lawyer role transition. 18 business rules, 16 edge cases, 50+ acceptance criteria. The fee-model compliance grep is the most important technical decision — it makes the Bar Association constraint a build-time property, not a policy.