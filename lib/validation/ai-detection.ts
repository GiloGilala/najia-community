import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

export const aiDetectionTypeEnum = z.enum(["image", "video", "audio", "document"]);
export type AIDetectionType = z.infer<typeof aiDetectionTypeEnum>;

export const aiDetectionCategoryEnum = z.enum(["low", "medium", "high"]);
export type AIDetectionCategory = z.infer<typeof aiDetectionCategoryEnum>;

export const aiDetectionMethodEnum = z.enum([
  "metadata_analysis",
  "visual_artifact",
  "audio_video_sync",
  "facial_inconsistency",
  "generation_watermark",
]);
export type AIDetectionMethod = z.infer<typeof aiDetectionMethodEnum>;

export const aiProviderEnum = z.enum(["hive", "google", "aws", "custom", "local"]);
export type AIProvider = z.infer<typeof aiProviderEnum>;

export const aiReviewDecisionEnum = z.enum(["confirmed", "false_positive", "uncertain"]);
export type AIDetectionReviewDecision = z.infer<typeof aiReviewDecisionEnum>;

export const aiQueueStatusEnum = z.enum(["pending", "processing", "completed", "failed"]);
export type AIQueueStatus = z.infer<typeof aiQueueStatusEnum>;

export const aiQueuePriorityEnum = z.enum(["low", "normal", "high"]);
export type AIQueuePriority = z.infer<typeof aiQueuePriorityEnum>;

// =============================================================================
// Trigger Detection
// =============================================================================

export const triggerDetectionSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID is required"),
  priority: aiQueuePriorityEnum.optional().default("normal"),
});
export type TriggerDetectionInput = z.infer<typeof triggerDetectionSchema>;

// =============================================================================
// Review Detection
// =============================================================================

export const reviewDetectionSchema = z.object({
  detectionId: z.string().min(1, "Detection ID is required"),
  decision: aiReviewDecisionEnum,
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
});
export type ReviewDetectionInput = z.infer<typeof reviewDetectionSchema>;

// =============================================================================
// Appeal Detection
// =============================================================================

export const appealDetectionSchema = z.object({
  detectionId: z.string().min(1, "Detection ID is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be at most 500 characters"),
});
export type AppealDetectionInput = z.infer<typeof appealDetectionSchema>;

// =============================================================================
// Create Detection Model
// =============================================================================

export const createDetectionModelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  provider: aiProviderEnum,
  apiEndpoint: z.string().max(500, "API endpoint must be at most 500 characters").url().optional(),
  apiKey: z.string().max(1000, "API key must be at most 1000 characters").optional(),
  capabilities: z.array(aiDetectionTypeEnum).min(1, "At least one capability is required"),
  costPerRequest: z.number().nonnegative("Cost must be non-negative").optional(),
  rateLimitPerMinute: z.number().int().positive("Rate limit must be a positive integer").optional(),
  config: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
});
export type CreateDetectionModelInput = z.infer<typeof createDetectionModelSchema>;

export const updateDetectionModelSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
  provider: aiProviderEnum.optional(),
  apiEndpoint: z.string().max(500, "API endpoint must be at most 500 characters").url().optional().nullable(),
  apiKey: z.string().max(1000, "API key must be at most 1000 characters").optional().nullable(),
  capabilities: z.array(aiDetectionTypeEnum).min(1, "At least one capability is required").optional(),
  costPerRequest: z.number().nonnegative("Cost must be non-negative").optional().nullable(),
  rateLimitPerMinute: z.number().int().positive("Rate limit must be a positive integer").optional().nullable(),
  config: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateDetectionModelInput = z.infer<typeof updateDetectionModelSchema>;

export const testDetectionModelSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
  testFileUrl: z.string().url("Invalid URL format"),
  expectedResult: aiDetectionCategoryEnum.optional(),
});
export type TestDetectionModelInput = z.infer<typeof testDetectionModelSchema>;

// =============================================================================
// Queue Item Update
// =============================================================================

export const updateQueueItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
  priority: aiQueuePriorityEnum.optional(),
  status: aiQueueStatusEnum.optional(),
  assignedTo: z.string().max(100, "Assigned to must be at most 100 characters").optional().nullable(),
});
export type UpdateQueueItemInput = z.infer<typeof updateQueueItemSchema>;

// =============================================================================
// Query Schemas
// =============================================================================

export const detectionResultsListSchema = z.object({
  evidenceId: z.string().optional(),
  category: aiDetectionCategoryEnum.optional(),
  isFlagged: z.boolean().optional(),
  reviewed: z.boolean().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(20),
  sortBy: z.enum(["detectedAt", "confidenceScore", "category"]).optional().default("detectedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type DetectionResultsListParams = z.infer<typeof detectionResultsListSchema>;

export const detectionQueueListSchema = z.object({
  status: aiQueueStatusEnum.optional(),
  priority: aiQueuePriorityEnum.optional(),
  assignedTo: z.string().optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
  sortBy: z.enum(["createdAt", "priority", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type DetectionQueueListParams = z.infer<typeof detectionQueueListSchema>;

export const detectionAppealsListSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(["pending", "in_review", "upheld", "overturned"]).optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
});
export type DetectionAppealsListParams = z.infer<typeof detectionAppealsListSchema>;

// =============================================================================
// Helpers
// =============================================================================

export function validateConfidenceScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getCategoryFromScore(score: number): AIDetectionCategory {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

export function shouldFlag(
  category: AIDetectionCategory,
  thresholds: { low: boolean; medium: boolean; high: boolean },
): boolean {
  return thresholds[category];
}
