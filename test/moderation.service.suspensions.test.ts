import { describe, it, beforeEach, afterEach, expect } from "bun:test";

import { createTestHarness } from "./harness";
import { createModerationService, type ModerationService } from "../services/moderation.service";
import {
  UserSuspensionNotFoundError,
  UserAlreadySuspendedError,
  CannotLiftPermanentSuspensionError,
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

describe("ModerationService - Suspensions", () => {
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

  describe("suspendUser", () => {
    it("suspends user temporarily", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "temp reason",
        type: "temporary",
        duration: 7,
        issuedBy: moderator.id,
      });
      expect(susp.id.startsWith("sus_")).toBeTrue();
      expect(susp.type).toBe("temporary");
      expect(susp.endsAt).toBeTruthy();
    });

    it("suspends user permanently", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "permanent",
        type: "permanent",
        issuedBy: moderator.id,
      });
      expect(susp.type).toBe("permanent");
      expect(susp.endsAt).toBeNull();
    });

    it("sets issuedBy and createdAt", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "test",
        type: "temporary",
        duration: 3,
        issuedBy: moderator.id,
      });
      expect(susp.issuedBy).toBe(moderator.id);
      expect(susp.createdAt).toEqual(DEFAULT_CLOCK_START);
    });

    it("sets isActive to true", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "active test",
        type: "temporary",
        duration: 1,
        issuedBy: moderator.id,
      });
      expect(susp.isActive).toBeTrue();
    });

    it("throws UserAlreadySuspendedError if user already has active suspension", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "first",
        type: "temporary",
        duration: 5,
        issuedBy: moderator.id,
      });
      await expect(
        service.suspendUser({
          userId: user.id,
          reason: "second",
          type: "temporary",
          duration: 5,
          issuedBy: moderator.id,
        }),
      ).rejects.toThrow(UserAlreadySuspendedError);
    });
  });

  describe("getUserSuspensions", () => {
    it("returns all suspensions for a user", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "one",
        type: "temporary",
        duration: 1,
        issuedBy: moderator.id,
      });
      // need to lift to allow second suspension due to active check, so use different user or lift
      const user2 = await createUser(harness.db, { email: `user2-${Date.now()}@example.com` });
      await service.suspendUser({
        userId: user2.id,
        reason: "one",
        type: "temporary",
        duration: 1,
        issuedBy: moderator.id,
      });
      const list = await service.getUserSuspensions(user.id);
      expect(list.length).toBe(1);
    });

    it("returns empty array for user with no suspensions", async () => {
      const list = await service.getUserSuspensions(user.id);
      expect(list.length).toBe(0);
    });
  });

  describe("getActiveSuspension", () => {
    it("returns active suspension if exists", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "active",
        type: "temporary",
        duration: 2,
        issuedBy: moderator.id,
      });
      const active = await service.getActiveSuspension(user.id);
      expect(active).toBeTruthy();
      expect(active?.userId).toBe(user.id);
    });

    it("returns null if no active suspension", async () => {
      const active = await service.getActiveSuspension(user.id);
      expect(active).toBeNull();
    });

    it("returns null if suspension expired", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "expired",
        type: "temporary",
        duration: 1,
        issuedBy: moderator.id,
      });
      // advance clock beyond expiration (2 days)
      clock.advance(1000 * 60 * 60 * 24 * 2);
      // re-create service with advanced clock to check
      const service2 = createModerationService({ db: harness.db, clock });
      const active = await service2.getActiveSuspension(user.id);
      expect(active).toBeNull();
    });
  });

  describe("checkUserSuspended", () => {
    it("returns true for active suspension", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "check",
        type: "temporary",
        duration: 5,
        issuedBy: moderator.id,
      });
      expect(await service.checkUserSuspended(user.id)).toBeTrue();
    });

    it("returns false for no suspension", async () => {
      expect(await service.checkUserSuspended(user.id)).toBeFalse();
    });

    it("returns false for expired suspension", async () => {
      await service.suspendUser({
        userId: user.id,
        reason: "expired check",
        type: "temporary",
        duration: 1,
        issuedBy: moderator.id,
      });
      clock.advance(1000 * 60 * 60 * 24 * 2);
      const service2 = createModerationService({ db: harness.db, clock });
      expect(await service2.checkUserSuspended(user.id)).toBeFalse();
    });
  });

  describe("liftSuspension", () => {
    it("lifts a temporary suspension", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "lift",
        type: "temporary",
        duration: 5,
        issuedBy: moderator.id,
      });
      const lifted = await service.liftSuspension({
        suspensionId: susp.id,
        reason: "appeal accepted",
        liftedBy: moderator.id,
      });
      expect(lifted.isActive).toBeFalse();
    });

    it("throws UserSuspensionNotFoundError for non-existent suspension", async () => {
      await expect(
        service.liftSuspension({ suspensionId: "sus_no", reason: "no", liftedBy: moderator.id }),
      ).rejects.toThrow(UserSuspensionNotFoundError);
    });

    it("throws CannotLiftPermanentSuspensionError for permanent suspension", async () => {
      const susp = await service.suspendUser({
        userId: user.id,
        reason: "perm",
        type: "permanent",
        issuedBy: moderator.id,
      });
      await expect(
        service.liftSuspension({ suspensionId: susp.id, reason: "try lift", liftedBy: moderator.id }),
      ).rejects.toThrow(CannotLiftPermanentSuspensionError);
    });
  });
});
