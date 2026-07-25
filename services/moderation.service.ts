import {
  and,
  asc,
  desc,
  eq,
  count,
  sql,
  or,
  isNull,
  gt,
  lt,
  ne,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import type { Notifier } from "../lib/notify/notifier.ts";

import {
  reportContentSchema,
  autoFlagContentSchema,
  resolveQueueItemSchema,
  moderateContentSchema,
  createModerationRuleSchema,
  updateModerationRuleSchema,
  issueWarningSchema,
  suspendUserSchema,
  liftSuspensionSchema,
  fileAppealSchema,
  decideAppealSchema,
  moderationQueueListSchema,
  moderationAppealListSchema,
  moderationRulesListSchema,
  type ReportContentInput,
  type AutoFlagContentInput,
  type ResolveQueueItemInput,
  type ModerateContentInput,
  type CreateModerationRuleInput,
  type UpdateModerationRuleInput,
  type IssueWarningInput,
  type SuspendUserInput,
  type LiftSuspensionInput,
  type FileAppealInput,
  type DecideAppealInput,
  type ModerationQueueListParams,
  type ModerationAppealListParams,
  type ModerationRulesListParams,
  type ModeratableContentType,
  type ModerationPriority,
  type ModerationResolution,
} from "../lib/validation/moderation.ts";

import {
  moderationQueue,
  moderationActions,
  moderationAppeals,
  userWarnings,
  userSuspensions,
  moderationRules,
  type ModerationQueueRow,
  type ModerationActionRow,
  type ModerationAppealRow,
  type UserWarningRow,
  type UserSuspensionRow,
  type ModerationRuleRow,
  type ModerationRuleContentType,
  type ModerationRuleSeverity,
} from "../db/schema/moderation.ts";

// =============================================================================
// Custom Errors
// =============================================================================

export class ModerationQueueNotFoundError extends Error {
  constructor(id: string) {
    super(`Moderation queue item not found: ${id}`);
    this.name = "ModerationQueueNotFoundError";
  }
}

export class ModerationQueueAlreadyAssignedError extends Error {
  constructor(id: string) {
    super(`Moderation queue item ${id} is already assigned`);
    this.name = "ModerationQueueAlreadyAssignedError";
  }
}

export class ModerationQueueAlreadyResolvedError extends Error {
  constructor(id: string) {
    super(`Moderation queue item ${id} is already resolved`);
    this.name = "ModerationQueueAlreadyResolvedError";
  }
}

export class ModerationRuleNotFoundError extends Error {
  constructor(id: string) {
    super(`Moderation rule not found: ${id}`);
    this.name = "ModerationRuleNotFoundError";
  }
}

export class DuplicateRuleNameError extends Error {
  constructor(name: string) {
    super(`Moderation rule with name \"${name}\" already exists`);
    this.name = "DuplicateRuleNameError";
  }
}

export class InvalidRegexPatternError extends Error {
  constructor(pattern: string) {
    super(`Invalid regex pattern: ${pattern}`);
    this.name = "InvalidRegexPatternError";
  }
}

export class UserWarningNotFoundError extends Error {
  constructor(id: string) {
    super(`User warning not found: ${id}`);
    this.name = "UserWarningNotFoundError";
  }
}

export class WarningAlreadyAcknowledgedError extends Error {
  constructor(id: string) {
    super(`Warning ${id} already acknowledged`);
    this.name = "WarningAlreadyAcknowledgedError";
  }
}

export class UserSuspensionNotFoundError extends Error {
  constructor(id: string) {
    super(`User suspension not found: ${id}`);
    this.name = "UserSuspensionNotFoundError";
  }
}

export class UserAlreadySuspendedError extends Error {
  constructor(userId: string) {
    super(`User ${userId} already has an active suspension`);
    this.name = "UserAlreadySuspendedError";
  }
}

export class CannotLiftPermanentSuspensionError extends Error {
  constructor(id: string) {
    super(`Cannot lift permanent suspension: ${id}`);
    this.name = "CannotLiftPermanentSuspensionError";
  }
}

export class ModerationAppealNotFoundError extends Error {
  constructor(id: string) {
    super(`Moderation appeal not found: ${id}`);
    this.name = "ModerationAppealNotFoundError";
  }
}

export class ModerationActionNotFoundError extends Error {
  constructor(id: string) {
    super(`Moderation action not found: ${id}`);
    this.name = "ModerationActionNotFoundError";
  }
}

export class AppealAlreadyDecidedError extends Error {
  constructor(id: string) {
    super(`Appeal ${id} has already been decided`);
    this.name = "AppealAlreadyDecidedError";
  }
}

export class CannotAppealSuspensionError extends Error {
  constructor(actionId: string) {
    super(`Cannot appeal suspension action: ${actionId}`);
    this.name = "CannotAppealSuspensionError";
  }
}

export class ContentNotModeratableError extends Error {
  constructor(type: string) {
    super(`Content type not moderatable: ${type}`);
    this.name = "ContentNotModeratableError";
  }
}

export class ContentAlreadyReportedError extends Error {
  constructor(contentId: string, userId: string) {
    super(`User ${userId} already reported content ${contentId}`);
    this.name = "ContentAlreadyReportedError";
  }
}

// =============================================================================
// Deps & Interface
// =============================================================================

export interface ModerationServiceDeps {
  db: DbClient;
  clock: Clock;
  notifier?: Notifier | any;
}

export interface ModerationMetrics {
  totalItems: number;
  byStatus: Record<string, number>;
  byContentType: Record<string, number>;
  byResolution: Record<string, number>;
  averageResolutionTimeMs: number | null;
  moderatorActivity: Record<string, number>;
  appealRate: number;
  appealOverturnRate: number;
}

export interface QueueStatistics {
  pending: number;
  inReview: number;
  resolved: number;
  escalated: number;
  total: number;
  byPriority: Record<string, number>;
}

export interface ModerationService {
  // Queue
  reportContent(input: ReportContentInput & { reportedBy: string }): Promise<ModerationQueueRow>;
  autoFlagContent(input: AutoFlagContentInput): Promise<ModerationQueueRow>;
  getQueueItemById(id: string): Promise<ModerationQueueRow>;
  listQueueItems(params: ModerationQueueListParams): Promise<{ items: ModerationQueueRow[]; total: number }>;
  assignQueueItem(input: { queueItemId: string; moderatorId: string }): Promise<ModerationQueueRow>;
  resolveQueueItem(input: ResolveQueueItemInput & { resolvedBy: string }): Promise<ModerationQueueRow>;
  escalateQueueItem(input: { queueItemId: string; reason: string; escalatedBy: string }): Promise<ModerationQueueRow>;
  bulkResolveQueueItems(input: {
    queueItemIds: string[];
    resolution: ModerationResolution;
    notes: string;
    resolvedBy: string;
  }): Promise<number>;

  // Direct
  moderateContent(input: ModerateContentInput & { moderatedBy: string }): Promise<ModerationActionRow>;

  // Rules
  createRule(input: CreateModerationRuleInput): Promise<ModerationRuleRow>;
  getRuleById(id: string): Promise<ModerationRuleRow>;
  updateRule(input: UpdateModerationRuleInput): Promise<ModerationRuleRow>;
  deleteRule(id: string): Promise<void>;
  listRules(params: ModerationRulesListParams): Promise<ModerationRuleRow[]>;
  toggleRule(id: string): Promise<ModerationRuleRow>;

  checkContentAgainstRules(input: {
    content: string;
    contentType: ModeratableContentType;
    authorId: string;
  }): Promise<{ flagged: boolean; rule?: ModerationRuleRow }>;

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
  getModerationMetrics(params?: { period?: string; moderatorId?: string }): Promise<ModerationMetrics>;
  getQueueStatistics(): Promise<QueueStatistics>;
}

// =============================================================================
// Helpers
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, "")}`;
}

function validateRegex(pattern: string): void {
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern);
  } catch {
    throw new InvalidRegexPatternError(pattern);
  }
}

function calculatePriorityFromReason(reason: string): ModerationPriority {
  const highReasons = ["hate_speech", "incitement", "pornography", "ai_manipulation"];
  const mediumReasons = ["harassment", "defamation", "impersonation", "fraud"];
  if (highReasons.includes(reason)) return "high";
  if (mediumReasons.includes(reason)) return "medium";
  return "low";
}

function calculatePriorityFromConfidence(conf?: number): ModerationPriority {
  if (conf === undefined || conf === null) return "medium";
  if (conf >= 85) return "critical";
  if (conf >= 60) return "high";
  if (conf >= 30) return "medium";
  return "low";
}

function severityRank(sev: ModerationRuleSeverity): number {
  switch (sev) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function isExpiredWarning(warning: UserWarningRow, now: Date): boolean {
  if (!warning.expiresAt) return false;
  return warning.expiresAt < now;
}

function isExpiredSuspension(susp: UserSuspensionRow, now: Date): boolean {
  if (!susp.endsAt) return false; // permanent or no end
  return susp.endsAt < now;
}

// =============================================================================
// Implementation
// =============================================================================

export function createModerationService(deps: ModerationServiceDeps): ModerationService {
  const { db, clock } = deps;

  async function requireQueueItem(id: string): Promise<ModerationQueueRow> {
    const [row] = await db.select().from(moderationQueue).where(eq(moderationQueue.id, id)).limit(1);
    if (!row) throw new ModerationQueueNotFoundError(id);
    return row;
  }

  async function requireRule(id: string): Promise<ModerationRuleRow> {
    const [row] = await db.select().from(moderationRules).where(eq(moderationRules.id, id)).limit(1);
    if (!row) throw new ModerationRuleNotFoundError(id);
    return row;
  }

  async function requireAction(id: string): Promise<ModerationActionRow> {
    const [row] = await db.select().from(moderationActions).where(eq(moderationActions.id, id)).limit(1);
    if (!row) throw new ModerationActionNotFoundError(id);
    return row;
  }

  async function requireAppeal(id: string): Promise<ModerationAppealRow> {
    const [row] = await db.select().from(moderationAppeals).where(eq(moderationAppeals.id, id)).limit(1);
    if (!row) throw new ModerationAppealNotFoundError(id);
    return row;
  }

  async function requireWarning(id: string): Promise<UserWarningRow> {
    const [row] = await db.select().from(userWarnings).where(eq(userWarnings.id, id)).limit(1);
    if (!row) throw new UserWarningNotFoundError(id);
    return row;
  }

  async function requireSuspension(id: string): Promise<UserSuspensionRow> {
    const [row] = await db.select().from(userSuspensions).where(eq(userSuspensions.id, id)).limit(1);
    if (!row) throw new UserSuspensionNotFoundError(id);
    return row;
  }

  async function createActionRecord(input: {
    queueItemId?: string | null;
    actionType: string;
    actionedBy?: string | null;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ModerationActionRow> {
    const now = clock.now();
    const [row] = await db
      .insert(moderationActions)
      .values({
        id: generateId("ma_"),
        queueItemId: input.queueItemId ?? null,
        actionType: input.actionType as any,
        actionedBy: input.actionedBy ?? null,
        actionedAt: now,
        details: input.details ? JSON.stringify(input.details) : null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      })
      .returning();
    if (!row) throw new Error("Failed to create moderation action");
    return row;
  }

  return {
    // ----------------------------------------------------------------------
    // Queue
    // ----------------------------------------------------------------------
    async reportContent(input) {
      const validated = reportContentSchema.parse(input as any);
      // user already reported this content?
      const existing = await db
        .select({ id: moderationQueue.id })
        .from(moderationQueue)
        .where(
          and(
            eq(moderationQueue.contentId, validated.contentId),
            eq(moderationQueue.contentType, validated.contentType),
            eq(moderationQueue.reportedBy, input.reportedBy),
          ),
        )
        .limit(1);
      if (existing.length > 0) {
        throw new ContentAlreadyReportedError(validated.contentId, input.reportedBy);
      }

      const now = clock.now();
      const priority = calculatePriorityFromReason(validated.reason as string);

      const [row] = await db
        .insert(moderationQueue)
        .values({
          id: generateId("mq_"),
          contentType: validated.contentType,
          contentId: validated.contentId,
          reportedBy: input.reportedBy,
          reportedAt: now,
          reason: validated.reason as string,
          priority,
          status: "pending",
          isAutomated: false,
          aiConfidence: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to create queue item");

      await createActionRecord({
        queueItemId: row.id,
        actionType: "flag",
        actionedBy: input.reportedBy,
        details: { reason: validated.reason, details: validated.details, contentType: validated.contentType },
      });

      return row;
    },

    async autoFlagContent(input) {
      const validated = autoFlagContentSchema.parse(input as any);
      const now = clock.now();
      const priority = validated.priority ?? calculatePriorityFromConfidence(validated.aiConfidence);

      const [row] = await db
        .insert(moderationQueue)
        .values({
          id: generateId("mq_"),
          contentType: validated.contentType,
          contentId: validated.contentId,
          reportedBy: null,
          reportedAt: now,
          reason: validated.reason as string,
          priority,
          status: "pending",
          isAutomated: true,
          aiConfidence: validated.aiConfidence ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to create auto-flag queue item");

      await createActionRecord({
        queueItemId: row.id,
        actionType: "flag",
        details: { reason: validated.reason, aiConfidence: validated.aiConfidence, automated: true },
      });

      return row;
    },

    async getQueueItemById(id) {
      return requireQueueItem(id);
    },

    async listQueueItems(params) {
      const validated = moderationQueueListSchema.parse(params as any);
      const { page, limit, sortBy, sortOrder } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.contentType) conditions.push(eq(moderationQueue.contentType, validated.contentType));
      if (validated.status) conditions.push(eq(moderationQueue.status, validated.status));
      if (validated.priority) conditions.push(eq(moderationQueue.priority, validated.priority));
      if (validated.assignedTo) conditions.push(eq(moderationQueue.assignedTo, validated.assignedTo));
      if (validated.reportedBy) conditions.push(eq(moderationQueue.reportedBy, validated.reportedBy));

      const where = conditions.length ? and(...conditions) : undefined;

      // count
      const countQuery = where
        ? db.select({ count: count() }).from(moderationQueue).where(where)
        : db.select({ count: count() }).from(moderationQueue);
      const [cntRes] = await countQuery;
      const total = Number(cntRes?.count ?? 0);

      // order
      let orderBy: any;
      if (sortBy === "priority") {
        // custom ordering for priority: critical > high > medium > low
        // fallback to createdAt desc for same priority
        orderBy = sql`CASE ${moderationQueue.priority} WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END ${sortOrder === "asc" ? sql`ASC` : sql`DESC`}, ${moderationQueue.createdAt} DESC`;
      } else if (sortBy === "status") {
        orderBy = sortOrder === "asc" ? asc(moderationQueue.status) : desc(moderationQueue.status);
      } else if (sortBy === "updatedAt") {
        orderBy = sortOrder === "asc" ? asc(moderationQueue.updatedAt) : desc(moderationQueue.updatedAt);
      } else {
        orderBy = sortOrder === "asc" ? asc(moderationQueue.createdAt) : desc(moderationQueue.createdAt);
      }

      // Handle the case where orderBy is a raw sql for priority - need to spread correctly
      const items =
        sortBy === "priority"
          ? await db
              .select()
              .from(moderationQueue)
              .where(where)
              .orderBy(orderBy as any)
              .offset(offset)
              .limit(limit)
          : await db
              .select()
              .from(moderationQueue)
              .where(where)
              .orderBy(orderBy as any, desc(moderationQueue.createdAt))
              .offset(offset)
              .limit(limit);

      return { items: items as ModerationQueueRow[], total };
    },

    async assignQueueItem(input) {
      const item = await requireQueueItem(input.queueItemId);
      if (item.status === "resolved") throw new ModerationQueueAlreadyResolvedError(item.id);
      if (item.assignedTo) throw new ModerationQueueAlreadyAssignedError(item.id);

      const now = clock.now();
      const [row] = await db
        .update(moderationQueue)
        .set({
          assignedTo: input.moderatorId,
          assignedAt: now,
          status: "in_review",
          updatedAt: now,
        })
        .where(eq(moderationQueue.id, input.queueItemId))
        .returning();

      if (!row) throw new Error("Failed to assign");

      await createActionRecord({
        queueItemId: row.id,
        actionType: "review_start",
        actionedBy: input.moderatorId,
      });

      return row;
    },

    async resolveQueueItem(input) {
      const validated = resolveQueueItemSchema.parse({
        queueItemId: input.queueItemId,
        resolution: input.resolution,
        resolutionNotes: input.resolutionNotes,
        actionDetails: (input as any).actionDetails,
      });

      const item = await requireQueueItem(validated.queueItemId);
      if (item.status === "resolved") throw new ModerationQueueAlreadyResolvedError(item.id);

      const now = clock.now();
      const [row] = await db
        .update(moderationQueue)
        .set({
          status: "resolved",
          resolution: validated.resolution,
          resolutionNotes: validated.resolutionNotes,
          resolvedBy: input.resolvedBy,
          resolvedAt: now,
          updatedAt: now,
        })
        .where(eq(moderationQueue.id, validated.queueItemId))
        .returning();

      if (!row) throw new Error("Failed to resolve");

      await createActionRecord({
        queueItemId: row.id,
        actionType: validated.resolution === "approved" ? "approve" : validated.resolution === "rejected" ? "reject" : validated.resolution === "removed" ? "remove" : validated.resolution === "edited" ? "edit" : validated.resolution === "warning_issued" ? "warn" : validated.resolution === "suspended" ? "suspend" : "review_complete",
        actionedBy: input.resolvedBy,
        details: { resolution: validated.resolution, notes: validated.resolutionNotes, actionDetails: validated.actionDetails },
      });

      return row;
    },

    async escalateQueueItem(input) {
      const item = await requireQueueItem(input.queueItemId);
      if (item.status === "resolved") throw new ModerationQueueAlreadyResolvedError(item.id);

      const now = clock.now();
      const [row] = await db
        .update(moderationQueue)
        .set({
          status: "escalated",
          updatedAt: now,
        })
        .where(eq(moderationQueue.id, input.queueItemId))
        .returning();

      if (!row) throw new Error("Failed to escalate");

      await createActionRecord({
        queueItemId: row.id,
        actionType: "escalate",
        actionedBy: input.escalatedBy,
        details: { reason: input.reason },
      });

      return row;
    },

    async bulkResolveQueueItems(input) {
      let resolvedCount = 0;
      for (const qId of input.queueItemIds) {
        try {
          const item = await db
            .select()
            .from(moderationQueue)
            .where(eq(moderationQueue.id, qId))
            .limit(1);
          const row = item[0];
          if (!row) continue;
          if (row.status === "resolved") continue;

          const now = clock.now();
          await db
            .update(moderationQueue)
            .set({
              status: "resolved",
              resolution: input.resolution,
              resolutionNotes: input.notes,
              resolvedBy: input.resolvedBy,
              resolvedAt: now,
              updatedAt: now,
            })
            .where(eq(moderationQueue.id, qId));

          await createActionRecord({
            queueItemId: qId,
            actionType: "bulk_action",
            actionedBy: input.resolvedBy,
            details: { resolution: input.resolution, notes: input.notes },
          });
          resolvedCount++;
        } catch {
          // skip failures
          continue;
        }
      }
      return resolvedCount;
    },

    // ----------------------------------------------------------------------
    // Direct moderation
    // ----------------------------------------------------------------------
    async moderateContent(input) {
      const validated = moderateContentSchema.parse(input as any);

      // In a real system we would verify content exists; here we just log action
      const action = await createActionRecord({
        queueItemId: null,
        actionType: validated.action,
        actionedBy: input.moderatedBy,
        details: {
          contentId: validated.contentId,
          contentType: validated.contentType,
          reason: validated.reason,
          notes: validated.notes,
        },
      });

      return action;
    },

    // ----------------------------------------------------------------------
    // Rules
    // ----------------------------------------------------------------------
    async createRule(input) {
      const validated = createModerationRuleSchema.parse(input as any);
      if (validated.pattern) {
        validateRegex(validated.pattern);
      }

      // duplicate name check
      const [existing] = await db
        .select({ id: moderationRules.id })
        .from(moderationRules)
        .where(eq(moderationRules.name, validated.name))
        .limit(1);
      if (existing) throw new DuplicateRuleNameError(validated.name);

      const now = clock.now();
      const [row] = await db
        .insert(moderationRules)
        .values({
          id: generateId("mr_"),
          name: validated.name,
          description: validated.description ?? null,
          contentType: validated.contentType as ModerationRuleContentType,
          pattern: validated.pattern ?? null,
          keywords: validated.keywords ? JSON.stringify(validated.keywords) : null,
          action: validated.action as any,
          severity: validated.severity as ModerationRuleSeverity,
          isActive: validated.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to create rule");
      return row;
    },

    async getRuleById(id) {
      return requireRule(id);
    },

    async updateRule(input) {
      const validated = updateModerationRuleSchema.parse(input as any);
      const existing = await requireRule(validated.id);

      if (validated.pattern) {
        validateRegex(validated.pattern);
      }

      if (validated.name && validated.name !== existing.name) {
        const [dup] = await db
          .select({ id: moderationRules.id })
          .from(moderationRules)
          .where(and(eq(moderationRules.name, validated.name), ne(moderationRules.id, validated.id)))
          .limit(1);
        if (dup) throw new DuplicateRuleNameError(validated.name);
      }

      const now = clock.now();
      const [row] = await db
        .update(moderationRules)
        .set({
          name: validated.name ?? existing.name,
          description:
            validated.description !== undefined ? (validated.description as any) : existing.description,
          contentType:
            (validated.contentType as ModerationRuleContentType | undefined) ?? existing.contentType,
          pattern: validated.pattern !== undefined ? (validated.pattern as any) : existing.pattern,
          keywords:
            validated.keywords !== undefined
              ? validated.keywords
                ? JSON.stringify(validated.keywords)
                : null
              : existing.keywords,
          action: (validated.action as any) ?? existing.action,
          severity: (validated.severity as any) ?? existing.severity,
          isActive: validated.isActive ?? existing.isActive,
          updatedAt: now,
        })
        .where(eq(moderationRules.id, validated.id))
        .returning();

      if (!row) throw new Error("Failed to update rule");
      return row;
    },

    async deleteRule(id) {
      await requireRule(id);
      await db.delete(moderationRules).where(eq(moderationRules.id, id));
    },

    async listRules(params) {
      const validated = moderationRulesListSchema.parse(params as any);
      const conditions: any[] = [];
      if (validated.contentType) {
        // include both specific type and 'all' if filtering by specific? spec says filter by contentType.
        // We'll exact match.
        conditions.push(eq(moderationRules.contentType, validated.contentType));
      }
      if (validated.isActive !== undefined) {
        conditions.push(eq(moderationRules.isActive, validated.isActive));
      }
      const where = conditions.length ? and(...conditions) : undefined;
      const rows = where
        ? await db.select().from(moderationRules).where(where).orderBy(asc(moderationRules.name))
        : await db.select().from(moderationRules).orderBy(asc(moderationRules.name));
      return rows;
    },

    async toggleRule(id) {
      const existing = await requireRule(id);
      const now = clock.now();
      const [row] = await db
        .update(moderationRules)
        .set({ isActive: !existing.isActive, updatedAt: now })
        .where(eq(moderationRules.id, id))
        .returning();
      if (!row) throw new Error("Failed to toggle");
      return row;
    },

    async checkContentAgainstRules(input) {
      const activeRules = await db
        .select()
        .from(moderationRules)
        .where(eq(moderationRules.isActive, true));

      const applicable = activeRules.filter(
        (r) => r.contentType === "all" || r.contentType === input.contentType,
      );

      // Sort by severity high -> low
      applicable.sort((a, b) => severityRank(b.severity as ModerationRuleSeverity) - severityRank(a.severity as ModerationRuleSeverity));

      const lowerContent = input.content.toLowerCase();

      for (const rule of applicable) {
        let matched = false;

        if (rule.pattern) {
          try {
            const re = new RegExp(rule.pattern, "i");
            if (re.test(input.content)) matched = true;
          } catch {
            // invalid regex should have been caught at creation - skip
          }
        }

        if (!matched && rule.keywords) {
          try {
            const keywords: string[] = JSON.parse(rule.keywords);
            for (const kw of keywords) {
              if (lowerContent.includes(kw.toLowerCase())) {
                matched = true;
                break;
              }
            }
          } catch {
            // ignore malformed
          }
        }

        // If rule has neither pattern nor keywords, treat as not matching (or if it has both we already did OR)
        if (matched) {
          return { flagged: true, rule };
        }
      }

      return { flagged: false };
    },

    // ----------------------------------------------------------------------
    // Warnings
    // ----------------------------------------------------------------------
    async issueWarning(input) {
      const validated = issueWarningSchema.parse(input as any);
      const now = clock.now();
      const [row] = await db
        .insert(userWarnings)
        .values({
          id: generateId("uw_"),
          userId: validated.userId,
          issuedBy: input.issuedBy,
          reason: validated.reason,
          severity: validated.severity as any,
          expiresAt: validated.expiresAt ?? null,
          isActive: true,
          createdAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to issue warning");

      await createActionRecord({
        queueItemId: null,
        actionType: "warn",
        actionedBy: input.issuedBy,
        details: { warningId: row.id, userId: validated.userId, severity: validated.severity },
      });

      return row;
    },

    async getUserWarnings(userId) {
      return db.select().from(userWarnings).where(eq(userWarnings.userId, userId)).orderBy(desc(userWarnings.createdAt));
    },

    async getActiveWarningCount(userId) {
      const now = clock.now();
      const rows = await db
        .select()
        .from(userWarnings)
        .where(and(eq(userWarnings.userId, userId), eq(userWarnings.isActive, true)));
      let countActive = 0;
      for (const r of rows) {
        if (!isExpiredWarning(r, now)) countActive++;
      }
      return countActive;
    },

    async acknowledgeWarning(warningId) {
      const warning = await requireWarning(warningId);
      if (warning.acknowledgedAt) throw new WarningAlreadyAcknowledgedError(warningId);

      const now = clock.now();
      const [row] = await db
        .update(userWarnings)
        .set({ acknowledgedAt: now })
        .where(eq(userWarnings.id, warningId))
        .returning();

      if (!row) throw new Error("Failed to acknowledge");
      return row;
    },

    // ----------------------------------------------------------------------
    // Suspensions
    // ----------------------------------------------------------------------
    async suspendUser(input) {
      const validated = suspendUserSchema.parse(input as any);
      const now = clock.now();

      // check active suspension
      const active = await db
        .select()
        .from(userSuspensions)
        .where(and(eq(userSuspensions.userId, validated.userId), eq(userSuspensions.isActive, true)));

      for (const s of active) {
        if (!isExpiredSuspension(s, now)) {
          throw new UserAlreadySuspendedError(validated.userId);
        }
      }

      let endsAt: Date | null = null;
      if (validated.type === "temporary") {
        const duration = validated.duration!;
        endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      }

      const [row] = await db
        .insert(userSuspensions)
        .values({
          id: generateId("sus_"),
          userId: validated.userId,
          issuedBy: input.issuedBy,
          reason: validated.reason,
          type: validated.type as any,
          duration: validated.duration ?? null,
          endsAt,
          isActive: true,
          canAppeal: validated.canAppeal ?? true,
          createdAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to suspend");

      await createActionRecord({
        queueItemId: null,
        actionType: "suspend",
        actionedBy: input.issuedBy,
        details: {
          suspensionId: row.id,
          userId: validated.userId,
          type: validated.type,
          duration: validated.duration,
          canAppeal: validated.canAppeal,
        },
      });

      return row;
    },

    async getUserSuspensions(userId) {
      return db.select().from(userSuspensions).where(eq(userSuspensions.userId, userId)).orderBy(desc(userSuspensions.createdAt));
    },

    async getActiveSuspension(userId) {
      const now = clock.now();
      const rows = await db
        .select()
        .from(userSuspensions)
        .where(and(eq(userSuspensions.userId, userId), eq(userSuspensions.isActive, true)))
        .orderBy(desc(userSuspensions.createdAt));

      for (const r of rows) {
        if (!isExpiredSuspension(r, now)) {
          return r;
        }
      }
      return null;
    },

    async checkUserSuspended(userId) {
      const active = await (async () => {
        const rows = await db
          .select()
          .from(userSuspensions)
          .where(and(eq(userSuspensions.userId, userId), eq(userSuspensions.isActive, true)));
        const now = clock.now();
        for (const r of rows) {
          if (!isExpiredSuspension(r, now)) return r;
        }
        return null;
      })();
      return !!active;
    },

    async liftSuspension(input) {
      const validated = liftSuspensionSchema.parse(input as any);
      const suspension = await requireSuspension(validated.suspensionId);
      if (suspension.type === "permanent") {
        throw new CannotLiftPermanentSuspensionError(validated.suspensionId);
      }
      if (!suspension.isActive) {
        return suspension;
      }

      const [row] = await db
        .update(userSuspensions)
        .set({ isActive: false })
        .where(eq(userSuspensions.id, validated.suspensionId))
        .returning();

      if (!row) throw new Error("Failed to lift suspension");

      await createActionRecord({
        queueItemId: null,
        actionType: "suspend",
        actionedBy: input.liftedBy,
        details: { liftedId: row.id, reason: validated.reason },
      });

      return row;
    },

    // ----------------------------------------------------------------------
    // Appeals
    // ----------------------------------------------------------------------
    async fileAppeal(input) {
      const validated = fileAppealSchema.parse(input as any);
      const action = await requireAction(validated.moderationActionId);

      // Check if we can appeal: if action details say permanent and canAppeal false
      try {
        const details = action.details ? JSON.parse(action.details) : null;
        if (details && details.canAppeal === false) {
          throw new CannotAppealSuspensionError(validated.moderationActionId);
        }
        if (details && details.type === "permanent" && details.canAppeal === false) {
          throw new CannotAppealSuspensionError(validated.moderationActionId);
        }
      } catch (e) {
        if (e instanceof CannotAppealSuspensionError) throw e;
        // ignore parse errors
      }

      const now = clock.now();
      const [row] = await db
        .insert(moderationAppeals)
        .values({
          id: generateId("apl_"),
          moderationActionId: validated.moderationActionId,
          userId: input.userId,
          reason: validated.reason,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) throw new Error("Failed to file appeal");
      return row;
    },

    async getAppealById(id) {
      return requireAppeal(id);
    },

    async listAppeals(params) {
      const validated = moderationAppealListSchema.parse(params as any);
      const { page, limit, sortBy, sortOrder } = validated;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (validated.userId) conditions.push(eq(moderationAppeals.userId, validated.userId));
      if (validated.status) conditions.push(eq(moderationAppeals.status, validated.status));

      const where = conditions.length ? and(...conditions) : undefined;

      const countQuery = where
        ? db.select({ count: count() }).from(moderationAppeals).where(where)
        : db.select({ count: count() }).from(moderationAppeals);
      const [cntRes] = await countQuery;
      const total = Number(cntRes?.count ?? 0);

      let orderBy: any;
      if (sortBy === "status") {
        orderBy = sortOrder === "asc" ? asc(moderationAppeals.status) : desc(moderationAppeals.status);
      } else if (sortBy === "updatedAt") {
        orderBy = sortOrder === "asc" ? asc(moderationAppeals.updatedAt) : desc(moderationAppeals.updatedAt);
      } else {
        orderBy = sortOrder === "asc" ? asc(moderationAppeals.createdAt) : desc(moderationAppeals.createdAt);
      }

      const appeals = await db
        .select()
        .from(moderationAppeals)
        .where(where)
        .orderBy(orderBy)
        .offset(offset)
        .limit(limit);

      return { appeals, total };
    },

    async decideAppeal(input) {
      const validated = decideAppealSchema.parse(input as any);
      const appeal = await requireAppeal(validated.appealId);

      if (appeal.status === "upheld" || appeal.status === "overturned") {
        throw new AppealAlreadyDecidedError(appeal.id);
      }

      const now = clock.now();
      const [row] = await db
        .update(moderationAppeals)
        .set({
          status: validated.decision === "upheld" ? "upheld" : "overturned",
          decision: validated.decision,
          decisionNotes: validated.decisionNotes ?? null,
          reviewedBy: input.reviewedBy,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(moderationAppeals.id, validated.appealId))
        .returning();

      if (!row) throw new Error("Failed to decide appeal");
      return row;
    },

    // ----------------------------------------------------------------------
    // Analytics
    // ----------------------------------------------------------------------
    async getModerationMetrics(params) {
      const allQueue = await db.select().from(moderationQueue);
      const allActions = await db.select().from(moderationActions);
      const allAppeals = await db.select().from(moderationAppeals);

      const byStatus: Record<string, number> = {};
      const byContentType: Record<string, number> = {};
      const byResolution: Record<string, number> = {};
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const q of allQueue) {
        byStatus[q.status] = (byStatus[q.status] ?? 0) + 1;
        byContentType[q.contentType] = (byContentType[q.contentType] ?? 0) + 1;
        if (q.resolution) {
          byResolution[q.resolution] = (byResolution[q.resolution] ?? 0) + 1;
        }
        if (q.resolvedAt && q.createdAt) {
          totalResolutionTime += q.resolvedAt.getTime() - q.createdAt.getTime();
          resolvedCount++;
        }
      }

      const moderatorActivity: Record<string, number> = {};
      for (const a of allActions) {
        if (a.actionedBy) {
          moderatorActivity[a.actionedBy] = (moderatorActivity[a.actionedBy] ?? 0) + 1;
        }
      }

      const appealRate = allQueue.length ? allAppeals.length / allQueue.length : 0;
      const overturned = allAppeals.filter((a) => a.decision === "overturned").length;
      const appealOverturnRate = allAppeals.length ? overturned / allAppeals.length : 0;

      return {
        totalItems: allQueue.length,
        byStatus,
        byContentType,
        byResolution,
        averageResolutionTimeMs: resolvedCount ? totalResolutionTime / resolvedCount : null,
        moderatorActivity,
        appealRate,
        appealOverturnRate,
      };
    },

    async getQueueStatistics() {
      const all = await db.select().from(moderationQueue);
      const stats: QueueStatistics = {
        pending: 0,
        inReview: 0,
        resolved: 0,
        escalated: 0,
        total: all.length,
        byPriority: {},
      };

      for (const q of all) {
        if (q.status === "pending") stats.pending++;
        else if (q.status === "in_review") stats.inReview++;
        else if (q.status === "resolved") stats.resolved++;
        else if (q.status === "escalated") stats.escalated++;

        stats.byPriority[q.priority] = (stats.byPriority[q.priority] ?? 0) + 1;
      }

      return stats;
    },
  };
}
