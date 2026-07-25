# Issue 04: AI Detection Service Tests

**Slice**: AI Manipulation Detection  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation), Issue 03 (service)  

---

## Description

Create comprehensive tests for the AI Detection service. Tests should cover all happy paths, error cases, and edge cases, including mocking of external detection APIs.

## Acceptance Criteria

- [ ] `test/ai-detection.service.detection.test.ts` - Detection tests
- [ ] `test/ai-detection.service.review.test.ts` - Review tests
- [ ] `test/ai-detection.service.models.test.ts` - Model management tests
- [ ] `test/ai-detection.service.queue.test.ts` - Queue tests
- [ ] `test/ai-detection.service.appeals.test.ts` - Appeal tests
- [ ] All tests follow existing patterns from `test/blog.service.*`
- [ ] Tests use the test harness and in-memory database
- [ ] Tests mock external detection APIs
- [ ] Tests achieve > 90% code coverage for AI detection service

## Test Files

### test/ai-detection.service.detection.test.ts

Test cases for detection operations:

```typescript
describe("AIDetectionService - Detection", () => {
  let service: AIDetectionService;
  let db: DbClient;
  let storage: InMemoryFileStorage;
  let clock: FixedClock;
  
  let evidence: EvidenceRow;
  let user: UserRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test evidence
    // Mock detection providers
  });

  describe("triggerDetection", () => {
    it("creates queue item for evidence");
    it("sets priority to normal by default");
    it("throws EvidenceNotDetectableError for non-image/video evidence");
    it("throws AIDetectionQueueNotFoundError for non-existent evidence");
    it("creates queue item with high priority for high-risk content");
  });

  describe("processQueue", () => {
    it("processes pending queue items");
    it("skips already processing items");
    it("returns count of processed items");
    it("handles detection failures gracefully");
    it("marks items as failed after max attempts");
  });

  describe("getDetectionResultById", () => {
    it("returns detection result by ID");
    it("throws AIDetectionNotFoundError for non-existent result");
  });

  describe("getDetectionResultByEvidence", () => {
    it("returns detection result for evidence");
    it("returns null if no detection result exists");
    it("returns most recent result if multiple exist");
  });

  describe("listDetectionResults", () => {
    it("returns paginated list of results");
    it("filters by evidenceId");
    it("filters by category");
    it("filters by isFlagged");
    it("filters by reviewed status");
    it("sorts by detectedAt");
    it("sorts by confidenceScore");
    it("returns total count");
  });

  describe("updateDetectionResult", () => {
    it("updates detection result fields");
    it("throws AIDetectionNotFoundError for non-existent result");
  });

  describe("getEvidenceDetectionStatus", () => {
    it("returns detected: false for evidence without detection");
    it("returns detected: true with category for detected evidence");
    it("returns flagged: true for flagged evidence");
  });
});
```

### test/ai-detection.service.review.test.ts

Test cases for human review operations:

```typescript
describe("AIDetectionService - Review", () => {
  let service: AIDetectionService;
  
  let detectionResult: AIDetectionResultRow;
  let reviewer: UserRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test detection result with isFlagged: true
    // Create reviewer user
  });

  describe("reviewDetection", () => {
    it("confirms detection as manipulation");
    it("rejects detection as false positive");
    it("marks detection as uncertain");
    it("sets reviewedBy and reviewedAt");
    it("sets reviewDecision and reviewNotes");
    it("throws AIDetectionNotFoundError for non-existent result");
    it("throws AIDetectionAlreadyReviewedError if already reviewed");
  });

  describe("getFlaggedForReview", () => {
    it("returns all flagged, unreviewed detection results");
    it("returns empty array if none flagged");
    it("sorts by detectedAt descending");
  });
});
```

### test/ai-detection.service.models.test.ts

Test cases for model management operations:

```typescript
describe("AIDetectionService - Models", () => {
  let service: AIDetectionService;

  beforeEach(async () => {
    // Initialize test harness
    // Mock detection providers
  });

  describe("createModel", () => {
    it("creates a detection model with valid input");
    it("sets isActive to true by default");
    it("throws DuplicateModelNameError for duplicate name");
    it("encrypts API key before storage");
    it("validates capabilities array");
  });

  describe("getModelById", () => {
    it("returns a model by ID");
    it("throws DetectionModelNotFoundError for non-existent model");
  });

  describe("updateModel", () => {
    it("updates model fields");
    it("can update API endpoint");
    it("can update API key");
    it("can update capabilities");
    it("throws DetectionModelNotFoundError for non-existent model");
    it("throws DuplicateModelNameError when changing to duplicate name");
  });

  describe("deleteModel", () => {
    it("deletes a model");
    it("throws DetectionModelNotFoundError for non-existent model");
  });

  describe("listModels", () => {
    it("returns all active models by default");
    it("filters by provider");
    it("includes inactive models when specified");
  });

  describe("toggleModel", () => {
    it("toggles model active status");
    it("throws DetectionModelNotFoundError for non-existent model");
  });

  describe("testModel", () => {
    it("tests model with test file");
    it("returns success with result for successful test");
    it("returns success: false with error for failed test");
    it("throws DetectionModelNotFoundError for non-existent model");
    it("throws DetectionModelInactiveError for inactive model");
  });

  describe("selectModel", () => {
    it("selects model with matching capability");
    it("returns undefined if no model supports detection type");
    it("prefers active models");
  });
});
```

### test/ai-detection.service.queue.test.ts

Test cases for queue management operations:

```typescript
describe("AIDetectionService - Queue", () => {
  let service: AIDetectionService;
  
  let queueItem: AIDetectionQueueRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test queue item
  });

  describe("getQueueItemById", () => {
    it("returns queue item by ID");
    it("throws AIDetectionQueueNotFoundError for non-existent item");
  });

  describe("listQueueItems", () => {
    it("returns paginated list of queue items");
    it("filters by status");
    it("filters by priority");
    it("filters by assignedTo");
    it("sorts by createdAt");
    it("sorts by priority");
    it("returns total count");
  });

  describe("updateQueueItem", () => {
    it("updates queue item fields");
    it("can update priority");
    it("can update status");
    it("can update assignedTo");
    it("throws AIDetectionQueueNotFoundError for non-existent item");
  });

  describe("retryFailedItem", () => {
    it("resets attempts to 0");
    it("sets status to pending");
    it("clears lastError");
    it("throws AIDetectionQueueNotFoundError for non-existent item");
    it("throws AIDetectionQueueAlreadyProcessingError if currently processing");
  });
});
```

### test/ai-detection.service.appeals.test.ts

Test cases for appeal operations:

```typescript
describe("AIDetectionService - Appeals", () => {
  let service: AIDetectionService;
  
  let detectionResult: AIDetectionResultRow;
  let user: UserRow;
  let reviewer: UserRow;

  beforeEach(async () => {
    // Initialize test harness
    // Create test detection result with reviewDecision: confirmed
    // Create test users
  });

  describe("appealDetection", () => {
    it("creates appeal for detection result");
    it("sets userId and createdAt");
    it("sets status to pending");
    it("throws AIDetectionNotFoundError for non-existent result");
    it("throws AppealAlreadyResolvedError if detection already has appeal");
  });

  describe("getAppealById", () => {
    it("returns appeal by ID");
    it("throws AIDetectionAppealNotFoundError for non-existent appeal");
  });

  describe("listAppeals", () => {
    it("returns paginated list of appeals");
    it("filters by userId");
    it("filters by status");
    it("returns total count");
  });

  describe("resolveAppeal", () => {
    it("resolves appeal as upheld");
    it("resolves appeal as overturned");
    it("sets resolvedBy and resolvedAt");
    it("sets decision and notes");
    it("throws AIDetectionAppealNotFoundError for non-existent appeal");
    it("throws AppealAlreadyResolvedError if already resolved");
  });
});
```

## Test Data Builders

```typescript
// In test file or separate helpers
function buildDetectionResult(overrides: Partial<AIDetectionResultRow> = {}): Partial<AIDetectionResultRow> {
  return {
    id: `aid_${Date.now()}`,
    evidenceId: `evidence_${Date.now()}`,
    detectionType: 'image',
    confidenceScore: 75,
    category: 'high',
    modelVersion: 'hive-v2.0',
    isFlagged: true,
    ...overrides,
  };
}

function buildDetectionModel(overrides: Partial<CreateDetectionModelInput> = {}): CreateDetectionModelInput {
  return {
    name: `Test Model ${Date.now()}`,
    provider: 'hive',
    capabilities: ['image', 'video'],
    isActive: true,
    ...overrides,
  };
}

function buildQueueItem(overrides: Partial<AIDetectionQueueRow> = {}): Partial<AIDetectionQueueRow> {
  return {
    id: `aidq_${Date.now()}`,
    evidenceId: `evidence_${Date.now()}`,
    priority: 'normal',
    status: 'pending',
    attempts: 0,
    ...overrides,
  };
}
```

## Mock Detection Providers

For testing, create mock detection providers:

```typescript
// In test setup
const mockProvider: DetectionProvider = {
  name: 'Mock Provider',
  provider: 'custom',
  capabilities: ['image', 'video'],
  
  detect: async ({ fileBytes, mimeType, evidenceId }) => {
    // Return mock results based on test setup
    return {
      confidenceScore: 75,
      category: 'high',
      methodResults: {
        metadata_analysis: { confidence: 80, findings: {} },
        visual_artifact: { confidence: 70, findings: {} },
      },
    };
  },
};

// Register mock provider before tests
service['detectionProviders']?.registerProvider(mockProvider);
```

## Notes

- Follow existing test patterns from `test/blog.service.*`
- Use `describe`, `it`, `beforeEach`, `afterEach` appropriately
- Test both happy paths and error cases
- Test edge cases (empty inputs, boundary values, API failures)
- Use the test clock for time-sensitive operations
- Mock external detection APIs to avoid real API calls in tests
- Keep tests focused and fast
- Aim for > 90% code coverage
- Consider testing with different file types and sizes
- Consider testing rate limiting scenarios
