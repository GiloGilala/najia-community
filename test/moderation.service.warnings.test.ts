import { describe, it, beforeEach, afterEach, expect } from "bun:test";

import { createTestHarness } from "./harness";
import { createModerationService, type ModerationService } from "../services/moderation.service";
import { UserWarningNotFoundError, WarningAlreadyAcknowledgedError } from "../services/moderation.service";
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

describe("ModerationService - Warnings", () => {
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

  describe("issueWarning", () => {
    it("issues a warning to user", async () => {
      const warning = await service.issueWarning({
        userId: user.id,
        reason: "Test warning",
        severity: "mild",
        issuedBy: moderator.id,
      });
      expect(warning.id.startsWith("uw_")).toBeTrue();
      expect(warning.userId).toBe(user.id);
    });

    it("sets issuedBy and createdAt", async () => {
      const warning = await service.issueWarning({
        userId: user.id,
        reason: "Reason",
        severity: "moderate",
        issuedBy: moderator.id,
      });
      expect(warning.issuedBy).toBe(moderator.id);
      expect(warning.createdAt).toEqual(DEFAULT_CLOCK_START);
    });

    it("sets isActive to true", async () => {
      const warning = await service.issueWarning({
        userId: user.id,
        reason: "Reason",
        severity: "severe",
        issuedBy: moderator.id,
      });
      expect(warning.isActive).toBeTrue();
    });
  });

  describe("getUserWarnings", () => {
    it("returns all warnings for a user", async () => {
      await service.issueWarning({ userId: user.id, reason: "w1", severity: "mild", issuedBy: moderator.id });
      await service.issueWarning({ userId: user.id, reason: "w2", severity: "moderate", issuedBy: moderator.id });
      const warnings = await service.getUserWarnings(user.id);
      expect(warnings.length).toBe(2);
    });

    it("returns empty array for user with no warnings", async () => {
      const warnings = await service.getUserWarnings(user.id);
      expect(warnings.length).toBe(0);
    });
  });

  describe("getActiveWarningCount", () => {
    it("returns count of active warnings", async () => {
      await service.issueWarning({ userId: user.id, reason: "w1", severity: "mild", issuedBy: moderator.id });
      await service.issueWarning({ userId: user.id, reason: "w2", severity: "mild", issuedBy: moderator.id });
      const count = await service.getActiveWarningCount(user.id);
      expect(count).toBe(2);
    });

    it("returns 0 for user with no active warnings", async () => {
      const count = await service.getActiveWarningCount(user.id);
      expect(count).toBe(0);
    });

    it("excludes expired warnings", async () => {
      const past = new Date(DEFAULT_CLOCK_START.getTime() - 1000 * 60 * 60 * 24);
      await service.issueWarning({
        userId: user.id,
        reason: "expired",
        severity: "mild",
        expiresAt: past,
        issuedBy: moderator.id,
      });
      const count = await service.getActiveWarningCount(user.id);
      expect(count).toBe(0);
    });
  });

  describe("acknowledgeWarning", () => {
    it("sets acknowledgedAt on warning", async () => {
      const warning = await service.issueWarning({
        userId: user.id,
        reason: "ack test",
        severity: "mild",
        issuedBy: moderator.id,
      });
      const acked = await service.acknowledgeWarning(warning.id);
      expect(acked.acknowledgedAt).toBeTruthy();
    });

    it("throws UserWarningNotFoundError for non-existent warning", async () => {
      await expect(service.acknowledgeWarning("uw_nonexistent")).rejects.toThrow(UserWarningNotFoundError);
    });

    it("throws WarningAlreadyAcknowledgedError if already acknowledged", async () => {
      const warning = await service.issueWarning({
        userId: user.id,
        reason: "double ack",
        severity: "mild",
        issuedBy: moderator.id,
      });
      await service.acknowledgeWarning(warning.id);
      await expect(service.acknowledgeWarning(warning.id)).rejects.toThrow(WarningAlreadyAcknowledgedError);
    });
  });
});
