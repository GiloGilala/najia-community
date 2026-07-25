import { describe, it, beforeEach, afterEach, expect } from "bun:test";

import { createTestHarness } from "./harness";
import { createModerationService, type ModerationService } from "../services/moderation.service";
import {
  ModerationAppealNotFoundError,
  AppealAlreadyDecidedError,
} from "../services/moderation.service";
import { FixedClock } from "../lib/clock/clock";
import { users } from "../db/schema/users";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

async function createUser(db: any, overrides: any = {}) {
  const { randomUUID } = await import("node:crypto");
  const id = randomUUID();
  const now = new Date(DEFAULT_CLOCK_START);
  const [row] = await db
    .insert(users)
    .values({
      id,
      email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
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

describe("ModerationService - Appeals", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let service: ModerationService;
  let clock: FixedClock;
  let user: any;
  let moderator: any;
  let queueItem: any;
  let action: any;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    service = createModerationService({ db: harness.db, clock });
    user = await createUser(harness.db, { email: `user-${Date.now()}@example.com` });
    moderator = await createUser(harness.db, { email: `mod-${Date.now()}@example.com` });

    // Create a resolved queue item with an action
    queueItem = await service.reportContent({
      contentId: `content-${Date.now()}`,
      contentType: "blog_comment",
      reason: "spam",
      reportedBy: user.id,
    });
    await service.assignQueueItem({ queueItemId: queueItem.id, moderatorId: moderator.id });
    const resolved = await service.resolveQueueItem({
      queueItemId: queueItem.id,
      resolution: "removed",
      resolutionNotes: "spam content",
      resolvedBy: moderator.id,
    });
    // The resolve creates an action; fetch the latest action for this queue
    const { moderationActions } = await import("../db/schema/moderation");
    const { eq, desc } = await import("drizzle-orm");
    const actions = await harness.db
      .select()
      .from(moderationActions)
      .where(eq(moderationActions.queueItemId, queueItem.id))
      .orderBy(desc(moderationActions.actionedAt));
    action = actions[0];
    if (!action) {
      // Fallback: create a direct moderation action
      action = await service.moderateContent({
        contentId: queueItem.contentId,
        contentType: queueItem.contentType as any,
        action: "remove",
        reason: "spam",
        moderatedBy: moderator.id,
      });
    }
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("fileAppeal", () => {
    it("files an appeal for a moderation action", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "I disagree with this decision",
        userId: user.id,
      });
      expect(appeal.id.startsWith("apl_")).toBeTrue();
      expect(appeal.moderationActionId).toBe(action.id);
    });

    it("sets userId and createdAt", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "Wrong decision",
        userId: user.id,
      });
      expect(appeal.userId).toBe(user.id);
      expect(appeal.createdAt).toEqual(DEFAULT_CLOCK_START);
    });

    it("sets status to pending", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "Pending test",
        userId: user.id,
      });
      expect(appeal.status).toBe("pending");
    });
  });

  describe("getAppealById", () => {
    it("returns an appeal by ID", async () => {
      const created = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "get by id",
        userId: user.id,
      });
      const fetched = await service.getAppealById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("throws ModerationAppealNotFoundError for non-existent appeal", async () => {
      await expect(service.getAppealById("apl_nonexistent")).rejects.toThrow(ModerationAppealNotFoundError);
    });
  });

  describe("listAppeals", () => {
    it("returns paginated list of appeals", async () => {
      await service.fileAppeal({ moderationActionId: action.id, reason: "a1", userId: user.id });
      await service.fileAppeal({ moderationActionId: action.id, reason: "a2", userId: user.id });
      const { appeals, total } = await service.listAppeals({ page: 1, limit: 1 });
      expect(appeals.length).toBe(1);
      expect(total).toBe(2);
    });

    it("filters by userId", async () => {
      const otherUser = await createUser(harness.db, { email: `other-${Date.now()}@example.com` });
      await service.fileAppeal({ moderationActionId: action.id, reason: "user filter", userId: user.id });
      await service.fileAppeal({ moderationActionId: action.id, reason: "user filter 2", userId: otherUser.id });
      const { appeals } = await service.listAppeals({ userId: user.id, page: 1, limit: 10 });
      expect(appeals.every((a) => a.userId === user.id)).toBeTrue();
    });

    it("filters by status", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "status filter",
        userId: user.id,
      });
      await service.decideAppeal({ appealId: appeal.id, decision: "upheld", reviewedBy: moderator.id });
      const { appeals } = await service.listAppeals({ status: "upheld", page: 1, limit: 10 } as any);
      expect(appeals.length).toBeGreaterThanOrEqual(1);
      expect(appeals[0].status).toBe("upheld");
    });
  });

  describe("decideAppeal", () => {
    it("decides appeal as upheld", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "upheld test",
        userId: user.id,
      });
      const decided = await service.decideAppeal({
        appealId: appeal.id,
        decision: "upheld",
        reviewedBy: moderator.id,
      });
      expect(decided.status).toBe("upheld");
      expect(decided.decision).toBe("upheld");
    });

    it("decides appeal as overturned", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "overturned test",
        userId: user.id,
      });
      const decided = await service.decideAppeal({
        appealId: appeal.id,
        decision: "overturned",
        decisionNotes: "re-evaluated, not spam",
        reviewedBy: moderator.id,
      });
      expect(decided.status).toBe("overturned");
      expect(decided.decisionNotes).toBe("re-evaluated, not spam");
    });

    it("sets reviewedBy and reviewedAt", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "reviewed fields",
        userId: user.id,
      });
      const decided = await service.decideAppeal({
        appealId: appeal.id,
        decision: "upheld",
        reviewedBy: moderator.id,
      });
      expect(decided.reviewedBy).toBe(moderator.id);
      expect(decided.reviewedAt).toBeTruthy();
    });

    it("throws ModerationAppealNotFoundError for non-existent appeal", async () => {
      await expect(
        service.decideAppeal({ appealId: "apl_no", decision: "upheld", reviewedBy: moderator.id }),
      ).rejects.toThrow(ModerationAppealNotFoundError);
    });

    it("throws AppealAlreadyDecidedError if already decided", async () => {
      const appeal = await service.fileAppeal({
        moderationActionId: action.id,
        reason: "double decide",
        userId: user.id,
      });
      await service.decideAppeal({ appealId: appeal.id, decision: "upheld", reviewedBy: moderator.id });
      await expect(
        service.decideAppeal({ appealId: appeal.id, decision: "overturned", reviewedBy: moderator.id }),
      ).rejects.toThrow(AppealAlreadyDecidedError);
    });
  });
});
