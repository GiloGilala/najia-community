# Issue 03: AI Detection Service

**Slice**: AI Manipulation Detection  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation), Evidence service (existing)  

---

## Description

Create the AI Detection service with all business logic for detecting AI manipulation in evidence files. This service will handle detection triggering, processing, result storage, and human review workflow.

## Acceptance Criteria

- [ ] `services/ai-detection.service.ts` exists with complete implementation
- [ ] All service methods follow existing patterns from `services/blog.service.ts`
- [ ] Service uses dependency injection pattern
- [ ] Service properly validates all inputs
- [ ] Service handles errors appropriately (throws typed errors)
- [ ] Service integrates with evidence service
- [ ] Service includes comprehensive JSDoc comments

## Service Interface

```typescript
interface AIDetectionService {
  // Detection Triggering
  triggerDetection(input: TriggerDetectionInput): Promise<AIDetectionQueueRow>;
  processQueue(): Promise<number>; // Process items from queue
  
  // Detection Results
  getDetectionResultById(id: string): Promise<AIDetectionResultRow>;
  getDetectionResultByEvidence(evidenceId: string): Promise<AIDetectionResultRow | null>;
  listDetectionResults(params: DetectionResultsListParams): Promise<{ results: AIDetectionResultRow[]; total: number }>;
  updateDetectionResult(id: string, updates: Partial<AIDetectionResultRow>): Promise<AIDetectionResultRow>;
  
  // Human Review
  reviewDetection(input: ReviewDetectionInput & { reviewedBy: string }): Promise<AIDetectionResultRow>;
  getFlaggedForReview(): Promise<AIDetectionResultRow[]>;
  
  // Appeals
  appealDetection(input: AppealDetectionInput & { userId: string }): Promise<AIDetectionAppealRow>;
  getAppealById(id: string): Promise<AIDetectionAppealRow>;
  listAppeals(params: DetectionAppealsListParams): Promise<{ appeals: AIDetectionAppealRow[]; total: number }>;
  resolveAppeal(input: { appealId: string; decision: AIDetectionReviewDecision; notes?: string; resolvedBy: string }): Promise<AIDetectionAppealRow>;
  
  // Model Management
  createModel(input: CreateDetectionModelInput): Promise<AIDetectionModelRow>;
  getModelById(id: string): Promise<AIDetectionModelRow>;
  updateModel(input: UpdateDetectionModelInput): Promise<AIDetectionModelRow>;
  deleteModel(id: string): Promise<void>;
  listModels(params: { provider?: AIProvider; isActive?: boolean }): Promise<AIDetectionModelRow[]>;
  toggleModel(id: string): Promise<AIDetectionModelRow>;
  testModel(input: TestDetectionModelInput): Promise<{ success: boolean; result?: AIDetectionCategory; error?: string }>;
  
  // Queue Management
  getQueueItemById(id: string): Promise<AIDetectionQueueRow>;
  listQueueItems(params: DetectionQueueListParams): Promise<{ items: AIDetectionQueueRow[]; total: number }>;
  updateQueueItem(input: UpdateQueueItemInput): Promise<AIDetectionQueueRow>;
  retryFailedItem(id: string): Promise<AIDetectionQueueRow>;
  
  // Analytics
  getDetectionMetrics(params: { period?: string; modelId?: string }): Promise<AIDetectionMetrics>;
  getFlagRate(): Promise<number>; // Percentage of evidence flagged
  getFalsePositiveRate(): Promise<number>; // If ground truth available
  getModelPerformance(modelId: string): Promise<AIDetectionModelPerformance>;
  
  // Integration with Evidence
  getEvidenceDetectionStatus(evidenceId: string): Promise<{ detected: boolean; flagged: boolean; category?: AIDetectionCategory }>;
  updateEvidenceWithDetection(evidenceId: string): Promise<void>; // Update evidence metadata
}
```

## Custom Errors

```typescript
// Queue Errors
export class AIDetectionQueueNotFoundError extends Error { ... }
export class AIDetectionQueueAlreadyProcessingError extends Error { ... }
export class AIDetectionQueueMaxAttemptsError extends Error { ... }

// Detection Errors
export class AIDetectionNotFoundError extends Error { ... }
export class AIDetectionAlreadyReviewedError extends Error { ... }
export class EvidenceNotDetectableError extends Error { ... }
export class DetectionModelNotFoundError extends Error { ... }
export class DetectionModelInactiveError extends Error { ... }
export class DetectionFailedError extends Error { ... }

// Appeal Errors
export class AIDetectionAppealNotFoundError extends Error { ... }
export class AppealAlreadyResolvedError extends Error { ... }

// Model Errors
export class DuplicateModelNameError extends Error { ... }
export class InvalidModelConfigError extends Error { ... }
export class ModelTestFailedError extends Error { ... }
```

## Service Dependencies

```typescript
interface AIDetectionServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Required: for accessing evidence files */
  storage: FileStorage;
  /** Optional: for sending notifications */
  notifier?: Notifier;
  /** Optional: external detection API clients */
  detectionProviders?: DetectionProviderRegistry;
}
```

## Detection Provider Interface

```typescript
interface DetectionProvider {
  name: string;
  provider: AIProvider;
  capabilities: AIDetectionType[];
  
  detect(args: {
    fileBytes: Uint8Array;
    mimeType: string;
    evidenceId: string;
  }): Promise<AIDetectionProviderResult>;
}

interface AIDetectionProviderResult {
  confidenceScore: number; // 0-100
  category: AIDetectionCategory;
  methodResults: Record<AIDetectionMethod, { confidence: number; findings: any }>;
  error?: string;
}

interface DetectionProviderRegistry {
  getProvider(provider: AIProvider): DetectionProvider | undefined;
  listProviders(): DetectionProvider[];
  registerProvider(provider: DetectionProvider): void;
}
```

## Helper Functions

The service should include helper functions for:

1. **File type detection**: Determine if file is image, video, audio, or document
2. **Provider selection**: Select appropriate provider based on file type and capabilities
3. **Confidence calculation**: Calculate ensemble confidence from multiple methods
4. **Category determination**: Determine category from confidence score
5. **Flag determination**: Determine if should be flagged based on category and thresholds
6. **Result aggregation**: Aggregate results from multiple detection methods

## Key Business Logic

### Detection Pipeline

```typescript
async function runDetection(evidenceId: string): Promise<AIDetectionResultRow> {
  // 1. Get evidence from database
  // 2. Get file from storage
  // 3. Determine file type
  // 4. Select appropriate detection model/provider
  // 5. Run detection methods
  // 6. Calculate ensemble score
  // 7. Determine category
  // 8. Determine if should be flagged
  // 9. Store detection result
  // 10. If flagged, create moderation queue item
  // 11. Return detection result
}
```

### Ensemble Score Calculation

```typescript
function calculateEnsembleScore(methodResults: Record<AIDetectionMethod, { confidence: number }>): number {
  // Calculate weighted average of all method confidences
  // Apply weights based on method reliability
  // Return final score (0-100)
}
```

### Queue Processing

```typescript
async function processQueueItem(item: AIDetectionQueueRow): Promise<void> {
  // 1. Update status to processing
  // 2. Try to run detection
  // 3. On success: update status to completed, store result
  // 4. On failure: increment attempts, store error
  // 5. If max attempts reached: update status to failed
  // 6. Handle retries
}
```

### Model Selection

```typescript
function selectModel(detectionType: AIDetectionType): AIDetectionModelRow | undefined {
  // 1. Get all active models with this capability
  // 2. Select based on priority, cost, accuracy
  // 3. Return selected model or undefined
}
```

## Integration Points

### Evidence Service
- Detection is triggered after evidence upload
- Detection results are linked to evidence
- Evidence metadata may be updated with detection status

### Moderation Service
- Flagged detections create moderation queue items
- AI Reviewer role can resolve detection reviews

### Storage Service
- Access evidence files for detection
- Store detection result files if needed

### Notification Service
- Notify AI Reviewers when items are flagged
- Notify users when their evidence is flagged
- Notify users when appeal decisions are made

## Notes

- Follow the dependency injection pattern from `services/blog.service.ts`
- Use `createAIDetectionService(deps: AIDetectionServiceDeps): AIDetectionService` pattern
- All async methods should properly handle database errors and external API failures
- Include comprehensive JSDoc comments for all public methods
- Use the validation schemas from Issue 02
- Return proper types from schema
- Throw typed errors for domain-specific failures
- Use the clock dependency for all date/time operations (testability)
- Consider rate limiting for external API calls
- Consider caching detection results to avoid re-processing
- Consider implementing a circuit breaker for external API calls
