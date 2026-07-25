# Issue 01: AI Detection Schema and Database Tables

**Slice**: AI Manipulation Detection  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Evidence Integrity service (existing)  

---

## Description

Create the database schema for the AI Manipulation Detection slice, including tables for detection results, detection methods, detection models, and detection queue.

## Acceptance Criteria

- [ ] `db/schema/ai-detection.ts` exists with properly typed tables
- [ ] All tables follow naming conventions (prefixes: aid_, aidm_, aidmodel_, aidq_)
- [ ] All foreign key relationships are properly defined (to evidence, users)
- [ ] Indexes are created for query performance
- [ ] Enums are defined for detection categories and statuses
- [ ] Schema exports types for use in services
- [ ] Drizzle configuration includes new schema file
- [ ] Migrations are generated and applied

## Tables to Create

### ai_detection_results

Stores the results of AI manipulation detection on evidence items.

```typescript
- id: text primary key (aid_ prefix)
- evidenceId: text not null references evidence(id)
- detectionType: text not null (enum: image, video, audio, document)
- confidenceScore: integer not null (0-100)
- category: text not null (enum: low, medium, high)
- modelVersion: text not null
- modelThresholds: text (JSON, nullable)
- detectionMethods: text[] (JSON array, not null)
- isFlagged: boolean not null default false
- flagReason: text (nullable, max 500 chars)
- detectedAt: timestamptz not null
- reviewedBy: text references users (nullable)
- reviewedAt: timestamptz (nullable)
- reviewDecision: text (enum: confirmed, false_positive, uncertain) (nullable)
- reviewNotes: text (nullable, max 1000 chars)
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### ai_detection_method_results

Detailed results from specific detection methods.

```typescript
- id: text primary key (aidm_ prefix)
- detectionResultId: text not null references ai_detection_results(id)
- method: text not null (enum: metadata_analysis, visual_artifact, audio_video_sync, facial_inconsistency, generation_watermark)
- confidence: integer not null (0-100)
- findings: text (JSON, nullable) - method-specific findings
- createdAt: timestamptz not null default now()
```

### ai_detection_models

Configuration for detection models/APIs.

```typescript
- id: text primary key (aidmodel_ prefix)
- name: text not null (max 100 chars)
- provider: text not null (enum: hive, google, aws, custom, local)
- apiEndpoint: text (nullable, max 500 chars)
- apiKeyEncrypted: text (nullable) - encrypted API key
- isActive: boolean not null default true
- capabilities: text[] (JSON array) - supported detection types
- costPerRequest: numeric (nullable) - estimated cost
- rateLimitPerMinute: integer (nullable) - API rate limit
- config: text (JSON, nullable) - model-specific configuration
- lastTestedAt: timestamptz (nullable)
- lastTestResult: text (nullable) - success/error message
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

### ai_detection_queue

Queue of evidence items awaiting AI detection.

```typescript
- id: text primary key (aidq_ prefix)
- evidenceId: text not null references evidence(id)
- priority: text not null (enum: low, normal, high)
- status: text not null (enum: pending, processing, completed, failed)
- attempts: integer not null default 0
- lastError: text (nullable, max 1000 chars)
- assignedTo: text (nullable, max 100 chars) - worker/process ID
- assignedAt: timestamptz (nullable)
- completedAt: timestamptz (nullable)
- createdAt: timestamptz not null default now()
- updatedAt: timestamptz not null default now()
```

## Indexes to Create

```sql
-- ai_detection_results
CREATE INDEX idx_ai_detection_results_evidence ON ai_detection_results(evidenceId);
CREATE INDEX idx_ai_detection_results_category ON ai_detection_results(category);
CREATE INDEX idx_ai_detection_results_flagged ON ai_detection_results(isFlagged) WHERE isFlagged = true;
CREATE INDEX idx_ai_detection_results_detected ON ai_detection_results(detectedAt);
CREATE INDEX idx_ai_detection_results_reviewed ON ai_detection_results(reviewedAt);

-- ai_detection_method_results
CREATE INDEX idx_ai_detection_method_results_result ON ai_detection_method_results(detectionResultId);
CREATE INDEX idx_ai_detection_method_results_method ON ai_detection_method_results(method);

-- ai_detection_models
CREATE INDEX idx_ai_detection_models_provider ON ai_detection_models(provider);
CREATE INDEX idx_ai_detection_models_active ON ai_detection_models(isActive) WHERE isActive = true;

-- ai_detection_queue
CREATE INDEX idx_ai_detection_queue_status ON ai_detection_queue(status);
CREATE INDEX idx_ai_detection_queue_priority ON ai_detection_queue(priority);
CREATE INDEX idx_ai_detection_queue_evidence ON ai_detection_queue(evidenceId);
CREATE INDEX idx_ai_detection_queue_created ON ai_detection_queue(createdAt);
```

## Enums to Define

```typescript
export type AIDetectionType = 'image' | 'video' | 'audio' | 'document';
export type AIDetectionCategory = 'low' | 'medium' | 'high';
export type AIDetectionMethod = 
  | 'metadata_analysis'
  | 'visual_artifact'
  | 'audio_video_sync'
  | 'facial_inconsistency'
  | 'generation_watermark';
export type AIProvider = 'hive' | 'google' | 'aws' | 'custom' | 'local';
export type AIDetectionReviewDecision = 'confirmed' | 'false_positive' | 'uncertain';
export type AIQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AIQueuePriority = 'low' | 'normal' | 'high';
```

## Notes

- Follow existing schema patterns from `db/schema/blog.ts`, `db/schema/legal-literacy.ts`
- Use `pgTable` for PostgreSQL tables
- Store API keys encrypted (use Bun's crypto or a dedicated encryption utility)
- Consider adding a `ai_detection_audit` table for comprehensive audit trail
- The `capabilities` field should store which detection types the model supports
- The `config` field can store model-specific parameters (thresholds, etc.)
