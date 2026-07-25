# Issue 03: Moderation Service

**Slice**: Moderation & Content Governance  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation)  

---

## Description

Create the moderation service with all business logic for content moderation, including queue management, rule-based automated detection, user warnings, suspensions, and appeals handling.

## Acceptance Criteria

- [ ] `services/moderation.service.ts` exists with complete implementation
- [ ] All service methods follow existing patterns from `services/blog.service.ts`
- [ ] Service uses dependency injection pattern
- [ ] Service properly validates all inputs
- [ ] Service handles errors appropriately (throws typed errors)
- [ ] Service respects RBAC permissions (enforced at API layer)
- [ ] Service includes comprehensive JSDoc comments

## Service Interface

```typescript
interface ModerationService {
  // Queue Management
  reportContent(input: ReportContentInput & { reportedBy: string }): Promise<ModerationQueueRow>;
  autoFlagContent(input: AutoFlagInput): Promise<ModerationQueueRow>;
  getQueueItemById(id: string): Promise<ModerationQueueRow>;
  listQueueItems(params: ModerationQueueListParams): Promise<{ items: ModerationQueueRow[]; total: number }>;
  assignQueueItem(input: { queueItemId: string; moderatorId: string }): Promise<ModerationQueueRow>;
  resolveQueueItem(input: ResolveQueueItemInput & { resolvedBy: string }): Promise<ModerationQueueRow>;
  escalateQueueItem(input: { queueItemId: string; reason: string }): Promise<ModerationQueueRow>;
  bulkResolveQueueItems(input: { queueItemIds: string[]; resolution: ModerationResolution; notes: string; resolvedBy: string }): Promise<number>;
  
  // Direct Moderation (bypass queue for certain actions)
  moderateContent(input: ModerateContentInput & { moderatedBy: string }): Promise<ModerationActionRow>;
  
  // Rules
  createRule(input: CreateModerationRuleInput): Promise<ModerationRuleRow>;
  getRuleById(id: string): Promise<ModerationRuleRow>;
  updateRule(input: UpdateModerationRuleInput): Promise<ModerationRuleRow>;
  deleteRule(id: string): Promise<void>;
  listRules(params: { contentType?: string; isActive?: boolean }): Promise<ModerationRuleRow[]>;
  toggleRule(id: string): Promise<ModerationRuleRow>;
  
  // Automated Detection
  checkContentAgainstRules(input: { content: string; contentType: ModeratableContentType; authorId: string }): Promise<{ flagged: boolean; rule?: ModerationRuleRow }>;
  
  // Warnings
  issueWarning(input: IssueWarningInput & { issuedBy: string }): Promise<UserWarningRow>;
  getUserWarnings(userId: string): Promise<UserWarningRow[]>;
  getActiveWarningCount(userId: string): Promise<number>;
  acknowledgeWarning(warningId: string): Promise<UserWarningRow>;
  
  // Suspensions
  suspendUser(input: SuspendUserInput & { issuedBy: string }): Promise<UserSuspensionRow>;
  getUserSuspensions(userId: string): Promise<UserSuspensionRow[]>;
  getActiveSuspension(userId: string): Promise<UserSuspensionRow | null>;
  liftSuspension(input: LiftSuspensionInput & { liftedBy: string }): Promise<UserSuspensionRow>;
  checkUserSuspended(userId: string): Promise<boolean>;
  
  // Appeals
  fileAppeal(input: FileAppealInput & { userId: string }): Promise<ModerationAppealRow>;
  getAppealById(id: string): Promise<ModerationAppealRow>;
  listAppeals(params: ModerationAppealListParams): Promise<{ appeals: ModerationAppealRow[]; total: number }>;
  decideAppeal(input: DecideAppealInput & { reviewedBy: string }): Promise<ModerationAppealRow>;
  
  // Analytics
  getModerationMetrics(params: { period?: string; moderatorId?: string }): Promise<ModerationMetrics>;
  getQueueStatistics(): Promise<QueueStatistics>;
}
```

## Custom Errors

```typescript
// Queue Errors
export class ModerationQueueNotFoundError extends Error { ... }
export class ModerationQueueAlreadyAssignedError extends Error { ... }
export class ModerationQueueAlreadyResolvedError extends Error { ... }

// Rule Errors
export class ModerationRuleNotFoundError extends Error { ... }
export class DuplicateRuleNameError extends Error { ... }
export class InvalidRegexPatternError extends Error { ... }

// Warning Errors
export class UserWarningNotFoundError extends Error { ... }
export class WarningAlreadyAcknowledgedError extends Error { ... }

// Suspension Errors
export class UserSuspensionNotFoundError extends Error { ... }
export class UserAlreadySuspendedError extends Error { ... }
export class CannotLiftPermanentSuspensionError extends Error { ... }

// Appeal Errors
export class ModerationAppealNotFoundError extends Error { ... }
export class AppealAlreadyDecidedError extends Error { ... }
export class CannotAppealSuspensionError extends Error { ... }

// Content Errors
export class ContentNotModeratableError extends Error { ... }
export class ContentAlreadyReportedError extends Error { ... }
```

## Service Dependencies

```typescript
interface ModerationServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Optional: for sending notifications on moderation actions */
  notifier?: Notifier;
}
```

## Helper Functions

The service should include helper functions for:

1. **Content type validation**: Check if content type is moderatable
2. **Rule matching**: Check content against moderation rules
3. **Priority calculation**: Calculate priority based on rule severity and user history
4. **User history lookup**: Get user's previous violations for context
5. **Notification generation**: Generate notifications for users and moderators
6. **Audit logging**: Log all moderation actions for transparency

## Key Business Logic

### Rule Matching Algorithm
```typescript
async function checkContentAgainstRules(content: string, contentType: ModeratableContentType): Promise<{ flagged: boolean; rule?: ModerationRuleRow }> {
  // Get all active rules for this content type (or 'all')
  // For each rule:
  //   - If pattern exists, check if content matches regex
  //   - If keywords exist, check if any keyword is in content
  //   - If both pattern and keywords, use OR logic
  // Return first matching rule with highest severity
  // If no match, return { flagged: false }
}
```

### Priority Calculation
```typescript
function calculatePriority(rule: ModerationRuleRow, userHistory: UserViolationHistory): Priority {
  // Base priority from rule severity
  // Increase priority if user has previous violations
  // Cap at 'critical'
  // Return calculated priority
}
```

### Queue Item Creation
```typescript
async function createQueueItem(input: {
  contentId: string;
  contentType: ModeratableContentType;
  reason: ModerationReason | string;
  reportedBy?: string;
  isAutomated: boolean;
  aiConfidence?: number;
  priority?: ModerationPriority;
}): Promise<ModerationQueueRow> {
  // Generate ID
  // Set default priority if not provided
  // Create queue item
  // Create initial action record
  // Return queue item
}
```

### Suspension Check Middleware
```typescript
async function checkUserSuspended(userId: string): Promise<boolean> {
  // Check for active suspensions
  // If found and not expired, return true
  // Otherwise return false
}
```

## Notes

- Follow the dependency injection pattern from `services/blog.service.ts`
- Use `createModerationService(deps: ModerationServiceDeps): ModerationService` pattern
- All async methods should properly handle database errors
- Include comprehensive JSDoc comments for all public methods
- Use the validation schemas from Issue 02
- Return proper types from schema
- Throw typed errors for domain-specific failures
- Use the clock dependency for all date/time operations (testability)
- Consider adding a separate `ModerationAuditService` for comprehensive audit logging
