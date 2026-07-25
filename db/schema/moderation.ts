import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

// =============================================================================
// Moderation — Content Type, Reason, Status, etc.
// =============================================================================

export type ModeratableContentType =
  | "poll_question"
  | "poll_comment"
  | "evidence"
  | "lawyer_profile"
  | "lawyer_review"
  | "case_comment"
  | "user_profile"
  | "blog_post"
  | "blog_comment";

export type ModerationReason =
  | "hate_speech"
  | "harassment"
  | "defamation"
  | "incitement"
  | "pornography"
  | "copyright_violation"
  | "impersonation"
  | "spam"
  | "fraud"
  | "off_topic"
  | "personal_attack"
  | "ai_manipulation"
  | "other";

export type ModerationPriority = "low" | "medium" | "high" | "critical";
export type ModerationQueueStatus = "pending" | "in_review" | "resolved" | "escalated";
export type ModerationResolution =
  | "approved"
  | "rejected"
  | "removed"
  | "edited"
  | "warning_issued"
  | "suspended";

export type ModerationActionType =
  | "flag"
  | "review_start"
  | "review_complete"
  | "approve"
  | "reject"
  | "remove"
  | "edit"
  | "warn"
  | "suspend"
  | "escalate"
  | "bulk_action";

export type ModerationAppealStatus = "pending" | "in_review" | "upheld" | "overturned";
export type AppealDecision = "upheld" | "overturned" | "pending" | "in_review";

export type ModerationRuleContentType = ModeratableContentType | "all";
export type ModerationRuleAction = "flag" | "remove" | "warn" | "approve";
export type ModerationRuleSeverity = "low" | "medium" | "high";

export type UserWarningSeverity = "mild" | "moderate" | "severe";
export type UserSuspensionType = "temporary" | "permanent";

// =============================================================================
// moderation_queue — single item awaiting review
// =============================================================================

export const moderationQueue = pgTable(
  "moderation_queue",
  {
    id: text("id").primaryKey(),
    contentType: text("content_type").notNull().$type<ModeratableContentType>(),
    contentId: text("content_id").notNull(),
    reportedBy: uuid("reported_by").references(() => users.id, { onDelete: "set null" }),
    reportedAt: timestamp("reported_at", { withTimezone: true }).notNull(),
    reason: text("reason").notNull().$type<ModerationReason | string>(),
    priority: text("priority").notNull().$type<ModerationPriority>(),
    status: text("status").notNull().$type<ModerationQueueStatus>(),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolution: text("resolution").$type<ModerationResolution>(),
    resolutionNotes: text("resolution_notes"),
    isAutomated: boolean("is_automated").notNull().default(false),
    aiConfidence: integer("ai_confidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_moderation_queue_content").on(table.contentType, table.contentId),
    index("idx_moderation_queue_status").on(table.status),
    index("idx_moderation_queue_priority").on(table.priority),
    index("idx_moderation_queue_assigned").on(table.assignedTo),
    index("idx_moderation_queue_reported_by").on(table.reportedBy),
    index("idx_moderation_queue_created").on(table.createdAt),
  ],
);

export type ModerationQueueRow = typeof moderationQueue.$inferSelect;
export type ModerationQueueInsert = typeof moderationQueue.$inferInsert;

// =============================================================================
// moderation_actions — record of a moderation action taken
// =============================================================================

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: text("id").primaryKey(),
    queueItemId: text("queue_item_id")
      .references(() => moderationQueue.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull().$type<ModerationActionType>(),
    actionedBy: uuid("actioned_by").references(() => users.id, { onDelete: "set null" }),
    actionedAt: timestamp("actioned_at", { withTimezone: true }).notNull().defaultNow(),
    details: text("details"), // JSON stringified
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("idx_moderation_actions_queue").on(table.queueItemId),
    index("idx_moderation_actions_type").on(table.actionType),
    index("idx_moderation_actions_by").on(table.actionedBy),
    index("idx_moderation_actions_at").on(table.actionedAt),
  ],
);

export type ModerationActionRow = typeof moderationActions.$inferSelect;
export type ModerationActionInsert = typeof moderationActions.$inferInsert;

// =============================================================================
// moderation_appeals — user appeal of a moderation decision
// =============================================================================

export const moderationAppeals = pgTable(
  "moderation_appeals",
  {
    id: text("id").primaryKey(),
    moderationActionId: text("moderation_action_id")
      .notNull()
      .references(() => moderationActions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: text("status").notNull().$type<ModerationAppealStatus>(),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    decision: text("decision").$type<AppealDecision>(),
    decisionNotes: text("decision_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_moderation_appeals_action").on(table.moderationActionId),
    index("idx_moderation_appeals_user").on(table.userId),
    index("idx_moderation_appeals_status").on(table.status),
  ],
);

export type ModerationAppealRow = typeof moderationAppeals.$inferSelect;
export type ModerationAppealInsert = typeof moderationAppeals.$inferInsert;

// =============================================================================
// user_warnings — warning issued to a user
// =============================================================================

export const userWarnings = pgTable(
  "user_warnings",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuedBy: uuid("issued_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    severity: text("severity").notNull().$type<UserWarningSeverity>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_warnings_user").on(table.userId),
    index("idx_user_warnings_issued").on(table.issuedBy),
    index("idx_user_warnings_active").on(table.isActive),
  ],
);

export type UserWarningRow = typeof userWarnings.$inferSelect;
export type UserWarningInsert = typeof userWarnings.$inferInsert;

// =============================================================================
// user_suspensions — temporary or permanent suspension
// =============================================================================

export const userSuspensions = pgTable(
  "user_suspensions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuedBy: uuid("issued_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    type: text("type").notNull().$type<UserSuspensionType>(),
    duration: integer("duration"), // days for temporary
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    canAppeal: boolean("can_appeal").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_suspensions_user").on(table.userId),
    index("idx_user_suspensions_issued").on(table.issuedBy),
    index("idx_user_suspensions_active").on(table.isActive),
  ],
);

export type UserSuspensionRow = typeof userSuspensions.$inferSelect;
export type UserSuspensionInsert = typeof userSuspensions.$inferInsert;

// =============================================================================
// moderation_rules — configurable automated rules
// =============================================================================

export const moderationRules = pgTable(
  "moderation_rules",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    contentType: text("content_type").notNull().$type<ModerationRuleContentType>(),
    pattern: text("pattern"), // regex string
    keywords: text("keywords"), // JSON array string
    action: text("action").notNull().$type<ModerationRuleAction>(),
    severity: text("severity").notNull().$type<ModerationRuleSeverity>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("moderation_rules_name_unique").on(table.name),
    index("idx_moderation_rules_content").on(table.contentType),
    index("idx_moderation_rules_active").on(table.isActive),
  ],
);

export type ModerationRuleRow = typeof moderationRules.$inferSelect;
export type ModerationRuleInsert = typeof moderationRules.$inferInsert;
