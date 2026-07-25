# Issue 04: Moderation Service Tests

**Slice**: Moderation & Content Governance  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation), Issue 03 (service)  

---

## Description

Create comprehensive tests for the Moderation & Content Governance service. Tests should cover all happy paths, error cases, and edge cases.

## Acceptance Criteria

- [ ] `test/moderation.service.queue.test.ts` - Queue management tests
- [ ] `test/moderation.service.rules.test.ts` - Rule management tests
- [ ] `test/moderation.service.warnings.test.ts` - Warning tests
- [ ] `test/moderation.service.suspensions.test.ts` - Suspension tests
- [ ] `test/moderation.service.appeals.test.ts` - Appeal tests
- [ ] All tests follow existing patterns from `test/blog.service.*`
- [ ] Tests use the test harness and in-memory database
- [ ] Tests achieve > 90% code coverage for moderation service

## Test Files

### test/moderation.service.queue.test.ts

Test cases for moderation queue operations:

```typescript
describe("ModerationService - Queue", () => {
  let service: ModerationService;
  let db: DbClient;
  let clock: FixedClock;
  
  let user: UserRow;
  let moderator: UserRow;
  let blogPost: BlogPostRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test users (regular and moderator)
    // Create test content
  });

  describe("reportContent", () => {
    it("creates a queue item when user reports content");
    it("sets reportedBy to the reporting user");
    it("sets isAutomated to false");
    it("sets status to pending");
    it("throws ContentNotModeratableError for non-moderatable content type");
    it("throws ContentAlreadyReportedError if same user already reported this content");
    it("creates initial moderation action record");
  });

  describe("autoFlagContent", () => {
    it("creates a queue item when system auto-flags content");
    it("sets isAutomated to true");
    it("sets aiConfidence if provided");
    it("sets priority based on confidence");
    it("creates initial moderation action record");
  });

  describe("getQueueItemById", () => {
    it("returns a queue item by ID");
    it("throws ModerationQueueNotFoundError for non-existent item");
  });

  describe("listQueueItems", () => {
    it("returns paginated list of queue items");
    it("filters by contentType");
    it("filters by status");
    it("filters by priority");
    it("filters by assignedTo");
    it("sorts by createdAt");
    it("sorts by priority");
    it("returns total count");
  });

  describe("assignQueueItem", () => {
    it("assigns item to moderator");
    it("updates status to in_review");
    it("sets assignedAt");
    it("creates moderation action record");
    it("throws ModerationQueueNotFoundError for non-existent item");
    it("throws ModerationQueueAlreadyAssignedError if already assigned");
    it("throws ModerationQueueAlreadyResolvedError if already resolved");
  });

  describe("resolveQueueItem", () => {
    it("resolves item with specified resolution");
    it("sets resolvedBy and resolvedAt");
    it("sets resolution and resolutionNotes");
    it("updates status to resolved");
    it("creates moderation action record");
    it("throws ModerationQueueNotFoundError for non-existent item");
    it("throws ModerationQueueAlreadyResolvedError if already resolved");
  });

  describe("escalateQueueItem", () => {
    it("escalates item to higher level");
    it("sets status to escalated");
    it("creates moderation action record");
    it("throws ModerationQueueNotFoundError for non-existent item");
    it("throws ModerationQueueAlreadyResolvedError if already resolved");
  });

  describe("bulkResolveQueueItems", () => {
    it("resolves multiple items at once");
    it("creates action record for each item");
    it("returns count of resolved items");
    it("skips already resolved items");
  });

  describe("moderateContent", () => {
    it("moderates content directly without queue");
    it("creates moderation action record");
    it("throws ContentNotModeratableError for non-moderatable content");
  });
});
```

### test/moderation.service.rules.test.ts

Test cases for moderation rule operations:

```typescript
describe("ModerationService - Rules", () => {
  let service: ModerationService;

  beforeEach(async () => {
    // Initialize test harness
  });

  describe("createRule", () => {
    it("creates a moderation rule with valid input");
    it("validates regex pattern");
    it("throws DuplicateRuleNameError for duplicate name");
    it("throws InvalidRegexPatternError for invalid regex");
    it("sets isActive to true by default");
  });

  describe("getRuleById", () => {
    it("returns a rule by ID");
    it("throws ModerationRuleNotFoundError for non-existent rule");
  });

  describe("updateRule", () => {
    it("updates rule fields");
    it("can update pattern");
    it("can update keywords");
    it("can update action and severity");
    it("throws ModerationRuleNotFoundError for non-existent rule");
    it("throws DuplicateRuleNameError when changing to duplicate name");
  });

  describe("deleteRule", () => {
    it("deletes a rule");
    it("throws ModerationRuleNotFoundError for non-existent rule");
  });

  describe("listRules", () => {
    it("returns all active rules by default");
    it("filters by contentType");
    it("includes inactive rules when specified");
  });

  describe("toggleRule", () => {
    it("toggles rule active status");
    it("throws ModerationRuleNotFoundError for non-existent rule");
  });

  describe("checkContentAgainstRules", () => {
    it("returns not flagged for clean content");
    it("flags content matching regex pattern");
    it("flags content matching keywords");
    it("returns highest severity match");
    it("only checks active rules");
    it("checks rules for specific contentType");
    it("checks 'all' contentType rules");
    it("returns the matching rule");
  });
});
```

### test/moderation.service.warnings.test.ts

Test cases for user warning operations:

```typescript
describe("ModerationService - Warnings", () => {
  let service: ModerationService;
  
  let user: UserRow;
  let moderator: UserRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test users
  });

  describe("issueWarning", () => {
    it("issues a warning to user");
    it("sets issuedBy and createdAt");
    it("sets isActive to true");
    it("creates moderation action record");
    it("throws UserWarningNotFoundError for invalid user");
  });

  describe("getUserWarnings", () => {
    it("returns all warnings for a user");
    it("returns empty array for user with no warnings");
    it("includes both active and inactive warnings");
  });

  describe("getActiveWarningCount", () => {
    it("returns count of active warnings");
    it("returns 0 for user with no active warnings");
    it("excludes expired warnings");
  });

  describe("acknowledgeWarning", () => {
    it("sets acknowledgedAt on warning");
    it("throws UserWarningNotFoundError for non-existent warning");
    it("throws WarningAlreadyAcknowledgedError if already acknowledged");
  });
});
```

### test/moderation.service.suspensions.test.ts

Test cases for user suspension operations:

```typescript
describe("ModerationService - Suspensions", () => {
  let service: ModerationService;
  
  let user: UserRow;
  let moderator: UserRow;
  let admin: UserRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test users
  });

  describe("suspendUser", () => {
    it("suspends user temporarily");
    it("suspends user permanently");
    it("sets issuedBy and createdAt");
    it("sets isActive to true");
    it("sets endsAt for temporary suspension");
    it("creates moderation action record");
    it("throws UserAlreadySuspendedError if user already has active suspension");
  });

  describe("getUserSuspensions", () => {
    it("returns all suspensions for a user");
    it("returns empty array for user with no suspensions");
  });

  describe("getActiveSuspension", () => {
    it("returns active suspension if exists");
    it("returns null if no active suspension");
    it("returns null if suspension expired");
  });

  describe("checkUserSuspended", () => {
    it("returns true for active suspension");
    it("returns false for no suspension");
    it("returns false for expired suspension");
  });

  describe("liftSuspension", () => {
    it("lifts a temporary suspension");
    it("sets isActive to false");
    it("creates moderation action record");
    it("throws UserSuspensionNotFoundError for non-existent suspension");
    it("throws CannotLiftPermanentSuspensionError for permanent suspension");
  });
});
```

### test/moderation.service.appeals.test.ts

Test cases for moderation appeal operations:

```typescript
describe("ModerationService - Appeals", () => {
  let service: ModerationService;
  
  let user: UserRow;
  let moderator: UserRow;
  let queueItem: ModerationQueueRow;
  let action: ModerationActionRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test users
    // Create a resolved queue item with action
  });

  describe("fileAppeal", () => {
    it("files an appeal for a moderation action");
    it("sets userId and createdAt");
    it("sets status to pending");
    it("throws ModerationAppealNotFoundError for invalid action");
    it("throws CannotAppealSuspensionError if action is permanent suspension");
  });

  describe("getAppealById", () => {
    it("returns an appeal by ID");
    it("throws ModerationAppealNotFoundError for non-existent appeal");
  });

  describe("listAppeals", () => {
    it("returns paginated list of appeals");
    it("filters by userId");
    it("filters by status");
    it("returns total count");
  });

  describe("decideAppeal", () => {
    it("decides appeal as upheld");
    it("decides appeal as overturned");
    it("sets reviewedBy and reviewedAt");
    it("sets decision and decisionNotes");
    it("updates status to in_review then to decided");
    it("throws ModerationAppealNotFoundError for non-existent appeal");
    it("throws AppealAlreadyDecidedError if already decided");
  });
});
```

## Test Data Builders

Create helper functions for building test data:

```typescript
// In test file or separate helpers
function buildReportContentInput(overrides: Partial<ReportContentInput> = {}): ReportContentInput {
  return {
    contentId: `test-content-${Date.now()}`,
    contentType: 'blog_comment',
    reason: 'spam',
    ...overrides,
  };
}

function buildModerationRuleInput(overrides: Partial<CreateModerationRuleInput> = {}): CreateModerationRuleInput {
  return {
    name: `Test Rule ${Date.now()}`,
    description: 'Test description',
    contentType: 'all',
    action: 'flag',
    severity: 'medium',
    ...overrides,
  };
}

function buildWarningInput(overrides: Partial<IssueWarningInput> = {}): IssueWarningInput {
  return {
    userId: '',
    reason: 'Test warning',
    severity: 'mild',
    ...overrides,
  };
}

function buildSuspensionInput(overrides: Partial<SuspendUserInput> = {}): SuspendUserInput {
  return {
    userId: '',
    reason: 'Test suspension',
    type: 'temporary',
    duration: 7,
    ...overrides,
  };
}
```

## Notes

- Follow existing test patterns from `test/blog.service.posts.test.ts`
- Use `describe`, `it`, `beforeEach`, `afterEach` appropriately
- Test both happy paths and error cases
- Test edge cases (empty inputs, boundary values, concurrent operations)
- Use the test clock for time-sensitive operations
- Mock external dependencies where needed
- Keep tests focused and fast
- Aim for > 90% code coverage
