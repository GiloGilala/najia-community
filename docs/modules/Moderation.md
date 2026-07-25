# Module Spec — Moderation

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Operations Director, Moderation Lead*
*Parent PRD: [PRD.md §4.7](../product/PRD.md#47-moderation)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: unified moderation queue, AI-assisted flagging, specialized workflows (Evidence, Policy Polls, Lawyer Reviews, user-generated content), moderator roles and permissions, appeals, Grievance Committee escalation, moderation audit trail. Out of scope: AI training interface (engineering team handles model updates), content management system for the blog (Blog Editor role, separate module), external moderation services.

---

## 1. Overview

### 1.1 Module Name

Moderation

### 1.2 Purpose

Provide the operational backbone for content and case moderation across the platform. The module is the unified system through which moderators (the Kemi persona) review flagged content, approve or remove it, and handle appeals. It is the consumer of three specialized queues (Evidence AI flags, Policy Polls Advisory Board reviews, Lawyer Reviews) and also handles standalone user-generated content (comments, profile content, case descriptions). The module's primary design constraints are: (1) **consistency** — the same content gets the same decision across moderators; (2) **speed** — the SLA is tight (24 hours for most queues) because content is time-sensitive; (3) **fairness** — every decision can be appealed and goes to a different reviewer.

### 1.3 In Scope

- Unified moderation queue UI (with queue-type filters)
- AI-assisted flagging (with confidence scores and model version)
- Specialized workflows for:
  - Evidence (AI-flagged files: approve / restrict / remove)
  - Policy Polls (Advisory Board: approve / reject / request changes)
  - Lawyer Reviews (approve / edit / remove)
  - User-generated content (comments, profile content, case descriptions: approve / remove / warn)
- Moderator roles (Content Moderator, Poll Moderator, AI Reviewer, Blog Editor) — defined in [PLATFORM.md §8.4](../PLATFORM.md#84-moderator-roles)
- Moderation actions: approve, remove, edit, warn, suspend
- Appeals flow (with reviewer reassignment)
- Grievance Committee escalation (for account-level decisions)
- Moderation audit trail (all actions logged)
- Moderation metrics (queue sizes, SLA compliance, decision distributions)
- Moderator workload balancing (queue distribution)
- RBAC for moderation actions

### 1.4 Out of Scope

- **AI training interface** — the Engineering team handles model updates. Moderators don't retrain the AI; they validate its decisions.
- **Blog content management** — the Blog Editor role handles blog posts and legal literacy modules (separate module).
- **Advisory Board membership management** — the Project Lead manages AB composition (the AB is not "moderation" in the workflow sense; it's a governance body). The AB's review actions are exposed via this module's interface, but AB membership is managed elsewhere.
- **Grievance Committee membership management** — the Legal Director manages GC composition. The GC's review actions are exposed via this module's interface.
- **External moderation services** — all moderation is in-house in the pilot.
- **User-initiated content takedown requests** (e.g., "this content is about me, take it down") — handled as a separate compliance flow, deferred to Year 2.
- **Automated content removal** — every action requires a human decision. AI flags are reviewed by humans before any action is taken.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Moderation queue SLA compliance | ≥ 95% within target time per queue | Audit log |
| Moderator decision consistency | ≥ 85% inter-moderator agreement on test cases | Quarterly test |
| Appeal rate | ≤ 10% of moderation decisions | Audit log |
| Appeal success rate (appeal granted) | ≤ 30% of appeals (most decisions stand) | Audit log |
| Grievance Committee escalation rate | ≤ 5% of appeals | Audit log |
| Time to first moderation action (median) | ≤ 4 hours | Audit log |
| Time to appeal decision (median) | ≤ 48 hours | Audit log |
| Moderator workload balance (no moderator > 2x the average) | Yes | Workload metrics |
| AI false positive rate (per queue) | < 10% (per platform spec) | Audit log |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Moderator (Content) | See the unified queue with queue-type filters | I can focus on my specialty | Must |
| Moderator (Content) | See AI confidence scores and model version | I can make informed decisions | Must |
| Moderator (Content) | Approve, remove, or edit flagged content | I can enforce the moderation policy | Must |
| Moderator (Content) | Add a note to my decision | I can document my reasoning | Must |
| Moderator (Poll) | Review a poll draft | I can approve or request changes | Must |
| Moderator (AI Reviewer) | Review a High AI confidence flag on evidence | I can decide if the file is manipulated | Must |
| Moderator (Blog Editor) | Review blog content before publication | I can ensure quality and legality | Must |
| Senior Moderator | Reassign a moderation action to another moderator | I can handle conflicts of interest | Must |
| Senior Moderator | Review appealed decisions | I can ensure consistency | Must |
| Admin | View moderation pipeline metrics | I can monitor the system | Must |
| Admin | Suspend a user (account-level action) | I can respond to abuse | Must |
| Citizen | Receive a clear explanation of any moderation action against me | I understand what happened | Must |
| Citizen | Appeal a moderation decision | I can challenge a wrong decision | Must |
| Citizen | Escalate an account-level decision to the Grievance Committee | I have a final review path | Should |
| User (any) | Report content that violates the policy | The platform can review it | Must |
| User (any) | See the status of my reports | I know if action was taken | Should |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `moderation_queue_items` | `id`, `queue_type` (EVIDENCE_AI / POLICY_DRAFT / LAWYER_REVIEW / UGC_COMMENT / UGC_PROFILE / UGC_CASE), `target_type` (the type of the moderated object), `target_id` (the ID of the moderated object), `priority` (LOW / MEDIUM / HIGH / URGENT), `status` (PENDING / IN_REVIEW / DECIDED / APPEALED), `assigned_to` (moderator ID, nullable), `assigned_at`, `ai_confidence` (nullable, for AI-flagged items), `ai_model_version` (nullable), `ai_category` (nullable, LOW/MEDIUM/HIGH), `created_at`, `decided_at` | The unified queue |
| `moderation_decisions` | `id`, `queue_item_id`, `moderator_id`, `action` (APPROVE / REMOVE / EDIT / WARN / SUSPEND / RESTRICT / REQUEST_CHANGES), `reason` (the standard reason code), `notes` (free text), `before_state` (JSON, the state before the action), `after_state` (JSON, the state after the action), `decided_at` | The decision record |
| `moderation_appeals` | `id`, `queue_item_id`, `original_decision_id`, `appellant_id`, `appeal_text` (≤ 1000 chars), `status` (PENDING / APPROVED / DENIED / ESCALATED), `assigned_to` (senior moderator, nullable), `decided_at`, `decision_notes` | Appeal records |
| `user_reports` | `id`, `reporter_id`, `target_type`, `target_id`, `reason` (the standard report reason), `description` (≤ 500 chars), `status` (PENDING / UNDER_REVIEW / ACTION_TAKEN / NO_ACTION), `created_at`, `decided_at` | User-submitted reports |
| `user_warnings` | `id`, `user_id`, `moderator_id`, `reason`, `issued_at`, `expires_at` (warnings can be time-limited) | Warnings issued to users |
| `user_suspensions` | `id`, `user_id`, `moderator_id` (or admin), `reason`, `suspension_type` (CONTENT / ACCOUNT), `started_at`, `ends_at` (nullable for permanent), `lifted_at` (nullable), `lifted_by` (nullable) | Account-level suspensions |
| `grievance_committee_reviews` | `id`, `appeal_id`, `committee_member_ids` (JSON array), `decision` (UPHOLD / OVERTURN), `decision_notes`, `decided_at` | Grievance Committee decisions |
| `audit_log` | cross-cutting | All moderation actions |

The unified queue is the entry point for all moderation work. Each queue type has specialized state machines and decision options, but they all flow through the same `moderation_queue_items` table.

#### 3.1.1 Queue Type Specialization

Each queue type has a different action set and SLA:

| Queue type | Actions | SLA | Notes |
|------------|---------|-----|-------|
| **EVIDENCE_AI** | APPROVE / RESTRICT / REMOVE | 24 hours | AI-flagged files (High confidence only) |
| **POLICY_DRAFT** | APPROVE / REJECT / REQUEST_CHANGES | 7 days | Advisory Board reviews of poll drafts |
| **LAWYER_REVIEW** | APPROVE / EDIT / REMOVE | 24 hours | Citizen-submitted lawyer reviews |
| **UGC_COMMENT** | APPROVE / REMOVE / WARN | 24 hours | User-submitted comments (blog, etc.) |
| **UGC_PROFILE** | APPROVE / REMOVE / WARN | 24 hours | User profile content (bio, etc.) |
| **UGC_CASE** | APPROVE / REMOVE / WARN | 24 hours | Case descriptions in the lawyer intake |

The action set is enforced at the API level: a moderator cannot apply a `REQUEST_CHANGES` action to a `LAWYER_REVIEW` (it doesn't make sense).

#### 3.1.2 Priority and Workload Balancing

Queue items have a priority based on:

- **AI confidence** (for AI-flagged items): HIGH confidence → HIGH priority
- **User reports** (for reported content): the report count escalates priority
- **Time in queue**: items in the queue > 12 hours are auto-escalated to MEDIUM; > 24 hours to HIGH
- **Content type**: account-level actions are always HIGH priority
- **Manual flagging**: admins can manually escalate priority

Workload balancing: when a moderator picks up a queue item, it is assigned to them. The system monitors the per-moderator workload and warns when a moderator has > 2x the average load. This is a soft warning, not a hard cap — moderators are professionals and can self-regulate.

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/admin/moderation/queue` | Get the unified queue (filterable) | Authenticated | `admin:moderation` |
| `GET` | `/api/admin/moderation/queue/:itemId` | Get a queue item detail | Authenticated | `admin:moderation` |
| `POST` | `/api/admin/moderation/queue/:itemId/assign` | Assign a queue item to the current moderator | Authenticated | `admin:moderation` |
| `POST` | `/api/admin/moderation/queue/:itemId/decide` | Make a moderation decision | Authenticated | `admin:moderation` (and queue-type-specific permission) |
| `GET` | `/api/admin/moderation/decisions` | List recent decisions (for audit) | Authenticated | `admin:moderation` |
| `GET` | `/api/admin/moderation/appeals` | List pending appeals | Authenticated | `admin:moderation` (senior) |
| `POST` | `/api/admin/moderation/appeals/:appealId/decide` | Decide an appeal | Authenticated | `admin:moderation` (senior) |
| `POST` | `/api/admin/moderation/appeals/:appealId/escalate` | Escalate to Grievance Committee | Authenticated | `admin:moderation` (senior) |
| `GET` | `/api/admin/moderation/grievance-queue` | List Grievance Committee reviews | Authenticated | `admin:grievance` |
| `POST` | `/api/admin/moderation/grievance/:reviewId/decide` | Decide a Grievance Committee review | Authenticated | `admin:grievance` |
| `POST` | `/api/users/:userId/suspend` | Suspend a user (account-level) | Authenticated | `admin:users` |
| `POST` | `/api/users/:userId/restore` | Restore a suspended user | Authenticated | `admin:users` |
| `POST` | `/api/users/:userId/warn` | Issue a warning to a user | Authenticated | `admin:moderation` |
| `POST` | `/api/reports` | Submit a user report | Authenticated | (any verified user) |
| `GET` | `/api/reports/me` | List the current user's reports | Authenticated | (self) |
| `GET` | `/api/admin/moderation/metrics` | Get moderation pipeline metrics | Authenticated | `admin:system` |
| `GET` | `/api/admin/moderation/workload` | Get per-moderator workload | Authenticated | `admin:system` |

#### 3.2.1 Webhook-Style Ingestion

The other modules feed into the moderation queue via internal service calls, not HTTP webhooks. The interface is:

```typescript
// In another module's service:
await moderationService.enqueue({
  queueType: 'EVIDENCE_AI',
  targetType: 'Evidence',
  targetId: evidence.id,
  priority: 'HIGH', // because AI confidence is HIGH
  aiConfidence: 0.85,
  aiModelVersion: 'ensemble-v1.2.0',
  aiCategory: 'HIGH',
});
This is the contract: any module can enqueue a moderation item by providing the queue type, target, priority, and any AI metadata. The Moderation module handles the rest.

3.3 Business Rules
Every moderation action requires a moderator identity and a reason. The action is tied to the moderator; the reason is one of a standard set (defined in the moderation policy).
A moderator cannot decide on a queue item they previously decided on at a lower level (e.g., a moderator who approved a piece of content cannot also decide on the appeal; the appeal goes to a different moderator).
The same moderator cannot both warn a user and then decide on the user's appeal. The appeal is reassigned automatically.
Appeals have a 30-day window from the original decision.
The appeal reviewer must be a different moderator than the original. This is enforced at the queue level.
A second appeal (after the first appeal is denied) escalates to the Grievance Committee. The GC is the final review.
The Grievance Committee's decision is final. No further escalation within the platform.
Account-level suspensions can be appealed through the same flow (30-day window, Grievance Committee escalation). The GC's decision is final.
All moderation actions are audit-logged with the moderator, action, reason, and before/after state.
AI-flagged content is reviewed by a human before any action is taken. The AI does not auto-remove; it only flags.
The AI confidence score is shown to the moderator with the model version, so the moderator knows how much to trust the flag.
A moderator can request a second opinion (assign the item to another moderator for review). This is for ambiguous cases.
The moderation queue respects the SLA per queue type (24 hours for most, 7 days for poll drafts).
The workload balancing warns moderators at > 2x average load but does not enforce a cap.
User reports are processed by the same moderation system — a report creates a queue item.
The moderation policy is documented in a separate document (forthcoming) and is referenced in the UI. The moderator can access the policy from any queue item.
3.4 State Machine — Queue Item
text

PENDING
  │  moderator picks up
  ▼
IN_REVIEW
  │  moderator decides         │  moderator requests second opinion
  ├────────────────────────────┤
  ▼                            ▼
DECIDED                    IN_REVIEW (assigned to different moderator)
  │  appellant appeals
  ▼
APPEALED
  │  appeal decided
  ├──────────────────────────────┐
  ▼                              ▼
DECIDED (original upheld)    DECIDED (original overturned)
  │  appellant escalates to GC
  ▼
ESCALATED_TO_GC
  │  GC decides
  ▼
GC_DECIDED (final, terminal)
3.5 Specialization — Evidence AI Workflow
The Evidence AI workflow has a specific decision flow:

Evidence with HIGH AI confidence is enqueued
Moderator sees: the file, the AI confidence score, the model version, the detection methods used
Moderator decides: APPROVE (file goes ACTIVE), RESTRICT (file goes RESTRICTED, visible only to uploader and assigned lawyer), or REMOVE (file goes REMOVED)
The decision is recorded with the moderator's notes
The user is notified
The user can appeal (via the standard appeals flow)
The moderator is reviewing the AI's decision, not making an independent AI assessment. If the moderator disagrees with the AI (e.g., the file is flagged but the moderator thinks it's authentic), the moderator can APPROVE with notes explaining the disagreement. This is the AI learning signal for future model updates.

3.6 Specialization — Policy Polls Advisory Board Workflow
The Policy Polls workflow is the Advisory Board review:

A moderator submits a poll draft for review
The poll is enqueued with queue_type = POLICY_DRAFT
An Advisory Board member picks it up (assigned to the AB member, not a moderator)
The AB member decides: APPROVE (poll goes APPROVED), REJECT (poll goes REJECTED), or REQUEST_CHANGES (poll goes back to DRAFT)
The decision is recorded with the AB member's notes
The moderator (who submitted the draft) is notified
Note: Advisory Board members have a special role (advisory_board) and a specific permission (advisory:review). They are not standard moderators. The queue UI for them is filtered to show only POLICY_DRAFT items.

3.7 Specialization — Lawyer Reviews Workflow
The Lawyer Reviews workflow:

A citizen submits a review
The review is enqueued with queue_type = LAWYER_REVIEW
A moderator picks it up
The moderator decides: APPROVE (review goes APPROVED → PUBLISHED), EDIT (review is edited to remove defamatory content, then APPROVED), or REMOVE (review goes REMOVED)
The decision is recorded with the moderator's notes
The citizen is notified; the lawyer is notified on approval
The citizen can appeal (via the standard appeals flow)
The EDIT action is rare and reserved for defamation. The original text is preserved in the audit log; the edited version is shown publicly.

3.8 Specialization — User-Generated Content Workflow
The UGC workflow handles comments, profile content, and case descriptions:

A user submits content (or AI flags it, or a user reports it)
The content is enqueued with the appropriate queue_type
A moderator picks it up
The moderator decides: APPROVE (content stays), REMOVE (content is removed), or WARN (user is warned but content stays; the warning is recorded)
The decision is recorded
The user is notified
Warnings are time-limited (configurable per warning, default 90 days). After the warning expires, it's no longer visible to the user. Accumulated warnings can trigger account-level review.

3.9 Edge Cases and Error Handling
Scenario	Expected Behavior	Error Code
Moderator tries to decide on a queue item already decided	"This item has already been decided. [View decision]"	ALREADY_DECIDED (409)
Moderator tries to decide on a queue item assigned to another moderator	"This item is assigned to another moderator."	NOT_ASSIGNED (403)
Moderator tries to apply an action that doesn't apply to the queue type	"This action is not valid for this queue type."	INVALID_ACTION_FOR_QUEUE (422)
Appeal submitted after 30-day window	"The appeal window for this decision has closed."	APPEAL_WINDOW_CLOSED (422)
Appeal submitted by a user who is not the original target	"You can only appeal decisions about your own content."	APPEAL_NOT_AUTHORIZED (403)
Second appeal submitted (first was denied)	"This decision has been appealed. You can escalate to the Grievance Committee."	SECOND_APPEAL_NOT_ALLOWED (422) — directs to GC escalation
GC member tries to decide a non-GC review	"This review is not in the Grievance Committee queue."	NOT_GC_QUEUE (403)
AI confidence score missing for an AI-flagged item	"This item is missing AI metadata. The engineering team has been notified."	MISSING_AI_METADATA (500)
Queue item has been pending > SLA	Auto-escalated priority; alert fired to senior moderator	(Operational)
Moderator workload > 2x average	Warning shown to moderator; suggestion to defer new items	(Operational)
User submits a report about themselves	"You cannot report your own content."	SELF_REPORT_NOT_ALLOWED (422)
User submits the same report multiple times for the same content	"You've already reported this content."	DUPLICATE_REPORT (409)
Suspension appeal is denied, user tries to escalate	Grievance Committee escalation flow is initiated	—
Account is suspended, user tries to log in	"Your account is suspended. [Appeal link]"	ACCOUNT_SUSPENDED (403)
Account is suspended, user tries to appeal a different decision	"Your account is suspended. Please resolve the suspension before appealing other decisions."	ACCOUNT_SUSPENDED (403)
4. Permissions
Reference RBAC.md. This module requires:

Permission	Roles	Notes
admin:moderation	moderator, admin	Access to the unified moderation queue
admin:moderation:senior	senior_moderator, admin	Access to appeals, can reassign, can override
admin:moderation:evidence	moderator (with ai_reviewer sub-role), admin	Can decide on EVIDENCE_AI queue items
admin:moderation:polls	moderator (with poll_moderator sub-role), admin	Can decide on POLICY_DRAFT queue items (in addition to Advisory Board)
admin:moderation:reviews	moderator (with content_moderator sub-role), admin	Can decide on LAWYER_REVIEW queue items
admin:moderation:ugc	moderator (with content_moderator sub-role), admin	Can decide on UGC queue items
advisory:review	advisory_board, admin	Can decide on POLICY_DRAFT items as an AB member
admin:grievance	grievance_committee, admin	Can decide on Grievance Committee reviews
admin:users	admin	Can suspend, restore, warn users
admin:users:warn	moderator, admin	Can issue warnings (not full suspensions)
admin:system	admin	Access to metrics, workload, configuration
The moderator role has sub-roles (defined in the platform spec) that determine which queue types they can access:

content_moderator — UGC, LAWYER_REVIEW
poll_moderator — POLICY_DRAFT
ai_reviewer — EVIDENCE_AI
blog_editor — blog content (handled in a separate module)
A moderator can have multiple sub-roles. The most common is content_moderator (the default).

5. User Experience
5.1 Key Screens
The moderation UI is a separate shell from the user-facing app. The screens this module owns:

Screen	Name	Persona	Login	Verified
46	Moderation queue (admin)	Kemi	Yes	Yes (staff)
(detail)	Queue item detail	Kemi	Yes	Yes (staff)
(form)	Decision form	Kemi	Yes	Yes (staff)
(list)	Appeals queue	Senior Kemi	Yes	Yes (staff)
(form)	Appeal decision	Senior Kemi	Yes	Yes (staff)
(list)	Grievance Committee queue	GC member	Yes	Yes (staff)
(dashboard)	Moderation metrics	Admin	Yes	Yes (staff)
5.2 The Unified Queue
The moderation queue is a single screen with filters:

text

[Filter: Queue Type ▼] [Priority ▼] [Assigned to me ☐] [Search...]

| ID | Type | Priority | Target | Age | Assigned | Status |
| EAI-1234 | Evidence AI | HIGH | File: image.jpg | 2h | Kemi | IN_REVIEW |
| LR-5678 | Lawyer Review | MED | Review: ★★★★☆ | 8h | — | PENDING |
| PD-9012 | Poll Draft | MED | "Should Nigeria adopt..." | 1d | — | PENDING |
| UGC-3456 | UGC Comment | LOW | "This is a great post" | 12h | — | PENDING |
The queue updates in real-time (WebSocket or polling every 30s). The moderator can click any item to see the detail and decide.

5.3 The Queue Item Detail
The detail view shows:

The target content (file, draft, review, comment) — full context
The AI metadata (if applicable): confidence score, model version, methods used
The user reports (if any): count, reasons
The history (if any): previous decisions, appeals
The moderation policy (linked, always one click away)
The action buttons (APPROVE, REMOVE, EDIT, etc.) — only the valid actions for the queue type
The reason dropdown (standard reasons from the policy)
The notes field (free text)
text

[Target Content]
[File: image.jpg] [Hash: 9e107d9d...] [Size: 2.3MB] [Type: image/jpeg]

[AI Metadata]
Confidence: 0.87 (HIGH) | Model: ensemble-v1.2.0 | Methods: metadata, visual, facial

[User Reports]
None

[History]
First time in queue

[Moderation Policy ↗]

[Action ▼]  [Reason ▼]  [Notes: ____________]  [Submit Decision]
5.4 The Appeals Queue
The appeals queue is similar but filtered to APPEALED status. Each item shows:

The original decision (who, when, what)
The original content
The appeal text (from the appellant)
The decision buttons: UPHOLD ORIGINAL or OVERTURN
The appeals reviewer must be a different moderator than the original. This is enforced at the queue level (the appeals queue only shows items not assigned to the current moderator if they decided the original).

5.5 The Grievance Committee Review
The GC review is similar to the appeals queue but with GC members. The GC's decision is final. The GC review includes:

The original decision
The appeal decision (if any)
The appeal text
The appellant's additional context (if any)
The decision buttons: UPHOLD or OVERTURN (with mandatory written reasoning)
5.6 User-Facing Notifications
Users receive clear notifications for every moderation action:

text

Subject: Your content was removed

Hi Tunde,

Your comment on "How to Vote in Policy Polls" was removed because it contained personal attacks, which violates our moderation policy.

Removed text:
"[The removed text]"

You can appeal this decision within 30 days.

[Appeal this decision]

If you have questions, contact support.
The notification includes:

What was removed
Why (in plain language)
The policy reference
The appeal path
A link to the full decision record (for transparency)
5.7 The Kemi Test (Module-Specific)
Beyond the general design principles:

Would Kemi be able to (1) decide consistently across moderators, (2) meet the SLA without rushing, and (3) document her reasoning in a way that survives an appeal?

If the answer to any of these is "no" — the design is not ready. Consistency is the most important property; the UI must support it via the moderation policy, the standard reason codes, and the notes field.

6. Non-Functional Requirements
Category	Requirement	Target
Performance	Queue load P95	< 500ms
Performance	Queue item detail load P95	< 1s (including the target content)
Performance	Decision submission P95	< 500ms
Performance	Real-time queue update latency	< 30s
Security	All API endpoints over TLS 1.3	Yes
Security	All connections over WireGuard	Yes
Security	Moderator identity recorded with every action	Yes
Security	Reason codes are from a standard set (no free-text reasons)	Yes
Privacy	Moderators do not see more PII than necessary	Yes (least-privilege)
Privacy	Appeal reviewers do not see the appellant's identity (unless needed)	Configurable per queue type
Privacy	NDPR compliance	Full
Reliability	Moderation queue uptime	≥ 99.5%
Reliability	SLA compliance per queue	≥ 95% within target time
Observability	Every action logged	Yes
Observability	SLA breach alerts	Yes
Observability	Workload imbalance alerts	Yes (at > 2x average)
Observability	Moderation metrics dashboard	Yes
7. Dependencies
Depends On	Type	Notes
Authentication & Identity Verification module	Internal	Moderator must be a verified user with the moderator role
RBAC module	Internal	Permission checks with sub-role support
Audit log module	Internal	All actions logged
Notification service	Internal	User notifications for moderation actions
Evidence module	Internal (lateral)	Feeds the EVIDENCE_AI queue
Policy Polls module	Internal (lateral)	Feeds the POLICY_DRAFT queue
Lawyer Reviews module	Internal (lateral)	Feeds the LAWYER_REVIEW queue
User profile / UGC	Internal (lateral)	Feeds the UGC queues
Cache layer (SQLite)	Internal	Queue item cache for fast loading
WebSocket (or polling)	External	Real-time queue updates
Postgres + Drizzle ORM	Internal	Primary database
8. Acceptance Criteria
Testable checklist. Every item must be verifiable before the pilot launches.

8.1 Queue and Workflow
 The unified queue loads with all queue types
 Queue type filters work correctly
 Priority filters work correctly
 Real-time updates fire within 30s
 A moderator can pick up a queue item (assignment)
 A moderator can decide on a queue item they are assigned to
 A moderator cannot decide on a queue item assigned to another moderator
 The valid actions per queue type are enforced at the API
8.2 Specialized Workflows
 EVIDENCE_AI: Moderator sees the file, AI confidence, model version
 EVIDENCE_AI: Moderator can APPROVE, RESTRICT, or REMOVE
 POLICY_DRAFT: Advisory Board member can APPROVE, REJECT, or REQUEST_CHANGES
 LAWYER_REVIEW: Moderator can APPROVE, EDIT, or REMOVE
 EDIT preserves the original text in the audit log
 UGC: Moderator can APPROVE, REMOVE, or WARN
 WARN is time-limited (default 90 days)
8.3 Appeals
 A user can appeal a moderation decision within 30 days
 The appeal goes to a different moderator than the original
 The appeal reviewer can UPHOLD or OVERTURN
 A second appeal escalates to the Grievance Committee
 The GC's decision is final
 The appellant is notified of the appeal decision
8.4 Grievance Committee
 The GC queue shows only items escalated from appeals
 GC members can decide (UPHOLD or OVERTURN)
 The GC decision requires written reasoning
 The GC decision is terminal (no further escalation)
8.5 User Reports
 A user can report content that violates the policy
 The report creates a queue item
 Duplicate reports are detected and rejected
 Self-reports are rejected
 The reporter can see the status of their report
8.6 Account-Level Actions
 An admin can suspend a user with a written reason
 A suspended user cannot log in
 A suspended user receives a clear explanation and appeal path
 An admin can restore a suspended user
 A warning is issued separately from a suspension
8.7 RBAC and Roles
 The moderator role has sub-roles that determine queue access
 The advisory_board role is separate from moderator
 The grievance_committee role is separate from senior_moderator
 The admin role has full access
 RBAC conditions are enforced at the API
8.8 Audit and Metrics
 Every moderation action is audit-logged
 Moderation metrics dashboard shows queue sizes, SLA compliance, decision distributions
 Workload imbalance alert fires at > 2x average
 SLA breach alert fires when a queue item exceeds the target time
 All actions include the moderator identity
8.9 Security
 All API endpoints over TLS 1.3
 All connections over WireGuard
 Moderator identity verified on every action
 Reason codes are from a standard set
 Free-text notes are allowed but not required
 Rate limit: 100 decisions per moderator per hour (sanity check)
8.10 Operational
 Health check includes moderation service status
 Alert on SLA breach (any queue)
 Alert on workload imbalance
 Runbook exists for "moderation backlog" (add staff, prioritize, communicate)
 Runbook exists for "moderator dispute" (senior moderator arbitrates)
 Runbook exists for "Grievance Committee unavailable" (defer escalations)
9. Test Plan Summary
Reference QA.md (forthcoming). This module's test focus:

9.1 Unit Tests
moderation.queue.service.ts — enqueue, pick up, assign, decide
moderation.appeal.service.ts — appeal submission, reviewer reassignment, escalation
moderation.grievance.service.ts — GC queue, decision
moderation.workflow.evidence.ts — Evidence AI specialization
moderation.workflow.policy.ts — Policy Polls specialization
moderation.workflow.review.ts — Lawyer Reviews specialization
moderation.workflow.ugc.ts — UGC specialization
moderation.workload.ts — workload calculation, imbalance detection
Coverage target: ≥ 90% on the workflow logic; ≥ 85% on the rest.

9.2 Integration Tests
Full flow: content submitted → enqueued → picked up → decided → user notified
Evidence AI: high confidence flag → moderator review → APPROVE / RESTRICT / REMOVE
Policy Polls: draft submitted → AB review → APPROVE / REJECT / REQUEST_CHANGES
Lawyer Reviews: review submitted → moderated → approved / edited / removed
Appeal: decision → appeal → different moderator → UPHOLD / OVERTURN
Second appeal: denial → GC escalation → final decision
Account-level: suspension → user cannot log in → appeal → admin review
Workload imbalance: simulate 2x average → alert fires
SLA breach: simulate item pending > 24h → alert fires
9.3 E2E Tests
Full moderation flow from the Kemi persona's perspective
Full appeal flow from the appellant's perspective
Full GC review from the GC member's perspective
User-facing notification flow (user receives notification of decision)
9.4 Manual Tests (during pilot)
Real moderation with real content
Real appeals with real users
Quarterly consistency test: 10 moderators review the same 20 items, measure inter-moderator agreement
Edge case: a coordinated attack (many reports on the same content)
Edge case: a coordinated defense (many appeals on the same decision)
9.5 Security Tests (required)
Penetration test: Attempt to decide on a queue item without being assigned. Must fail.
Penetration test: Attempt to decide on an appeal as the original moderator. Must fail.
Penetration test: Attempt to bypass the appeal reassignment. Must fail.
Code review: Every change to the moderation logic is reviewed by the Engineering Lead AND the Legal Director.
Audit verification: Every action is verified to be logged with the correct moderator identity.
9.6 The "Negative Test" Rule
For every "moderator can do X" test, there must be a matching "moderator cannot do X" test. The negative tests are especially important for:

A moderator cannot decide on an item assigned to another moderator
The original moderator cannot decide on the appeal
A user cannot appeal after 30 days
A user cannot appeal a decision about another user's content
A GC member cannot decide on a non-GC review
10. Rollout Plan
10.1 Feature Flags
Flag	Default	Purpose
moderation.module.enabled	true	Disable the entire module (catastrophic only)
moderation.queue.enabled	true	Hide the queue from moderators (operational)
moderation.appeals.enabled	true	Disable new appeals (operational)
moderation.gc.enabled	true	Disable GC queue (operational)
moderation.real-time-updates.enabled	true	Fall back to polling-only
10.2 Migration (if applicable)
Not applicable — greenfield module.

10.3 Rollback Plan
Moderation backlog: Increase staffing. The SLA may slip temporarily; users are notified. The queue is triaged by priority.
Moderator compromise: A moderator's account is compromised. All their recent decisions are reviewed by a senior moderator. Affected users are notified.
GC unavailable: Defer escalations. The 48-hour appeal SLA may slip; appellants are notified.
AI flagging surge: A pattern of false-positive AI flags overwhelms the queue. The AI's threshold is adjusted (by Engineering, not Moderation). The backlog is triaged.
Audit log loss: This is the catastrophic case. If the audit log is corrupted or lost, the moderation history is incomplete. All decisions from the affected period are reviewed.
11. Open Questions
#	Question	Owner	Status
1	What is the right moderation staffing level for the pilot?	Operations	Open — depends on volume
2	How do we measure inter-moderator consistency?	Moderation Lead	Open — quarterly test proposed
3	Should the Grievance Committee have a fixed term, or be ad-hoc?	Legal Director	Open — recommend fixed term
4	Should the moderation policy be public, or internal-only?	Legal Director	Open — recommend public for transparency
5	What is the right warning duration default? (90 days is the spec.)	Moderation Lead	Open — pilot data will inform
6	Should moderators be able to see the appellant's full history (e.g., previous appeals) when deciding on an appeal?	Legal Director	Open — recommend yes for context
7	How do we handle a moderator who consistently disagrees with the rest of the team?	Moderation Lead	Open — needs policy
Resolved questions move to the Decision Log. Decisions that affect the moderation policy or the appeal process require Legal Director sign-off.

Appendix A: Glossary
AB — Advisory Board
AI — Artificial Intelligence
GC — Grievance Committee
NDPR — Nigeria Data Protection Regulation
PII — Personally Identifiable Information
RBAC — Role-Based Access Control
SLA — Service Level Agreement
UGC — User-Generated Content
Appendix B: References
PRD.md §4.7 — Moderation
User Journeys.md §10 — J8 User appeals a moderation decision
Personas.md §3.4 — Kemi
PLATFORM.md §8 — Moderation & Content Governance
PLATFORM.md §8.4 — Moderator Roles
modules/Evidence Upload & Integrity.md — feeds EVIDENCE_AI
modules/Policy Polls.md — feeds POLICY_DRAFT
modules/Lawyer Reviews.md — feeds LAWYER_REVIEW
ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements
RBAC.md (forthcoming in Phase 4)
Decision Log
Appendix C: Module Spec Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead	Initial draft. Covers the unified moderation queue, AI-assisted flagging, four specialized workflows (Evidence, Policy Polls, Lawyer Reviews, UGC), moderator roles and sub-roles, appeals with reviewer reassignment, Grievance Committee escalation, and the moderation audit trail. 16 business rules, 14 edge cases, 50+ acceptance criteria. The reviewer reassignment for appeals (§3.3 rule 2) is the most important trust feature — the same person cannot decide both the original and the appeal.