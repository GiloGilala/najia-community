# Issue 02: Moderation Validation Schemas

**Slice**: Moderation & Content Governance  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema definition for type references)  

---

## Description

Create Zod validation schemas for all Moderation & Content Governance inputs. These schemas will be used by both the service layer and API routes for consistent validation.

## Acceptance Criteria

- [ ] `lib/validation/moderation.ts` exists with all moderation schemas
- [ ] All schemas follow existing patterns from `lib/validation/blog.ts`
- [ ] Schemas are exported for use in services and API layer
- [ ] Validation errors provide clear, user-friendly messages

## Schemas to Create

### Content Type and Reason Enums

```typescript
export const moderatableContentTypeEnum = z.enum([
  'poll_question',
  'poll_comment',
  'evidence',
  'lawyer_profile',
  'lawyer_review',
  'case_comment',
  'user_profile',
  'blog_post',
  'blog_comment',
]);

export type ModeratableContentType = z.infer<typeof moderatableContentTypeEnum>;

export const moderationReasonEnum = z.enum([
  'hate_speech',
  'harassment',
  'defamation',
  'incitement',
  'pornography',
  'copyright_violation',
  'impersonation',
  'spam',
  'fraud',
  'off_topic',
  'personal_attack',
  'ai_manipulation',
  'other',
]);

export type ModerationReason = z.infer<typeof moderationReasonEnum>;

export const moderationResolutionEnum = z.enum([
  'approved',
  'rejected',
  'removed',
  'edited',
  'warning_issued',
  'suspended',
]);

export type ModerationResolution = z.infer<typeof moderationResolutionEnum>;

export const moderationPriorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export type ModerationPriority = z.infer<typeof moderationPriorityEnum>;

export const appealDecisionEnum = z.enum([
  'pending',
  'in_review',
  'upheld',
  'overturned',
]);

export type AppealDecision = z.infer<typeof appealDecisionEnum>;
```

### Report Content Schema

```typescript
export const reportContentSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  contentType: moderatableContentTypeEnum,
  reason: z.union([
    moderationReasonEnum,
    z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters")
  ]),
  details: z.string().max(2000, "Details must be at most 2000 characters").optional(),
});

export type ReportContentInput = z.infer<typeof reportContentSchema>;
```

### Resolve Queue Item Schema

```typescript
export const resolveQueueItemSchema = z.object({
  queueItemId: z.string().min(1, "Queue item ID is required"),
  resolution: moderationResolutionEnum,
  resolutionNotes: z.string().min(1, "Resolution notes are required").max(1000, "Resolution notes must be at most 1000 characters"),
  actionDetails: z.record(z.any()).optional(),
});

export type ResolveQueueItemInput = z.infer<typeof resolveQueueItemSchema>;
```

### Moderate Content Schema (for direct moderation without queue)

```typescript
export const moderateContentSchema = z.object({
  contentId: z.string().min(1, "Content ID is required"),
  contentType: moderatableContentTypeEnum,
  action: z.enum(['approve', 'reject', 'remove', 'flag']),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
});

export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
```

### Create Moderation Rule Schema

```typescript
export const createModerationRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  contentType: z.union([
    moderatableContentTypeEnum,
    z.literal('all'),
  ]),
  pattern: z.string().max(500, "Pattern must be at most 500 characters").optional(),
  keywords: z.array(z.string().max(100, "Keyword must be at most 100 characters")).max(50, "Maximum 50 keywords").optional(),
  action: z.enum(['flag', 'remove', 'warn', 'approve']),
  severity: z.enum(['low', 'medium', 'high']),
  isActive: z.boolean().default(true),
});

export type CreateModerationRuleInput = z.infer<typeof createModerationRuleSchema>;
```

### Update Moderation Rule Schema

```typescript
export const updateModerationRuleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
  contentType: z.union([
    moderatableContentTypeEnum,
    z.literal('all'),
  ]).optional(),
  pattern: z.string().max(500, "Pattern must be at most 500 characters").optional().nullable(),
  keywords: z.array(z.string().max(100, "Keyword must be at most 100 characters")).max(50, "Maximum 50 keywords").optional().nullable(),
  action: z.enum(['flag', 'remove', 'warn', 'approve']).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateModerationRuleInput = z.infer<typeof updateModerationRuleSchema>;
```

### Issue Warning Schema

```typescript
export const issueWarningSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
  severity: z.enum(['mild', 'moderate', 'severe']),
  expiresAt: z.date().optional(),
});

export type IssueWarningInput = z.infer<typeof issueWarningSchema>;
```

### Suspend User Schema

```typescript
export const suspendUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
  type: z.enum(['temporary', 'permanent']),
  duration: z.number().int().min(1, "Duration must be at least 1 day").max(365, "Duration must be at most 365 days").optional(),
  canAppeal: z.boolean().default(true),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
```

### Lift Suspension Schema

```typescript
export const liftSuspensionSchema = z.object({
  suspensionId: z.string().min(1, "Suspension ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
});

export type LiftSuspensionInput = z.infer<typeof liftSuspensionSchema>;
```

### File Appeal Schema

```typescript
export const fileAppealSchema = z.object({
  moderationActionId: z.string().min(1, "Moderation action ID is required"),
  reason: z.string().min(1, "Reason is required").max(2000, "Reason must be at most 2000 characters"),
});

export type FileAppealInput = z.infer<typeof fileAppealSchema>;
```

### Decide Appeal Schema

```typescript
export const decideAppealSchema = z.object({
  appealId: z.string().min(1, "Appeal ID is required"),
  decision: z.enum(['upheld', 'overturned']),
  decisionNotes: z.string().max(2000, "Decision notes must be at most 2000 characters").optional(),
});

export type DecideAppealInput = z.infer<typeof decideAppealSchema>;
```

### Query Parameter Schemas

```typescript
export const moderationQueueListSchema = z.object({
  contentType: moderatableContentTypeEnum.optional(),
  status: z.enum(['pending', 'in_review', 'resolved', 'escalated']).optional(),
  priority: moderationPriorityEnum.optional(),
  assignedTo: z.string().optional(),
  reportedBy: z.string().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ModerationQueueListParams = z.infer<typeof moderationQueueListSchema>;


export const moderationAppealListSchema = z.object({
  userId: z.string().optional(),
  status: appealDecisionEnum.optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ModerationAppealListParams = z.infer<typeof moderationAppealListSchema>;
```

## Notes

- Follow existing patterns from `lib/validation/blog.ts` and `lib/validation/legal-literacy.ts`
- Use `z.string().min().max()` for length validation
- Use `z.enum()` for enum fields
- Use `z.coerce.number()` or `z.number()` for numeric fields
- Add custom error messages where helpful
- Export schema types for use in services (e.g., `type ReportContentInput = z.infer<typeof reportContentSchema>`)
- Consider adding helper functions for common validation patterns
