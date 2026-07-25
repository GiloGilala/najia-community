# AI Manipulation Detection - Specification

**Slice**: AI Manipulation Detection  
**Reference**: Platform Documentation §4.3  
**Status**: NOT YET IMPLEMENTED  
**Priority**: High (critical for evidence integrity)  
**Dependencies**: 
- Evidence Integrity service (for hash verification foundation)
- File storage (for storing detection results)

---

## Overview

The AI-Powered Manipulation Detection system flags plausible AI-generated or manipulated media as an input to human review, not as a definitive verdict. This complements the existing chain-of-custody integrity verification by adding probabilistic detection of synthetic media.

**Key Principle**: AI detection is **not definitive** - it flags content for human review. Users must be informed of detection limitations.

---

## Domain Model

### Detection Result

Result of AI manipulation detection on a piece of evidence.

**Properties:**
- `id`: Unique identifier (prefix: `aid_`)
- `evidenceId`: Reference to the evidence record
- `detectionType`: `image` | `video` | `audio` | `document`
- `confidenceScore`: Float (0-100) indicating likelihood of manipulation
- `category`: `low` (0-33%) | `medium` (34-66%) | `high` (67-100%)
- `modelVersion`: Which detection model was used
- `modelThresholds`: JSON with model-specific thresholds
- `detectionMethods`: Array of methods applied (metadata_analysis, visual_artifacts, etc.)
- `isFlagged`: Boolean - whether this should be flagged for human review
- `flagReason`: Reason for flagging (if flagged)
- `detectedAt`: When detection was performed
- `reviewedBy`: Moderator who reviewed (nullable)
- `reviewedAt`: When human review was completed (nullable)
- `reviewDecision`: `confirmed` | `false_positive` | `uncertain` (nullable)
- `reviewNotes`: Notes from human reviewer (nullable)
- `createdAt`: When record was created
- `updatedAt`: When last updated

### Detection Method Result

Detailed results from a specific detection method.

**Properties:**
- `id`: Unique identifier (prefix: `aidm_`)
- `detectionResultId`: Reference to parent detection result
- `method`: `metadata_analysis` | `visual_artifact` | `audio_video_sync` | `facial_inconsistency` | `generation_watermark`
- `confidence`: Float (0-100) for this specific method
- `findings`: JSON with method-specific findings
- `createdAt`: When this method was run

### Detection Model

Configuration for a detection model/API.

**Properties:**
- `id`: Unique identifier (prefix: `aidmodel_`)
- `name`: Model name (e.g., "Hive Moderation", "Google Vision AI")
- `provider`: `hive` | `google` | `aws` | `custom` | `local`
- `apiEndpoint`: API endpoint URL (nullable for local)
- `apiKey`: Encrypted API key (nullable)
- `isActive`: Boolean
- `capabilities`: Array of detection types supported
- `costPerRequest`: Estimated cost per API call
- `rateLimit`: Requests per minute limit
- `config`: JSON with model-specific configuration
- `createdAt`: When model was configured
- `updatedAt`: When last updated

### Detection Queue

Queue of evidence items awaiting AI detection.

**Properties:**
- `id`: Unique identifier (prefix: `aidq_`)
- `evidenceId`: Reference to evidence
- `priority`: `low` | `normal` | `high`
- `status`: `pending` | `processing` | `completed` | `failed`
- `attempts`: Number of detection attempts
- `lastError`: Error message from last attempt (nullable)
- `assignedTo`: Worker/process assigned (nullable)
- `createdAt`: When queued
- `updatedAt`: When last updated

---

## Detection Methods

Based on platform documentation §4.3.3:

| Method | Description | Applicable Media | Implementation |
|--------|-------------|-----------------|----------------|
| `metadata_analysis` | Examine file metadata for generation artifacts (EXIF, creation tools, timestamps) | Images, Videos | ✅ Priority 1 |
| `visual_artifact` | Detect pixel-level anomalies, compression patterns, unnatural textures | Images | ✅ Priority 1 |
| `audio_video_sync` | Check lip sync and audio coherence | Videos | ✅ Priority 2 |
| `facial_inconsistency` | Identify inconsistent facial features, blending artifacts, unnatural eye movement | Images, Videos | ✅ Priority 2 |
| `generation_watermark` | Detect generation-time watermarks (C2PA, etc.) | Images, Videos | ✅ Priority 3 |
| `text_analysis` | Detect AI-generated text patterns | Documents | ⏸️ Future |
| `deepfake_audio` | Detect AI-generated voice | Audio | ⏸️ Future (out of scope initially) |

---

## Detection Pipeline Flow

Based on platform documentation §4.4:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI DETECTION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stage 1: User uploads evidence                                         │
│       │                                                               │
│       ▼                                                               │
│  Stage 2: Hash + timestamp generated (integrity)                     │
│       │                                                               │
│       ▼                                                               │
│  Stage 3: File type checked                                            │
│       │                                                               │
│       ├───────────────────────┬─────────────────────────────────────│
│       ▼                       ▼                                     │
│  Stage 4a:              Stage 4b:                                  │
│  Not image/video         Image/Video                               │
│  ───────────            ─────────────                              │
│  Skip AI detection     Proceed to AI detection                    │
│  (integrity-only)       │                                           │
│                         ▼                                           │
│  Stage 5: Queue for     Stage 5: Metadata analysis performed        │
│  async processing      ─────────────────────────────────────────────│
│  (optional)             Stage 6: Visual artifact detection          │
│                         Stage 7: Audio-video sync (video only)      │
│                         Stage 8: Facial inconsistency detection     │
│                         Stage 9: Generation watermark detection    │
│                         ─────────────────────────────────────────────│
│                         Stage 10: Ensemble score calculated         │
│                         Stage 11: Category assigned                 │
│                              │                                      │
│                              ▼                                      │
│  Stage 12: Results stored and displayed                             │
│       │                                                               │
│       ▼                                                               │
│  Stage 13: High confidence → auto-flag for human review            │
│              Medium confidence → flag for human review              │
│              Low confidence → pass through                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### UC-01: Detect Manipulation on Upload (System)
1. User uploads evidence file
2. System checks file type
3. If image/video, system queues for AI detection
4. System processes detection asynchronously
5. System stores detection results
6. System updates evidence record with detection status

**Triggers**: Evidence upload, evidence re-verification request

### UC-02: View Detection Results (User)
1. User views their evidence
2. System displays integrity status (hash verification)
3. System displays AI detection status (if applicable)
4. User sees confidence level and category
5. User sees disclaimer about detection limitations

**Permissions**: Evidence owner or moderator+

### UC-03: Flag for Human Review (System)
1. Detection completes with medium/high confidence
2. System creates moderation queue item
3. System links detection result to queue item
4. System notifies AI reviewers

**Triggers**: Detection completion with flag-worthy confidence

### UC-04: Human Review Detection (AI Reviewer)
1. AI Reviewer views flagged evidence
2. System displays detection results and original evidence
3. Reviewer examines evidence and detection findings
4. Reviewer confirms, rejects, or marks as uncertain
5. Reviewer adds notes
6. System updates detection result with review decision
7. System updates evidence status if needed

**Permissions**: `ai:review` (AI Reviewer role)

### UC-05: Appeal Detection Result (User)
1. User disagrees with detection result
2. User requests human re-review
3. System creates appeal record
4. System queues for AI reviewer
5. AI Reviewer performs re-review
6. System updates detection result

**Permissions**: `ai:appeal` (citizen+)

### UC-06: Configure Detection Models (Admin)
1. Admin navigates to AI detection settings
2. System displays configured models
3. Admin can add, edit, remove, enable/disable models
4. Admin can test model configuration
5. System validates and saves changes

**Permissions**: `ai:configure` (admin only)

### UC-07: View Detection Analytics (Admin)
1. Admin navigates to AI detection dashboard
2. System displays metrics:
   - Total detections performed
   - Detections by media type
   - Detections by category (low/medium/high)
   - False positive rate
   - Detection accuracy (if ground truth available)
   - Model performance comparison
   - Cost tracking
3. Admin can filter by date range, model, media type

**Permissions**: `ai:analytics` (admin only)

---

## Detection Output

Based on platform documentation §4.3.4:

| Output Type | Description | Format |
|-------------|-------------|--------|
| Confidence Score | Float value indicating likelihood of manipulation | 0-100 |
| Category | Low (0-33%), Medium (34-66%), High (67-100%) | Enum |
| Detection Model Version | Which model and thresholds scored this file | String |
| Applicability Flag | Whether AI detection was attempted for this file type | Boolean |

### Display to Users

| Display Element | Description | Example |
|----------------|-------------|---------|
| Integrity Status | "This file passed/failed integrity checks" | Green badge / Red warning |
| AI Detection Status | "This file was/was not flagged for AI manipulation" | Text |
| User Guidance | "Users should independently evaluate authenticity" | Text |
| Confidence Level | Low / Medium / High | Colored indicator |
| Disclaimer | "This is an automated detection, not a definitive verdict" | Prominent text |

---

## API Endpoints

### Detection
- `POST /api/ai/detect` - Trigger detection on evidence (internal/system)
- `GET /api/ai/detection/:evidenceId` - Get detection results (owner/moderator+)
- `GET /api/ai/detection` - List detection results (admin)

### Review
- `GET /api/ai/review/queue` - List flagged for review (AI Reviewer+)
- `POST /api/ai/review/:detectionId/confirm` - Confirm manipulation (AI Reviewer+)
- `POST /api/ai/review/:detectionId/reject` - Reject as false positive (AI Reviewer+)
- `POST /api/ai/review/:detectionId/uncertain` - Mark as uncertain (AI Reviewer+)

### Appeals
- `POST /api/ai/appeal` - Appeal detection result (owner)
- `GET /api/ai/appeals` - List appeals (AI Reviewer+)
- `POST /api/ai/appeals/:id/review` - Review appeal (AI Reviewer+)

### Models
- `GET /api/ai/models` - List detection models (admin)
- `POST /api/ai/models` - Add detection model (admin)
- `PUT /api/ai/models/:id` - Update detection model (admin)
- `DELETE /api/ai/models/:id` - Remove detection model (admin)
- `POST /api/ai/models/:id/test` - Test detection model (admin)

### Analytics
- `GET /api/ai/analytics` - Get detection analytics (admin)

---

## Validation Rules

### Trigger Detection
- `evidenceId`: Required, valid evidence ID
- `priority`: Optional, `low` | `normal` | `high` (default: `normal`)

### Review Detection
- `detectionId`: Required, valid detection result ID
- `decision`: Required, `confirmed` | `false_positive` | `uncertain`
- `notes`: Optional, string (max 1000 chars)

### Appeal Detection
- `detectionId`: Required, valid detection result ID
- `reason`: Required, string (1-500 chars)

### Configure Model
- `name`: Required, string (1-100 chars)
- `provider`: Required, `hive` | `google` | `aws` | `custom` | `local`
- `apiEndpoint`: Optional, valid URL
- `apiKey`: Optional, string
- `capabilities`: Required, array of detection types
- `isActive`: Optional, boolean (default: true)
- `config`: Optional, JSON object

---

## Known Limitations

Based on platform documentation §4.3.7:

| Limitation | Communication |
|------------|---------------|
| Detectors tuned for synthetic faces/deepfakes | Most civil-dispute evidence (property damage, receipts, chat screenshots) is not in-scope |
| False positives possible | Users are informed of detection limitations |
| False negatives possible | Users are encouraged to independently verify |
| No detection is perfect | Clear communication of probabilistic nature |
| Coverage limited to certain media types | Audio, documents may not be analyzed initially |

### Detection Scope Limits

**Initially Supported:**
- Images (JPG, PNG, WebP)
- Videos (MP4, AVI, WebM)

**Not Initially Supported:**
- Audio only (MP3, WAV, M4A) - out of scope due to detection complexity and cost
- Documents (PDF, DOCX, TXT) - manipulation assessed through hash only

**Note**: Audio deepfakes are a real risk but explicitly out of scope for initial implementation.

---

## Cache Strategy

| Data | Cache Key | TTL | Invalidation |
|------|-----------|-----|--------------|
| Detection results | `ai:detection:{evidenceId}` | 24 hours | New detection, review |
| Detection queue | `ai:queue` | 1 min | Queue changes |
| Model config | `ai:models` | 1 hour | Model CRUD, toggle |
| Analytics | `ai:analytics` | 1 hour | New detection, end of day |

---

## Rate Limiting

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| POST /api/ai/detect | 10 | 1 minute | Per evidence item |
| POST /api/ai/review/* | 20 | 1 minute | Per reviewer |
| POST /api/ai/appeal | 3 | 1 day | Per user per evidence |
| Model testing | 5 | 1 hour | Per admin |

---

## RBAC Permissions

| Resource | Citizen | Lawyer | Writer | Moderator | Admin | AI Reviewer |
|----------|---------|--------|--------|-----------|-------|------------|
| ai:detect | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (internal) |
| ai:view | ✅ own | ✅ own | ✅ own | ✅ all | ✅ all | ✅ all |
| ai:review | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| ai:appeal | ✅ own | ✅ own | ✅ own | ✅ own | ✅ own | ✅ all |
| ai:configure | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| ai:analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Integration Points

### Evidence Service Integration
- Detection is triggered after evidence upload completes
- Detection results are linked to evidence records
- Evidence status may be updated based on detection + review

### Moderation Service Integration
- High/medium confidence detections auto-create moderation queue items
- AI Reviewer role can resolve both detection reviews and moderation items

### Notification Service Integration
- Notifications sent to:
  - AI Reviewers when items are flagged
  - Users when their content is flagged
  - Users when appeal decisions are made

---

## Database Schema (Reference)

See implementation in `db/schema/ai-detection.ts`

---

## Implementation Tickets

See `.scratch/ai-detection/issues/` directory for individual implementation tickets.
