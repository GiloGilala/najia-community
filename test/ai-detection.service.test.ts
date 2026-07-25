import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createTestHarness } from "./harness";
import { createAIDetectionService } from "../services/ai-detection.service";
import { FixedClock } from "../lib/clock/clock";
import { InMemoryFileStorage } from "../lib/storage/in-memory-file-storage";
import { users } from "../db/schema/users";
import { evidence } from "../db/schema/evidence";
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

async function createEvidence(db: any, uploaderId: string, overrides: any = {}) {
  const id = randomUUID();
  const now = new Date(DEFAULT_CLOCK_START);
  const [row] = await db.insert(evidence).values({
    id,
    caseId: randomUUID(),
    uploaderId,
    filename: overrides.filename ?? `test-${Date.now()}.jpg`,
    mimeType: overrides.mimeType ?? "image/jpeg",
    sizeBytes: 1234,
    sha256Hash: "abc123",
    storageKey: `evidence/${id}`,
    verificationStatus: "verified",
    createdAt: now,
    ...overrides,
    id,
  }).returning();
  return row;
}

describe("AIDetectionService", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let clock: FixedClock;
  let storage: InMemoryFileStorage;
  let service: ReturnType<typeof createAIDetectionService>;
  let user: any;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    storage = new InMemoryFileStorage();
    service = createAIDetectionService({ db: harness.db, clock, storage });
    user = await createUser(harness.db);
  });

  afterEach(async () => {
    await harness.close();
  });

  it("triggers detection and queues item", async () => {
    const ev = await createEvidence(harness.db, user.id);
    const queued = await service.triggerDetection({ evidenceId: ev.id });
    expect(queued.id.startsWith("aidq_")).toBeTrue();
    expect(queued.evidenceId).toBe(ev.id);
    expect(queued.status).toBe("pending");
  });

  it("processes queue and creates detection result", async () => {
    const ev = await createEvidence(harness.db, user.id, { filename: "normalphoto.jpg" });
    await service.triggerDetection({ evidenceId: ev.id });
    const processed = await service.processQueue();
    expect(processed).toBe(1);
    const result = await service.getDetectionResultByEvidence(ev.id);
    expect(result).toBeTruthy();
    expect(result?.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(["low","medium","high"]).toContain(result?.category);
  });

  it("flags high confidence deepfake", async () => {
    const ev = await createEvidence(harness.db, user.id, { filename: "deepfake_image.jpg" });
    await service.triggerDetection({ evidenceId: ev.id });
    await service.processQueue();
    const result = await service.getDetectionResultByEvidence(ev.id);
    expect(result?.isFlagged).toBeTrue();
    expect(result?.category).toBe("high");
  });

  it("creates and lists models", async () => {
    const model = await service.createModel({
      name: `Hive ${Date.now()}`,
      provider: "hive",
      capabilities: ["image","video"],
    });
    expect(model.id.startsWith("aidmodel_")).toBeTrue();
    const list = await service.listModels({});
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it("reviews flagged detection", async () => {
    const ev = await createEvidence(harness.db, user.id, { filename: "deepfake_video.mp4", mimeType: "video/mp4" });
    await service.triggerDetection({ evidenceId: ev.id });
    await service.processQueue();
    const result = await service.getDetectionResultByEvidence(ev.id);
    expect(result?.isFlagged).toBeTrue();
    const reviewer = await createUser(harness.db);
    const reviewed = await service.reviewDetection({
      detectionId: result!.id,
      decision: "confirmed",
      notes: "looks fake",
      reviewedBy: reviewer.id,
    });
    expect(reviewed.reviewDecision).toBe("confirmed");
    expect(reviewed.reviewedBy).toBe(reviewer.id);
  });

  it("gets metrics", async () => {
    const ev1 = await createEvidence(harness.db, user.id, { filename: "normal1.jpg" });
    const ev2 = await createEvidence(harness.db, user.id, { filename: "deepfake2.jpg" });
    await service.triggerDetection({ evidenceId: ev1.id });
    await service.triggerDetection({ evidenceId: ev2.id });
    await service.processQueue();
    const metrics = await service.getDetectionMetrics();
    expect(metrics.totalDetections).toBe(2);
    expect(metrics.flaggedCount).toBeGreaterThanOrEqual(1);
  });
});
