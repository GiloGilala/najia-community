import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { evidence } from "./evidence.ts";

// =============================================================================
// Types
// =============================================================================

export type AIDetectionType = "image" | "video" | "audio" | "document";
export type AIDetectionCategory = "low" | "medium" | "high";
export type AIDetectionMethod =
  | "metadata_analysis"
  | "visual_artifact"
  | "audio_video_sync"
  | "facial_inconsistency"
  | "generation_watermark";
export type AIProvider = "hive" | "google" | "aws" | "custom" | "local";
export type AIDetectionReviewDecision = "confirmed" | "false_positive" | "uncertain";
export type AIQueueStatus = "pending" | "processing" | "completed" | "failed";
export type AIQueuePriority = "low" | "normal" | "high";

// =============================================================================
// ai_detection_results
// =============================================================================

export const aiDetectionResults = pgTable(
  "ai_detection_results",
  {
    id: text("id").primaryKey(),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    detectionType: text("detection_type").notNull().$type<AIDetectionType>(),
    confidenceScore: integer("confidence_score").notNull(),
    category: text("category").notNull().$type<AIDetectionCategory>(),
    modelVersion: text("model_version").notNull(),
    modelThresholds: text("model_thresholds"), // JSON
    detectionMethods: text("detection_methods").notNull(), // JSON array
    isFlagged: boolean("is_flagged").notNull().default(false),
    flagReason: text("flag_reason"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewDecision: text("review_decision").$type<AIDetectionReviewDecision>(),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ai_detection_results_evidence").on(table.evidenceId),
    index("idx_ai_detection_results_category").on(table.category),
    index("idx_ai_detection_results_flagged").on(table.isFlagged),
    index("idx_ai_detection_results_detected").on(table.detectedAt),
    index("idx_ai_detection_results_reviewed").on(table.reviewedAt),
  ],
);

export type AIDetectionResultRow = typeof aiDetectionResults.$inferSelect;
export type AIDetectionResultInsert = typeof aiDetectionResults.$inferInsert;

// =============================================================================
// ai_detection_method_results
// =============================================================================

export const aiDetectionMethodResults = pgTable(
  "ai_detection_method_results",
  {
    id: text("id").primaryKey(),
    detectionResultId: text("detection_result_id")
      .notNull()
      .references(() => aiDetectionResults.id, { onDelete: "cascade" }),
    method: text("method").notNull().$type<AIDetectionMethod>(),
    confidence: integer("confidence").notNull(),
    findings: text("findings"), // JSON
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ai_detection_method_results_result").on(table.detectionResultId),
    index("idx_ai_detection_method_results_method").on(table.method),
  ],
);

export type AIDetectionMethodResultRow = typeof aiDetectionMethodResults.$inferSelect;
export type AIDetectionMethodResultInsert = typeof aiDetectionMethodResults.$inferInsert;

// =============================================================================
// ai_detection_models
// =============================================================================

export const aiDetectionModels = pgTable(
  "ai_detection_models",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    provider: text("provider").notNull().$type<AIProvider>(),
    apiEndpoint: text("api_endpoint"),
    apiKeyEncrypted: text("api_key_encrypted"),
    isActive: boolean("is_active").notNull().default(true),
    capabilities: text("capabilities").notNull(), // JSON array
    costPerRequest: numeric("cost_per_request"),
    rateLimitPerMinute: integer("rate_limit_per_minute"),
    config: text("config"), // JSON
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    lastTestResult: text("last_test_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_detection_models_name_unique").on(table.name),
    index("idx_ai_detection_models_provider").on(table.provider),
    index("idx_ai_detection_models_active").on(table.isActive),
  ],
);

export type AIDetectionModelRow = typeof aiDetectionModels.$inferSelect;
export type AIDetectionModelInsert = typeof aiDetectionModels.$inferInsert;

// =============================================================================
// ai_detection_queue
// =============================================================================

export const aiDetectionQueue = pgTable(
  "ai_detection_queue",
  {
    id: text("id").primaryKey(),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    priority: text("priority").notNull().$type<AIQueuePriority>(),
    status: text("status").notNull().$type<AIQueueStatus>(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    assignedTo: text("assigned_to"), // worker ID
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ai_detection_queue_status").on(table.status),
    index("idx_ai_detection_queue_priority").on(table.priority),
    index("idx_ai_detection_queue_evidence").on(table.evidenceId),
    index("idx_ai_detection_queue_created").on(table.createdAt),
  ],
);

export type AIDetectionQueueRow = typeof aiDetectionQueue.$inferSelect;
export type AIDetectionQueueInsert = typeof aiDetectionQueue.$inferInsert;

// =============================================================================
// ai_detection_appeals (for completeness, though not in schema issue, needed for service)
// =============================================================================

export const aiDetectionAppeals = pgTable(
  "ai_detection_appeals",
  {
    id: text("id").primaryKey(),
    detectionResultId: text("detection_result_id")
      .notNull()
      .references(() => aiDetectionResults.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: text("status").notNull().$type<"pending" | "in_review" | "upheld" | "overturned">(),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    decision: text("decision").$type<AIDetectionReviewDecision>(),
    decisionNotes: text("decision_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ai_detection_appeals_result").on(table.detectionResultId),
    index("idx_ai_detection_appeals_user").on(table.userId),
    index("idx_ai_detection_appeals_status").on(table.status),
  ],
);

export type AIDetectionAppealRow = typeof aiDetectionAppeals.$inferSelect;
export type AIDetectionAppealInsert = typeof aiDetectionAppeals.$inferInsert;
