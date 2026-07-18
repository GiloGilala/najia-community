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
 * Ticket 03 — Verify evidence & detect tampering.
 * Seam: the evidence service layer. Tampering is simulated by overwriting the
 * stored bytes through the in-memory storage fake.
 */
describe("evidence service — verify & detect tampering", () => {
  let harness: TestHarness;

  const supportedUpload = () => ({
    caseId: "11111111-1111-4111-8111-111111111111",
    uploaderId: "22222222-2222-4222-8222-222222222222",
    filename: "photo.jpg",
    mimeType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3, 4, 5]),
  });

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

  test("returns 'verified' when the stored bytes are intact", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());

    const result = await service.verifyEvidence({ evidenceId: record.id });

    expect(result.status).toBe("verified");
  });

  test("returns 'altered' when the stored bytes have changed", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());

    harness.storage.overwrite(record.storageKey, new Uint8Array([9, 9, 9]));
    const result = await service.verifyEvidence({ evidenceId: record.id });

    expect(result.status).toBe("altered");
  });

  test("writes a 'verified' audit event capturing the outcome", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());

    await service.verifyEvidence({ evidenceId: record.id });
    harness.storage.overwrite(record.storageKey, new Uint8Array([7]));
    await service.verifyEvidence({ evidenceId: record.id });

    const trail = await service.getAuditTrail({ evidenceId: record.id });
    const verifyEvents = trail.filter((e) => e.eventType === "verified");
    expect(verifyEvents).toHaveLength(2);
    expect(verifyEvents[0]?.outcome).toBe("verified");
    expect(verifyEvents[1]?.outcome).toBe("altered");
  });

  test("never mutates the original stored hash", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());
    const originalHash = record.sha256Hash;

    harness.storage.overwrite(record.storageKey, new Uint8Array([9, 9, 9]));
    const result = await service.verifyEvidence({ evidenceId: record.id });

    expect(result.originalHash).toBe(originalHash);
  });

  test("is idempotent: repeated verification yields identical results", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(supportedUpload());

    const first = await service.verifyEvidence({ evidenceId: record.id });
    const second = await service.verifyEvidence({ evidenceId: record.id });

    expect(first.status).toBe("verified");
    expect(second.status).toBe("verified");
    expect(first.originalHash).toBe(second.originalHash);
  });

  test("returns 'not_applicable' for an unsupported type without re-hashing", async () => {
    const service = makeService();
    const record = await service.uploadEvidence({
      ...supportedUpload(),
      filename: "notes.txt",
      mimeType: "text/plain",
    });

    const result = await service.verifyEvidence({ evidenceId: record.id });

    expect(result.status).toBe("not_applicable");
  });
});
