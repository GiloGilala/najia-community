import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createEvidenceService } from "../services/evidence.service.ts";

/**
 * Ticket 05 — Audit trail & access logging.
 * Seam: the evidence service layer. Verifies the append-only custody trail and
 * that the service exposes no mutation surface for evidence or audit events.
 */
describe("evidence service — audit trail & access logging", () => {
  let harness: TestHarness;

  const supportedUpload = () => ({
    caseId: "11111111-1111-4111-8111-111111111111",
    uploaderId: "22222222-2222-4222-8222-222222222222",
    filename: "photo.jpg",
    mimeType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3, 4, 5]),
  });

  const actorId = "33333333-3333-4333-8333-333333333333";

  const makeService = () =>
    createEvidenceService({
      db: harness.db,
      storage: harness.storage,
      clock: harness.clock,
    });

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  test("recordAccess appends an 'accessed' event timestamped via the clock", async () => {
    harness.clock.set(new Date("2025-07-08T09:10:11.000Z"));
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());

    await service.recordAccess({ evidenceId: record.id, actorId });

    const trail = await service.getAuditTrail({ evidenceId: record.id });
    const accessed = trail.filter((e) => e.eventType === "accessed");
    expect(accessed).toHaveLength(1);
    expect(accessed[0]?.actorId).toBe(actorId);
    expect(accessed[0]?.createdAt.toISOString()).toBe(
      "2025-07-08T09:10:11.000Z",
    );
  });

  test("the audit trail is chronological and includes all three event types", async () => {
    const service = makeService();

    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    const record = await service.uploadEvidence(supportedUpload());

    harness.clock.set(new Date("2025-01-01T00:00:01.000Z"));
    await service.verifyEvidence({ evidenceId: record.id });

    harness.clock.set(new Date("2025-01-01T00:00:02.000Z"));
    await service.recordAccess({ evidenceId: record.id, actorId });

    const trail = await service.getAuditTrail({ evidenceId: record.id });
    expect(trail.map((e) => e.eventType)).toEqual([
      "uploaded",
      "verified",
      "accessed",
    ]);
    // Non-decreasing timestamps.
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i]!.createdAt.getTime()).toBeGreaterThanOrEqual(
        trail[i - 1]!.createdAt.getTime(),
      );
    }
  });

  test("the trail for one evidence item excludes events of another", async () => {
    const service = makeService();
    const a = await service.uploadEvidence(supportedUpload());
    const b = await service.uploadEvidence(supportedUpload());

    await service.recordAccess({ evidenceId: a.id, actorId });

    const trailB = await service.getAuditTrail({ evidenceId: b.id });
    expect(trailB.every((e) => e.evidenceId === b.id)).toBe(true);
    expect(trailB.some((e) => e.eventType === "accessed")).toBe(false);
  });

  test("the service exposes no update or delete surface (append-only)", () => {
    const service = makeService();
    const keys = Object.keys(service);
    const mutating = keys.filter((k) =>
      /^(update|delete|remove|edit|patch)/i.test(k),
    );
    expect(mutating).toEqual([]);
    // Explicitly assert the intended surface.
    expect(keys.sort()).toEqual(
      ["getAuditTrail", "recordAccess", "uploadEvidence", "verifyEvidence"].sort(),
    );
  });
});
