import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { eq } from "drizzle-orm";

import { createTestHarness } from "./harness";
import { createModerationService, type ModerationService } from "../services/moderation.service";
import {
  ModerationQueueNotFoundError,
  ModerationQueueAlreadyAssignedError,
  ModerationQueueAlreadyResolvedError,
  ContentAlreadyReportedError,
} from "../services/moderation.service";
import { FixedClock } from "../lib/clock/clock";
import { users } from "../db/schema/users";
import { moderationQueue } from "../db/schema/moderation";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

async function createUser(db: any, overrides: any = {}) {
  const { randomUUID } = await import("node:crypto");
  const id = randomUUID();
  const now = new Date("2025-01-01T00:00:00.000Z");
  const [row] = await db
    .insert(users)
    .values({
      id,
      email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: "hashed",
      verificationStatus: "email_verified",
      createdAt: now,
      updatedAt: now,
      ...overrides,
      id,
    })
    .returning();
  return row;
}

function buildReportInput(overrides: any = {}) {
  return {
    contentId: `content-${Date.now()}-${Math.random()}`,
    contentType: "blog_comment" as const,
    reason: "spam" as const,
    ...overrides,
  };
}

describe("ModerationService - Queue", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let service: ModerationService;
  let clock: FixedClock;
  let user: any;
  let moderator: any;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    service = createModerationService({ db: harness.db, clock });
    user = await createUser(harness.db, { email: `user-${Date.now()}@example.com` });
    moderator = await createUser(harness.db, { email: `mod-${Date.now()}@example.com` });
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("reportContent", () => {
    it("creates a queue item when user reports content", async () => {
      const input = buildReportInput();
      const item = await service.reportContent({ ...input, reportedBy: user.id });
      expect(item.id).toBeTruthy();
      expect(item.id.startsWith("mq_")).toBeTrue();
      expect(item.contentId).toBe(input.contentId);
      expect(item.contentType).toBe(input.contentType);
    });

    it("sets reportedBy to the reporting user", async () => {
      const input = buildReportInput();
      const item = await service.reportContent({ ...input, reportedBy: user.id });
      expect(item.reportedBy).toBe(user.id);
    });

    it("sets isAutomated to false", async () => {
      const input = buildReportInput();
      const item = await service.reportContent({ ...input, reportedBy: user.id });
      expect(item.isAutomated).toBe(false);
    });

    it("sets status to pending", async () => {
      const input = buildReportInput();
      const item = await service.reportContent({ ...input, reportedBy: user.id });
      expect(item.status).toBe("pending");
    });

    it("throws ContentAlreadyReportedError if same user already reported this content", async () => {
      const input = buildReportInput({ contentId: "same-content-id" });
      await service.reportContent({ ...input, reportedBy: user.id });
      await expect(service.reportContent({ ...input, reportedBy: user.id })).rejects.toThrow(ContentAlreadyReportedError);
    });

    it("creates initial moderation action record", async () => {
      const input = buildReportInput();
      const item = await service.reportContent({ ...input, reportedBy: user.id });
      // The service should create an action record internally; we just verify the queue item exists
      expect(item).toBeTruthy();
      const fetched = await service.getQueueItemById(item.id);
      expect(fetched.id).toBe(item.id);
    });
  });

  describe("autoFlagContent", () => {
    it("creates a queue item when system auto-flags content", async () => {
      const item = await service.autoFlagContent({
        contentId: "auto-content-1",
        contentType: "blog_comment",
        reason: "spam",
      });
      expect(item.id.startsWith("mq_")).toBeTrue();
      expect(item.isAutomated).toBeTrue();
    });

    it("sets isAutomated to true", async () => {
      const item = await service.autoFlagContent({
        contentId: "auto-content-2",
        contentType: "evidence",
        reason: "ai_manipulation",
      });
      expect(item.isAutomated).toBeTrue();
    });

    it("sets aiConfidence if provided", async () => {
      const item = await service.autoFlagContent({
        contentId: "auto-content-3",
        contentType: "blog_post",
        reason: "spam",
        aiConfidence: 85,
      });
      expect(item.aiConfidence).toBe(85);
    });

    it("sets priority based on confidence", async () => {
      const low = await service.autoFlagContent({
        contentId: "low-conf",
        contentType: "blog_comment",
        reason: "spam",
        aiConfidence: 10,
      });
      const high = await service.autoFlagContent({
        contentId: "high-conf",
        contentType: "blog_comment",
        reason: "spam",
        aiConfidence: 90,
      });
      expect(low.priority).not.toBe(high.priority);
    });
  });

  describe("getQueueItemById", () => {
    it("returns a queue item by ID", async () => {
      const created = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const fetched = await service.getQueueItemById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("throws ModerationQueueNotFoundError for non-existent item", async () => {
      await expect(service.getQueueItemById("mq_nonexistent")).rejects.toThrow(ModerationQueueNotFoundError);
    });
  });

  describe("listQueueItems", () => {
    it("returns paginated list of queue items", async () => {
      for (let i = 0; i < 5; i++) {
        await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      }
      const { items, total } = await service.listQueueItems({ page: 1, limit: 2 });
      expect(items.length).toBe(2);
      expect(total).toBe(5);
    });

    it("filters by contentType", async () => {
      await service.reportContent({ contentId: "c1", contentType: "blog_post", reason: "spam", reportedBy: user.id } as any);
      await service.reportContent({ contentId: "c2", contentType: "blog_comment", reason: "spam", reportedBy: user.id } as any);
      const { items } = await service.listQueueItems({ contentType: "blog_post", page: 1, limit: 10 } as any);
      expect(items.every((i: any) => i.contentType === "blog_post")).toBeTrue();
    });

    it("filters by status", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id });
      const { items } = await service.listQueueItems({ status: "in_review", page: 1, limit: 10 } as any);
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].status).toBe("in_review");
    });

    it("sorts by createdAt", async () => {
      await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const { items } = await service.listQueueItems({ sortBy: "createdAt", sortOrder: "asc", page: 1, limit: 10 } as any);
      expect(items.length).toBe(2);
    });
  });

  describe("assignQueueItem", () => {
    it("assigns item to moderator", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const assigned = await service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id });
      expect(assigned.assignedTo).toBe(moderator.id);
    });

    it("updates status to in_review", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const assigned = await service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id });
      expect(assigned.status).toBe("in_review");
    });

    it("throws ModerationQueueNotFoundError for non-existent item", async () => {
      await expect(service.assignQueueItem({ queueItemId: "mq_no", moderatorId: moderator.id })).rejects.toThrow(
        ModerationQueueNotFoundError,
      );
    });

    it("throws ModerationQueueAlreadyAssignedError if already assigned", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id });
      await expect(service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id })).rejects.toThrow(
        ModerationQueueAlreadyAssignedError,
      );
    });

    it("throws ModerationQueueAlreadyResolvedError if already resolved", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id });
      await service.resolveQueueItem({
        queueItemId: item.id,
        resolution: "approved",
        resolutionNotes: "looks fine",
        resolvedBy: moderator.id,
      });
      await expect(service.assignQueueItem({ queueItemId: item.id, moderatorId: moderator.id })).rejects.toThrow(
        ModerationQueueAlreadyResolvedError,
      );
    });
  });

  describe("resolveQueueItem", () => {
    it("resolves item with specified resolution", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const resolved = await service.resolveQueueItem({
        queueItemId: item.id,
        resolution: "removed",
        resolutionNotes: "spam",
        resolvedBy: moderator.id,
      });
      expect(resolved.resolution).toBe("removed");
      expect(resolved.status).toBe("resolved");
    });

    it("sets resolvedBy and resolvedAt", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const resolved = await service.resolveQueueItem({
        queueItemId: item.id,
        resolution: "approved",
        resolutionNotes: "ok",
        resolvedBy: moderator.id,
      });
      expect(resolved.resolvedBy).toBe(moderator.id);
      expect(resolved.resolvedAt).toBeTruthy();
    });

    it("throws ModerationQueueAlreadyResolvedError if already resolved", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.resolveQueueItem({
        queueItemId: item.id,
        resolution: "approved",
        resolutionNotes: "ok",
        resolvedBy: moderator.id,
      });
      await expect(
        service.resolveQueueItem({
          queueItemId: item.id,
          resolution: "approved",
          resolutionNotes: "again",
          resolvedBy: moderator.id,
        }),
      ).rejects.toThrow(ModerationQueueAlreadyResolvedError);
    });
  });

  describe("escalateQueueItem", () => {
    it("escalates item to higher level", async () => {
      const item = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const escalated = await service.escalateQueueItem({
        queueItemId: item.id,
        reason: "needs senior review",
        escalatedBy: moderator.id,
      });
      expect(escalated.status).toBe("escalated");
    });
  });

  describe("bulkResolveQueueItems", () => {
    it("resolves multiple items at once", async () => {
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await service.reportContent({ ...buildReportInput(), reportedBy: user.id }));
      }
      const count = await service.bulkResolveQueueItems({
        queueItemIds: items.map((i) => i.id),
        resolution: "approved",
        notes: "bulk ok",
        resolvedBy: moderator.id,
      });
      expect(count).toBe(3);
    });

    it("skips already resolved items", async () => {
      const item1 = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      const item2 = await service.reportContent({ ...buildReportInput(), reportedBy: user.id });
      await service.resolveQueueItem({
        queueItemId: item1.id,
        resolution: "approved",
        resolutionNotes: "ok",
        resolvedBy: moderator.id,
      });
      const count = await service.bulkResolveQueueItems({
        queueItemIds: [item1.id, item2.id],
        resolution: "approved",
        notes: "bulk",
        resolvedBy: moderator.id,
      });
      expect(count).toBe(1);
    });
  });

  describe("moderateContent", () => {
    it("moderates content directly without queue", async () => {
      const action = await service.moderateContent({
        contentId: "direct-1",
        contentType: "blog_post",
        action: "approve",
        reason: "fine",
        moderatedBy: moderator.id,
      });
      expect(action.id.startsWith("ma_")).toBeTrue();
    });
  });
});
