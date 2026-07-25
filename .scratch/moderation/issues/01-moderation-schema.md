# Issue 01: Moderation Schema and Database Tables

**Slice**: Moderation & Content Governance  
**Priority**: High  
**Status**: Not Started  
**Depends on**: None  

---

## Description

Create the database schema for the Moderation & Content Governance slice, including tables for moderation queue, actions, appeals, warnings, suspensions, and rules.

## Acceptance Criteria

- [ ] `db/schema/moderation.ts` exists with properly typed tables
- [ ] All tables follow naming conventions (prefixes: mq_, ma_, apl_, uw_, sus_, mr_)
- [ ] All foreign key relationships are properly defined
- [ ] Indexes are created for query performance
- [ ] Enums are defined for status fields
- [ ] Schema exports types for use in services
- [ ] Drizzle configuration includes new schema file
- [ ] Migrations are generated and applied

## Tables to Create

### moderation_queue
```typescript
- id: text primary key (mq_ prefix)
- contentType: text not null (enum: poll_question, poll_comment, evidence, lawyer_profile, lawyer_review, case_comment, user_profile, blog_post, blog_comment)
- contentId: text not null
- reportedBy: text references users (nullable)
- reportedAt: timestamptz not null
- reason: text not null (enum or text for other)
- priority: text not null (enum: low, medium, high, critical)
- status: text not null (enum: pending, in_review, resolved, escalated)
- assignedTo: text references users (nullable)
- assignedAt: timestamptz (nullable)
- resolvedBy: text references users (nullable)
- resolvedAt: timestamptz (nullable)
- resolution: text (enum: approved, rejected, removed, edited, warning_issued, suspended)
- resolutionNotes: text (nullable)
- isAutomated: boolean not null default false
- aiConfidence: integer (nullable, 0-100)
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### moderation_actions
```typescript
- id: text primary key (ma_ prefix)
- queueItemId: text references moderation_queue
- actionType: text not null (enum: flag, review_start, review_complete, approve, reject, remove, edit, warn, suspend, escalate, bulk_action)
- actionedBy: text references users (nullable for system)
- actionedAt: timestamptz not null default now()
- details: text (JSON, nullable)
- ipAddress: text (nullable)
- userAgent: text (nullable)
```

### moderation_appeals
```typescript
- id: text primary key (apl_ prefix)
- moderationActionId: text references moderation_actions
- userId: text references users not null
- reason: text not null (max 2000 chars)
- status: text not null (enum: pending, in_review, upheld, overturned)
- reviewedBy: text references users (nullable)
- reviewedAt: timestamptz (nullable)
- decision: text (enum: upheld, overturned) (nullable)
- decisionNotes: text (nullable, max 2000 chars)
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### user_warnings
```typescript
- id: text primary key (uw_ prefix)
- userId: text references users not null
- issuedBy: text references users not null
- reason: text not null (max 500 chars)
- severity: text not null (enum: mild, moderate, severe)
- expiresAt: timestamptz (nullable)
- isActive: boolean not null default true
- acknowledgedAt: timestamptz (nullable)
- createdAt: timestamptz not null default now()
```

### user_suspensions
```typescript
- id: text primary key (sus_ prefix)
- userId: text references users not null
- issuedBy: text references users not null
- reason: text not null (max 500 chars)
- type: text not null (enum: temporary, permanent)
- duration: integer (days, for temporary)
- endsAt: timestamptz (nullable, for temporary)
- isActive: boolean not null default true
- canAppeal: boolean not null default true
- createdAt: timestamptz not null default now()
```

### moderation_rules
```typescript
- id: text primary key (mr_ prefix)
- name: text not null (max 100 chars)
- description: text (nullable, max 500 chars)
- contentType: text not null (enum: all, poll_question, poll_comment, evidence, lawyer_profile, lawyer_review, case_comment, user_profile, blog_post, blog_comment)
- pattern: text (nullable, regex pattern)
- keywords: text (nullable, JSON array of strings)
- action: text not null (enum: flag, remove, warn, approve)
- severity: text not null (enum: low, medium, high)
- isActive: boolean not null default true
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

## Indexes to Create

```sql
-- moderation_queue
CREATE INDEX idx_moderation_queue_content ON moderation_queue(contentType, contentId);
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX idx_moderation_queue_assigned ON moderation_queue(assignedTo);
CREATE INDEX idx_moderation_queue_reported_by ON moderation_queue(reportedBy);
CREATE INDEX idx_moderation_queue_created ON moderation_queue(createdAt);

-- moderation_actions
CREATE INDEX idx_moderation_actions_queue ON moderation_actions(queueItemId);
CREATE INDEX idx_moderation_actions_type ON moderation_actions(actionType);
CREATE INDEX idx_moderation_actions_by ON moderation_actions(actionedBy);
CREATE INDEX idx_moderation_actions_at ON moderation_actions(actionedAt);

-- moderation_appeals
CREATE INDEX idx_moderation_appeals_action ON moderation_appeals(moderationActionId);
CREATE INDEX idx_moderation_appeals_user ON moderation_appeals(userId);
CREATE INDEX idx_moderation_appeals_status ON moderation_appeals(status);

-- user_warnings
CREATE INDEX idx_user_warnings_user ON user_warnings(userId);
CREATE INDEX idx_user_warnings_issued ON user_warnings(issuedBy);
CREATE INDEX idx_user_warnings_active ON user_warnings(isActive) WHERE isActive = true;

-- user_suspensions
CREATE INDEX idx_user_suspensions_user ON user_suspensions(userId);
CREATE INDEX idx_user_suspensions_issued ON user_suspensions(issuedBy);
CREATE INDEX idx_user_suspensions_active ON user_suspensions(isActive) WHERE isActive = true;

-- moderation_rules
CREATE INDEX idx_moderation_rules_content ON moderation_rules(contentType);
CREATE INDEX idx_moderation_rules_active ON moderation_rules(isActive) WHERE isActive = true;
```

## Notes

- Follow existing schema patterns from `db/schema/blog.ts`, `db/schema/legal-literacy.ts`
- Use `pgTable` for PostgreSQL tables
- Define appropriate indexes for query performance
- Use `timestamp('created_at').defaultNow()` pattern for timestamps
- Define enums as exported constants for reuse
- Consider adding a `moderation_audit_log` table for comprehensive audit trail
