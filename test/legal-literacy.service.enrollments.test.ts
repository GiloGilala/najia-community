import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createTestHarness } from "./harness";
import { createLegalLiteracyService } from "../services/legal-literacy.service";
import {
  LegalLiteracyModuleNotFoundError,
  LegalLiteracyEnrollmentNotFoundError,
  AlreadyEnrolledError,
  ModuleNotEnrolledError,
} from "../services/legal-literacy.service";
import { FixedClock } from "../lib/clock/clock";
import { users } from "../db/schema/users";
import { randomUUID } from "node:crypto";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

async function createUser(db: any) {
  const id = randomUUID();
  const now = new Date(DEFAULT_CLOCK_START);
  const [row] = await db.insert(users).values({
    id,
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hashed",
    verificationStatus: "email_verified",
    createdAt: now,
    updatedAt: now,
  }).returning();
  return row;
}

function buildModuleInput(overrides: any = {}) {
  return {
    title: `Module ${Date.now()}`,
    slug: `module-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    description: "Test description",
    category: "introduction-to-law" as const,
    content: "# Content",
    estimatedDuration: 30,
    difficulty: "beginner" as const,
    ...overrides,
  };
}

describe("LegalLiteracyService - Enrollments", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let service: ReturnType<typeof createLegalLiteracyService>;
  let clock: FixedClock;
  let user: any;
  let module: any;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    service = createLegalLiteracyService({ db: harness.db, clock });
    user = await createUser(harness.db);
    module = await service.createModule(buildModuleInput());
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("enrollUser", () => {
    it("creates an enrollment for a user and module", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      expect(enrollment.id.startsWith("llen_")).toBeTrue();
      expect(enrollment.userId).toBe(user.id);
      expect(enrollment.moduleId).toBe(module.id);
    });

    it("sets status to not_started", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      expect(enrollment.status).toBe("not_started");
      expect(enrollment.progress).toBe(0);
    });

    it("throws LegalLiteracyModuleNotFoundError for invalid moduleId", async () => {
      await expect(service.enrollUser({ userId: user.id, moduleId: "non-existent" })).rejects.toThrow(
        LegalLiteracyModuleNotFoundError,
      );
    });

    it("throws AlreadyEnrolledError if user already enrolled", async () => {
      await service.enrollUser({ userId: user.id, moduleId: module.id });
      await expect(service.enrollUser({ userId: user.id, moduleId: module.id })).rejects.toThrow(AlreadyEnrolledError);
    });
  });

  describe("getEnrollmentById", () => {
    it("returns an enrollment by ID", async () => {
      const created = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const fetched = await service.getEnrollmentById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment", async () => {
      await expect(service.getEnrollmentById("non-existent")).rejects.toThrow(LegalLiteracyEnrollmentNotFoundError);
    });
  });

  describe("updateEnrollmentProgress", () => {
    it("updates progress percentage", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const updated = await service.updateEnrollmentProgress({ id: enrollment.id, progress: 50 });
      expect(updated.progress).toBe(50);
    });

    it("updates status based on progress", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const updated = await service.updateEnrollmentProgress({ id: enrollment.id, progress: 50 });
      expect(updated.status).toBe("in_progress");
      const completed = await service.updateEnrollmentProgress({ id: enrollment.id, progress: 100 });
      expect(completed.status).toBe("completed");
    });

    it("updates lastAccessedAt", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      clock.advance(1000);
      const updated = await service.updateEnrollmentProgress({ id: enrollment.id, progress: 10 });
      expect(updated.lastAccessedAt).toBeTruthy();
      expect(updated.lastAccessedAt!.getTime()).toBeGreaterThan(enrollment.createdAt.getTime());
    });

    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment", async () => {
      await expect(service.updateEnrollmentProgress({ id: "nope", progress: 50 })).rejects.toThrow(
        LegalLiteracyEnrollmentNotFoundError,
      );
    });
  });

  describe("completeModule", () => {
    it("marks enrollment as completed", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const completed = await service.completeModule({ enrollmentId: enrollment.id, userId: user.id });
      expect(completed.status).toBe("completed");
      expect(completed.progress).toBe(100);
    });

    it("sets completedAt", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const completed = await service.completeModule({ enrollmentId: enrollment.id, userId: user.id });
      expect(completed.completedAt).toBeTruthy();
    });

    it("sets quizScore if provided", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const completed = await service.completeModule({
        enrollmentId: enrollment.id,
        userId: user.id,
        quizScore: 85,
      });
      expect(completed.quizScore).toBe(85);
    });

    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment", async () => {
      await expect(service.completeModule({ enrollmentId: "nope", userId: user.id })).rejects.toThrow(
        LegalLiteracyEnrollmentNotFoundError,
      );
    });

    it("throws ModuleNotEnrolledError if user does not own enrollment", async () => {
      const enrollment = await service.enrollUser({ userId: user.id, moduleId: module.id });
      const otherUser = await createUser(harness.db);
      await expect(
        service.completeModule({ enrollmentId: enrollment.id, userId: otherUser.id }),
      ).rejects.toThrow(ModuleNotEnrolledError);
    });
  });

  describe("listUserEnrollments", () => {
    it("returns all enrollments for a user", async () => {
      const mod2 = await service.createModule(buildModuleInput());
      await service.enrollUser({ userId: user.id, moduleId: module.id });
      await service.enrollUser({ userId: user.id, moduleId: mod2.id });
      const list = await service.listUserEnrollments(user.id);
      expect(list.length).toBe(2);
    });

    it("returns empty array for user with no enrollments", async () => {
      const list = await service.listUserEnrollments(user.id);
      expect(list.length).toBe(0);
    });
  });

  describe("getUserModuleProgress", () => {
    it("returns enrollment if user is enrolled in module", async () => {
      await service.enrollUser({ userId: user.id, moduleId: module.id });
      const progress = await service.getUserModuleProgress(user.id, module.id);
      expect(progress).toBeTruthy();
      expect(progress?.moduleId).toBe(module.id);
    });

    it("returns null if user is not enrolled", async () => {
      const progress = await service.getUserModuleProgress(user.id, module.id);
      expect(progress).toBeNull();
    });
  });
});
