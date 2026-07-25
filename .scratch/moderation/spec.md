# Moderation & Content Governance - Specification

**Slice**: Moderation & Content Governance  
**Reference**: Platform Documentation §8  
**Status**: NOT YET IMPLEMENTED  
**Priority**: High (critical for platform safety and trust)  
**Dependencies**: 
- Existing auth service (for moderator authentication)
- Existing RBAC patterns
- Blog & Content Platform (for content to moderate)
- Evidence Integrity (for evidence to moderate)

---

## Overview

The Moderation & Content Governance system ensures that all user-generated content on the Najia Community Bridge platform maintains appropriate standards of quality, legality, and civic discourse. This system combines automated detection with human review to handle content flagging, moderation decisions, appeals, and transparency reporting.

---

## Domain Model

### Content Types Subject to Moderation

Based on platform documentation §8.2.1:

| Content Type | Moderation Level | Description |
|--------------|------------------|-------------|
| Poll Questions | High | Subject to approval before publication |
| Poll Comments | High | Automated + human moderation |
| Evidence Uploads | Medium | Automated + human review of AI flags |
| Lawyer Profiles | High | Verified before publication |
| Lawyer Reviews | High | Moderated before publication |
| Case Comments | Medium | Automated + human review |
| User Profiles | Low | Only for violations |
| Blog Comments | Medium | Automated + human review |
| Blog Content | High | Editorial review before publication |

### Moderation Queue Item

A single item awaiting moderation review.

**Properties:**
- `id`: Unique identifier (prefix: `mq_`)
- `contentType`: Type of content being moderated (enum)
- `contentId`: Reference to the content being moderated
- `reportedBy`: User who reported (nullable for auto-flagged)
- `reportedAt`: When the item was reported/flagged
- `reason`: Reason for flagging (enum or text)
- `priority`: `low` | `medium` | `high` | `critical`
- `status`: `pending` | `in_review` | `resolved` | `escalated`
- `assignedTo`: Moderator assigned (nullable)
- `assignedAt`: When assigned
- `resolvedBy`: Moderator who resolved (nullable)
- `resolvedAt`: When resolved
- `resolution`: `approved` | `rejected` | `removed` | `edited` | `warning_issued`
- `resolutionNotes`: Explanation for resolution
- `isAutomated`: Whether this was auto-flagged
- `aiConfidence`: AI detection confidence score (nullable)
- `createdAt`: When the queue item was created
- `updatedAt`: When last updated

### Moderation Action

Record of a moderation action taken.

**Properties:**
- `id`: Unique identifier (prefix: `ma_`)
- `queueItemId`: Reference to the moderation queue item
- `actionType`: Type of action taken (enum)
- `actionedBy`: Moderator who took action
- `actionedAt`: When action was taken
- `details`: JSON with action-specific details
- `ipAddress`: IP address of moderator (for audit)
- `userAgent`: User agent of moderator (for audit)

### Appeal

User appeal of a moderation decision.

**Properties:**
- `id`: Unique identifier (prefix: `apl_`)
- `moderationActionId`: Reference to the action being appealed
- `userId`: User who filed the appeal
- `reason`: Reason for appeal
- `status`: `pending` | `in_review` | `upheld` | `overturned`
- `reviewedBy`: Moderator/panel who reviewed (nullable)
- `reviewedAt`: When reviewed
- `decision`: Appeal decision
- `decisionNotes`: Explanation for decision
- `createdAt`: When appeal was filed
- `updatedAt`: When last updated

### Moderation Rule

Configurable rules for automated moderation.

**Properties:**
- `id`: Unique identifier (prefix: `mr_`)
- `name`: Rule name
- `description`: Rule description
- `contentType`: Which content type this applies to
- `pattern`: Regex pattern to match (nullable)
- `keywords`: Array of keywords to match (nullable)
- `action`: `flag` | `remove` | `warn` | `approve`
- `severity`: `low` | `medium` | `high`
- `isActive`: Boolean
- `createdAt`: When created
- `updatedAt`: When last updated

### User Warning

Warning issued to a user for repeated violations.

**Properties:**
- `id`: Unique identifier (prefix: `uw_`)
- `userId`: User who received warning
- `issuedBy`: Moderator who issued warning
- `reason`: Reason for warning
- `severity`: `mild` | `moderate` | `severe`
- `expiresAt`: When warning expires (nullable)
- `isActive`: Boolean
- `acknowledgedAt`: When user acknowledged (nullable)
- `createdAt`: When issued

### User Suspension

Temporary or permanent suspension of a user.

**Properties:**
- `id`: Unique identifier (prefix: `sus_`)
- `userId`: User who was suspended
- `issuedBy`: Moderator who issued suspension
- `reason`: Reason for suspension
- `type`: `temporary` | `permanent`
- `duration`: Duration in days (for temporary)
- `endsAt`: When suspension ends (nullable for permanent)
- `isActive`: Boolean
- `canAppeal`: Boolean
- `createdAt`: When issued

---

## Content Type Enums

```typescript
type ModeratableContentType = 
  | 'poll_question'
  | 'poll_comment'
  | 'evidence'
  | 'lawyer_profile'
  | 'lawyer_review'
  | 'case_comment'
  | 'user_profile'
  | 'blog_post'
  | 'blog_comment';

type ModerationReason = 
  | 'hate_speech'
  | 'harassment'
  | 'defamation'
  | 'incitement'
  | 'pornography'
  | 'copyright_violation'
  | 'impersonation'
  | 'spam'
  | 'fraud'
  | 'off_topic'
  | 'personal_attack'
  | 'ai_manipulation'
  | 'other';

type ModerationResolution = 
  | 'approved'
  | 'rejected'
  | 'removed'
  | 'edited'
  | 'warning_issued'
  | 'suspended';

type AppealDecision = 
  | 'pending'
  | 'in_review'
  | 'upheld'
  | 'overturned';
```

---

## Use Cases

### UC-01: Auto-Flag Content (System)
1. User submits content (comment, post, evidence, etc.)
2. System applies automated moderation rules
3. System checks for prohibited patterns/keywords
4. If match found, create moderation queue item with `isAutomated: true`
5. System assigns priority based on severity
6. System notifies moderators

**Triggers:**
- New content submission
- Content edit/update

### UC-02: User Report Content (Authenticated User)
1. User views content they believe violates guidelines
2. User clicks "Report" button
3. System displays report form with reason options
4. User selects reason and adds optional details
5. System creates moderation queue item
6. System notifies moderators
7. System shows confirmation to user

**Permissions**: `moderation:report` (citizen+)

### UC-03: Assign Moderation Item (Moderator)
1. Moderator views moderation queue
2. Moderator filters by content type, priority, status
3. Moderator selects an item and clicks "Assign to Me"
4. System assigns item to moderator
5. System updates status to `in_review`

**Permissions**: `moderation:view` (moderator+)

### UC-04: Review and Resolve Item (Moderator)
1. Moderator views assigned item with full context
2. Moderator reviews content and history
3. Moderator selects resolution: approve, reject, remove, edit, warning
4. Moderator adds resolution notes
5. System applies resolution
6. System updates queue item status to `resolved`
7. System creates moderation action record
8. System notifies user (if applicable)

**Permissions**: `moderation:act` (moderator+)

### UC-05: Escalate Item (Moderator)
1. Moderator reviews item and determines it needs higher-level review
2. Moderator clicks "Escalate"
3. System updates status to `escalated`
4. System notifies senior moderators/admins
5. System adds to escalated queue

**Permissions**: `moderation:escalate` (moderator+)

### UC-06: Bulk Moderation Actions (Moderator)
1. Moderator selects multiple items in queue
2. Moderator selects bulk action (approve all, remove all, etc.)
3. System applies action to all selected items
4. System creates moderation action record for each

**Permissions**: `moderation:bulk` (moderator+)

### UC-07: File Appeal (User)
1. User receives moderation decision they disagree with
2. User navigates to their notifications or the content
3. User clicks "Appeal" button
4. System displays appeal form
5. User provides reason for appeal
6. System creates appeal record
7. System notifies moderation team

**Permissions**: `moderation:appeal` (citizen+)

### UC-08: Review Appeal (Moderator/Admin)
1. Moderator views appeals queue
2. Moderator selects an appeal
3. Moderator reviews original content and decision
4. Moderator makes decision: uphold or overturn
5. Moderator adds decision notes
6. System updates appeal status
7. System notifies user of decision

**Permissions**: `moderation:appeal_review` (moderator+)

### UC-09: Manage Moderation Rules (Admin)
1. Admin navigates to moderation rules settings
2. System displays list of active rules
3. Admin can create, edit, delete, enable/disable rules
4. System validates rule syntax
5. System saves rule changes

**Permissions**: `moderation:rules` (admin only)

### UC-10: Issue User Warning (Moderator)
1. Moderator reviews user's violation history
2. Moderator decides to issue warning
3. Moderator selects warning severity
4. Moderator provides reason
5. System creates warning record
6. System notifies user

**Permissions**: `moderation:warn` (moderator+)

### UC-11: Suspend User (Moderator/Admin)
1. Moderator/admin reviews user's violation history
2. Moderator/admin decides to suspend user
3. Moderator/admin selects suspension type and duration
4. Moderator/admin provides reason
5. System creates suspension record
6. System revokes user sessions
7. System notifies user

**Permissions**: `moderation:suspend` (moderator+ for temporary, admin for permanent)

### UC-12: View Moderation History (Moderator/Admin)
1. Moderator/admin navigates to user profile or content
2. System displays moderation history for that user/content
3. Moderator/admin can filter by date, type, moderator

**Permissions**: `moderation:history` (moderator+)

### UC-13: Moderation Analytics (Admin)
1. Admin navigates to moderation dashboard
2. System displays metrics:
   - Total items moderated
   - Items by content type
   - Items by resolution
   - Average resolution time
   - Moderator activity
   - Appeal rates and outcomes
3. Admin can filter by date range

**Permissions**: `moderation:analytics` (admin only)

---

## Moderator Roles

Based on platform documentation §8.4.1:

| Role | Responsibilities | Permissions |
|------|------------------|-------------|
| Content Moderator | Review flagged content, comments, evidence | `moderation:view`, `moderation:act` |
| Poll Moderator | Draft, review, and approve polls | `polls:create`, `polls:update`, `moderation:view`, `moderation:act` |
| Case Moderator | Review cases, mediation support | `cases:read`, `moderation:view`, `moderation:act` |
| Lawyer Moderator | Verify lawyers, review profiles | `lawyer:verify`, `moderation:view`, `moderation:act` |
| AI Reviewer | Review AI detection flags, false positives | `moderation:view`, `moderation:act`, `ai:review` |
| Blog Editor | Review and approve blog content | `blog:publish`, `moderation:view`, `moderation:act` |

---

## Moderation Workflow

### Standard Flow
```
Content Submitted
    │
    ▼
┌─────────────────────┐
│ Automated Detection │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ No Violation        │ ←─────────────────────┐
│ Detected            │                          │
└─────────┬───────────┘                          │
          │                                      │
          ▼                                      │
    Content Published                           │
                                              │
    │                                         │
    ▼                                         │
User Reports or                              │
System Auto-Flags                           │
    │                                         │
    ▼                                         │
┌─────────────────────┐                     │
│ Moderation Queue    │ ◄────────────────────┘
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Moderator Review    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Decision Applied    │
└─────────┬───────────┘
          │
          ▼
    User Notified
```

### AI-Assisted Flow
```
Content Uploaded
    │
    ▼
┌─────────────────────┐
│ AI Detection         │
└─────────┬───────────┘
          │
          ├─────────────────────┐
          ▼                     ▼
    Low Confidence      Medium/High
    (Pass)              Confidence
          │                     │
          ▼                     ▼
    Content           Flagged for
    Published          Human Review
                          │
                          ▼
                    ┌─────────────────────┐
                    │ Human Reviewer      │
                    │ Validates AI        │
                    │ Decision            │
                    └─────────┬───────────┘
                              │
                              ▼
                         Final Decision
```

---

## API Endpoints

### Moderation Queue
- `GET /api/moderation/queue` - List queue items (moderator+)
- `GET /api/moderation/queue/:id` - Get queue item details (moderator+)
- `POST /api/moderation/queue/:id/assign` - Assign item to self (moderator+)
- `POST /api/moderation/queue/:id/resolve` - Resolve item (moderator+)
- `POST /api/moderation/queue/:id/escalate` - Escalate item (moderator+)
- `POST /api/moderation/queue/bulk-resolve` - Bulk resolve (moderator+)

### Reports
- `POST /api/moderation/report` - Report content (authenticated)

### Appeals
- `POST /api/moderation/appeal` - File appeal (authenticated)
- `GET /api/moderation/appeals` - List appeals (moderator+)
- `GET /api/moderation/appeals/:id` - Get appeal details (moderator+)
- `POST /api/moderation/appeals/:id/decide` - Decide appeal (moderator+)

### Rules
- `GET /api/moderation/rules` - List rules (admin)
- `POST /api/moderation/rules` - Create rule (admin)
- `PUT /api/moderation/rules/:id` - Update rule (admin)
- `DELETE /api/moderation/rules/:id` - Delete rule (admin)
- `POST /api/moderation/rules/:id/toggle` - Enable/disable rule (admin)

### Warnings
- `POST /api/moderation/warnings` - Issue warning (moderator+)
- `GET /api/moderation/warnings/:userId` - Get user warnings (moderator+)

### Suspensions
- `POST /api/moderation/suspensions` - Suspend user (moderator+/admin)
- `GET /api/moderation/suspensions/:userId` - Get user suspensions (moderator+)
- `POST /api/moderation/suspensions/:id/lift` - Lift suspension early (admin)

### Analytics
- `GET /api/moderation/analytics` - Get moderation metrics (admin)

---

## Validation Rules

### Report Content
- `contentId`: Required, valid ID format
- `contentType`: Required, valid ModeratableContentType
- `reason`: Required, valid ModerationReason or text (1-500 chars)
- `details`: Optional, text (max 2000 chars)

### Resolve Queue Item
- `resolution`: Required, valid ModerationResolution
- `resolutionNotes`: Required, text (1-1000 chars)
- `actionDetails`: Optional, JSON object

### Create Rule
- `name`: Required, string (1-100 chars)
- `description`: Required, string (1-500 chars)
- `contentType`: Required, valid ModeratableContentType or `all`
- `pattern`: Optional, valid regex
- `keywords`: Optional, array of strings (max 50 items, each max 100 chars)
- `action`: Required, `flag` | `remove` | `warn` | `approve`
- `severity`: Required, `low` | `medium` | `high`
- `isActive`: Optional, boolean (default: true)

### Issue Warning
- `userId`: Required, valid user ID
- `reason`: Required, string (1-500 chars)
- `severity`: Required, `mild` | `moderate` | `severe`
- `expiresAt`: Optional, future date

### Suspend User
- `userId`: Required, valid user ID
- `reason`: Required, string (1-500 chars)
- `type`: Required, `temporary` | `permanent`
- `duration`: Required for temporary, number of days (1-365)
- `canAppeal`: Optional, boolean (default: true)

---

## Cache Strategy

| Data | Cache Key | TTL | Invalidation |
|------|-----------|-----|--------------|
| Queue items | `moderation:queue:{filtersHash}` | 1 min | New item, item assigned/resolved |
| Queue count | `moderation:queue:count` | 1 min | Any queue change |
| User warnings | `moderation:warnings:{userId}` | 5 min | New warning, warning expired |
| User suspensions | `moderation:suspensions:{userId}` | 5 min | New suspension, suspension lifted/ended |
| Moderation rules | `moderation:rules` | 1 hour | Rule CRUD, toggle |
| Analytics | `moderation:analytics` | 1 hour | New action, end of day |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/moderation/report | 5 | 1 hour per user |
| POST /api/moderation/appeal | 3 | 1 day per user |
| GET /api/moderation/queue | 30 | 1 minute |
| POST /api/moderation/queue/*/resolve | 20 | 1 minute |
| Bulk operations | 10 | 1 minute |

---

## RBAC Permissions

| Resource | Citizen | Lawyer | Writer | Moderator | Admin |
|----------|---------|--------|--------|-----------|-------|
| moderation:report | ✅ | ✅ | ✅ | ✅ | ✅ |
| moderation:view | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:act | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:escalate | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:bulk | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:appeal | ✅ | ✅ | ✅ | ✅ | ✅ |
| moderation:appeal_review | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:rules | ❌ | ❌ | ❌ | ❌ | ✅ |
| moderation:warn | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:suspend | ❌ | ❌ | ❌ | ✅ (temp) | ✅ |
| moderation:history | ❌ | ❌ | ❌ | ✅ | ✅ |
| moderation:analytics | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema (Reference)

See implementation in `db/schema/moderation.ts`

---

## Implementation Tickets

See `.scratch/moderation/issues/` directory for individual implementation tickets.
